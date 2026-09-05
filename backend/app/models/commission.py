import enum
from sqlalchemy import Column, Integer, Float, ForeignKey, Enum, String, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import BaseModel

class PayoutStatus(str, enum.Enum):
    PENDING = "Pending"
    PARTIAL = "Partial"
    PAID = "Paid"

class CommissionStage(str, enum.Enum):
    EXPECTED = "EXPECTED"           # Deal booked, waiting for builder payment milestone
    SUBMITTED = "SUBMITTED"         # GST invoice generated & submitted to builder accounts
    APPROVED = "APPROVED"           # Verified & cleared by builder finance team
    PAYABLE = "PAYABLE"             # Payment advice issued / in banking clearing
    PAID = "PAID"                   # Payment credited & reconciled (UTR available)
    DISPUTED = "DISPUTED"           # On hold / deduction disputed

    @classmethod
    def _missing_(cls, value):
        for member in cls:
            if member.value.upper() == str(value).upper():
                return member
        return None

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
    stage = Column(Enum(CommissionStage, values_callable=lambda obj: [e.value for e in obj]), default=CommissionStage.EXPECTED, nullable=False, index=True)
    
    # Real Estate Revenue Operating System - Commission Lifecycle & Aging Ledger
    invoice_number = Column(String(100), nullable=True, index=True)
    invoice_date = Column(DateTime, nullable=True)
    due_date = Column(DateTime, nullable=True)
    paid_date = Column(DateTime, nullable=True)
    payment_reference = Column(String(100), nullable=True) # UTR or Cheque number
    
    gst_rate = Column(Float, default=18.0, nullable=False) # 18% GST on brokerage services
    gst_amount = Column(Float, default=0.0, nullable=False)
    tds_rate = Column(Float, default=5.0, nullable=False) # 5% TDS under Sec 194H
    tds_amount = Column(Float, default=0.0, nullable=False)
    net_receivable = Column(Float, nullable=True) # (builder_comm + gst - tds)
    
    aging_bucket = Column(String(50), default="0-30 Days", nullable=False, index=True) # 0-30 Days, 31-60 Days, 61-90 Days, 90+ Days Overdue
    days_overdue = Column(Integer, default=0, nullable=False)
    
    remarks = Column(String(255), nullable=True)

    # Relationships
    booking = relationship("Booking", back_populates="commission")

