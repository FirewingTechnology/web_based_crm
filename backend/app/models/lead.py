import enum
from sqlalchemy import Column, Integer, String, Float, Text, ForeignKey, Enum, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from app.database import BaseModel

class LeadStatus(str, enum.Enum):
    NEW = "New"
    CONTACTED = "Contacted"
    QUALIFIED = "Qualified"
    SITE_VISIT = "Site Visit Scheduled"
    NEGOTIATION = "Negotiation"
    BOOKED = "Booked"
    LOST = "Lost"

class LeadPriority(str, enum.Enum):
    LOW = "Low"
    MEDIUM = "Medium"
    HIGH = "High"
    URGENT = "Urgent"

class Lead(BaseModel):
    __tablename__ = "leads"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False, index=True)
    phone = Column(String(20), nullable=False, index=True)
    email = Column(String(150), nullable=True)
    source = Column(String(100), default="Direct", nullable=False, index=True) # Website, Referral, 99acres, Facebook Ads, Walk-in
    status = Column(Enum(LeadStatus), default=LeadStatus.NEW, nullable=False, index=True)
    priority = Column(Enum(LeadPriority), default=LeadPriority.MEDIUM, nullable=False)
    budget_min = Column(Float, nullable=True) # in Lakhs
    budget_max = Column(Float, nullable=True) # in Lakhs
    preferred_location = Column(String(150), nullable=True)
    preferred_configuration = Column(String(100), nullable=True)
    preferred_project_id = Column(Integer, ForeignKey("projects.id"), nullable=True)
    assigned_to_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_by_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    tags = Column(String(255), nullable=True) # Comma-separated tags e.g. "NRI, High Intent, Ready Buyer"

    # Relationships
    assigned_to = relationship("User", back_populates="assigned_leads", foreign_keys=[assigned_to_id])
    created_by = relationship("User", back_populates="created_leads", foreign_keys=[created_by_id])
    preferred_project = relationship("Project")
    notes_list = relationship("LeadNote", back_populates="lead", cascade="all, delete-orphan")
    history_list = relationship("LeadStatusHistory", back_populates="lead", cascade="all, delete-orphan")
    followups = relationship("Followup", back_populates="lead", cascade="all, delete-orphan")
    bookings = relationship("Booking", back_populates="lead")

class LeadNote(BaseModel):
    __tablename__ = "lead_notes"

    id = Column(Integer, primary_key=True, index=True)
    lead_id = Column(Integer, ForeignKey("leads.id"), nullable=False)
    created_by_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    note_text = Column(Text, nullable=False)

    lead = relationship("Lead", back_populates="notes_list")
    author = relationship("User")

class LeadStatusHistory(BaseModel):
    __tablename__ = "lead_status_history"

    id = Column(Integer, primary_key=True, index=True)
    lead_id = Column(Integer, ForeignKey("leads.id"), nullable=False)
    changed_by_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    old_status = Column(String(50), nullable=True)
    new_status = Column(String(50), nullable=False)
    remarks = Column(String(255), nullable=True)

    lead = relationship("Lead", back_populates="history_list")
    changed_by = relationship("User")
