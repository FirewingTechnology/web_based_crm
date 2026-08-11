import enum
from sqlalchemy import Column, Integer, Float, ForeignKey, Enum, String
from sqlalchemy.orm import relationship
from app.database import BaseModel

class PayoutStatus(str, enum.Enum):
    PENDING = "Pending"
    PARTIAL = "Partial"
    PAID = "Paid"

class Commission(BaseModel):
    __tablename__ = "commissions"

    id = Column(Integer, primary_key=True, index=True)
    organization_id = Column(Integer, ForeignKey("organizations.id"), nullable=True, index=True)
    booking_id = Column(Integer, ForeignKey("bookings.id"), unique=True, nullable=False)

    
    builder_commission_rate = Column(Float, nullable=False) # e.g. 3.0%
    builder_commission_amount = Column(Float, nullable=False) # e.g. 4,50,000 INR
    
    executive_commission_rate = Column(Float, default=0.5, nullable=False) # e.g. 0.5%
    executive_commission_amount = Column(Float, nullable=False)
    
    broker_commission_rate = Column(Float, default=1.0, nullable=False) # e.g. 1.0% if external broker
    broker_commission_amount = Column(Float, default=0.0, nullable=False)
    
    company_margin_amount = Column(Float, nullable=False) # Remaining margin
    
    payout_status = Column(Enum(PayoutStatus), default=PayoutStatus.PENDING, nullable=False, index=True)
    remarks = Column(String(255), nullable=True)

    # Relationships
    booking = relationship("Booking", back_populates="commission")
