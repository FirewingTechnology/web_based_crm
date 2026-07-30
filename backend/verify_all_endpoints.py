import sys
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def run_checks():
    print("=" * 60)
    print("[TEST] TESTING ALL BROKEROS LITE BACKEND ENDPOINTS...")
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

    if builders:
        b_id = builders[0]["id"]
        res = client.get(f"/api/v1/builders/{b_id}", headers=headers)
        assert res.status_code == 200, f"Builder detail failed: {res.text}"
        print(f"[OK] GET /api/v1/builders/{b_id}            -> 200 OK")

    # 6. Projects
    res = client.get("/api/v1/projects", headers=headers)
    assert res.status_code == 200, f"Projects failed: {res.text}"
    projects = res.json()
    print(f"[OK] GET /api/v1/projects                -> 200 OK ({len(projects)} projects)")

    if projects:
        p_id = projects[0]["id"]
        res = client.get(f"/api/v1/projects/{p_id}", headers=headers)
        assert res.status_code == 200, f"Project detail failed: {res.text}"
        print(f"[OK] GET /api/v1/projects/{p_id}            -> 200 OK")

    # 7. Leads
    res = client.get("/api/v1/leads", headers=headers)
    assert res.status_code == 200, f"Leads failed: {res.text}"
    leads = res.json()
    print(f"[OK] GET /api/v1/leads                   -> 200 OK ({len(leads)} leads)")

    if leads:
        l_id = leads[0]["id"]
        res = client.get(f"/api/v1/leads/{l_id}", headers=headers)
        assert res.status_code == 200, f"Lead detail failed: {res.text}"
        print(f"[OK] GET /api/v1/leads/{l_id}               -> 200 OK")

    # 8. Followups
    res = client.get("/api/v1/followups", headers=headers)
    assert res.status_code == 200, f"Followups failed: {res.text}"
    print(f"[OK] GET /api/v1/followups               -> 200 OK ({len(res.json())} followups)")

    # 9. Brokers
    res = client.get("/api/v1/brokers", headers=headers)
    assert res.status_code == 200, f"Brokers failed: {res.text}"
    print(f"[OK] GET /api/v1/brokers                 -> 200 OK ({len(res.json())} brokers)")

    # 10. Sales Targets
    res = client.get("/api/v1/sales/targets", headers=headers)
    assert res.status_code == 200, f"Sales targets failed: {res.text}"
    print(f"[OK] GET /api/v1/sales/targets           -> 200 OK ({len(res.json())} targets)")

    # 11. Bookings
    res = client.get("/api/v1/bookings", headers=headers)
    assert res.status_code == 200, f"Bookings failed: {res.text}"
    print(f"[OK] GET /api/v1/bookings                -> 200 OK ({len(res.json())} bookings)")

    # 12. Commissions
    res = client.get("/api/v1/commissions", headers=headers)
    assert res.status_code == 200, f"Commissions failed: {res.text}"
    print(f"[OK] GET /api/v1/commissions             -> 200 OK ({len(res.json())} commissions)")

    # 13. Reports
    res = client.get("/api/v1/reports/dashboard-stats", headers=headers)
    assert res.status_code == 200, f"Dashboard stats failed: {res.text}"
    print(f"[OK] GET /api/v1/reports/dashboard-stats -> 200 OK")

    res = client.get("/api/v1/reports/monthly-sales", headers=headers)
    assert res.status_code == 200, f"Monthly sales failed: {res.text}"
    print(f"[OK] GET /api/v1/reports/monthly-sales -> 200 OK")

    res = client.get("/api/v1/reports/lead-sources", headers=headers)
    assert res.status_code == 200, f"Lead sources failed: {res.text}"
    print(f"[OK] GET /api/v1/reports/lead-sources  -> 200 OK")

    res = client.get("/api/v1/reports/lead-statuses", headers=headers)
    assert res.status_code == 200, f"Lead statuses failed: {res.text}"
    print(f"[OK] GET /api/v1/reports/lead-statuses -> 200 OK")

    # 14. Notifications
    res = client.get("/api/v1/notifications", headers=headers)
    assert res.status_code == 200, f"Notifications failed: {res.text}"
    print(f"[OK] GET /api/v1/notifications          -> 200 OK ({len(res.json())} notifications)")

    # 15. Activity Logs
    res = client.get("/api/v1/activity-logs", headers=headers)
    assert res.status_code == 200, f"Activity logs failed: {res.text}"
    print(f"[OK] GET /api/v1/activity-logs           -> 200 OK ({len(res.json())} activity logs)")

    # 16. Settings
    res = client.get("/api/v1/settings/lead-sources", headers=headers)
    assert res.status_code == 200, f"Settings lead-sources failed: {res.text}"
    print(f"[OK] GET /api/v1/settings/lead-sources  -> 200 OK")

    res = client.get("/api/v1/settings/lead-tags", headers=headers)
    assert res.status_code == 200, f"Settings lead-tags failed: {res.text}"
    print(f"[OK] GET /api/v1/settings/lead-tags     -> 200 OK")

    print("=" * 60)
    print("SUCCESS: ALL 16 BACKEND ENDPOINTS PASSED WITH 200 OK!")
    print("=" * 60)

if __name__ == "__main__":
    run_checks()
