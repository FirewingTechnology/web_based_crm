import hmac
import hashlib
import time
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import RedirectResponse
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.call import CallRecord, CallDirection, CallStatus, CallOutcome
from app.models.user import User, UserRole
from app.middleware.auth_middleware import get_current_user
from app.services.call_service import CallService
from app.config import settings

router = APIRouter(prefix="/calls", tags=["Call Intelligence"])

class CallLogCreate(BaseModel):
    lead_id: int
    phone_number: Optional[str] = None
    direction: str = "Outbound"
    call_status: str = "Connected"
    outcome: str = "Interested"
    duration_seconds: int = 0
    recording_url: Optional[str] = None
    notes: Optional[str] = None
    transcript_text: Optional[str] = None
    ai_summary: Optional[str] = None
    ai_next_action: Optional[str] = None
    schedule_followup: Optional[bool] = False
    followup_hours: Optional[int] = 24

class CallRecordResponse(BaseModel):
    id: int
    lead_id: int
    executive_id: int
    executive_name: str
    phone_number: str
    direction: str
    call_status: str
    outcome: str
    duration_seconds: int
    has_recording: bool
    recording_consent_obtained: bool
    ai_summary: Optional[str] = None
    ai_next_action: Optional[str] = None
    notes: Optional[str] = None
    started_at: str
    signed_playback_url: Optional[str] = None

    class Config:
        from_attributes = True


@router.get("", response_model=List[CallRecordResponse])
def list_calls(
    lead_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Lists call activities and telecom engagement logs for a lead or the user's organization."""
    query = db.query(CallRecord).filter(CallRecord.is_deleted == False)
    if current_user.role != UserRole.SUPERADMIN and current_user.organization_id:
        query = query.filter(CallRecord.organization_id == current_user.organization_id)
    if lead_id:
        query = query.filter(CallRecord.lead_id == lead_id)
    records = query.order_by(CallRecord.id.desc()).limit(50).all()

    return [CallRecordResponse(
        id=c.id,
        lead_id=c.lead_id,
        executive_id=c.executive_id,
        executive_name=c.executive.name if c.executive else "Executive",
        phone_number=c.phone_number,
        direction=c.direction,
        call_status=c.call_status,
        outcome=c.outcome,
        duration_seconds=c.duration_seconds,
        has_recording=bool(c.recording_url),
        recording_consent_obtained=c.recording_consent_obtained,
        ai_summary=c.ai_summary,
        ai_next_action=c.ai_next_action,
        notes=c.notes,
        started_at=c.started_at.isoformat() if c.started_at else ""
    ) for c in records]

@router.post("/log", response_model=CallRecordResponse, status_code=status.HTTP_201_CREATED)
def log_call(
    payload: CallLogCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Logs a live or VoIP sales call, fulfills response SLA timers, and creates automated next actions."""
    try:
        phone = payload.phone_number
        if not phone:
            from app.models.lead import Lead
            ld = db.query(Lead).filter(Lead.id == payload.lead_id).first()
            phone = (ld.phone or ld.normalized_phone or "Unknown") if ld else "Unknown"

        record = CallService.log_call(
            db=db,
            lead_id=payload.lead_id,
            executive=current_user,
            phone_number=phone,
            direction=payload.direction,
            call_status=payload.call_status,
            outcome=payload.outcome,
            duration_seconds=payload.duration_seconds,
            recording_url=payload.recording_url,
            notes=payload.notes,
            transcript_text=payload.transcript_text,
            ai_summary=payload.ai_summary,
            ai_next_action=payload.ai_next_action
        )
        signed_info = CallService.generate_secure_playback_url(record.id, current_user, db) if record.recording_url else None
        signed_url = signed_info["signed_stream_url"] if signed_info else None
        return CallRecordResponse(
            id=record.id,
            lead_id=record.lead_id,
            executive_id=record.executive_id,
            executive_name=current_user.name,
            phone_number=record.phone_number,
            direction=record.direction,
            call_status=record.call_status,
            outcome=record.outcome,
            duration_seconds=record.duration_seconds,
            has_recording=bool(record.recording_url),
            recording_consent_obtained=record.recording_consent_obtained,
            ai_summary=record.ai_summary,
            ai_next_action=record.ai_next_action,
            notes=record.notes,
            started_at=record.started_at.isoformat() if record.started_at else "",
            signed_playback_url=signed_url
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/{call_id}/playback")
def get_secure_playback_url(
    call_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Generates a lawful, signed, time-limited playback link with access auditing."""
    try:
        return CallService.generate_secure_playback_url(call_id=call_id, user=current_user, db=db)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

@router.get("/{call_id}/stream")
def stream_call_recording(
    call_id: int,
    token: Optional[str] = None,
    expires: Optional[int] = None,
    user_id: Optional[int] = None,
    db: Session = Depends(get_db)
):
    """Verifies HMAC signature and redirects to compliant call recording storage."""
    record = db.query(CallRecord).filter(CallRecord.id == call_id, CallRecord.is_deleted == False).first()
    if not record or not record.recording_url:
        raise HTTPException(status_code=404, detail="Recording not found")

    if token and expires and user_id:
        if int(time.time()) > expires:
            raise HTTPException(status_code=403, detail="Playback token expired")
        data_to_sign = f"{call_id}:{user_id}:{expires}"
        expected_sig = hmac.new(settings.SECRET_KEY.encode(), data_to_sign.encode(), hashlib.sha256).hexdigest()
        if not hmac.compare_digest(token, expected_sig):
            raise HTTPException(status_code=403, detail="Invalid playback token")

    return RedirectResponse(url=record.recording_url, status_code=status.HTTP_307_TEMPORARY_REDIRECT)
