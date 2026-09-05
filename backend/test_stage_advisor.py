import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.database import SessionLocal
from app.models.lead import Lead, LeadStatus, LeadPriority
from app.models.followup import Followup, FollowupStatus, FollowupType
from app.services.stage_advisor_service import get_next_best_action

client = TestClient(app)

def get_auth_token():
    res = client.post("/api/v1/auth/login", json={"email": "admin@brokeros.com", "password": "Admin@123"})
    assert res.status_code == 200
    return res.json()["access_token"]

def test_stage_advisor_rules():
    db = SessionLocal()

    # 1. New lead
    lead_new = Lead(
        name="New Advisor Prospect",
        phone="+919876543220",
        status=LeadStatus.NEW,
        priority=LeadPriority.HIGH
    )
    adv_new = get_next_best_action(lead_new, db)
    assert adv_new["current_status"] == "New"
    assert adv_new["suggested_next_status"] == "Contacted"
    assert adv_new["urgency"] == "High"
    assert len(adv_new["talking_points"]) > 0
    assert "Initiate first contact" in adv_new["primary_action"]

    # 2. Contacted lead with missing budget & location
    lead_contacted = Lead(
        name="Contacted Prospect",
        phone="+919876543221",
        status=LeadStatus.CONTACTED,
        priority=LeadPriority.MEDIUM
    )
    adv_contacted = get_next_best_action(lead_contacted, db)
    assert adv_contacted["current_status"] == "Contacted"
    assert adv_contacted["suggested_next_status"] == "Qualified"
    assert adv_contacted["stage_progression_readiness"] is False
    assert any("Budget" in b for b in adv_contacted["blockers"])
    assert any("location" in b.lower() for b in adv_contacted["blockers"])

    # 3. Qualified lead with budget & location
    lead_qual = Lead(
        name="Qualified Prospect",
        phone="+919876543222",
        status=LeadStatus.QUALIFIED,
        budget_min=80.0,
        budget_max=120.0,
        preferred_location="Noida Expressway"
    )
    adv_qual = get_next_best_action(lead_qual, db)
    assert adv_qual["current_status"] == "Qualified"
    assert adv_qual["suggested_next_status"] == "Site Visit Scheduled"
    assert any("Site visit" in b for b in adv_qual["blockers"])

    # 4. Negotiation lead
    lead_nego = Lead(
        name="Negotiation Prospect",
        phone="+919876543223",
        status=LeadStatus.NEGOTIATION,
        budget_min=150.0,
        budget_max=180.0,
        preferred_location="Sector 150"
    )
    adv_nego = get_next_best_action(lead_nego, db)
    assert adv_nego["current_status"] == "Negotiation"
    assert adv_nego["suggested_next_status"] == "Booked"
    assert adv_nego["stage_progression_readiness"] is True
    assert "token" in adv_nego["primary_action"].lower()

    db.close()

def test_stage_advisor_api():
    token = get_auth_token()
    headers = {"Authorization": f"Bearer {token}"}

    # Test with lead 1
    res = client.get("/api/v1/leads/1/next-action", headers=headers)
    assert res.status_code == 200
    data = res.json()
    assert data["lead_id"] == 1
    assert "primary_action" in data
    assert "suggested_channel" in data
    assert "talking_points" in data
    assert "stage_progression_readiness" in data
    assert isinstance(data["talking_points"], list)
