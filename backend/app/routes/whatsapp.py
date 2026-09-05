from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from typing import List, Optional
import urllib.parse
from datetime import datetime, timezone

from app.database import get_db
from app.models.user import User
from app.models.lead import Lead
from app.models.whatsapp import WhatsAppMessage
from app.middleware.auth_middleware import get_current_user
from app.schemas.whatsapp import (
    WhatsAppTemplateResponse,
    WhatsAppSendMessageRequest,
    WhatsAppMessageResponse,
    WhatsAppStatusUpdateRequest
)
from app.services.whatsapp_service import render_all_templates, log_whatsapp_message

router = APIRouter(prefix="/whatsapp", tags=["WhatsApp Revenue Workflow"])

def clean_phone_number(phone_str: str) -> str:
    """Normalizes phone number to international WhatsApp format without plus or symbols."""
    cleaned = "".join([c for c in phone_str if c.isdigit()])
    if len(cleaned) == 10:
        cleaned = "91" + cleaned
    return cleaned

@router.get("/templates", response_model=List[WhatsAppTemplateResponse])
def get_templates(
    lead_id: Optional[int] = Query(None, description="Optional lead ID to personalize template variables"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Returns all pre-defined WhatsApp revenue workflow templates pre-populated for the lead."""
    lead = None
    if lead_id:
        lead = db.query(Lead).filter(Lead.id == lead_id).first()
        if not lead:
            raise HTTPException(status_code=404, detail="Lead not found")
        # Tenant isolation
        if current_user.organization_id and lead.organization_id and lead.organization_id != current_user.organization_id:
            raise HTTPException(status_code=403, detail="Access denied")

    templates = render_all_templates(lead, current_user)
    return templates

@router.post("/send", response_model=WhatsAppMessageResponse)
def send_whatsapp_message(
    payload: WhatsAppSendMessageRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Logs an outbound WhatsApp communication, updates lead activity & health,
    and returns the authenticated WhatsApp direct click-to-chat deep link.
    """
    lead = db.query(Lead).filter(Lead.id == payload.lead_id).first()
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")
        
    if current_user.organization_id and lead.organization_id and lead.organization_id != current_user.organization_id:
        raise HTTPException(status_code=403, detail="Access denied")

    normalized_phone = clean_phone_number(payload.recipient_phone)
    if not normalized_phone or len(normalized_phone) < 10:
        raise HTTPException(status_code=400, detail="Invalid recipient phone number")

    # Record message log and refresh health
    msg = log_whatsapp_message(
        db=db,
        lead=lead,
        current_user=current_user,
        template_key=payload.template_key,
        recipient_phone=normalized_phone,
        message_body=payload.message_body,
        metadata=payload.metadata,
        status="SENT"
    )

    encoded_text = urllib.parse.quote(payload.message_body)
    wa_link = f"https://wa.me/{normalized_phone}?text={encoded_text}"

    resp = WhatsAppMessageResponse.model_validate(msg)
    resp.sender_name = current_user.name
    resp.wa_link = wa_link
    return resp

@router.get("/lead/{lead_id}/messages", response_model=List[WhatsAppMessageResponse])
def get_lead_whatsapp_messages(
    lead_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Fetches all logged WhatsApp messages and interactions for a specific lead."""
    lead = db.query(Lead).filter(Lead.id == lead_id).first()
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")

    if current_user.organization_id and lead.organization_id and lead.organization_id != current_user.organization_id:
        raise HTTPException(status_code=403, detail="Access denied")

    messages = db.query(WhatsAppMessage).filter(
        WhatsAppMessage.lead_id == lead_id
    ).order_by(WhatsAppMessage.sent_at.desc()).all()

    response_list = []
    for m in messages:
        item = WhatsAppMessageResponse.model_validate(m)
        if m.sender:
            item.sender_name = m.sender.name
        encoded_text = urllib.parse.quote(m.message_body)
        item.wa_link = f"https://wa.me/{m.recipient_phone}?text={encoded_text}"
        response_list.append(item)

    return response_list

@router.patch("/messages/{message_id}/status", response_model=WhatsAppMessageResponse)
def update_message_status(
    message_id: int,
    payload: WhatsAppStatusUpdateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Updates delivery/read/replied status of a logged WhatsApp message."""
    msg = db.query(WhatsAppMessage).filter(WhatsAppMessage.id == message_id).first()
    if not msg:
        raise HTTPException(status_code=404, detail="WhatsApp message record not found")

    valid_statuses = ["SENT", "DELIVERED", "READ", "REPLIED"]
    if payload.status.upper() not in valid_statuses:
        raise HTTPException(status_code=400, detail=f"Invalid status. Must be one of {valid_statuses}")

    now = datetime.now(timezone.utc)
    new_status = payload.status.upper()
    msg.status = new_status
    
    if new_status in ["DELIVERED", "READ", "REPLIED"] and not msg.delivered_at:
        msg.delivered_at = now
    if new_status in ["READ", "REPLIED"] and not msg.read_at:
        msg.read_at = now
    if new_status == "REPLIED":
        msg.replied_at = now

    db.commit()
    db.refresh(msg)

    resp = WhatsAppMessageResponse.model_validate(msg)
    if msg.sender:
        resp.sender_name = msg.sender.name
    return resp
