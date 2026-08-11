import hmac
import hashlib
import json
import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.config import settings
from app.database import SessionLocal
from app.models.saas import Payment, PaymentWebhook, OTP
from app.seed import seed_db

seed_db()
client = TestClient(app)

def test_payment_bad_signature_rejection():
    # 1. Create order
    create_res = client.post("/api/v1/payments/create-order", json={"plan_code": "professional"})
    assert create_res.status_code == 200
    order_data = create_res.json()
    order_id = order_data["order_id"]

    # 2. Login to get token
    login_res = client.post("/api/v1/auth/login", json={"email": "admin@brokeros.com", "password": "Admin@123"})
    token = login_res.json()["access_token"]

    # 3. Submit bad signature -> Must return 401 and payment status must be Failed
    verify_res = client.post(
        "/api/v1/payments/verify",
        json={
            "razorpay_order_id": order_id,
            "razorpay_payment_id": "pay_fake_123",
            "razorpay_signature": "invalid_bad_signature_string"
        },
        headers={"Authorization": f"Bearer {token}"}
    )
    assert verify_res.status_code == 401

    db = SessionLocal()
    pay_record = db.query(Payment).filter(Payment.razorpay_order_id == order_id).first()
    assert pay_record is not None
    assert pay_record.status == "Failed"
    db.close()

def test_webhook_signature_and_idempotency():
    # 1. Create an order to reference in webhook
    create_res = client.post("/api/v1/payments/create-order", json={"plan_code": "professional"})
    assert create_res.status_code == 200
    order_id = create_res.json()["order_id"]

    webhook_secret = "whsec_REALVIONWebhook2026Secret"
    settings.RAZORPAY_WEBHOOK_SECRET = webhook_secret

    payload_dict = {
        "event": "payment.captured",
        "id": "evt_test_unique_9999",
        "payload": {
            "payment": {
                "entity": {
                    "id": "pay_test_wh_1111",
                    "order_id": order_id,
                    "amount": 500000,
                    "method": "upi",
                    "email": "wh.user@example.com"
                }
            }
        }
    }
    raw_payload = json.dumps(payload_dict)
    valid_sig = hmac.new(webhook_secret.encode("utf-8"), raw_payload.encode("utf-8"), hashlib.sha256).hexdigest()

    # 2. Submit webhook with BAD signature -> Must return 401
    bad_wh_res = client.post(
        "/api/v1/payments/webhook",
        content=raw_payload,
        headers={"x-razorpay-signature": "bad_sig_123", "Content-Type": "application/json"}
    )
    assert bad_wh_res.status_code == 401

    # 3. Submit webhook with VALID signature -> Must succeed (200)
    good_wh_res1 = client.post(
        "/api/v1/payments/webhook",
        content=raw_payload,
        headers={"x-razorpay-signature": valid_sig, "Content-Type": "application/json"}
    )
    assert good_wh_res1.status_code == 200

    # 4. Submit DUPLICATE webhook payload -> Must return 200 but produce exactly 1 DB effect
    good_wh_res2 = client.post(
        "/api/v1/payments/webhook",
        content=raw_payload,
        headers={"x-razorpay-signature": valid_sig, "Content-Type": "application/json"}
    )
    assert good_wh_res2.status_code == 200

    db = SessionLocal()
    webhook_records = db.query(PaymentWebhook).filter(PaymentWebhook.event_id == "evt_test_unique_9999").all()
    assert len(webhook_records) == 1
    db.close()

def test_otp_bypass_eliminated():
    # 1. Send OTP to clean email
    send_res = client.post("/api/v1/saas/send-otp", json={"email": "otp.bypass.test@example.com"})
    assert send_res.status_code == 200

    # 2. Try verifying with bypass codes ("123456", "999999", "000000") -> Must FAIL (400)
    for bypass_code in ["123456", "999999", "000000"]:
        verify_res = client.post("/api/v1/saas/verify-otp", json={
            "email": "otp.bypass.test@example.com",
            "otp_code": bypass_code
        })
        assert verify_res.status_code == 400

def test_cors_rejects_arbitrary_origin():
    # Arbitrary 3rd-party origin should not be reflected in Access-Control-Allow-Origin header
    res = client.options(
        "/api/v1/saas/plans",
        headers={
            "Origin": "https://malicious-hacker-site.com",
            "Access-Control-Request-Method": "GET"
        }
    )
    allowed_origin = res.headers.get("access-control-allow-origin")
    assert allowed_origin != "https://malicious-hacker-site.com"
    assert allowed_origin != "*"

if __name__ == "__main__":
    test_payment_bad_signature_rejection()
    test_webhook_signature_and_idempotency()
    test_otp_bypass_eliminated()
    test_cors_rejects_arbitrary_origin()
    print("ALL PHASE 1 HARDENING TESTS PASSED SUCCESSFULLY!")
