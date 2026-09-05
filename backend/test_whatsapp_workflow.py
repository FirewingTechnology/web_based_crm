import pytest
from datetime import datetime, timezone
from fastapi.testclient import TestClient

from app.main import app
from app.database import SessionLocal
from app.models.lead import Lead, LeadStatus, LeadPriority
from app.models.project import Project, ProjectStatus
from app.models.whatsapp import WhatsAppMessage

client = TestClient(app)

def get_auth_token():
    res = client.post("/api/v1/auth/login", json={"email": "admin@brokeros.com", "password": "Admin@123"})
    assert res.status_code == 200
    return res.json()["access_token"]

def test_whatsapp_templates_rendering():
    token = get_auth_token()
    headers = {"Authorization": f"Bearer {token}"}
    db = SessionLocal()

    # Query existing project or create properly
    project = db.query(Project).first()
    if not project:
        from app.models.builder import Builder
        builder = db.query(Builder).first()
        if not builder:
            builder = Builder(name="Test Lodha Builder", contact_person="Ramesh", phone="9876500000")
            db.add(builder)
            db.commit()
            db.refresh(builder)
        project = Project(
            name="Lodha Park Vista Test",
            location="Worli, Mumbai",
            builder_id=builder.id,
            configuration="3 BHK",
            min_price=150.0,
            max_price=250.0,
            status=ProjectStatus.UNDER_CONSTRUCTION
        )
        db.add(project)
        db.commit()
        db.refresh(project)

    lead = Lead(
        name="Vikram Oberoi Test",
        phone="+919876543299",
        budget_min=150.0,
        budget_max=200.0,
        preferred_project_id=project.id,
        status=LeadStatus.QUALIFIED,
        priority=LeadPriority.HIGH
    )
    db.add(lead)
    db.commit()
    db.refresh(lead)

    resp = client.get(f"/api/v1/whatsapp/templates?lead_id={lead.id}", headers=headers)
    assert resp.status_code == 200
    templates = resp.json()
    assert len(templates) >= 5

    # Check qualification template personalization
    qual = next((t for t in templates if t["key"] == "QUALIFICATION"), None)
    assert qual is not None
    assert "Vikram Oberoi Test" in qual["rendered_body"]
    assert project.name in qual["rendered_body"]
    assert "₹150L - ₹200L" in qual["rendered_body"]

    # Check site visit template
    visit = next((t for t in templates if t["key"] == "SITE_VISIT_CONFIRMATION"), None)
    assert visit is not None
    assert project.name.replace(" ", "+") in visit["rendered_body"]

def test_send_and_track_whatsapp_message():
    token = get_auth_token()
    headers = {"Authorization": f"Bearer {token}"}
    db = SessionLocal()

    lead = Lead(
        name="Rohit Verma Test",
        phone="+919123456799",
        status=LeadStatus.CONTACTED,
        priority=LeadPriority.MEDIUM,
        health_score=60
    )
    db.add(lead)
    db.commit()
    db.refresh(lead)

    payload = {
        "lead_id": lead.id,
        "template_key": "SITE_VISIT_CONFIRMATION",
        "recipient_phone": "+91 9123456799",
        "message_body": "Hi Rohit, your visit is confirmed for tomorrow 11 AM.",
        "metadata": {"source": "LeadDrawer"}
    }

    send_resp = client.post("/api/v1/whatsapp/send", json=payload, headers=headers)
    assert send_resp.status_code == 200
    data = send_resp.json()
    assert data["status"] == "SENT"
    assert "wa.me/919123456799" in data["wa_link"]
    message_id = data["id"]

    # Verify lead activity updated
    db.refresh(lead)
    assert lead.last_activity_at is not None

    # Verify message list
    list_resp = client.get(f"/api/v1/whatsapp/lead/{lead.id}/messages", headers=headers)
    assert list_resp.status_code == 200
    messages = list_resp.json()
    assert len(messages) >= 1
    assert any(m["id"] == message_id for m in messages)

    # Update status to READ then REPLIED
    status_resp = client.patch(
        f"/api/v1/whatsapp/messages/{message_id}/status",
        json={"status": "READ"},
        headers=headers
    )
    assert status_resp.status_code == 200
    assert status_resp.json()["status"] == "READ"
    assert status_resp.json()["read_at"] is not None

    replied_resp = client.patch(
        f"/api/v1/whatsapp/messages/{message_id}/status",
        json={"status": "REPLIED"},
        headers=headers
    )
    assert replied_resp.status_code == 200
    assert replied_resp.json()["status"] == "REPLIED"
    assert replied_resp.json()["replied_at"] is not None
