from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel

class BuyerDocumentCreate(BaseModel):
    lead_id: Optional[int] = None
    booking_id: Optional[int] = None
    document_type: str # PAN_CARD, AADHAAR_CARD, PASSPORT, ALLOTMENT_LETTER, COST_SHEET, PAYMENT_RECEIPT, BBA_AGREEMENT, SALE_DEED, OTHER
    title: str
    file_name: str
    file_url: str
    file_size_bytes: Optional[int] = None
    mime_type: Optional[str] = "application/pdf"
    document_number: Optional[str] = None

class BuyerDocumentVerify(BaseModel):
    verification_status: str # VERIFIED | REJECTED | PENDING
    rejection_reason: Optional[str] = None

class BuyerDocumentResponse(BaseModel):
    id: int
    organization_id: Optional[int] = None
    lead_id: Optional[int] = None
    booking_id: Optional[int] = None
    uploaded_by_id: int
    uploaded_by_name: Optional[str] = None

    document_type: str
    title: str
    file_name: str
    file_url: str
    file_size_bytes: Optional[int] = None
    mime_type: str
    document_number: Optional[str] = None

    verification_status: str
    verified_by_id: Optional[int] = None
    verified_by_name: Optional[str] = None
    verified_at: Optional[datetime] = None
    rejection_reason: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

class BuyerKYCSummary(BaseModel):
    lead_id: int
    lead_name: str
    pan_verified: bool
    aadhaar_verified: bool
    cost_sheet_present: bool
    payment_proof_present: bool
    allotment_letter_present: bool
    bba_present: bool

    kyc_compliance_pct: float
    compliance_status: str # "FULLY_COMPLIANT" | "PARTIALLY_COMPLIANT" | "PENDING"
    documents: List[BuyerDocumentResponse]
