from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from typing import List, Optional

from app.database import get_db
from app.models.user import User, UserRole
from app.models.site_visit import SiteVisit, SiteVisitStatus
from app.models.lead import Lead
from app.models.project import Project
from app.middleware.auth_middleware import get_current_user
from app.schemas.site_visit import (
    SiteVisitCreate, SiteVisitUpdate, SiteVisitStatusUpdate,
    SiteVisitVerifyOtp, SiteVisitResponse
)
from app.services.site_visit_service import (
    schedule_site_visit, verify_visit_otp, record_visit_completion
)

router = APIRouter(prefix="/site-visits", tags=["Site Visit Operating System"])

def format_visit_response(v: SiteVisit) -> SiteVisitResponse:
    res = SiteVisitResponse.model_validate(v)
    if v.lead:
        res.lead_name = v.lead.name
        res.lead_phone = v.lead.phone
    if v.project:
        res.project_name = v.project.name
    if v.sales_executive:
        res.sales_executive_name = v.sales_executive.name
    return res

@router.get("", response_model=List[SiteVisitResponse])
def get_site_visits(
    lead_id: Optional[int] = Query(None),
    sales_executive_id: Optional[int] = Query(None),
    status: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Lists scheduled and completed site visits with filtering options."""
    query = db.query(SiteVisit).filter(SiteVisit.is_deleted == False)

    if current_user.role != UserRole.SUPERADMIN and current_user.organization_id:
        query = query.filter(
            (SiteVisit.organization_id == current_user.organization_id) | (SiteVisit.organization_id.is_(None))
        )

    if lead_id:
        query = query.filter(SiteVisit.lead_id == lead_id)
    if sales_executive_id:
        query = query.filter(SiteVisit.sales_executive_id == sales_executive_id)
    if status:
        query = query.filter(SiteVisit.status == status)

    visits = query.order_by(SiteVisit.scheduled_at.desc()).all()
    return [format_visit_response(v) for v in visits]

@router.get("/{visit_id}", response_model=SiteVisitResponse)
def get_site_visit(
    visit_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Fetches details of a specific site visit record."""
    visit = db.query(SiteVisit).filter(SiteVisit.id == visit_id, SiteVisit.is_deleted == False).first()
    if not visit:
        raise HTTPException(status_code=404, detail="Site visit not found")
    return format_visit_response(visit)

@router.post("", response_model=SiteVisitResponse, status_code=status.HTTP_201_CREATED)
def create_site_visit(
    payload: SiteVisitCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Schedules a new VIP Site Visit with chauffeur details and auto-provisions verification OTP."""
    try:
        visit = schedule_site_visit(db, payload, current_user)
        return format_visit_response(visit)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/{visit_id}/verify-otp")
def verify_otp_endpoint(
    visit_id: int,
    payload: SiteVisitVerifyOtp,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Validates on-site or in-cab client verification OTP code."""
    visit = db.query(SiteVisit).filter(SiteVisit.id == visit_id, SiteVisit.is_deleted == False).first()
    if not visit:
        raise HTTPException(status_code=404, detail="Site visit not found")

    is_valid = verify_visit_otp(db, visit, payload.otp_code, current_user)
    if not is_valid:
        raise HTTPException(status_code=400, detail="Invalid OTP verification code")

    return {
        "verified": True,
        "message": "OTP successfully verified. Client arrival confirmed.",
        "status": visit.status.value if hasattr(visit.status, "value") else str(visit.status)
    }

@router.patch("/{visit_id}/status", response_model=SiteVisitResponse)
def update_site_visit_status(
    visit_id: int,
    payload: SiteVisitStatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Updates visit status, logs post-visit buyer feedback, and advances deal stage."""
    visit = db.query(SiteVisit).filter(SiteVisit.id == visit_id, SiteVisit.is_deleted == False).first()
    if not visit:
        raise HTTPException(status_code=404, detail="Site visit not found")

    updated = record_visit_completion(
        db=db,
        visit=visit,
        status_str=payload.status,
        feedback_rating=payload.feedback_rating,
        buyer_interest_level=payload.buyer_interest_level,
        preferred_unit=payload.preferred_unit,
        discussion_notes=payload.discussion_notes,
        auto_advance_lead=payload.auto_advance_lead,
        current_user=current_user
    )
    return format_visit_response(updated)
