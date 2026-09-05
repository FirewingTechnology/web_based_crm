import enum
from sqlalchemy import Column, Integer, String, Text, ForeignKey, DateTime, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from app.database import BaseModel

class DocumentType(str, enum.Enum):
    PAN_CARD = "PAN_CARD"
    AADHAAR_CARD = "AADHAAR_CARD"
    PASSPORT = "PASSPORT"
    ALLOTMENT_LETTER = "ALLOTMENT_LETTER"
    COST_SHEET = "COST_SHEET"
    PAYMENT_RECEIPT = "PAYMENT_RECEIPT"
    BBA_AGREEMENT = "BBA_AGREEMENT"
    SALE_DEED = "SALE_DEED"
    OTHER = "OTHER"

class VerificationStatus(str, enum.Enum):
    PENDING = "PENDING"
    VERIFIED = "VERIFIED"
    REJECTED = "REJECTED"

class BuyerDocument(BaseModel):
    __tablename__ = "buyer_documents"

    id = Column(Integer, primary_key=True, index=True)
    organization_id = Column(Integer, ForeignKey("organizations.id"), nullable=True, index=True)
    lead_id = Column(Integer, ForeignKey("leads.id"), nullable=True, index=True)
    booking_id = Column(Integer, ForeignKey("bookings.id"), nullable=True, index=True)
    uploaded_by_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    document_type = Column(String(50), default=DocumentType.OTHER.value, nullable=False, index=True)
    title = Column(String(200), nullable=False)
    file_name = Column(String(255), nullable=False)
    file_url = Column(String(500), nullable=False)
    file_size_bytes = Column(Integer, nullable=True)
    mime_type = Column(String(100), default="application/pdf", nullable=False)

    document_number = Column(String(100), nullable=True) # e.g. ABCDE1234F or XXXX-XXXX-1234

    verification_status = Column(String(50), default=VerificationStatus.PENDING.value, nullable=False, index=True)
    verified_by_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    verified_at = Column(DateTime, nullable=True)
    rejection_reason = Column(Text, nullable=True)

    # Relationships
    lead = relationship("Lead", backref="documents")
    booking = relationship("Booking", backref="documents")
    uploaded_by = relationship("User", foreign_keys=[uploaded_by_id])
    verified_by = relationship("User", foreign_keys=[verified_by_id])
