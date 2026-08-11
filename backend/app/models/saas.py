from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, Text, ForeignKey
from sqlalchemy.orm import relationship
from app.database import BaseModel

class Organization(BaseModel):
    __tablename__ = "organizations"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    slug = Column(String(255), unique=True, index=True, nullable=False)
    company_type = Column(String(100), default="Agency")
    gst_number = Column(String(100), nullable=True)
    website = Column(String(255), nullable=True)
    address = Column(Text, nullable=True)
    city = Column(String(100), nullable=True)
    state = Column(String(100), nullable=True)
    employee_count = Column(String(50), nullable=True)
    logo_url = Column(String(500), nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)

class Workspace(BaseModel):
    __tablename__ = "workspaces"
    
    id = Column(Integer, primary_key=True, index=True)
    organization_id = Column(Integer, ForeignKey("organizations.id"), nullable=True)
    name = Column(String(255), nullable=False)
    is_demo = Column(Boolean, default=False, index=True)
    demo_expires_at = Column(DateTime, nullable=True)

class Plan(BaseModel):
    __tablename__ = "plans"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    code = Column(String(100), unique=True, index=True, nullable=False)
    price_monthly = Column(Float, nullable=False, default=0.0)
    price_yearly = Column(Float, nullable=False, default=0.0)
    platform_fee = Column(Float, nullable=False, default=499.0)
    max_users = Column(Integer, default=5)
    max_leads = Column(Integer, default=5000)
    features_json = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)

class Subscription(BaseModel):
    __tablename__ = "subscriptions"
    
    id = Column(Integer, primary_key=True, index=True)
    organization_id = Column(Integer, ForeignKey("organizations.id"), nullable=False)
    plan_id = Column(Integer, ForeignKey("plans.id"), nullable=True)
    status = Column(String(50), default="Trial", nullable=False, index=True) # Trial, Demo, Active, Expired, Cancelled
    start_date = Column(DateTime, nullable=False)
    end_date = Column(DateTime, nullable=False)
    auto_renew = Column(Boolean, default=True, nullable=False)
    razorpay_subscription_id = Column(String(255), nullable=True)

class SubscriptionHistory(BaseModel):
    __tablename__ = "subscription_history"
    
    id = Column(Integer, primary_key=True, index=True)
    subscription_id = Column(Integer, ForeignKey("subscriptions.id"), nullable=False)
    event = Column(String(100), nullable=False)
    old_plan_id = Column(Integer, nullable=True)
    new_plan_id = Column(Integer, nullable=True)
    details = Column(Text, nullable=True)

class Payment(BaseModel):
    __tablename__ = "payments"
    
    id = Column(Integer, primary_key=True, index=True)
    organization_id = Column(Integer, ForeignKey("organizations.id"), nullable=True)
    workspace_id = Column(Integer, ForeignKey("workspaces.id"), nullable=True)
    subscription_id = Column(Integer, ForeignKey("subscriptions.id"), nullable=True)
    registration_id = Column(Integer, ForeignKey("registration_requests.id"), nullable=True)
    plan_id = Column(Integer, ForeignKey("plans.id"), nullable=True)
    razorpay_order_id = Column(String(255), unique=True, index=True, nullable=False)
    razorpay_payment_id = Column(String(255), unique=True, nullable=True, index=True)
    razorpay_signature = Column(String(500), nullable=True)
    amount = Column(Float, nullable=False)
    platform_fee = Column(Float, default=0.0, nullable=False)
    gst_amount = Column(Float, default=0.0, nullable=False)
    total_amount = Column(Float, nullable=False)
    currency = Column(String(10), default="INR", nullable=False)
    status = Column(String(50), default="Created", nullable=False, index=True) # Created, Captured, Failed, Refunded
    payment_method = Column(String(50), nullable=True)
    receipt = Column(String(255), nullable=True)

class PaymentLog(BaseModel):
    __tablename__ = "payment_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    payment_id = Column(Integer, ForeignKey("payments.id"), nullable=True)
    event_type = Column(String(100), nullable=False)
    payload_json = Column(Text, nullable=False)

class PaymentWebhook(BaseModel):
    __tablename__ = "payment_webhooks"
    
    id = Column(Integer, primary_key=True, index=True)
    event_id = Column(String(255), unique=True, index=True, nullable=True)
    event_type = Column(String(100), nullable=False)
    signature = Column(String(500), nullable=True)
    payload_json = Column(Text, nullable=False)
    is_processed = Column(Boolean, default=False, nullable=False)
    processing_error = Column(Text, nullable=True)

class License(BaseModel):
    __tablename__ = "licenses"
    
    id = Column(Integer, primary_key=True, index=True)
    organization_id = Column(Integer, ForeignKey("organizations.id"), nullable=False)
    license_key = Column(String(255), unique=True, index=True, nullable=False)
    max_seats = Column(Integer, default=5, nullable=False)
    used_seats = Column(Integer, default=1, nullable=False)
    expires_at = Column(DateTime, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)

class OrganizationSetting(BaseModel):
    __tablename__ = "organization_settings"
    
    id = Column(Integer, primary_key=True, index=True)
    organization_id = Column(Integer, ForeignKey("organizations.id"), unique=True, nullable=False)
    theme_color = Column(String(50), default="#C8A45D")
    currency = Column(String(10), default="INR")
    pipeline_stages_json = Column(Text, nullable=True)
    lead_sources_json = Column(Text, nullable=True)

class EmailLog(BaseModel):
    __tablename__ = "email_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    recipient_email = Column(String(255), index=True, nullable=False)
    subject = Column(String(255), nullable=False)
    template_name = Column(String(100), nullable=False)
    status = Column(String(50), default="Sent", nullable=False)
    error_message = Column(Text, nullable=True)

class OTP(BaseModel):
    __tablename__ = "otps"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), index=True, nullable=False)
    otp_code = Column(String(10), index=True, nullable=True)
    otp_hash = Column(String(255), nullable=True)
    expires_at = Column(DateTime, nullable=False)
    is_verified = Column(Boolean, default=False, nullable=False)
    is_used = Column(Boolean, default=False, nullable=False)
    attempts = Column(Integer, default=0, nullable=False)
    last_sent_at = Column(DateTime, default=datetime.utcnow, nullable=False)


class RegistrationRequest(BaseModel):
    __tablename__ = "registration_requests"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    full_name = Column(String(255), nullable=False)
    phone = Column(String(50), nullable=False)
    password_hash = Column(String(500), nullable=False)
    company_name = Column(String(255), nullable=True)
    company_type = Column(String(100), nullable=True)
    gst_number = Column(String(100), nullable=True)
    website = Column(String(255), nullable=True)
    address = Column(Text, nullable=True)
    city = Column(String(100), nullable=True)
    state = Column(String(100), nullable=True)
    employees = Column(String(50), nullable=True)
    selected_plan_code = Column(String(100), default="professional")
    step_completed = Column(Integer, default=1)
    is_converted = Column(Boolean, default=False)

class DemoAudit(BaseModel):
    __tablename__ = "demo_audits"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    phone_clean = Column(String(50), index=True, nullable=True)
    company_name = Column(String(255), nullable=True)
    ip_address = Column(String(100), nullable=True, index=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

