import os
import json
import hmac
import hashlib
import random
import string
import base64
import urllib.request
from typing import Optional
from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, Depends, HTTPException, Request, Header, status
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.config import settings
from app.database import get_db
from app.models import (
    Payment, PaymentLog, PaymentWebhook, Organization, Workspace, Plan, Subscription, SubscriptionHistory, User, UserRole, RegistrationRequest
)
from app.schemas.saas import CreateOrderRequest, CreateOrderResponse, VerifyPaymentRequest
from app.utils.security import get_password_hash
from app.services.email_service import send_welcome_credentials_email
from app.middleware.auth_middleware import get_current_user

router = APIRouter(prefix="/payments", tags=["Razorpay Payments & Webhooks"])

PLAN_PRICES = {
    "starter": {"name": "Starter CP Plan", "subtotal": 999.0},
    "professional": {"name": "Professional Agency Plan", "subtotal": 4999.0},
    "enterprise": {"name": "Enterprise Plan", "subtotal": 14999.0},
}

@router.post("/create-order", response_model=CreateOrderResponse)
def create_order(req: CreateOrderRequest, db: Session = Depends(get_db)):
    plan_info = PLAN_PRICES.get(req.plan_code.lower(), PLAN_PRICES["professional"])
    subtotal = plan_info["subtotal"]
    
    if req.coupon_code and req.coupon_code.upper() == "REALVION20":
        subtotal = round(subtotal * 0.8, 2) # 20% Discount
        
    razorpay_fee = round(subtotal * 0.02, 2) # 2% Razorpay Transaction Commission
    gst_amount = 0.0
    total_amount = round(subtotal + razorpay_fee + gst_amount, 2)
    
    key_id = settings.RAZORPAY_KEY_ID
    key_secret = settings.RAZORPAY_KEY_SECRET

    order_id = None
    if key_id and key_secret and not key_id.startswith("rzp_test_mock"):
        try:
            auth_str = base64.b64encode(f"{key_id}:{key_secret}".encode()).decode()
            headers = {
                "Authorization": f"Basic {auth_str}",
                "Content-Type": "application/json"
            }
            payload = {
                "amount": int(round(total_amount * 100)), # Paise
                "currency": "INR",
                "receipt": f"rcpt_{int(datetime.now(timezone.utc).timestamp())}",
                "notes": {
                    "plan_code": req.plan_code,
                    "organization_id": str(req.organization_id or ""),
                    "workspace_id": str(req.workspace_id or ""),
                    "registration_id": str(req.registration_id or ""),
                }
            }
            req_obj = urllib.request.Request("https://api.razorpay.com/v1/orders", data=json.dumps(payload).encode("utf-8"), headers=headers, method="POST")
            with urllib.request.urlopen(req_obj, timeout=10) as resp:
                res_data = json.loads(resp.read().decode())
                order_id = res_data.get("id")
        except Exception:
            # Test / fallback mode order creation
            order_id = f"order_realvion_{int(datetime.now(timezone.utc).timestamp())}_{random.randint(1000, 9999)}"
    else:
        order_id = f"order_realvion_{int(datetime.now(timezone.utc).timestamp())}_{random.randint(1000, 9999)}"
    
    payment = Payment(
        organization_id=req.organization_id,
        workspace_id=req.workspace_id,
        registration_id=req.registration_id,
        plan_id=req.plan_id,
        subscription_id=req.subscription_id,
        razorpay_order_id=order_id,
        amount=subtotal,
        platform_fee=razorpay_fee,
        gst_amount=gst_amount,
        total_amount=total_amount,
        currency="INR",
        status="Created",
        receipt=f"rcpt_{order_id[-8:]}"
    )
    db.add(payment)
    db.commit()
    
    is_test_mode = not key_secret or "mock" in key_id.lower() or "test" in key_id.lower()

    return CreateOrderResponse(
        order_id=order_id,
        amount=subtotal,
        platform_fee=razorpay_fee,
        gst_amount=gst_amount,
        total_amount=total_amount,
        currency="INR",
        key_id=key_id or "rzp_test_placeholder",
        plan_name=plan_info["name"],
        is_test_mode=is_test_mode
    )

@router.post("/webhook")
async def razorpay_webhook(
    request: Request,
    x_razorpay_signature: str = Header(None),
    db: Session = Depends(get_db)
):
    webhook_secret = settings.RAZORPAY_WEBHOOK_SECRET
    body_bytes = await request.body()
    body_str = body_bytes.decode("utf-8")
    
    # Strict Webhook Signature Verification
    if not x_razorpay_signature or not webhook_secret:
        raise HTTPException(status_code=401, detail="Missing razorpay signature or webhook secret configuration")
        
    expected_sig = hmac.new(
        webhook_secret.encode("utf-8"),
        body_bytes,
        hashlib.sha256
    ).hexdigest()
    
    if not hmac.compare_digest(expected_sig, x_razorpay_signature):
        raise HTTPException(status_code=401, detail="Invalid webhook signature")
        
    try:
        payload = json.loads(body_str)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid JSON webhook payload")
        
    event_type = payload.get("event", "payment.captured")
    event_id = payload.get("id")
    
    # Idempotency Check on event_id
    if event_id:
        existing_wh = db.query(PaymentWebhook).filter(PaymentWebhook.event_id == event_id).first()
        if existing_wh and existing_wh.is_processed:
            return {"status": "ok", "message": "Event already processed"}
            
    wh = PaymentWebhook(
        event_id=event_id,
        event_type=event_type,
        signature=x_razorpay_signature,
        payload_json=body_str,
        is_processed=False
    )
    db.add(wh)
    try:
        db.commit()
    except Exception:
        db.rollback()
        return {"status": "ok", "message": "Duplicate webhook event ignored"}

    if event_type in ["payment.captured", "order.paid", "payment.authorized"]:
        payment_entity = payload.get("payload", {}).get("payment", {}).get("entity", {})
        order_id = payment_entity.get("order_id") or payload.get("order_id")
        payment_id = payment_entity.get("id")
        email = payment_entity.get("email") or payload.get("email")
        
        if order_id:
            payment = db.query(Payment).filter(Payment.razorpay_order_id == order_id).first()
            if payment:
                if payment.status == "Captured":
                    wh.is_processed = True
                    db.commit()
                    return {"status": "ok", "message": "Payment already captured"}
                    
                payment.status = "Captured"
                payment.razorpay_payment_id = payment_id
                payment.payment_method = payment_entity.get("method", "card/upi")
                db.commit()
                
                _activate_tenant_post_payment(payment, email, db)
                
        wh.is_processed = True
        db.commit()
        
    return {"status": "ok", "message": "Webhook processed successfully"}

@router.post("/verify")
def verify_payment(
    req: VerifyPaymentRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    key_secret = settings.RAZORPAY_KEY_SECRET
    
    payment = db.query(Payment).filter(Payment.razorpay_order_id == req.razorpay_order_id).first()
    if not payment:
        raise HTTPException(status_code=404, detail="Order not found")

    if not req.razorpay_signature:
        payment.status = "Failed"
        db.commit()
        raise HTTPException(status_code=401, detail="Missing payment signature")
        
    msg = f"{req.razorpay_order_id}|{req.razorpay_payment_id}"
    expected_signature = hmac.new(
        key_secret.encode("utf-8") if key_secret else b"dev_secret",
        msg.encode("utf-8"),
        hashlib.sha256
    ).hexdigest()
    
    if not hmac.compare_digest(expected_signature, req.razorpay_signature):
        payment.status = "Failed"
        db.commit()
        raise HTTPException(status_code=401, detail="Invalid payment signature. Verification failed.")

    payment.status = "Captured"
    payment.razorpay_payment_id = req.razorpay_payment_id
    payment.razorpay_signature = req.razorpay_signature
    db.commit()

    _activate_tenant_post_payment(payment, current_user.email, db)

    return {"success": True, "message": "Subscription activated successfully! Full enterprise features unlocked."}

@router.get("/history")
def get_payment_history(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    payments = db.query(Payment).order_by(Payment.id.desc()).limit(20).all()
    return payments

def _activate_tenant_post_payment(payment: Optional[Payment], email: str, db: Session):
    """
    Sub-routine triggered post-payment to activate subscription for 1 full year using payment metadata.
    Never infers org via 'latest organization' query.
    """
    if not payment:
        return
        
    org = None
    if payment.organization_id:
        org = db.query(Organization).filter(Organization.id == payment.organization_id).first()
    elif payment.workspace_id:
        ws = db.query(Workspace).filter(Workspace.id == payment.workspace_id).first()
        if ws and ws.organization_id:
            org = db.query(Organization).filter(Organization.id == ws.organization_id).first()
            payment.organization_id = org.id
            
    if not org and email:
        email = email.lower().strip()
        user = db.query(User).filter(func.lower(User.email) == email, User.is_deleted == False).first()
        if user and user.organization_id:
            org = db.query(Organization).filter(Organization.id == user.organization_id).first()
            if org:
                payment.organization_id = org.id

    if org:
        org.is_active = True
        sub = db.query(Subscription).filter(Subscription.organization_id == org.id).order_by(Subscription.id.desc()).first()
        if not sub:
            sub = Subscription(
                organization_id=org.id,
                status="Active",
                start_date=datetime.utcnow(),
                end_date=datetime.utcnow() + timedelta(days=365),
                auto_renew=True
            )
            db.add(sub)
        else:
            sub.status = "Active"
            sub.end_date = datetime.utcnow() + timedelta(days=365)
            
        if payment.workspace_id:
            ws = db.query(Workspace).filter(Workspace.id == payment.workspace_id).first()
            if ws:
                ws.is_demo = False
        db.commit()


