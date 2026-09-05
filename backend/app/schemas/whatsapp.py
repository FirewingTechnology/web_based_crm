from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime

class WhatsAppTemplateResponse(BaseModel):
    key: str
    title: str
    description: str
    category: str
    raw_template: str
    rendered_body: str

class WhatsAppSendMessageRequest(BaseModel):
    lead_id: int
    template_key: Optional[str] = "CUSTOM"
    recipient_phone: str
    message_body: str
    metadata: Optional[Dict[str, Any]] = None

class WhatsAppMessageResponse(BaseModel):
    id: int
    lead_id: int
    sender_id: int
    sender_name: Optional[str] = None
    template_key: Optional[str] = None
    recipient_phone: str
    recipient_name: Optional[str] = None
    message_body: str
    status: str
    sent_at: datetime
    delivered_at: Optional[datetime] = None
    read_at: Optional[datetime] = None
    replied_at: Optional[datetime] = None
    metadata_json: Optional[str] = None
    wa_link: Optional[str] = None

    class Config:
        from_attributes = True

class WhatsAppStatusUpdateRequest(BaseModel):
    status: str # SENT, DELIVERED, READ, REPLIED
