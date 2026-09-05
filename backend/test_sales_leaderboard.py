import pytest
from datetime import datetime, timezone
from fastapi.testclient import TestClient
from app.main import app
from app.database import get_db
from app.models.user import User, UserRole
from app.models.sales_target import SalesTarget
from app.models.booking import Booking, BookingStatus
from app.services.performance_service import PerformanceService

client = TestClient(app)

@pytest.fixture
def db_session():
    db = next(get_db())
    yield db
    db.rollback()

def test_performance_service_leaderboard(db_session):
    admin = db_session.query(User).filter(User.role == UserRole.ADMIN).first()
    assert admin is not None

    summary = PerformanceService.get_leaderboard(db_session, admin)
    assert summary is not None
    assert summary.month_year == datetime.now(timezone.utc).strftime("%Y-%m")
    assert summary.days_elapsed >= 1
    assert summary.total_days >= 28
    assert isinstance(summary.rankings, list)
    assert len(summary.rankings) >= 1

    # Check top ranking executive fields
    top_exec = summary.rankings[0]
    assert top_exec.rank == 1
    assert top_exec.name is not None
    assert hasattr(top_exec, "achieved_amount")
    assert hasattr(top_exec, "projected_run_rate")
    assert hasattr(top_exec, "pace_status")
    assert isinstance(top_exec.badges, list)

def test_sales_leaderboard_api():
    # Login as admin
    login_res = client.post("/api/v1/auth/login", json={"email": "admin@brokeros.com", "password": "Admin@123"})
    assert login_res.status_code == 200
    token = login_res.json()["access_token"]

    res = client.get(
        "/api/v1/sales/leaderboard",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert res.status_code == 200
    data = res.json()
    assert "month_year" in data
    assert "podium" in data
    assert "rankings" in data
    assert "total_org_target" in data
    assert "total_org_achieved" in data
    assert "projected_org_run_rate" in data

    if len(data["rankings"]) > 0:
        first_user_id = data["rankings"][0]["user_id"]
        sc_res = client.get(
            f"/api/v1/sales/scorecard/{first_user_id}",
            headers={"Authorization": f"Bearer {token}"}
        )
        assert sc_res.status_code == 200
        sc_data = sc_res.json()
        assert sc_data["user_id"] == first_user_id
        assert "badges" in sc_data
