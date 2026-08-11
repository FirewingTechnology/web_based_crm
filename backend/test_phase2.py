import hmac
import hashlib
import json
import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.config import settings
from app.database import SessionLocal
from app.models.saas import Organization, Workspace, Subscription, Payment, OTP, RegistrationRequest
from app.models.user import User, UserRole
from app.seed import seed_db

seed_db()
client = TestClient(app)

def test_phase2_e2e_registration_to_active_workspace():
    # 1. Validate Registration Precheck
    val_res = client.post("/api/v1/saas/validate-registration", json={
        "email": "e2e.owner@realvionagency.com",
        "phone": "+91 98888 77777",
        "company_name": "E2E RealVion Agency"
    })
    assert val_res.status_code == 200

    # 2. Send OTP & Verify OTP
    send_res = client.post("/api/v1/saas/send-otp", json={"email": "e2e.owner@realvionagency.com"})
    assert send_res.status_code == 200

    db = SessionLocal()
    otp_obj = db.query(OTP).filter(OTP.email == "e2e.owner@realvionagency.com").order_by(OTP.id.desc()).first()
    assert otp_obj is not None
    otp_code = otp_obj.otp_code
    db.close()

    verify_otp_res = client.post("/api/v1/saas/verify-otp", json={
        "email": "e2e.owner@realvionagency.com",
        "otp_code": otp_code
    })
    assert verify_otp_res.status_code == 200

    # 3. Register Demo Workspace
    demo_res = client.post("/api/v1/saas/register-demo", json={
        "full_name": "E2E Agency Founder",
        "email": "e2e.owner@realvionagency.com",
        "phone": "+91 98888 77777",
        "password": "Password@123Secure",
        "company_name": "E2E RealVion Agency",
        "company_type": "Agency",
        "city": "Mumbai",
        "employees": "10-50",
        "selected_plan_code": "professional"
    })
    assert demo_res.status_code == 200
    demo_data = demo_res.json()
    token = demo_data["access_token"]
    assert demo_data["is_demo_mode"] == True

    db = SessionLocal()
    org = db.query(Organization).filter(Organization.name == "E2E RealVion Agency").first()
    assert org is not None
    ws = db.query(Workspace).filter(Workspace.organization_id == org.id).first()
    assert ws is not None
    assert ws.is_demo == True
    org_id = org.id
    ws_id = ws.id
    db.close()

    # 4. Create Payment Order for SAME Workspace
    order_res = client.post("/api/v1/payments/create-order", json={
        "plan_code": "professional",
        "organization_id": org_id,
        "workspace_id": ws_id
    })
    assert order_res.status_code == 200
    order_id = order_res.json()["order_id"]

    # 5. Verify Payment with HMAC signature -> Flips SAME workspace to ACTIVE
    key_secret = settings.RAZORPAY_KEY_SECRET or "dev_secret"
    payment_id = "pay_e2e_verified_123"
    msg = f"{order_id}|{payment_id}"
    signature = hmac.new(key_secret.encode("utf-8"), msg.encode("utf-8"), hashlib.sha256).hexdigest()

    verify_pay_res = client.post(
        "/api/v1/payments/verify",
        json={
            "razorpay_order_id": order_id,
            "razorpay_payment_id": payment_id,
            "razorpay_signature": signature
        },
        headers={"Authorization": f"Bearer {token}"}
    )
    assert verify_pay_res.status_code == 200

    # Assert SAME workspace and organization flip to ACTIVE, no duplicate orgs created
    db = SessionLocal()
    org_count = db.query(Organization).filter(Organization.name == "E2E RealVion Agency").count()
    assert org_count == 1

    updated_ws = db.query(Workspace).filter(Workspace.id == ws_id).first()
    assert updated_ws.is_demo == False

    sub = db.query(Subscription).filter(Subscription.organization_id == org_id).order_by(Subscription.id.desc()).first()
    assert sub.status == "Active"
    db.close()

if __name__ == "__main__":
    test_phase2_e2e_registration_to_active_workspace()
    print("PHASE 2 END-TO-END TEST PASSED PERFECTLY!")
