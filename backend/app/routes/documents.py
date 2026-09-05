from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User, UserRole
from app.models.document import BuyerDocument
from app.schemas.document import (
    BuyerDocumentCreate,
    BuyerDocumentVerify,
    BuyerDocumentResponse,
    BuyerKYCSummary,
)
from app.services.document_service import DocumentService
from app.middleware.auth_middleware import get_current_user

router = APIRouter(prefix="/documents", tags=["Document Vault & Buyer KYC"])

@router.get("/lead/{lead_id}", response_model=BuyerKYCSummary)
def get_lead_kyc_and_documents(
    lead_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Returns Buyer KYC verification status, statutory compliance score, and document vault for a lead.
    """
    try:
        return DocumentService.get_lead_kyc_summary(lead_id, db, current_user)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

@router.get("/booking/{booking_id}", response_model=List[BuyerDocumentResponse])
def get_booking_documents(
    booking_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Returns all transaction documents (Allotment Letter, Cost Sheet, Payment Receipts) for a booking.
    """
    return DocumentService.get_booking_documents(booking_id, db, current_user)

@router.post("", response_model=BuyerDocumentResponse, status_code=status.HTTP_201_CREATED)
def upload_buyer_document(
    doc_in: BuyerDocumentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Registers a new buyer document (PAN, Aadhaar, Cost Sheet, Cheque/UTR receipt) in the vault.
    """
    return DocumentService.create_document(doc_in, db, current_user)

@router.patch("/{document_id}/verify", response_model=BuyerDocumentResponse)
def verify_document(
    document_id: int,
    verify_in: BuyerDocumentVerify,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Reviews and verifies/rejects a buyer KYC document, updating compliance scores.
    """
    try:
        return DocumentService.verify_document(document_id, verify_in, db, current_user)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

@router.delete("/{document_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_document(
    document_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    doc = db.query(BuyerDocument).filter(BuyerDocument.id == document_id, BuyerDocument.is_deleted == False).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    doc.is_deleted = True
    db.commit()
    return None
