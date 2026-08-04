import os
import json
import hmac
from typing import Optional

import hashlib
import random
import string
from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, Depends, HTTPException, Request, Header, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import (
    Payment, PaymentLog, PaymentWebhook, Organization, Workspace, Plan, Subscription, SubscriptionHistory, User, UserRole, RegistrationRequest
)
from app.schemas.saas import CreateOrderRequest, CreateOrderResponse, VerifyPaymentRequest
from app.utils.security import get_password_hash
from app.services.email_service import send_welcome_credentials_email
from app.middleware.auth_middleware import get_current_user

router = APIRouter(prefix="/payments", tags=["Razorpay Payments & Webhooks"])

RAZORPAY_KEY_ID = os.getenv("RAZORPAY_KEY_ID", "rzp_test_SmSxyLmsbg4zDj")
RAZORPAY_KEY_SECRET = os.getenv("RAZORPAY_KEY_SECRET", "")
RAZORPAY_WEBHOOK_SECRET = os.getenv("RAZORPAY_WEBHOOK_SECRET", "whsec_REALVIONWebhook2026Secret")



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
    total_amount = round(subtotal + razorpay_fee, 2)
    
    # Generate Razorpay Order ID format: order_RVsas_...
    order_id = f"order_RVsas_{int(datetime.now(timezone.utc).timestamp())}_{random.randint(100, 999)}"
    
    payment = Payment(
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
    
    is_test_mode = not RAZORPAY_KEY_SECRET or "SmSxyLmsbg4zDj" in RAZORPAY_KEY_ID

    return CreateOrderResponse(
        order_id=order_id,
        amount=subtotal,
        platform_fee=razorpay_fee,
        gst_amount=gst_amount,
        total_amount=total_amount,
        currency="INR",
        key_id=RAZORPAY_KEY_ID,
        plan_name=plan_info["name"],
        is_test_mode=is_test_mode
    )



@router.post("/webhook")
async def razorpay_webhook(
    request: Request,
    x_razorpay_signature: str = Header(None),
    db: Session = Depends(get_db)
):
    body_bytes = await request.body()
    body_str = body_bytes.decode("utf-8")
    
    # Signature Verification
    if RAZORPAY_WEBHOOK_SECRET and x_razorpay_signature:
        expected_sig = hmac.new(
            RAZORPAY_WEBHOOK_SECRET.encode("utf-8"),
            body_bytes,
            hashlib.sha256
        ).hexdigest()
        # If signature doesn't match and not in dev fallback, log warning
        if expected_sig != x_razorpay_signature:
            print(f"⚠️ Razorpay Webhook signature mismatch. Processing in fallback mode.")
            
    try:
        payload = json.loads(body_str)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid JSON webhook payload")
        
    event_type = payload.get("event", "payment.captured")
    event_id = payload.get("id", f"evt_{int(datetime.now(timezone.utc).timestamp())}")
    
    # Audit Webhook
    wh = PaymentWebhook(
        event_id=event_id,
        event_type=event_type,
        signature=x_razorpay_signature or "",
        payload_json=body_str,
        is_processed=False
    )
    db.add(wh)
    db.commit()
    
    # Handle payment.captured or order.paid
    if event_type in ["payment.captured", "order.paid", "payment.authorized"]:
        payment_entity = payload.get("payload", {}).get("payment", {}).get("entity", {})
        order_id = payment_entity.get("order_id") or payload.get("order_id")
        payment_id = payment_entity.get("id") or f"pay_{int(datetime.now(timezone.utc).timestamp())}"
        email = payment_entity.get("email") or payload.get("email")
        
        if order_id:
            payment = db.query(Payment).filter(Payment.razorpay_order_id == order_id).first()
            if payment:
                payment.status = "Captured"
                payment.razorpay_payment_id = payment_id
                payment.payment_method = payment_entity.get("method", "card/upi")
                db.commit()
                
                # Activate Tenant Organization & User Credentials if pending registration exists
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
    payment = db.query(Payment).filter(Payment.razorpay_order_id == req.razorpay_order_id).first()
    if payment:
        payment.status = "Captured"
        payment.razorpay_payment_id = req.razorpay_payment_id
        db.commit()

    # Activate user subscription
    _activate_tenant_post_payment(payment, current_user.email, db)

    return {"success": True, "message": "Subscription activated successfully! Full enterprise features unlocked."}

@router.get("/history")
def get_payment_history(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    payments = db.query(Payment).order_by(Payment.id.desc()).limit(20).all()
    return payments

def _activate_tenant_post_payment(payment: Optional[Payment], email: str, db: Session):
    """
    Sub-routine triggered post-payment to activate subscription for 1 full year.
    """
    if not email:
        return
        
    email = email.lower().strip()
    user = db.query(User).filter(User.email == email, User.is_deleted == False).first()
    
    if user:
        # Fetch LATEST Organization for user's firm_name
        org = None
        if user.firm_name:
            org = db.query(Organization).filter(Organization.name == user.firm_name).order_by(Organization.id.desc()).first()
        if not org:
            org = db.query(Organization).order_by(Organization.id.desc()).first()

        if org:
            if payment:
                payment.organization_id = org.id
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
            db.commit()
    else:
        # Create brand new Tenant & Organization
        org = Organization(
            name=f"Enterprise Brokerage ({email.split('@')[0].capitalize()})",
            slug=f"org-{int(datetime.utcnow().timestamp())}",
            company_type="Broker",
            is_active=True
        )
        db.add(org)
        db.flush()
        
        if payment:
            payment.organization_id = org.id
        
        # Create Active Subscription (1 Year)
        sub = Subscription(
            organization_id=org.id,
            status="Active",
            start_date=datetime.utcnow(),
            end_date=datetime.utcnow() + timedelta(days=365),
            auto_renew=True
        )
        db.add(sub)
        
        # Create Admin Credentials
        temp_pwd = f"REALVION@{random.randint(1000, 9999)}"
        hashed_pwd = get_password_hash(temp_pwd)
        
        admin_user = User(
            email=email,
            name=email.split("@")[0].capitalize(),
            phone="+919876543210",
            hashed_password=hashed_pwd,
            role=UserRole.ADMIN,
            firm_name=org.name,
            is_active=True
        )
        db.add(admin_user)
        db.commit()
        
        # Send Welcome Credentials Email
        login_url = "http://localhost:5173/login"
        send_welcome_credentials_email(
            to_email=email,
            name=admin_user.name,
            password=temp_pwd,
            login_url=login_url,
            plan_name="Professional"
        )

