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

def test_superadmin_login():
    res = client.post("/api/v1/auth/login", json={"email": "superadmin@realvion.com", "password": "SuperAdmin@123"})
    assert res.status_code == 200
    data = res.json()
    assert "access_token" in data
    assert "refresh_token" in data

    headers = {"Authorization": f"Bearer {data['access_token']}"}
    me_res = client.get("/api/v1/auth/me", headers=headers)
    assert me_res.status_code == 200
    user = me_res.json()
    assert user["email"] == "superadmin@realvion.com"
    assert user["role"] == "Super Admin"

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

def test_trial_expiration_isolation():
    # 1. Register an account created earlier
    reg = client.post("/api/v1/saas/register-demo", json={
        "full_name": "Afternoon User",
        "email": "afternoon.user@example.com",
        "phone": "+91 98888 11111",
        "password": "Password@123",
        "company_name": "Afternoon Agency Ltd",
        "company_type": "Agency",
        "city": "Mumbai"
    })
    assert reg.status_code == 200
    user_token = reg.json()["access_token"]

    # 2. Simulate time passing past trial end by updating sub.end_date to the past
    db = SessionLocal()
    from app.models.saas import Organization, Subscription
    org = db.query(Organization).filter(Organization.name == "Afternoon Agency Ltd").first()
    sub = db.query(Subscription).filter(Subscription.organization_id == org.id).first()
    from datetime import datetime, timedelta
    sub.end_date = datetime.utcnow() - timedelta(hours=3) # Expired 3 hours ago
    db.commit()
    db.close()

    # 3. Create a brand new workspace 1 minute ago for another user
    reg2 = client.post("/api/v1/saas/register-demo", json={
        "full_name": "Evening User",
        "email": "evening.user@example.com",
        "phone": "+91 98888 22222",
        "password": "Password@123",
        "company_name": "Evening Agency Ltd",
        "company_type": "Agency",
        "city": "Mumbai"
    })
    assert reg2.status_code == 200

    # 4. Check get_me for afternoon user -> MUST be expired and NOT stolen from evening user's trial
    me_res = client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {user_token}"})
    assert me_res.status_code == 200
    me_data = me_res.json()
    assert me_data["is_trial_expired"] == True
    assert me_data["trial_seconds_remaining"] == 0

def test_sales_executive_inherits_admin_trial():
    seed_db()
    # 1. Register a Demo Admin

    reg = client.post("/api/v1/saas/register-demo", json={
        "full_name": "Trial Admin",
        "email": "trial.admin@agency.com",
        "phone": "+91 97777 11111",
        "password": "Password@123",
        "company_name": "Trial Agency Corp",
        "company_type": "Agency",
        "city": "Mumbai"
    })
    assert reg.status_code == 200
    admin_token = reg.json()["access_token"]

    # 2. Admin creates a Sales Executive user
    se_create = client.post("/api/v1/users", json={
        "name": "Sales Executive Amol",
        "email": "amol.sales@agency.com",
        "password": "Password@123",
        "role": "Sales Executive",
        "phone": "+91 97777 22222"
    }, headers={"Authorization": f"Bearer {admin_token}"})
    assert se_create.status_code == 201

    # 3. Sales Executive logs in
    se_login = client.post("/api/v1/auth/login", json={
        "email": "amol.sales@agency.com",
        "password": "Password@123"
    })
    assert se_login.status_code == 200
    se_token = se_login.json()["access_token"]

    # 4. Fetch Sales Executive get_me -> MUST have exact organization_id and matching trial seconds as Admin
    se_me = client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {se_token}"})
    assert se_me.status_code == 200
    se_data = se_me.json()

    admin_me = client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {admin_token}"}).json()

    assert se_data["organization_id"] == admin_me["organization_id"]
    assert abs(se_data["trial_seconds_remaining"] - admin_me["trial_seconds_remaining"]) <= 5
    assert se_data["is_trial_expired"] == admin_me["is_trial_expired"]

def test_validate_registration_precheck():
    # 1. Valid unique precheck should pass
    val_res = client.post("/api/v1/saas/validate-registration", json={
        "email": "brand.new.precheck.user@example.com",
        "phone": "+91 91111 99999",
        "company_name": "Brand New Precheck Agency"
    })
    assert val_res.status_code == 200
    assert val_res.json()["valid"] == True

    # 2. Precheck with existing email (from previous test registration) should fail (400)
    dup_email_res = client.post("/api/v1/saas/validate-registration", json={
        "email": "TRIAL.ADMIN@agency.com",
        "phone": "+91 99999 00000",
        "company_name": "Another Company"
    })
    assert dup_email_res.status_code == 400
    assert "already" in dup_email_res.json()["detail"].lower()

    # 3. Precheck with existing phone (from previous test registration) should fail (400)
    dup_phone_res = client.post("/api/v1/saas/validate-registration", json={
        "email": "brand.new.user@example.com",
        "phone": "9777711111",
        "company_name": "Different Company"
    })
    assert dup_phone_res.status_code == 400
    assert "mobile number" in dup_phone_res.json()["detail"].lower() or "trial" in dup_phone_res.json()["detail"].lower()

    # 4. Precheck with invalid phone (too short) should fail (400)
    invalid_phone_res = client.post("/api/v1/saas/validate-registration", json={
        "email": "valid.email@example.com",
        "phone": "123",
        "company_name": "Short Phone Agency"
    })
    assert invalid_phone_res.status_code == 400

if __name__ == "__main__":
    test_api_health()
    test_admin_login()
    test_superadmin_login()
    test_get_me()
    test_saas_otp_and_demo_register()
    test_get_dashboard_stats()
    test_demo_security_duplicate_prevention()
    test_trial_expiration_isolation()
    test_sales_executive_inherits_admin_trial()
    test_validate_registration_precheck()
    print("ALL BACKEND TEST CLIENT CHECKS PASSED PERFECTLY!")

