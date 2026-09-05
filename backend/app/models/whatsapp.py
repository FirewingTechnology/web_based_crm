from sqlalchemy import Column, Integer, String, Text, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from app.database import BaseModel

class WhatsAppMessage(BaseModel):
    __tablename__ = "whatsapp_messages"

    id = Column(Integer, primary_key=True, index=True)
    organization_id = Column(Integer, ForeignKey("organizations.id"), nullable=True, index=True)
    lead_id = Column(Integer, ForeignKey("leads.id"), nullable=False, index=True)
    sender_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    
    template_key = Column(String(50), nullable=True, index=True) # e.g. QUALIFICATION, SITE_VISIT_CONFIRMATION, POST_VISIT_FEEDBACK, PAYMENT_REMINDER, REENGAGEMENT_DRIP, CUSTOM
    recipient_phone = Column(String(20), nullable=False)
    recipient_name = Column(String(100), nullable=True)
    message_body = Column(Text, nullable=False)
    status = Column(String(30), default="SENT", nullable=False, index=True) # SENT, DELIVERED, READ, REPLIED
    
    sent_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    delivered_at = Column(DateTime, nullable=True)
    read_at = Column(DateTime, nullable=True)
    replied_at = Column(DateTime, nullable=True)
    metadata_json = Column(Text, nullable=True)

    # Relationships
    lead = relationship("Lead", backref="whatsapp_messages")
    sender = relationship("User")
