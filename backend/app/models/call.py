import enum
from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Text, Boolean, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from app.database import BaseModel

class CallDirection(str, enum.Enum):
    OUTBOUND = "Outbound"
    INBOUND = "Inbound"

class CallStatus(str, enum.Enum):
    CONNECTED = "Connected"
    MISSED = "Missed"
    BUSY = "Busy"
    FAILED = "Failed"
    VOICEMAIL = "Voicemail"

class CallOutcome(str, enum.Enum):
    INTERESTED = "Interested"
    NOT_INTERESTED = "Not Interested"
    CALL_BACK = "Call Back"
    SITE_VISIT_AGREED = "Site Visit Agreed"
    WRONG_NUMBER = "Wrong Number"
    NO_ANSWER = "No Answer"

class CallRecord(BaseModel):
    __tablename__ = "call_records"

    id = Column(Integer, primary_key=True, index=True)
    organization_id = Column(Integer, ForeignKey("organizations.id"), nullable=False, index=True)
    lead_id = Column(Integer, ForeignKey("leads.id"), nullable=False, index=True)
    executive_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)

    phone_number = Column(String(30), nullable=False)
    direction = Column(String(20), default=CallDirection.OUTBOUND.value, nullable=False)
    call_status = Column(String(20), default=CallStatus.CONNECTED.value, nullable=False)
    outcome = Column(String(50), default=CallOutcome.INTERESTED.value, nullable=False)
    duration_seconds = Column(Integer, default=0, nullable=False)
    
    # Lawful recording storage reference
    recording_url = Column(String(500), nullable=True)
    recording_consent_obtained = Column(Boolean, default=True, nullable=False)
    
    transcript_text = Column(Text, nullable=True)
    ai_summary = Column(Text, nullable=True)
    ai_next_action = Column(String(255), nullable=True)
    notes = Column(Text, nullable=True)
    
    started_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    ended_at = Column(DateTime, nullable=True)

    lead = relationship("Lead")
    executive = relationship("User")
