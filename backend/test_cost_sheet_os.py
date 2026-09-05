import uuid
import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.database import get_db
from app.models.user import User, UserRole
from app.models.lead import Lead, LeadStatus, LeadPriority
from app.models.builder import Builder
from app.models.project import Project, ProjectStatus
from app.models.booking import Booking, BookingStatus
from app.models.commission import Commission
from app.middleware.auth_middleware import get_current_user
from app.services.cost_sheet_service import CostSheetService
from app.schemas.cost_sheet import CostSheetCalculateRequest, QuickBookFromCostSheetRequest

client = TestClient(app)

@pytest.fixture
def db_session():
    db = next(get_db())
    yield db
    db.rollback()

def test_cost_sheet_calculation(db_session):
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
    if not builder:
        builder = Builder(
            name="Godrej Properties",
            company="Godrej",
            contact_person="Director",
            email="info@godrej.com",
            phone="+91 98111 22233",
            address="Noida",
            commission_rate=3.5
        )
        db_session.add(builder)
        db_session.flush()

    project = Project(
        name="Godrej Palm Retreat",
        builder_id=builder.id,
        location="Sector 150, Noida",
        configuration="3 BHK Resort Residences",
        min_price=120.0,
        max_price=250.0,
        status=ProjectStatus.UNDER_CONSTRUCTION
    )
    db_session.add(project)
    db_session.flush()

    # Calculate cost sheet for 1650 sq ft unit on 8th floor @ 7500/sqft
    req = CostSheetCalculateRequest(
        project_id=project.id,
        unit_number="Tower 4 - 802",
        configuration="3 BHK",
        super_builtup_area_sqft=1650.0,
        base_rate_per_sqft=7500.0,
        floor_number=8,
        floor_rise_rate_per_sqft=25.0,
        plc_rate_per_sqft=150.0,
        car_parking_slots=1,
        car_parking_rate=400000.0,
        clubhouse_charges=350000.0,
        possession_charges=150000.0,
        gst_rate_pct=5.0,
        stamp_duty_rate_pct=7.0,
        registration_fee=30000.0,
        discount_amount=100000.0
    )

    res = CostSheetService.calculate_cost_sheet(req, db_session, test_user)

    # 1. Base selling price: 1650 * 7500 = 1,23,75,000
    assert res.breakdown.base_selling_price == 12375000
    # 2. Floor rise: 4 floors above floor 4 * 25 * 1650 = 1,65,000
    assert res.breakdown.floor_rise_charges == 165000
    # 3. PLC: 150 * 1650 = 2,47,500
    assert res.breakdown.plc_charges == 247500
    # 4. Agreement value = 12375000 + 165000 + 247500 + 400000 - 100000 = 1,30,87,500
    assert res.breakdown.total_agreement_value == 13087500
    # 5. GST (5%) = 6,54,375
    assert res.breakdown.gst_amount == 654375
    # 6. Stamp duty (7%) = 9,16,125
    assert res.breakdown.stamp_duty_amount == 916125
    # 7. Grand total > agreement value
    assert res.breakdown.grand_total > res.breakdown.total_agreement_value
    # 8. Milestone schedule has 7 stages
    assert len(res.payment_schedule) == 7
    # 9. Formatted WhatsApp summary
    assert "Godrej Palm Retreat" in res.whatsapp_summary
    assert "Tower 4 - 802" in res.whatsapp_summary

def test_quick_booking_from_cost_sheet(db_session):
    test_user = db_session.query(User).filter(User.email == "admin@brokeros.com").first()
    builder = db_session.query(Builder).first()
    project = db_session.query(Project).first()

    unique_phone = f"+91 99{uuid.uuid4().hex[:8]}"
    lead = Lead(
        name="Deepak Singhal",
        phone=unique_phone,
        email="deepak@example.com",
        source="Channel Partner",
        status=LeadStatus.NEGOTIATION,
        priority=LeadPriority.URGENT,
        budget_min=130.0,
        budget_max=160.0
    )
    db_session.add(lead)
    db_session.flush()

    req = QuickBookFromCostSheetRequest(
        lead_id=lead.id,
        project_id=project.id,
        unit_number="Tower 2 - 1201",
        configuration="3 BHK Luxury",
        super_builtup_area_sqft=1500.0,
        base_rate_per_sqft=8000.0,
        floor_number=12,
        notes="Booked with festive Diwali discount"
    )

    booking = CostSheetService.quick_book_from_cost_sheet(req, db_session, test_user)

    assert booking.id is not None
    assert booking.lead_id == lead.id
    assert booking.unit_number == "Tower 2 - 1201"
    assert booking.status == BookingStatus.CONFIRMED

    # Lead should be advanced to BOOKED
    db_session.refresh(lead)
    assert lead.status == LeadStatus.BOOKED

    # Commission should be created
    comm = db_session.query(Commission).filter(Commission.booking_id == booking.id).first()
    assert comm is not None
    assert comm.builder_commission_amount > 0

def test_cost_sheet_api():
    app.dependency_overrides[get_current_user] = lambda: User(
        id=1,
        name="Admin Test",
        email="admin@test.com",
        role=UserRole.ADMIN,
        is_active=True,
        organization_id=None
    )

    # Defaults endpoint
    res = client.get("/api/v1/bookings/cost-sheet/defaults/1")
    if res.status_code == 200:
        data = res.json()
        assert "super_builtup_area_sqft" in data
        assert "base_rate_per_sqft" in data

    # Calculate endpoint
    calc_payload = {
        "project_id": 1,
        "unit_number": "Test Unit 101",
        "configuration": "2 BHK",
        "super_builtup_area_sqft": 1200.0,
        "base_rate_per_sqft": 6000.0
    }
    res_calc = client.post("/api/v1/bookings/cost-sheet/calculate", json=calc_payload)
    if res_calc.status_code == 200:
        cdata = res_calc.json()
        assert "breakdown" in cdata
        assert "payment_schedule" in cdata
        assert "whatsapp_summary" in cdata

    app.dependency_overrides.clear()
