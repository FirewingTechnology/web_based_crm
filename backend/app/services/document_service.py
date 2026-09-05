from datetime import datetime, timezone
from typing import List, Optional
from sqlalchemy.orm import Session
from app.models.user import User, UserRole
from app.models.lead import Lead
from app.models.booking import Booking
from app.models.document import BuyerDocument, DocumentType, VerificationStatus
from app.models.activity_log import ActivityLog
from app.schemas.document import (
    BuyerDocumentCreate,
    BuyerDocumentVerify,
    BuyerDocumentResponse,
    BuyerKYCSummary,
)

def _normalize_dt(dt: datetime | None) -> datetime | None:
    if dt is not None and dt.tzinfo is not None:
        return dt.replace(tzinfo=None)
    return dt

class DocumentService:

    @staticmethod
    def format_document_response(doc: BuyerDocument) -> BuyerDocumentResponse:
        return BuyerDocumentResponse(
            id=doc.id,
            organization_id=doc.organization_id,
            lead_id=doc.lead_id,
            booking_id=doc.booking_id,
            uploaded_by_id=doc.uploaded_by_id,
            uploaded_by_name=doc.uploaded_by.name if doc.uploaded_by else None,
            document_type=doc.document_type,
            title=doc.title,
            file_name=doc.file_name,
            file_url=doc.file_url,
            file_size_bytes=doc.file_size_bytes,
            mime_type=doc.mime_type,
            document_number=doc.document_number,
            verification_status=doc.verification_status,
            verified_by_id=doc.verified_by_id,
            verified_by_name=doc.verified_by.name if doc.verified_by else None,
            verified_at=doc.verified_at,
            rejection_reason=doc.rejection_reason,
            created_at=doc.created_at,
        )

    @staticmethod
    def create_document(
        doc_in: BuyerDocumentCreate,
        db: Session,
        current_user: User
    ) -> BuyerDocumentResponse:
        org_id = current_user.organization_id
        lead = db.query(Lead).filter(Lead.id == doc_in.lead_id).first() if doc_in.lead_id else None
        if lead and lead.organization_id:
            org_id = lead.organization_id

        doc = BuyerDocument(
            organization_id=org_id,
            lead_id=doc_in.lead_id,
            booking_id=doc_in.booking_id,
            uploaded_by_id=current_user.id,
            document_type=doc_in.document_type,
            title=doc_in.title,
            file_name=doc_in.file_name,
            file_url=doc_in.file_url,
            file_size_bytes=doc_in.file_size_bytes,
            mime_type=doc_in.mime_type or "application/pdf",
            document_number=doc_in.document_number,
            verification_status=VerificationStatus.PENDING.value,
        )
        db.add(doc)

        # If lead exists and health score is present, boost health score for providing documentation
        if lead and lead.health_score is not None:
            lead.health_score = min(100, lead.health_score + 5)

        db.add(ActivityLog(
            user_id=current_user.id,
            user_name=current_user.name,
            action="DOCUMENT_UPLOADED",
            module="Documents",
            details=f"Uploaded {doc_in.document_type} ('{doc_in.title}') for Lead #{doc_in.lead_id or doc_in.booking_id}"
        ))

        db.commit()
        db.refresh(doc)
        return DocumentService.format_document_response(doc)

    @staticmethod
    def verify_document(
        doc_id: int,
        verify_in: BuyerDocumentVerify,
        db: Session,
        current_user: User
    ) -> BuyerDocumentResponse:
        doc = db.query(BuyerDocument).filter(BuyerDocument.id == doc_id, BuyerDocument.is_deleted == False).first()
        if not doc:
            raise ValueError("Document record not found")

        now = _normalize_dt(datetime.now(timezone.utc))
        status = verify_in.verification_status.upper()

        if status == "VERIFIED":
            doc.verification_status = VerificationStatus.VERIFIED.value
            doc.verified_by_id = current_user.id
            doc.verified_at = now
            doc.rejection_reason = None

            # Boost lead health score by 10 points when KYC verified
            if doc.lead and doc.lead.health_score is not None:
                doc.lead.health_score = min(100, doc.lead.health_score + 10)

        elif status == "REJECTED":
            doc.verification_status = VerificationStatus.REJECTED.value
            doc.verified_by_id = current_user.id
            doc.verified_at = now
            doc.rejection_reason = verify_in.rejection_reason or "Document rejected by compliance team"
        else:
            doc.verification_status = VerificationStatus.PENDING.value
            doc.verified_by_id = None
            doc.verified_at = None

        db.add(ActivityLog(
            user_id=current_user.id,
            user_name=current_user.name,
            action="DOCUMENT_VERIFIED",
            module="Documents",
            details=f"Document #{doc.id} ({doc.title}) status set to {doc.verification_status} by {current_user.name}"
        ))

        db.commit()
        db.refresh(doc)
        return DocumentService.format_document_response(doc)

    @staticmethod
    def get_lead_kyc_summary(
        lead_id: int,
        db: Session,
        current_user: User
    ) -> BuyerKYCSummary:
        lead = db.query(Lead).filter(Lead.id == lead_id).first()
        if not lead:
            raise ValueError(f"Lead #{lead_id} not found")

        docs = db.query(BuyerDocument).filter(
            BuyerDocument.lead_id == lead_id,
            BuyerDocument.is_deleted == False
        ).order_by(BuyerDocument.created_at.desc()).all()

        formatted_docs = [DocumentService.format_document_response(d) for d in docs]

        pan_verified = any(
            d.document_type == DocumentType.PAN_CARD.value and d.verification_status == VerificationStatus.VERIFIED.value
            for d in docs
        )
        aadhaar_verified = any(
            d.document_type == DocumentType.AADHAAR_CARD.value and d.verification_status == VerificationStatus.VERIFIED.value
            for d in docs
        )
        cost_sheet_present = any(
            d.document_type == DocumentType.COST_SHEET.value for d in docs
        )
        payment_proof_present = any(
            d.document_type == DocumentType.PAYMENT_RECEIPT.value for d in docs
        )
        allotment_letter_present = any(
            d.document_type == DocumentType.ALLOTMENT_LETTER.value for d in docs
        )
        bba_present = any(
            d.document_type == DocumentType.BBA_AGREEMENT.value for d in docs
        )

        # Compliance score calculation
        score = 0.0
        if pan_verified:
            score += 35.0
        elif any(d.document_type == DocumentType.PAN_CARD.value for d in docs):
            score += 15.0

        if aadhaar_verified:
            score += 35.0
        elif any(d.document_type == DocumentType.AADHAAR_CARD.value for d in docs):
            score += 15.0

        if payment_proof_present:
            score += 15.0
        if allotment_letter_present or bba_present:
            score += 15.0

        score = min(100.0, score)

        if score >= 85.0:
            status = "FULLY_COMPLIANT"
        elif score >= 35.0:
            status = "PARTIALLY_COMPLIANT"
        else:
            status = "PENDING"

        return BuyerKYCSummary(
            lead_id=lead.id,
            lead_name=lead.name,
            pan_verified=pan_verified,
            aadhaar_verified=aadhaar_verified,
            cost_sheet_present=cost_sheet_present,
            payment_proof_present=payment_proof_present,
            allotment_letter_present=allotment_letter_present,
            bba_present=bba_present,
            kyc_compliance_pct=score,
            compliance_status=status,
            documents=formatted_docs,
        )

    @staticmethod
    def get_booking_documents(
        booking_id: int,
        db: Session,
        current_user: User
    ) -> List[BuyerDocumentResponse]:
        docs = db.query(BuyerDocument).filter(
            BuyerDocument.booking_id == booking_id,
            BuyerDocument.is_deleted == False
        ).order_by(BuyerDocument.created_at.desc()).all()

        return [DocumentService.format_document_response(d) for d in docs]
