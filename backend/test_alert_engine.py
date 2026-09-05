import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.database import get_db
from app.models.user import User, UserRole
from app.services.alert_engine import AlertEngine

client = TestClient(app)

@pytest.fixture
def db_session():
    db = next(get_db())
    yield db
    db.rollback()

def test_alert_engine_service(db_session):
    admin = db_session.query(User).filter(User.role == UserRole.ADMIN).first()
    assert admin is not None

    res = AlertEngine.evaluate_and_generate_alerts(db_session, admin)
    assert isinstance(res, dict)
    assert "alerts_generated" in res
    assert res["alerts_generated"] >= 0

def test_alert_engine_api():
    login_res = client.post("/api/v1/auth/login", json={"email": "admin@brokeros.com", "password": "Admin@123"})
    assert login_res.status_code == 200
    token = login_res.json()["access_token"]

    eval_res = client.post(
        "/api/v1/notifications/generate-alerts",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert eval_res.status_code == 200
    assert "alerts_generated" in eval_res.json()

    notifs_res = client.get(
        "/api/v1/notifications",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert notifs_res.status_code == 200
    items = notifs_res.json()
    assert isinstance(items, list)
