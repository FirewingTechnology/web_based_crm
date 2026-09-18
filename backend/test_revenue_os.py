import os
import pytest
from datetime import datetime, timezone, timedelta
from fastapi.testclient import TestClient

from app.main import app
from app.database import SessionLocal
from app.models.lead import Lead, LeadStatus, LeadPriority
from app.models.project import Project, ProjectStatus
from app.models.builder import Builder
from app.models.site_visit import SiteVisit, SiteVisitStatus
from app.models.automation import AutomationRule
from app.models.user import User, UserRole
from app.services.universal_ingestion_service import UniversalIngestionService
from app.services.call_service import CallService

client = TestClient(app)

def get_auth_token():
    res = client.post("/api/v1/auth/login", json={"email": "admin@brokeros.com", "password": "Admin@123"})
    if res.status_code != 200:
        # Fallback to superadmin
        res = client.post("/api/v1/auth/login", json={"email": "superadmin@realvion.com", "password": "Admin@123"})
    assert res.status_code == 200, f"Login failed: {res.text}"
    return res.json()["access_token"]


def test_universal_ingestion_meta_and_idempotency():
    """Verify Meta lead ingestion, phone normalization (+91), SLA deadline, and duplicate idempotency."""
    db = SessionLocal()
    admin = db.query(User).filter(User.role.in_([UserRole.SUPERADMIN, UserRole.ADMIN])).first()
    org_id = admin.organization_id if admin else None

    # 1. Simulate Meta webhook payload
    meta_payload = {
        "organization_id": org_id or 1,
        "object": "page",
        "entry": [{
            "id": "1002345",
            "changes": [{
                "field": "leadgen",
                "value": {
                    "leadgen_id": "meta_lead_rev_os_9999",
                    "form_id": "form_luxury_villas",
                    "campaign_name": "Godrej Palm Retreat Summer Blast",
                    "ad_name": "3BHK Carousel Ad",
                    "created_time": 1726000000,
                    "field_data": [
                        {"name": "full_name", "values": ["Vikramaditya Sharma"]},
                        {"name": "phone_number", "values": ["9899112233"]},
                        {"name": "email", "values": ["vikram@sharma-enterprises.in"]},
                        {"name": "city", "values": ["Noida"]},
                        {"name": "budget", "values": ["2.5 Cr"]}
                    ]
                }
            }]
        }]
    }

    # Post to ingestion endpoint
    res = client.post("/api/v1/ingest/meta", json=meta_payload)
    assert res.status_code == 200, f"Meta ingestion failed with: {res.text}"
    data = res.json()
    assert data["status"] in ["CREATED_AND_ASSIGNED", "DUPLICATE_EVENT_IGNORED"]
    lead_id = data["lead_id"]
    assert data["lead_name"] == "Vikramaditya Sharma"

    # Verify lead in database
    lead = db.query(Lead).filter(Lead.id == lead_id).first()
    assert lead is not None
    assert lead.normalized_phone == "+919899112233"
    assert lead.campaign_name == "Godrej Palm Retreat Summer Blast"
    assert lead.sla_deadline is not None
    assert lead.health_score is not None

    # 2. Idempotency test: Re-post identical payload
    res_duplicate = client.post("/api/v1/ingest/meta", json=meta_payload)
    assert res_duplicate.status_code == 200, f"Idempotency failed: {res_duplicate.text}"
    data_dup = res_duplicate.json()
    assert data_dup["status"] == "DUPLICATE_EVENT_IGNORED"
    # Idempotent response returns existing lead without creating a new lead ID
    assert data_dup["lead_id"] == lead_id

    db.close()


def test_site_visit_geofence_verification():
    """Verify site visit check-in with GPS geofence validation."""
    token = get_auth_token()
    headers = {"Authorization": f"Bearer {token}"}
    db = SessionLocal()

    # Create project with GPS coords (Whitefield, Bangalore)
    project = db.query(Project).filter(Project.latitude.isnot(None)).first()
    if not project:
        builder = db.query(Builder).first()
        if not builder:
            builder = Builder(name="Prestige Estates", contact_person="Vijay", phone="9876543200")
            db.add(builder)
            db.commit()
            db.refresh(builder)
        project = Project(
            name="Prestige Tech Park Villa",
            location="Whitefield, Bangalore",
            configuration="3 BHK",
            min_price=120.0,
            max_price=180.0,
            builder_id=builder.id,
            latitude=12.9698,
            longitude=77.7499,
            geofence_radius_meters=500.0,
            status=ProjectStatus.UNDER_CONSTRUCTION
        )
        db.add(project)
        db.commit()
        db.refresh(project)

    admin = db.query(User).filter(User.email == "admin@brokeros.com").first()
    sales_user = db.query(User).filter(User.role == UserRole.SALES_EXECUTIVE).first() or admin

    # Create a test lead
    lead = Lead(
        name="Sunita Malhotra",
        phone="+919877112244",
        status=LeadStatus.QUALIFIED,
        priority=LeadPriority.HIGH,
        preferred_project_id=project.id,
        organization_id=admin.organization_id if admin else 1,
        deal_value=150.0
    )
    db.add(lead)
    db.commit()
    db.refresh(lead)

    # Schedule a site visit
    scheduled_time = datetime.now(timezone.utc) + timedelta(hours=2)
    visit = SiteVisit(
        lead_id=lead.id,
        project_id=project.id,
        sales_executive_id=sales_user.id,
        otp_code="123456",
        organization_id=admin.organization_id if admin else 1,
        scheduled_at=scheduled_time,
        status=SiteVisitStatus.SCHEDULED
    )
    db.add(visit)
    db.commit()
    db.refresh(visit)

    # 1. Check in within geofence (20 meters away)
    checkin_payload_valid = {
        "latitude": 12.9699,
        "longitude": 77.7500,
        "notes": "Met client at tower entrance with floor plan."
    }
    res_valid = client.post(f"/api/v1/site-visits/{visit.id}/checkin", json=checkin_payload_valid, headers=headers)
    assert res_valid.status_code == 200
    res_data = res_valid.json()
    assert res_data["geofence_status"] == "INSIDE_RADIUS"
    assert (res_data.get("distance_from_project_meters") or res_data.get("distance_meters")) < 500.0

    # 2. Schedule second visit for testing out-of-range checkin
    visit2 = SiteVisit(
        lead_id=lead.id,
        project_id=project.id,
        sales_executive_id=sales_user.id,
        otp_code="654321",
        organization_id=admin.organization_id if admin else 1,
        scheduled_at=scheduled_time,
        status=SiteVisitStatus.SCHEDULED
    )
    db.add(visit2)
    db.commit()
    db.refresh(visit2)

    # Check in 15 km away
    checkin_payload_far = {
        "latitude": 12.8398,
        "longitude": 77.6770,
        "notes": "Attempting check-in from distance"
    }
    res_far = client.post(f"/api/v1/site-visits/{visit2.id}/checkin", json=checkin_payload_far, headers=headers)
    assert res_far.status_code == 200
    res_far_data = res_far.json()
    assert res_far_data["geofence_status"] == "OUTSIDE_RADIUS"
    assert (res_far_data.get("distance_from_project_meters") or res_far_data.get("distance_meters")) > 1000.0

    db.close()


def test_call_intelligence_and_followup():
    """Verify call logging, auto-followup generation, and signed playback URL."""
    token = get_auth_token()
    headers = {"Authorization": f"Bearer {token}"}
    db = SessionLocal()

    admin = db.query(User).filter(User.email == "admin@brokeros.com").first()
    org_id = admin.organization_id if admin else 1

    lead = db.query(Lead).filter(Lead.organization_id == org_id).first()
    if not lead:
        lead = Lead(
            name="Test Caller",
            phone="+919876500000",
            status=LeadStatus.NEW,
            organization_id=org_id
        )
        db.add(lead)
        db.commit()
        db.refresh(lead)

    assert lead is not None

    call_payload = {
        "lead_id": lead.id,
        "direction": "OUTBOUND",
        "duration_seconds": 180,
        "outcome": "INTERESTED",
        "notes": "Client requested updated cost sheet with bank subvention scheme.",
        "recording_url": "https://storage.googleapis.com/realvion-recordings/call_rec_123.mp3",
        "schedule_followup": True,
        "followup_hours": 24
    }

    res = client.post("/api/v1/calls/log", json=call_payload, headers=headers)
    assert res.status_code in [200, 201], f"Call logging failed: {res.text}"
    data = res.json()
    assert data["outcome"] == "Interested" or data["outcome"] == "INTERESTED"
    assert data["signed_playback_url"] is not None

    call_id = data["id"]
    # Test signed audio playback redirect endpoint
    playback_res = client.get(f"/api/v1/calls/{call_id}/stream", follow_redirects=False)
    assert playback_res.status_code in [302, 307]
    assert "realvion-recordings" in playback_res.headers["location"]

    db.close()


def test_business_today_command_center():
    """Verify management 'Business Today' command center metrics and urgent items."""
    token = get_auth_token()
    headers = {"Authorization": f"Bearer {token}"}

    res = client.get("/api/v1/reports/business-today", headers=headers)
    assert res.status_code == 200
    data = res.json()
    assert "kpis" in data
    assert "active_pipeline_cr" in data["kpis"]
    assert "at_risk_lakhs" in data["kpis"]
    assert "site_visits_today" in data["kpis"]
    assert "urgent_action_items" in data
    assert isinstance(data["urgent_action_items"], list)


def test_revenue_attribution():
    """Verify end-to-end source-to-revenue attribution endpoint."""
    token = get_auth_token()
    headers = {"Authorization": f"Bearer {token}"}

    res = client.get("/api/v1/reports/revenue-attribution", headers=headers)
    assert res.status_code == 200
    data = res.json()
    assert "summary" in data
    assert "sources" in data
    assert "campaigns" in data
    assert "total_leads" in data["summary"]


def test_copilot_queries():
    """Verify AI CRM Copilot answers live queries with exact context."""
    token = get_auth_token()
    headers = {"Authorization": f"Bearer {token}"}

    queries = [
        "Which leads should I call today?",
        "Why is our deal at risk?",
        "Which marketing source gives the highest ROI?",
        "What is our pending commission aging?"
    ]

    for q in queries:
        res = client.post("/api/v1/copilot/query", json={"query": q}, headers=headers)
        assert res.status_code == 200
        data = res.json()
        assert data["answer"] != ""
        assert len(data["suggested_actions"]) > 0
