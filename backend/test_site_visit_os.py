import pytest
from datetime import datetime, timezone, timedelta
from fastapi.testclient import TestClient

from app.main import app
from app.database import SessionLocal
from app.models.lead import Lead, LeadStatus, LeadPriority
from app.models.project import Project, ProjectStatus
from app.models.builder import Builder
from app.models.site_visit import SiteVisit, SiteVisitStatus

client = TestClient(app)

def get_auth_token():
    res = client.post("/api/v1/auth/login", json={"email": "admin@brokeros.com", "password": "Admin@123"})
    assert res.status_code == 200
    return res.json()["access_token"]

def test_site_visit_lifecycle():
    token = get_auth_token()
    headers = {"Authorization": f"Bearer {token}"}
    db = SessionLocal()

    # 1. Ensure a project exists
    project = db.query(Project).first()
    if not project:
        builder = db.query(Builder).first()
        if not builder:
            builder = Builder(name="Prestige Estates", contact_person="Vijay", phone="9876543200")
            db.add(builder)
            db.commit()
            db.refresh(builder)
        project = Project(
            name="Prestige High Fields",
            location="Whitefield, Bangalore",
            builder_id=builder.id,
            configuration="3 BHK",
            min_price=120.0,
            max_price=180.0,
            status=ProjectStatus.UNDER_CONSTRUCTION
        )
        db.add(project)
        db.commit()
        db.refresh(project)

    # 2. Create a test lead
    lead = Lead(
        name="Ananya Roy",
        phone="+919833445566",
        status=LeadStatus.QUALIFIED,
        priority=LeadPriority.HIGH,
        preferred_project_id=project.id,
        budget_min=120.0,
        budget_max=160.0
    )
    db.add(lead)
    db.commit()
    db.refresh(lead)

    # 3. Schedule VIP Site Visit
    visit_time = (datetime.now(timezone.utc) + timedelta(days=2)).replace(tzinfo=None)
    payload = {
        "lead_id": lead.id,
        "project_id": project.id,
        "scheduled_at": visit_time.isoformat(),
        "pickup_location": "Indiranagar Metro Station",
        "pickup_time": "10:30 AM",
        "driver_name": "Ramesh Chauffeur",
        "driver_phone": "+919877788899",
        "cab_vehicle_number": "KA-01-MJ-4592"
    }

    create_res = client.post("/api/v1/site-visits", json=payload, headers=headers)
    assert create_res.status_code == 201
    visit_data = create_res.json()
    assert visit_data["status"] == "Scheduled"
    assert len(visit_data["otp_code"]) == 4
    visit_id = visit_data["id"]
    otp = visit_data["otp_code"]

    # Verify lead transitioned to Site Visit Scheduled
    db.refresh(lead)
    assert lead.status == LeadStatus.SITE_VISIT

    # 4. Verify OTP (Negative test: wrong OTP)
    bad_otp = client.post(f"/api/v1/site-visits/{visit_id}/verify-otp", json={"otp_code": "0000"}, headers=headers)
    assert bad_otp.status_code == 400

    # Positive test: valid OTP
    good_otp = client.post(f"/api/v1/site-visits/{visit_id}/verify-otp", json={"otp_code": otp}, headers=headers)
    assert good_otp.status_code == 200
    assert good_otp.json()["verified"] is True
    assert good_otp.json()["status"] == "In Transit"

    # 5. Complete site visit with buyer feedback & rating
    complete_payload = {
        "status": "Completed",
        "feedback_rating": 5,
        "buyer_interest_level": "Ready to Book",
        "preferred_unit": "Tower B - 1402",
        "discussion_notes": "Client loved the east-facing panoramic balcony view. Requested booking agreement draft.",
        "auto_advance_lead": True
    }

    complete_res = client.patch(f"/api/v1/site-visits/{visit_id}/status", json=complete_payload, headers=headers)
    assert complete_res.status_code == 200
    updated_visit = complete_res.json()
    assert updated_visit["status"] == "Completed"
    assert updated_visit["feedback_rating"] == 5
    assert updated_visit["buyer_interest_level"] == "Ready to Book"

    # Verify lead pipeline automatically advanced to Negotiation
    db.refresh(lead)
    assert lead.status == LeadStatus.NEGOTIATION
