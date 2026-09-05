import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.database import get_db
from app.models.user import User, UserRole
from app.services.revenue_analytics_service import RevenueAnalyticsService

client = TestClient(app)

@pytest.fixture
def db_session():
    db = next(get_db())
    yield db
    db.rollback()

def test_revenue_funnel_service(db_session):
    admin = db_session.query(User).filter(User.role == UserRole.ADMIN).first()
    assert admin is not None

    res = RevenueAnalyticsService.get_revenue_funnel_analytics(db_session, admin)
    assert res is not None
    assert res.total_inquiries >= 0
    assert isinstance(res.funnel_stages, list)
    assert len(res.funnel_stages) == 6
    assert isinstance(res.channels, list)
    assert res.bottleneck_stage is not None
    assert res.bottleneck_insight is not None

    # Verify stage ordering
    stage_keys = [s.stage_key for s in res.funnel_stages]
    assert stage_keys == ["inquiries", "qualified", "visits_scheduled", "visits_completed", "bookings", "revenue"]

def test_revenue_funnel_api():
    login_res = client.post("/api/v1/auth/login", json={"email": "admin@brokeros.com", "password": "Admin@123"})
    assert login_res.status_code == 200
    token = login_res.json()["access_token"]

    res = client.get(
        "/api/v1/reports/revenue-funnel",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert res.status_code == 200
    data = res.json()
    assert "total_inquiries" in data
    assert "funnel_stages" in data
    assert "channels" in data
    assert "bottleneck_stage" in data
    assert "overall_conversion_rate" in data
