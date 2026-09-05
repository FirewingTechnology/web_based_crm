import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.database import SessionLocal
from app.models.broker import BrokerProfile, CoBrokingDeal
from app.models.user import User, UserRole
from app.models.project import Project, ProjectStatus
from app.models.builder import Builder

client = TestClient(app)

def get_auth_token():
    res = client.post("/api/v1/auth/login", json={"email": "admin@brokeros.com", "password": "Admin@123"})
    assert res.status_code == 200
    return res.json()["access_token"]

def test_cp_tiers_and_volume_kickers():
    token = get_auth_token()
    headers = {"Authorization": f"Bearer {token}"}

    resp = client.get("/api/v1/brokers/tiers", headers=headers)
    assert resp.status_code == 200
    tiers = resp.json()
    assert len(tiers) == 3
    
    tier_names = [t["tier"] for t in tiers]
    assert "Silver" in tier_names
    assert "Gold" in tier_names
    assert "Platinum" in tier_names

    gold = next(t for t in tiers if t["tier"] == "Gold")
    assert gold["volume_kicker_pct"] == 0.25
    assert gold["effective_commission_pct"] == 2.25

def test_broker_sub_broker_hierarchy_and_tier_update():
    token = get_auth_token()
    headers = {"Authorization": f"Bearer {token}"}
    import uuid
    uid = uuid.uuid4().hex[:6]

    # 1. Create Parent Broker
    parent_resp = client.post("/api/v1/brokers", json={
        "firm_name": f"Apex Realty Partners {uid}",
        "contact_person": "Sunil Mehta",
        "phone": "+919811122233",
        "email": f"sunil.{uid}@testcp.com",
        "tier": "Gold",
        "commission_rate": 2.25
    }, headers=headers)
    assert parent_resp.status_code == 201
    parent_data = parent_resp.json()
    parent_id = parent_data["id"]

    # 2. Create Sub-Broker pointing to parent
    sub_resp = client.post("/api/v1/brokers", json={
        "firm_name": f"Apex Suburban Associates {uid}",
        "contact_person": "Kavita Rao",
        "phone": "+919811122244",
        "email": f"kavita.{uid}@testcp.com",
        "parent_broker_id": parent_id,
        "tier": "Silver",
        "commission_rate": 1.5
    }, headers=headers)
    assert sub_resp.status_code == 201
    sub_data = sub_resp.json()
    assert f"Apex Realty Partners {uid}" in sub_data["parent_firm_name"]

    # Verify parent now has sub_broker_count >= 1
    fetch_parent = client.get(f"/api/v1/brokers/{parent_id}", headers=headers)
    assert fetch_parent.status_code == 200
    assert fetch_parent.json()["sub_broker_count"] >= 1

    # 3. Upgrade Sub-Broker to Platinum
    tier_resp = client.patch(
        f"/api/v1/brokers/{sub_data['id']}/tier",
        json={"tier": "Platinum"},
        headers=headers
    )
    assert tier_resp.status_code == 200
    assert tier_resp.json()["tier"] == "Platinum"
    assert tier_resp.json()["commission_rate"] == 3.0

def test_co_broking_deal_registration():
    token = get_auth_token()
    headers = {"Authorization": f"Bearer {token}"}
    db = SessionLocal()

    b1 = db.query(BrokerProfile).filter(BrokerProfile.is_deleted == False).first()
    assert b1 is not None

    deal_payload = {
        "primary_broker_id": b1.id,
        "client_name": "Rohan Deshmukh",
        "client_phone": "+919922334455",
        "primary_split_pct": 60.0,
        "secondary_split_pct": 40.0,
        "expected_deal_value": 250.0,
        "notes": "Exclusive 60/40 co-broking mandate"
    }

    res = client.post("/api/v1/brokers/co-broking", json=deal_payload, headers=headers)
    assert res.status_code == 201
    deal = res.json()
    assert deal["primary_split_pct"] == 60.0
    assert deal["secondary_split_pct"] == 40.0
    assert deal["client_name"] == "Rohan Deshmukh"

    # List deals
    list_res = client.get("/api/v1/brokers/co-broking", headers=headers)
    assert list_res.status_code == 200
    all_deals = list_res.json()
    assert any(d["id"] == deal["id"] for d in all_deals)

def test_broker_project_collaterals():
    token = get_auth_token()
    headers = {"Authorization": f"Bearer {token}"}
    db = SessionLocal()

    broker = db.query(BrokerProfile).filter(BrokerProfile.is_deleted == False).first()
    assert broker is not None

    res = client.get(f"/api/v1/brokers/{broker.id}/collaterals", headers=headers)
    assert res.status_code == 200
    collaterals = res.json()
    assert isinstance(collaterals, list)
    if len(collaterals) > 0:
        c = collaterals[0]
        assert "co_branded_share_text" in c
        assert broker.firm_name in c["co_branded_share_text"]
        assert "wa.me" in c["co_branded_whatsapp_link"]
