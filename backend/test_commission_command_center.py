import uuid
from datetime import datetime, timezone, timedelta
import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.database import get_db
from app.models.user import User, UserRole
from app.models.lead import Lead, LeadStatus
from app.models.builder import Builder
from app.models.project import Project
from app.models.booking import Booking, BookingStatus
from app.models.commission import Commission, CommissionStage, PayoutStatus
from app.middleware.auth_middleware import get_current_user
from app.services.commission_service import CommissionService
from app.schemas.commission_ledger import CommissionStageUpdate

client = TestClient(app)

@pytest.fixture
def db_session():
    db = next(get_db())
    yield db
    db.rollback()

def test_commission_aging_and_taxes(db_session):
    test_user = db_session.query(User).filter(User.email == "admin@brokeros.com").first()
    if not test_user:
        test_user = User(
            name="Admin User",
            email="admin@brokeros.com",
            hashed_password="hash",
            role=UserRole.ADMIN,
            is_active=True
        )
        db_session.add(test_user)
        db_session.flush()

    builder = db_session.query(Builder).first()
    project = db_session.query(Project).first()

    unique_phone = f"+91 91{uuid.uuid4().hex[:8]}"
    lead = Lead(
        name="Harish Reddy",
        phone=unique_phone,
        status=LeadStatus.BOOKED
    )
    db_session.add(lead)
    db_session.flush()

    booking = Booking(
        booking_number=f"BK-{uuid.uuid4().hex[:6].upper()}",
        lead_id=lead.id,
        project_id=project.id,
        builder_id=builder.id,
        assigned_executive_id=test_user.id,
        unit_number="Villa 108",
        booking_amount=1000000.0,
        total_deal_value=20000000.0, # 2 Cr
        status=BookingStatus.CONFIRMED
    )
    db_session.add(booking)
    db_session.flush()

    # Create commission: 3% on 2 Cr = 6,00,000 INR
    comm = Commission(
        booking_id=booking.id,
        builder_commission_rate=3.0,
        builder_commission_amount=600000.0,
        executive_commission_rate=0.5,
        executive_commission_amount=100000.0,
        broker_commission_rate=0.0,
        broker_commission_amount=0.0,
        company_margin_amount=500000.0,
        stage=CommissionStage.SUBMITTED,
        payout_status=PayoutStatus.PENDING,
        invoice_number="INV-2026-001",
        invoice_date=datetime.now(timezone.utc).replace(tzinfo=None) - timedelta(days=45),
        due_date=datetime.now(timezone.utc).replace(tzinfo=None) - timedelta(days=15),
    )
    db_session.add(comm)
    db_session.flush()

    CommissionService.refresh_commission_metrics(comm)

    # 1. 18% GST: 600000 * 0.18 = 108000
    assert comm.gst_amount == 108000.0
    # 2. 5% TDS: 600000 * 0.05 = 30000
    assert comm.tds_amount == 30000.0
    # 3. Net receivable: 600000 + 108000 - 30000 = 678000
    assert comm.net_receivable == 678000.0
    # 4. Overdue check: due 15 days ago -> 15 days overdue
    assert comm.days_overdue == 15
    assert comm.aging_bucket == "0-30 Days"

    # Now update stage to PAID with UTR reference
    update_in = CommissionStageUpdate(
        stage=CommissionStage.PAID,
        payment_reference="HDFCUTR9988776655",
        remarks="Payment cleared via RTGS"
    )
    res = CommissionService.update_commission_stage(comm.id, update_in, db_session, test_user)

    assert res.stage in ("Paid", "PAID")
    assert res.payout_status in ("Paid", "PAID")
    assert res.payment_reference == "HDFCUTR9988776655"
    assert res.days_overdue == 0
    assert res.aging_bucket == "Paid"

def test_commission_command_center_summary(db_session):
    test_user = db_session.query(User).filter(User.email == "admin@brokeros.com").first()
    summary = CommissionService.get_command_center(db_session, test_user)

    assert summary.total_receivable >= 0
    assert summary.total_collected >= 0
    assert len(summary.aging_buckets) == 4
    assert any(b.bucket == "0-30 Days" for b in summary.aging_buckets)

def test_commission_api():
    app.dependency_overrides[get_current_user] = lambda: User(
        id=1,
        name="Admin Test",
        email="admin@test.com",
        role=UserRole.ADMIN,
        is_active=True,
        organization_id=None
    )

    res = client.get("/api/v1/commissions/aging-summary")
    assert res.status_code == 200
    data = res.json()
    assert "total_receivable" in data
    assert "aging_buckets" in data
    assert "commissions" in data

    app.dependency_overrides.clear()
