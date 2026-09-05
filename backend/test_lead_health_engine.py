import pytest
from datetime import datetime, timedelta
from fastapi.testclient import TestClient

from app.main import app
from app.database import SessionLocal
from app.models.lead import Lead, LeadStatus, LeadPriority, LeadNote
from app.models.followup import Followup, FollowupStatus, FollowupType
from app.services.lead_health_service import (
    calculate_lead_health, update_lead_health, bulk_recalculate_health, get_health_summary
)

client = TestClient(app)

def get_auth_token():
    res = client.post("/api/v1/auth/login", json={"email": "admin@brokeros.com", "password": "Admin@123"})
    assert res.status_code == 200
    return res.json()["access_token"]

def test_lead_health_calculation_rules():
    db = SessionLocal()
    now = datetime.utcnow()

    # Case 1: Fresh active lead with recent note
    lead1 = Lead(
        name="Test Fresh Healthy Lead",
        phone="+919876543210",
        status=LeadStatus.NEW,
        priority=LeadPriority.MEDIUM,
        budget_min=45.0,
        budget_max=60.0,
        created_at=now,
        last_activity_at=now,
        stage_entered_at=now,
        postponement_count=0
    )
    health1 = calculate_lead_health(lead1, db, now=now)
    assert health1["health_score"] == 100
    assert health1["health_category"] == "Excellent"

    # Case 2: Untouched lead created 3 days ago without notes or follow-ups
    lead_untouched = Lead(
        name="Test Untouched Lead",
        phone="+919876543211",
        status=LeadStatus.NEW,
        priority=LeadPriority.MEDIUM,
        created_at=now - timedelta(days=3),
        last_activity_at=now - timedelta(days=3),
        stage_entered_at=now - timedelta(days=3),
        postponement_count=0
    )
    health_untouched = calculate_lead_health(lead_untouched, db, now=now)
    assert health_untouched["health_score"] <= 75
    assert any("Untouched lead" in r for r in health_untouched["health_reasons"])

    # Case 3: High value lead at risk with severe overdue follow-up
    lead_hv = Lead(
        name="Test High Value Deal At Risk",
        phone="+919876543212",
        status=LeadStatus.QUALIFIED,
        priority=LeadPriority.HIGH,
        budget_min=150.0,
        budget_max=250.0, # >= ₹1 Cr
        created_at=now - timedelta(days=15),
        last_activity_at=now - timedelta(days=5),
        stage_entered_at=now - timedelta(days=12),
        postponement_count=2
    )
    # Add an overdue followup
    f_overdue = Followup(
        title="Payment collection discussion",
        status=FollowupStatus.OVERDUE,
        scheduled_at=now - timedelta(days=4)
    )
    lead_hv.followups.append(f_overdue)

    health_hv = calculate_lead_health(lead_hv, db, now=now)
    assert health_hv["is_high_value"] is True
    assert health_hv["health_score"] < 50
    assert health_hv["health_category"] in ["Critical", "Lost Risk"]
    assert any("High-value deal" in r for r in health_hv["health_reasons"])
    assert any("overdue" in r.lower() for r in health_hv["health_reasons"])
    assert any("postponement" in r.lower() for r in health_hv["health_reasons"])

    # Case 4: Booked lead
    lead_booked = Lead(
        name="Test Booked Customer",
        phone="+919876543213",
        status=LeadStatus.BOOKED,
        budget_max=120.0
    )
    health_booked = calculate_lead_health(lead_booked, db, now=now)
    assert health_booked["health_score"] == 100
    assert health_booked["health_category"] == "Excellent"

    # Case 5: Lost lead
    lead_lost = Lead(
        name="Test Lost Customer",
        phone="+919876543214",
        status=LeadStatus.LOST,
        lost_reason="Purchased competitor project in Sector 150"
    )
    health_lost = calculate_lead_health(lead_lost, db, now=now)
    assert health_lost["health_score"] == 10
    assert health_lost["health_category"] == "Lost Risk"
    assert "Sector 150" in health_lost["health_reasons"][0]

    db.close()

def test_lead_health_api_endpoints():
    token = get_auth_token()
    headers = {"Authorization": f"Bearer {token}"}

    # 1. Health Summary
    res_summary = client.get("/api/v1/leads/health/summary", headers=headers)
    assert res_summary.status_code == 200
    summary = res_summary.json()
    assert "total_leads" in summary
    assert "pipeline_value_at_risk" in summary
    assert "top_leakage_reasons" in summary
    assert isinstance(summary["top_leakage_reasons"], list)

    # 2. Recalculate Health
    res_recalc = client.post("/api/v1/leads/health/recalculate", headers=headers)
    assert res_recalc.status_code == 200
    recalc_data = res_recalc.json()
    assert "count" in recalc_data

    # 3. Get Leads list and verify health attributes are populated
    res_leads = client.get("/api/v1/leads", headers=headers)
    assert res_leads.status_code == 200
    leads = res_leads.json()
    assert len(leads) > 0
    first_lead = leads[0]
    assert "health_score" in first_lead
    assert "health_category" in first_lead
    assert "health_reasons" in first_lead
    assert "recommended_action" in first_lead

    # 4. Lead Health Detail endpoint
    lead_id = first_lead["id"]
    res_detail = client.get(f"/api/v1/leads/{lead_id}/health", headers=headers)
    assert res_detail.status_code == 200
    detail = res_detail.json()
    assert detail["lead_id"] == lead_id
    assert "health_score" in detail
    assert "recommended_action" in detail
