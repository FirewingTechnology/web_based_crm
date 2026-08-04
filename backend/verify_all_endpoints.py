import sys
from fastapi.testclient import TestClient
from app.main import app
from app.database import SessionLocal
from app.seed import seed_db

# Ensure initial database seeding before running checks
seed_db()

client = TestClient(app)

def run_checks():
    print("=" * 60)
    print("[TEST] TESTING ALL REALVION BACKEND ENDPOINTS...")
    print("=" * 60)

    # 1. Health check / root
    res = client.get("/")
    assert res.status_code == 200, f"Root failed: {res.text}"
    print("[OK] GET /                              -> 200 OK")

    # 2. Authentication Login (Admin)
    login_res = client.post("/api/v1/auth/login", json={"email": "admin@brokeros.com", "password": "Admin@123"})
    assert login_res.status_code == 200, f"Login failed: {login_res.text}"
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    print("[OK] POST /api/v1/auth/login            -> 200 OK (Token retrieved)")

    # 3. Auth Me
    res = client.get("/api/v1/auth/me", headers=headers)
    assert res.status_code == 200, f"Auth me failed: {res.text}"
    print(f"[OK] GET /api/v1/auth/me                 -> 200 OK (User: {res.json()['name']})")

    # 4. Users
    res = client.get("/api/v1/users", headers=headers)
    assert res.status_code == 200, f"Users failed: {res.text}"
    print(f"[OK] GET /api/v1/users                   -> 200 OK ({len(res.json())} users)")

    # 5. Builders
    res = client.get("/api/v1/builders", headers=headers)
    assert res.status_code == 200, f"Builders failed: {res.text}"
    builders = res.json()
    print(f"[OK] GET /api/v1/builders                -> 200 OK ({len(builders)} builders)")

    # 6. Projects
    res = client.get("/api/v1/projects", headers=headers)
    assert res.status_code == 200, f"Projects failed: {res.text}"
    projects = res.json()
    print(f"[OK] GET /api/v1/projects                -> 200 OK ({len(projects)} projects)")

    # 7. Leads
    res = client.get("/api/v1/leads", headers=headers)
    assert res.status_code == 200, f"Leads failed: {res.text}"
    leads = res.json()
    print(f"[OK] GET /api/v1/leads                   -> 200 OK ({len(leads)} leads)")

    # 8. SaaS Registration & Plans
    res = client.get("/api/v1/saas/plans")
    assert res.status_code == 200, f"SaaS plans failed: {res.text}"
    print(f"[OK] GET /api/v1/saas/plans              -> 200 OK ({len(res.json())} plans)")

    # 9. Razorpay Order Creation
    res = client.post("/api/v1/payments/create-order", json={"plan_code": "professional", "coupon_code": "REALVION20"})
    assert res.status_code == 200, f"Create order failed: {res.text}"
    print(f"[OK] POST /api/v1/payments/create-order  -> 200 OK (Order ID: {res.json()['order_id']})")

    # 10. Super Admin Analytics
    res = client.get("/api/v1/superadmin/analytics", headers=headers)
    assert res.status_code == 200, f"Superadmin analytics failed: {res.text}"
    print(f"[OK] GET /api/v1/superadmin/analytics    -> 200 OK (MRR: INR {res.json()['mrr']})")


    # 11. Super Admin Organizations List
    res = client.get("/api/v1/superadmin/organizations", headers=headers)
    assert res.status_code == 200, f"Superadmin organizations failed: {res.text}"
    print(f"[OK] GET /api/v1/superadmin/organizations -> 200 OK ({len(res.json())} orgs)")

    print("=" * 60)
    print("SUCCESS: ALL REALVION ENDPOINTS VERIFIED PERFECTLY!")
    print("=" * 60)

if __name__ == "__main__":
    run_checks()
