import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.database import SessionLocal
from app.models.saas import Organization
from app.models.user import User, UserRole
from app.models.lead import Lead, LeadStatus, LeadPriority
from app.models.project import Project, ProjectStatus
from app.models.builder import Builder
from app.seed import seed_db
from app.utils.security import get_password_hash

seed_db()
client = TestClient(app)

def test_tenant_isolation_idor_prevention():
    db = SessionLocal()

    # 1. Create Company A & User A
    org_a = Organization(name="Company A Realty", slug="comp-a", is_active=True)
    db.add(org_a)
    db.flush()

    user_a = User(
        organization_id=org_a.id,
        email="user.a@comp-a.com",
        name="User A",
        hashed_password=get_password_hash("Password@123"),
        role=UserRole.ADMIN,
        is_active=True
    )
    db.add(user_a)
    db.flush()

    # Create Lead for Company A
    lead_a = Lead(
        organization_id=org_a.id,
        name="Company A Lead",
        phone="+91 99999 11111",
        email="lead.a@comp-a.com",
        status=LeadStatus.NEW,
        priority=LeadPriority.HIGH,
        created_by_id=user_a.id,
        assigned_to_id=user_a.id
    )
    db.add(lead_a)

    # 2. Create Company B & User B & Lead B
    org_b = Organization(name="Company B Realty", slug="comp-b", is_active=True)
    db.add(org_b)
    db.flush()

    user_b = User(
        organization_id=org_b.id,
        email="user.b@comp-b.com",
        name="User B",
        hashed_password=get_password_hash("Password@123"),
        role=UserRole.ADMIN,
        is_active=True
    )
    db.add(user_b)
    db.flush()

    lead_b = Lead(
        organization_id=org_b.id,
        name="Company B Private Secret Lead",
        phone="+91 99999 22222",
        email="secret.b@comp-b.com",
        status=LeadStatus.NEW,
        priority=LeadPriority.HIGH,
        created_by_id=user_b.id,
        assigned_to_id=user_b.id
    )
    db.add(lead_b)
    db.commit()

    lead_b_id = lead_b.id
    org_a_id = org_a.id
    db.close()

    # 3. Login as User A (Company A)
    login_res = client.post("/api/v1/auth/login", json={"email": "user.a@comp-a.com", "password": "Password@123"})
    assert login_res.status_code == 200
    token_a = login_res.json()["access_token"]
    headers_a = {"Authorization": f"Bearer {token_a}"}

    # 4. User A attempts to access Lead B (Company B) -> MUST NOT leakage data (Must be 404 or filtered out)
    lead_detail_res = client.get(f"/api/v1/leads/{lead_b_id}", headers=headers_a)
    # If the lead belongs to another org, either 404 or filtered query returns 404
    assert lead_detail_res.status_code in [403, 404] or (
        lead_detail_res.status_code == 200 and lead_detail_res.json().get("organization_id") == org_a_id
    )


    # 5. List leads as User A -> Must contain Company A leads, ZERO Company B leads
    leads_list_res = client.get("/api/v1/leads", headers=headers_a)
    assert leads_list_res.status_code == 200
    leads_data = leads_list_res.json()
    lead_ids = [l["id"] for l in leads_data]
    assert lead_b_id not in lead_ids

if __name__ == "__main__":
    test_tenant_isolation_idor_prevention()
    print("PHASE 3 TENANT ISOLATION IDOR TEST PASSED PERFECTLY!")
