import uuid
import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.database import get_db
from app.models.user import User, UserRole
from app.models.lead import Lead, LeadStatus
from app.schemas.document import BuyerDocumentCreate, BuyerDocumentVerify
from app.services.document_service import DocumentService

client = TestClient(app)

@pytest.fixture
def db_session():
    db = next(get_db())
    yield db
    db.rollback()

def test_document_service_kyc_flow(db_session):
    admin = db_session.query(User).filter(User.role == UserRole.ADMIN).first()
    assert admin is not None

    lead = Lead(
        name=f"KYC Test Buyer {uuid.uuid4().hex[:4]}",
        phone=f"+91 99{uuid.uuid4().hex[:8]}",
        status=LeadStatus.QUALIFIED,
        health_score=50
    )
    db_session.add(lead)
    db_session.commit()
    db_session.refresh(lead)

    # 1. Upload PAN Card
    pan_doc = BuyerDocumentCreate(
        lead_id=lead.id,
        document_type="PAN_CARD",
        title="Buyer PAN Card",
        file_name="pan_card.pdf",
        file_url="https://docs.realvion.com/vault/pan.pdf",
        document_number="ABCDE1234F"
    )
    doc_res = DocumentService.create_document(pan_doc, db_session, admin)
    assert doc_res.id is not None
    assert doc_res.document_type == "PAN_CARD"
    assert doc_res.verification_status == "PENDING"

    # Health score boosted
    db_session.refresh(lead)
    assert lead.health_score == 55

    # 2. Check KYC Summary (Pending verification)
    summary = DocumentService.get_lead_kyc_summary(lead.id, db_session, admin)
    assert summary.lead_id == lead.id
    assert summary.pan_verified == False
    assert summary.kyc_compliance_pct == 15.0

    # 3. Verify PAN Card
    verify_in = BuyerDocumentVerify(verification_status="VERIFIED")
    v_res = DocumentService.verify_document(doc_res.id, verify_in, db_session, admin)
    assert v_res.verification_status == "VERIFIED"

    summary_after = DocumentService.get_lead_kyc_summary(lead.id, db_session, admin)
    assert summary_after.pan_verified == True
    assert summary_after.kyc_compliance_pct == 35.0

def test_documents_api():
    login_res = client.post("/api/v1/auth/login", json={"email": "admin@brokeros.com", "password": "Admin@123"})
    assert login_res.status_code == 200
    token = login_res.json()["access_token"]

    lead_res = client.get("/api/v1/leads", headers={"Authorization": f"Bearer {token}"})
    assert lead_res.status_code == 200
    leads = lead_res.json()
    if leads:
        lead_id = leads[0]["id"]
        # Fetch KYC
        kyc_res = client.get(f"/api/v1/documents/lead/{lead_id}", headers={"Authorization": f"Bearer {token}"})
        assert kyc_res.status_code == 200
        data = kyc_res.json()
        assert "kyc_compliance_pct" in data
        assert "compliance_status" in data
        assert "documents" in data
