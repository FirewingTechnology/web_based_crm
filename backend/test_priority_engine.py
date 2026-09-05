import pytest
from datetime import datetime, timedelta
from fastapi.testclient import TestClient

from app.main import app
from app.database import SessionLocal
from app.models.user import User
from app.models.lead import Lead, LeadStatus, LeadPriority
from app.models.followup import Followup, FollowupStatus, FollowupType
from app.services.priority_engine import get_today_priorities

client = TestClient(app)

def get_auth_token():
    res = client.post("/api/v1/auth/login", json={"email": "admin@brokeros.com", "password": "Admin@123"})
    assert res.status_code == 200
    return res.json()["access_token"]

def test_priority_engine_ranking():
    db = SessionLocal()
    admin = db.query(User).filter(User.email == "admin@brokeros.com").first()
    assert admin is not None

    priorities = get_today_priorities(admin, db)
    assert "total_priorities" in priorities
    assert "items" in priorities
    assert "overdue_count" in priorities
    assert "closing_count" in priorities

    items = priorities["items"]
    if items:
        # Verify items have expected attributes
        first = items[0]
        assert "id" in first
        assert "priority_rank" in first
        assert "lead_name" in first
        assert "recommended_action" in first
        assert "badge_label" in first

        # Verify sorted by priority_rank ascending
        ranks = [x["priority_rank"] for x in items]
        assert ranks == sorted(ranks)

    db.close()

def test_today_priorities_api():
    token = get_auth_token()
    headers = {"Authorization": f"Bearer {token}"}

    res = client.get("/api/v1/sales/today-priorities", headers=headers)
    assert res.status_code == 200
    data = res.json()
    assert "total_priorities" in data
    assert "items" in data
    assert isinstance(data["items"], list)
