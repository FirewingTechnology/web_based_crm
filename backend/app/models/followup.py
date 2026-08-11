import enum
from sqlalchemy import Column, Integer, String, Text, ForeignKey, Enum, DateTime
from sqlalchemy.orm import relationship
from app.database import BaseModel

class FollowupType(str, enum.Enum):
    CALL = "Call"
    WHATSAPP = "WhatsApp"
    MEETING = "Meeting"
    SITE_VISIT = "Site Visit"
    TASK = "Task"
    REMINDER = "Reminder"

class FollowupStatus(str, enum.Enum):
    PENDING = "Pending"
    COMPLETED = "Completed"
    OVERDUE = "Overdue"
    CANCELLED = "Cancelled"

class Followup(BaseModel):
    __tablename__ = "followups"

    id = Column(Integer, primary_key=True, index=True)
    organization_id = Column(Integer, ForeignKey("organizations.id"), nullable=True, index=True)
    lead_id = Column(Integer, ForeignKey("leads.id"), nullable=False)

    assigned_to_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    type = Column(Enum(FollowupType), default=FollowupType.CALL, nullable=False)
    status = Column(Enum(FollowupStatus), default=FollowupStatus.PENDING, nullable=False, index=True)
    title = Column(String(200), nullable=False)
    scheduled_at = Column(DateTime, nullable=False, index=True)
    completed_at = Column(DateTime, nullable=True)
    notes = Column(Text, nullable=True)
    outcome = Column(Text, nullable=True)

    # Relationships
    lead = relationship("Lead", back_populates="followups")
    assigned_to = relationship("User", back_populates="followups")
