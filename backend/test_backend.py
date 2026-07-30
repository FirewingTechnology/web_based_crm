from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_api_health():
    res = client.get("/")
    assert res.status_code == 200
    assert res.json()["message"] == "BrokerOS Lite API is running"

def test_admin_login():
    res = client.post("/api/v1/auth/login", json={"email": "admin@brokeros.com", "password": "Admin@123"})
    assert res.status_code == 200
    data = res.json()
    assert "access_token" in data
    assert "refresh_token" in data

def test_get_me():
    login_res = client.post("/api/v1/auth/login", json={"email": "admin@brokeros.com", "password": "Admin@123"})
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    res = client.get("/api/v1/auth/me", headers=headers)
    assert res.status_code == 200
    user = res.json()
    assert user["email"] == "admin@brokeros.com"
    assert user["role"] == "Admin"

def test_get_dashboard_stats():
    login_res = client.post("/api/v1/auth/login", json={"email": "admin@brokeros.com", "password": "Admin@123"})
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    res = client.get("/api/v1/reports/dashboard-stats", headers=headers)
    assert res.status_code == 200
    stats = res.json()
    assert stats["total_leads"] >= 5
    assert stats["total_bookings"] >= 1

if __name__ == "__main__":
    test_api_health()
    test_admin_login()
    test_get_me()
    test_get_dashboard_stats()
    print("ALL BACKEND TEST CLIENT CHECKS PASSED PERFECTLY!")
