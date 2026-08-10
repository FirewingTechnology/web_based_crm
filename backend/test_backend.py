from fastapi.testclient import TestClient
from app.main import app
from app.database import SessionLocal
from app.seed import seed_db

# Ensure initial database seeding before running tests
seed_db()

client = TestClient(app)


def test_api_health():
    res = client.get("/")
    assert res.status_code == 200
    assert res.json()["message"] == "REALVION API is running"

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

from unittest.mock import patch

@patch("app.routes.registration.send_otp_email", return_value=True)
def test_saas_otp_and_demo_register(mock_send_email):
    # 1. Send OTP
    send_res = client.post("/api/v1/saas/send-otp", json={"email": "user.test@example.com"})
    assert send_res.status_code == 200
    assert send_res.json()["success"] == True



    # 2. Get Plans
    plans_res = client.get("/api/v1/saas/plans")
    assert plans_res.status_code == 200
    assert len(plans_res.json()) == 3

    # 3. Register Demo Workspace
    demo_res = client.post("/api/v1/saas/register-demo", json={
        "full_name": "Test Agency Owner",
        "email": "owner@realviondemo.com",
        "phone": "+919876543210",
        "password": "Demo@123Password",
        "company_name": "Apex Real Estate Advisory",
        "company_type": "Agency",
        "city": "Mumbai",
        "employees": "10-50",
        "selected_plan_code": "professional"
    })
    assert demo_res.status_code == 200
    demo_data = demo_res.json()
    assert demo_data["success"] == True
    assert demo_data["is_demo_mode"] == True
    assert "access_token" in demo_data

def test_get_dashboard_stats():
    login_res = client.post("/api/v1/auth/login", json={"email": "admin@brokeros.com", "password": "Admin@123"})
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    res = client.get("/api/v1/reports/dashboard-stats", headers=headers)
    assert res.status_code == 200
    stats = res.json()
    assert stats["total_leads"] >= 5

def test_demo_security_duplicate_prevention():
    # 1. First demo registration should succeed
    demo_res1 = client.post("/api/v1/saas/register-demo", json={
        "full_name": "Unique Security Test Owner",
        "email": "security.user1@realviondemo.com",
        "phone": "+91 99887 76655",
        "password": "Demo@123Password",
        "company_name": "Unique Security Agency 1",
        "company_type": "Agency",
        "city": "Mumbai",
        "employees": "10-50",
        "selected_plan_code": "professional"
    })
    assert demo_res1.status_code == 200

    # 2. Try registering with SAME email (different case) -> MUST FAIL (400)
    dup_email_res = client.post("/api/v1/saas/register-demo", json={
        "full_name": "Attacker Duplicate Email",
        "email": "SECURITY.USER1@realviondemo.com",
        "phone": "+91 91111 22222",
        "password": "Demo@123Password",
        "company_name": "Different Agency",
        "company_type": "Agency",
        "city": "Delhi"
    })
    assert dup_email_res.status_code == 400
    assert "already" in dup_email_res.json()["detail"].lower()

    # 3. Try registering with SAME phone number (formatted without spaces/country code) -> MUST FAIL (400)
    dup_phone_res = client.post("/api/v1/saas/register-demo", json={
        "full_name": "Attacker Duplicate Phone",
        "email": "completely.new.email@example.com",
        "phone": "9988776655", # Same last 10 digits!
        "password": "Demo@123Password",
        "company_name": "Another Agency",
        "company_type": "Agency",
        "city": "Pune"
    })
    assert dup_phone_res.status_code == 400
    assert "mobile number" in dup_phone_res.json()["detail"].lower() or "trial" in dup_phone_res.json()["detail"].lower()

    # 4. Try registering with SAME company name -> MUST FAIL (400)
    dup_company_res = client.post("/api/v1/saas/register-demo", json={
        "full_name": "Attacker Duplicate Company",
        "email": "new.email.company@example.com",
        "phone": "+91 97777 66666",
        "password": "Demo@123Password",
        "company_name": "Unique Security Agency 1",
        "company_type": "Agency",
        "city": "Mumbai"
    })
    assert dup_company_res.status_code == 400
    assert "already exists" in dup_company_res.json()["detail"].lower()

if __name__ == "__main__":
    test_api_health()
    test_admin_login()
    test_get_me()
    test_saas_otp_and_demo_register()
    test_get_dashboard_stats()
    test_demo_security_duplicate_prevention()
    print("ALL BACKEND TEST CLIENT CHECKS PASSED PERFECTLY!")

