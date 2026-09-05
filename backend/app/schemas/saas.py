from typing import Optional, List, Dict, Any
from pydantic import BaseModel, EmailStr, Field

class SendOTPRequest(BaseModel):
    email: EmailStr

class SendOTPResponse(BaseModel):
    success: bool
    message: str

class VerifyOTPRequest(BaseModel):
    email: EmailStr
    otp_code: str

class VerifyOTPResponse(BaseModel):
    success: bool
    message: str

class RegisterDemoRequest(BaseModel):
    full_name: str
    email: EmailStr
    phone: str
    password: str
    company_name: str
    company_type: str = "Agency"
    gst_number: Optional[str] = None
    website: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    employees: Optional[str] = "1-10"
    selected_plan_code: str = "professional"

class ValidateRegistrationRequest(BaseModel):
    email: EmailStr
    phone: str
    company_name: str

class ValidateRegistrationResponse(BaseModel):
    valid: bool
    message: str

class RegisterDemoResponse(BaseModel):
    success: bool
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    is_demo_mode: bool = True
    user: Dict[str, Any]
    workspace_name: str
    message: str

class CreateOrderRequest(BaseModel):
    plan_code: str = "professional"
    plan_id: Optional[int] = None
    email: Optional[EmailStr] = None
    organization_id: Optional[int] = None
    workspace_id: Optional[int] = None
    registration_id: Optional[int] = None
    subscription_id: Optional[int] = None
    billing_cycle: str = "monthly" # monthly or yearly
    coupon_code: Optional[str] = None


class CreateOrderResponse(BaseModel):
    order_id: str
    amount: float
    platform_fee: float
    gst_amount: float
    total_amount: float
    currency: str = "INR"
    key_id: str
    plan_name: str
    is_test_mode: bool = False


class VerifyPaymentRequest(BaseModel):
    razorpay_order_id: str
    razorpay_payment_id: str
    razorpay_signature: str
    email: Optional[EmailStr] = None


class PlanSchema(BaseModel):
    id: int
    name: str
    code: str
    price_monthly: float
    price_yearly: float
    platform_fee: float
    max_users: int
    max_leads: int
    features: List[str] = []

    class Config:
        from_attributes = True

class SaaSAnalyticsResponse(BaseModel):
    mrr: float
    arr: float
    total_customers: int
    active_subscriptions: int
    demo_workspaces: int
    total_revenue: float
    growth_rate_pct: float
    website_total_visits: Optional[int] = 0
    website_unique_visitors: Optional[int] = 0
    website_today_visitors: Optional[int] = 0
    website_registered_users: Optional[int] = 0
    website_conversion_rate: Optional[float] = 0.0

class TrackVisitRequest(BaseModel):
    visitor_id: str
    session_id: Optional[str] = None
    page_path: str
    page_title: Optional[str] = None
    referrer: Optional[str] = None
    device_type: Optional[str] = None
    browser: Optional[str] = None
    os: Optional[str] = None

class WebsiteAnalyticsSummary(BaseModel):
    total_visits: int
    unique_visitors: int
    today_visitors: int
    this_week_visitors: int
    total_registered_users: int
    conversion_rate_pct: float

class DailyTrendItem(BaseModel):
    date: str
    visits: int
    unique_visitors: int
    registrations: int

class TopPageItem(BaseModel):
    page_path: str
    page_title: Optional[str] = None
    views: int
    unique_visitors: int
    pct: float

class BreakdownItem(BaseModel):
    name: str
    count: int
    pct: float

class RecentVisitItem(BaseModel):
    id: int
    visitor_id: str
    page_path: str
    page_title: Optional[str] = None
    referrer: Optional[str] = None
    ip_address: Optional[str] = None
    device_type: Optional[str] = None
    browser: Optional[str] = None
    os: Optional[str] = None
    created_at: str

class WebsiteAnalyticsResponse(BaseModel):
    summary: WebsiteAnalyticsSummary
    daily_trends: List[DailyTrendItem]
    top_pages: List[TopPageItem]
    device_breakdown: List[BreakdownItem]
    browser_breakdown: List[BreakdownItem]
    recent_visits: List[RecentVisitItem]

class WebsiteRegisteredUserItem(BaseModel):
    id: int
    user_id: Optional[int] = None
    name: str
    email: str
    phone: str
    company_name: Optional[str] = None
    company_type: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    plan_code: str
    status: str
    registered_at: str
    ip_address: Optional[str] = None
    is_active: bool

class CreateOfflineTenantRequest(BaseModel):
    admin_name: str
    admin_email: EmailStr
    admin_phone: str
    admin_password: str
    company_name: str
    company_type: str = "Channel Partner"
    plan_code: str = "professional"
    payment_method: str = "Offline Cash / Bank Transfer"
    seats_limit: int = 15
    city: Optional[str] = "Mumbai"
    state: Optional[str] = "Maharashtra"

class UpdateQuotaRequest(BaseModel):
    seats_limit: int
    max_leads: int


class UpgradePlanRequest(BaseModel):
    plan_code: str  # starter | professional | enterprise
    seats_limit: int = 15
    max_leads: int = 5000
    extend_days: int = 365  # how many days from today to set end_date


class ExtendSubscriptionRequest(BaseModel):
    extend_days: int = 365  # additional days to add to current end_date (or from today)
