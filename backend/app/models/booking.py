import enum
from sqlalchemy import Column, Integer, String, Float, ForeignKey, Enum, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from app.database import BaseModel

class BookingStatus(str, enum.Enum):
    PENDING = "Pending"
    CONFIRMED = "Confirmed"
    CANCELLED = "Cancelled"
    COMPLETED = "Completed"

class Booking(BaseModel):
    __tablename__ = "bookings"

    id = Column(Integer, primary_key=True, index=True)
    booking_number = Column(String(50), unique=True, nullable=False, index=True) # e.g. BK-2026-001
    lead_id = Column(Integer, ForeignKey("leads.id"), nullable=False)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False)
    builder_id = Column(Integer, ForeignKey("builders.id"), nullable=False)
    assigned_executive_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    broker_id = Column(Integer, ForeignKey("broker_profiles.id"), nullable=True)
    
    unit_number = Column(String(50), nullable=False) # e.g. Tower A - 1204
    booking_amount = Column(Float, nullable=False) # Token amount (e.g. 5,00,000 INR)
    total_deal_value = Column(Float, nullable=False) # Full property price (e.g. 1,50,00,000 INR)
    booking_date = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    status = Column(Enum(BookingStatus), default=BookingStatus.PENDING, nullable=False, index=True)
    notes = Column(String(255), nullable=True)

    # Relationships
    lead = relationship("Lead", back_populates="bookings")
    project = relationship("Project", back_populates="bookings")
    builder = relationship("Builder", back_populates="bookings")
    assigned_executive = relationship("User", back_populates="bookings")
    broker = relationship("BrokerProfile", back_populates="bookings")
    commission = relationship("Commission", back_populates="booking", uselist=False, cascade="all, delete-orphan")
