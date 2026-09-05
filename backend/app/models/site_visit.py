import enum
from sqlalchemy import Column, Integer, String, Text, ForeignKey, Enum, DateTime, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from app.database import BaseModel

class SiteVisitStatus(str, enum.Enum):
    SCHEDULED = "Scheduled"
    IN_TRANSIT = "In Transit"
    COMPLETED = "Completed"
    CANCELLED = "Cancelled"
    NO_SHOW = "No Show"

class BuyerInterestLevel(str, enum.Enum):
    HOT = "Hot"
    WARM = "Warm"
    COLD = "Cold"
    READY_TO_BOOK = "Ready to Book"

class SiteVisit(BaseModel):
    __tablename__ = "site_visits"

    id = Column(Integer, primary_key=True, index=True)
    organization_id = Column(Integer, ForeignKey("organizations.id"), nullable=True, index=True)
    lead_id = Column(Integer, ForeignKey("leads.id"), nullable=False, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False, index=True)
    sales_executive_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)

    # Logistics & Timing
    scheduled_at = Column(DateTime, nullable=False, index=True)
    completed_at = Column(DateTime, nullable=True)
    pickup_location = Column(String(255), nullable=True)
    pickup_time = Column(String(50), nullable=True)

    # Chauffeur / Cab Service
    driver_name = Column(String(100), nullable=True)
    driver_phone = Column(String(20), nullable=True)
    cab_vehicle_number = Column(String(50), nullable=True)

    # Anti-fraud Security & On-Site OTP Verification
    otp_code = Column(String(10), nullable=False)
    is_otp_verified = Column(Boolean, default=False, nullable=False)

    # Execution Status & Post-Visit Feedback
    status = Column(Enum(SiteVisitStatus), default=SiteVisitStatus.SCHEDULED, nullable=False, index=True)
    feedback_rating = Column(Integer, nullable=True) # 1 to 5
    buyer_interest_level = Column(Enum(BuyerInterestLevel), nullable=True)
    preferred_unit = Column(String(100), nullable=True)
    discussion_notes = Column(Text, nullable=True)

    # Relationships
    lead = relationship("Lead", backref="site_visits_list")
    project = relationship("Project")
    sales_executive = relationship("User", foreign_keys=[sales_executive_id])
