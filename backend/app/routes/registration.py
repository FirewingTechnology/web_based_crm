import random
import string
import re
from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks, Request
from sqlalchemy import func
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import (
    User, UserRole, Organization, Workspace, Plan, Subscription, OTP, RegistrationRequest, DemoAudit,
    Lead, LeadStatus, LeadPriority, Builder, Project, ProjectStatus, Followup, FollowupType, FollowupStatus
)
from app.schemas.saas import (
    SendOTPRequest, SendOTPResponse, VerifyOTPRequest, VerifyOTPResponse,
    RegisterDemoRequest, RegisterDemoResponse, ValidateRegistrationRequest, ValidateRegistrationResponse, PlanSchema
)
from app.utils.security import get_password_hash, create_access_token, create_refresh_token
from app.services.email_service import send_otp_email

router = APIRouter(prefix="/saas", tags=["SaaS Registration & OTP"])

def clean_phone_number(phone: str) -> str:
    """Strips non-digits and extracts last 10 digits for mobile number comparison."""
    if not phone:
        return ""
    digits = re.sub(r'\D', '', phone)
    return digits[-10:] if len(digits) >= 10 else digits


@router.post("/validate-registration", response_model=ValidateRegistrationResponse)
def validate_registration(req: ValidateRegistrationRequest, db: Session = Depends(get_db)):
    email = req.email.lower().strip()
    raw_phone = req.phone.strip() if req.phone else ""
    clean_phone = clean_phone_number(raw_phone)
    company_name_clean = req.company_name.strip() if req.company_name else ""

    if not clean_phone or len(clean_phone) < 10:
        raise HTTPException(
            status_code=400,
            detail="Please enter a valid 10-digit mobile number."
        )

    # 1. Email Check
    existing_email_user = db.query(User).filter(func.lower(User.email) == email).first()
    if existing_email_user:
        raise HTTPException(
            status_code=400,
            detail="An account or free trial has already been created with this email address. Each user is allowed only 1 free trial. Please log in directly."
        )

    existing_demo_audit = db.query(DemoAudit).filter(func.lower(DemoAudit.email) == email).first()
    if existing_demo_audit:
        raise HTTPException(
            status_code=400,
            detail="This email address has already claimed a 1-hour free trial. Multiple trial accounts for the same email are prohibited. Please log in to your existing account."
        )

    existing_reg_req = db.query(RegistrationRequest).filter(func.lower(RegistrationRequest.email) == email).first()
    if existing_reg_req and existing_reg_req.is_converted:
        raise HTTPException(
            status_code=400,
            detail="An account with this email address already exists. Please log in directly."
        )

    # 2. Phone Check
    all_users_with_phone = db.query(User).filter(User.phone.isnot(None), User.phone != "").all()
    for u in all_users_with_phone:
        if clean_phone_number(u.phone) == clean_phone:
            raise HTTPException(
                status_code=400,
                detail=f"A trial workspace or account has already been registered with mobile number ending in ...{clean_phone[-4:]}. Each phone number is eligible for only 1 free trial. Please log in."
            )

    existing_phone_audit = db.query(DemoAudit).filter(DemoAudit.phone_clean == clean_phone).first()
    if existing_phone_audit:
        raise HTTPException(
            status_code=400,
            detail=f"Mobile number ending in ...{clean_phone[-4:]} has already been used to claim a 1-hour free trial. Please log in to your account."
        )

    # 3. Company Name Check
    if company_name_clean:
        existing_org = db.query(Organization).filter(func.lower(Organization.name) == company_name_clean.lower()).first()
        if existing_org:
            raise HTTPException(
                status_code=400,
                detail=f"An agency workspace for '{company_name_clean}' already exists. Please contact your company administrator to invite you or log in directly."
            )

    return ValidateRegistrationResponse(
        valid=True,
        message="Registration details verified and available."
    )


@router.post("/send-otp", response_model=SendOTPResponse)
def send_otp(req: SendOTPRequest, request: Request, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    email = req.email.lower().strip()

    # Extract Client IP for rate limiting
    client_ip = request.headers.get("x-forwarded-for")
    if client_ip:
        client_ip = client_ip.split(",")[0].strip()
    else:
        client_ip = request.client.host if request.client else "unknown"

    # 1. Validate if email already registered
    existing_user = db.query(User).filter(User.email.ilike(email)).first()
    if existing_user:
        raise HTTPException(
            status_code=400,
            detail="An account with this email address already exists. Please log in directly."
        )

    # 2. Check DemoAudit
    existing_audit = db.query(DemoAudit).filter(DemoAudit.email.ilike(email)).first()
    if existing_audit:
        raise HTTPException(
            status_code=400,
            detail="This email address has already been used for a free trial. Please log in to your existing account."
        )
        
    # 3. Check 60-second Resend Cooldown
    now = datetime.utcnow()
    latest_otp = db.query(OTP).filter(OTP.email == email).order_by(OTP.id.desc()).first()
    if latest_otp and latest_otp.last_sent_at:
        seconds_since_last = (now - latest_otp.last_sent_at).total_seconds()
        if seconds_since_last < 60:
            raise HTTPException(
                status_code=429,
                detail=f"Please wait {int(60 - seconds_since_last)} seconds before requesting another verification code."
            )
            
    # 4. Generate Secure 6-digit OTP & Hash
    otp_code = "".join(random.choices(string.digits, k=6))
    otp_hash = get_password_hash(otp_code)
    expires_at = now + timedelta(minutes=10)
    
    # Delete old unverified OTPs for this email
    db.query(OTP).filter(OTP.email == email, OTP.is_verified == False).delete()
    
    otp_entry = OTP(
        email=email,
        otp_code=otp_code, # Retained for email sending
        otp_hash=otp_hash,
        expires_at=expires_at,
        is_verified=False,
        is_used=False,
        attempts=0,
        last_sent_at=now
    )
    db.add(otp_entry)
    db.commit()
    
    # Send Email asynchronously
    background_tasks.add_task(send_otp_email, email, otp_code)
    
    return SendOTPResponse(
        success=True,
        message=f"Verification code sent to {email}. (Valid for 10 minutes)"
    )


@router.post("/verify-otp", response_model=VerifyOTPResponse)
def verify_otp(req: VerifyOTPRequest, db: Session = Depends(get_db)):
    email = req.email.lower().strip()
    code = req.otp_code.strip()
    now = datetime.utcnow()
    
    # Fetch active unverified & unused OTP entry
    otp_entry = db.query(OTP).filter(
        OTP.email == email,
        OTP.is_verified == False,
        OTP.is_used == False
    ).order_by(OTP.id.desc()).first()
    
    if not otp_entry:
        raise HTTPException(status_code=400, detail="No active verification code found. Please request a new code.")
        
    if otp_entry.expires_at < now:
        raise HTTPException(status_code=400, detail="Verification code has expired. Please request a new code.")
        
    if otp_entry.attempts >= 5:
        raise HTTPException(status_code=400, detail="Maximum verification attempts exceeded. Please request a new code.")
        
    # Strictly verify code - NO BYPASS ALLOWED
    is_valid = (otp_entry.otp_code == code)
    if not is_valid:
        otp_entry.attempts += 1
        db.commit()
        attempts_left = 5 - otp_entry.attempts
        raise HTTPException(
            status_code=400,
            detail=f"Incorrect verification code. {attempts_left} attempt(s) remaining."
        )
        
    # Mark as verified and single-use used
    otp_entry.is_verified = True
    otp_entry.is_used = True
    db.commit()
    
    return VerifyOTPResponse(success=True, message="Email successfully verified")




@router.post("/register-demo", response_model=RegisterDemoResponse)
def register_demo(req: RegisterDemoRequest, request: Request, db: Session = Depends(get_db)):
    email = req.email.lower().strip()
    raw_phone = req.phone.strip() if req.phone else ""
    clean_phone = clean_phone_number(raw_phone)
    company_name_clean = req.company_name.strip() if req.company_name else ""
    
    # Extract Client IP
    client_ip = request.headers.get("x-forwarded-for")
    if client_ip:
        client_ip = client_ip.split(",")[0].strip()
    else:
        client_ip = request.client.host if request.client else "unknown"

    # 1. SERVER-SIDE SECURITY VALIDATION: Case-Insensitive Email Check
    existing_email_user = db.query(User).filter(func.lower(User.email) == email).first()
    if existing_email_user:
        raise HTTPException(
            status_code=400,
            detail="An account or free trial has already been created with this email address. Each user is allowed only 1 free trial. Please log in directly."
        )

    existing_demo_audit = db.query(DemoAudit).filter(func.lower(DemoAudit.email) == email).first()
    if existing_demo_audit:
        raise HTTPException(
            status_code=400,
            detail="This email address has already claimed a 1-hour free trial. Multiple trial accounts for the same email are prohibited. Please log in to your existing account."
        )

    existing_reg_req = db.query(RegistrationRequest).filter(func.lower(RegistrationRequest.email) == email).first()
    if existing_reg_req and existing_reg_req.is_converted:
        raise HTTPException(
            status_code=400,
            detail="An account with this email address already exists. Please log in directly."
        )

    # 2. SERVER-SIDE SECURITY VALIDATION: Cleaned 10-Digit Mobile / Phone Check
    if clean_phone:
        all_users_with_phone = db.query(User).filter(User.phone.isnot(None), User.phone != "").all()
        for u in all_users_with_phone:
            if clean_phone_number(u.phone) == clean_phone:
                raise HTTPException(
                    status_code=400,
                    detail=f"A trial workspace or account has already been registered with mobile number ending in ...{clean_phone[-4:]}. Each phone number is eligible for only 1 free trial. Please log in."
                )

        existing_phone_audit = db.query(DemoAudit).filter(DemoAudit.phone_clean == clean_phone).first()
        if existing_phone_audit:
            raise HTTPException(
                status_code=400,
                detail=f"Mobile number ending in ...{clean_phone[-4:]} has already been used to claim a 1-hour free trial. Please log in to your account."
            )

    # 3. SERVER-SIDE SECURITY VALIDATION: Organization / Agency Name Duplicate Check
    if company_name_clean:
        existing_org = db.query(Organization).filter(func.lower(Organization.name) == company_name_clean.lower()).first()
        if existing_org:
            raise HTTPException(
                status_code=400,
                detail=f"An agency workspace for '{company_name_clean}' already exists. Please contact your company administrator to invite you or log in directly."
            )

    # 4. SERVER-SIDE SECURITY VALIDATION: IP Rate Limiting (Max 5 trials per IP per 24 hours)
    twenty_four_hours_ago = datetime.utcnow() - timedelta(hours=24)
    recent_trials_from_ip = db.query(DemoAudit).filter(
        DemoAudit.ip_address == client_ip,
        DemoAudit.created_at >= twenty_four_hours_ago
    ).count()

    if recent_trials_from_ip >= 5:
        raise HTTPException(
            status_code=429,
            detail="Maximum free trial creation limit reached from your IP address today. Please contact support or upgrade your account."
        )

    
    # Create Organization
    slug = req.company_name.lower().replace(" ", "-").replace("&", "and") + "-" + "".join(random.choices(string.digits, k=4))
    org = Organization(
        name=req.company_name,
        slug=slug,
        company_type=req.company_type,
        gst_number=req.gst_number,
        website=req.website,
        address=req.address,
        city=req.city,
        state=req.state,
        employee_count=req.employees,
        is_active=True
    )
    db.add(org)
    db.flush()
    
    # Create Workspace in 1-Hour Trial Mode
    now = datetime.utcnow()
    one_hour_later = now + timedelta(hours=1)
    workspace = Workspace(
        organization_id=org.id,
        name=f"{req.company_name} Workspace",
        is_demo=True,
        demo_expires_at=one_hour_later
    )
    db.add(workspace)

    # Create 1-Hour Free Trial Subscription
    sub = Subscription(
        organization_id=org.id,
        status="Trial",
        start_date=now,
        end_date=one_hour_later,
        auto_renew=False
    )
    db.add(sub)

    
    # Create Admin User
    hashed_pwd = get_password_hash(req.password)
    admin_user = User(
        organization_id=org.id,
        email=email,
        name=req.full_name,
        phone=req.phone,
        hashed_password=hashed_pwd,
        role=UserRole.ADMIN,
        firm_name=req.company_name,
        is_active=True
    )
    db.add(admin_user)
    db.flush()

    # Preload Demo Data: 5 Builders, 5 Projects, 50 Leads, 10 Followups
    builders_data = [
        ("Lodha Group", "contact@lodha.com", "+919820011223"),
        ("Godrej Properties", "sales@godrejprop.com", "+919820044556"),
        ("DLF Limited", "info@dlf.in", "+919820077889"),
        ("Prestige Estates", "contact@prestige.com", "+919820099001"),
        ("Sobha Developers", "sales@sobha.com", "+919820033445"),
    ]
    created_builders = []
    for b_name, b_email, b_phone in builders_data:
        b = Builder(
            name=b_name,
            company=b_name,
            contact_person="Sales Desk",
            email=b_email,
            phone=b_phone,
            address=req.city or "Mumbai",
            commission_rate=3.0
        )
        db.add(b)
        db.flush()
        created_builders.append(b)


    projects_data = [
        ("Lodha Altamount", "Altamount Road, South Mumbai", 850.0, 2200.0, ProjectStatus.UNDER_CONSTRUCTION),
        ("Godrej Trees", "Vikhroli, Mumbai", 180.0, 450.0, ProjectStatus.NEW_LAUNCH),
        ("DLF Camellias", "Golf Course Road, Gurgaon", 1200.0, 3500.0, ProjectStatus.READY_TO_MOVE),
        ("Prestige Falcon City", "Kanakapura Road, Bangalore", 120.0, 280.0, ProjectStatus.READY_TO_MOVE),
        ("Sobha Royal Pavilion", "Sarjapur Road, Bangalore", 140.0, 320.0, ProjectStatus.UNDER_CONSTRUCTION),
    ]
    created_projects = []
    for p_idx, (p_name, p_loc, p_min, p_max, p_status) in enumerate(projects_data):
        proj = Project(
            builder_id=created_builders[p_idx % len(created_builders)].id,
            name=p_name,
            location=p_loc,
            configuration="3 & 4 BHK Luxury Residences",
            min_price=p_min,
            max_price=p_max,
            status=p_status,
            possession_date="Dec 2027",
            rera_id=f"PRM/KA/RERA/1251/{2026+p_idx}"
        )
        db.add(proj)
        db.flush()
        created_projects.append(proj)


    # Preload 50 Sample Leads
    sample_first = ["Rahul", "Priya", "Amit", "Neha", "Vicky", "Sanjay", "Ananya", "Rohan", "Pooja", "Vikram", "Kavita", "Karan", "Simran", "Rajesh", "Deepak", "Aarti", "Sunil", "Meera", "Manish", "Sneha"]
    sample_last = ["Sharma", "Verma", "Gupta", "Mehta", "Patel", "Singh", "Joshi", "Deshmukh", "Nair", "Rao", "Kapoor", "Chopra", "Bhatia", "Reddy", "Aggarwal"]
    statuses = [LeadStatus.NEW, LeadStatus.CONTACTED, LeadStatus.QUALIFIED, LeadStatus.SITE_VISIT, LeadStatus.NEGOTIATION, LeadStatus.BOOKED, LeadStatus.LOST]

    for i in range(1, 51):
        fn = random.choice(sample_first)
        ln = random.choice(sample_last)
        lead_name = f"{fn} {ln}"
        lead_phone = f"+9198{random.randint(10000000, 99999999)}"
        lead_email = f"{fn.lower()}.{ln.lower()}{i}@example.com"
        st = random.choice(statuses)
        b_min = round(random.uniform(50.0, 500.0), 2)
        b_max = round(b_min + random.uniform(50.0, 300.0), 2)
        proj_choice = random.choice(created_projects)

        lead = Lead(
            name=lead_name,
            email=lead_email,
            phone=lead_phone,
            status=st,
            priority=random.choice([LeadPriority.HIGH, LeadPriority.MEDIUM, LeadPriority.LOW]),
            budget_min=b_min,
            budget_max=b_max,
            preferred_location=req.city or "Mumbai",
            assigned_to_id=admin_user.id,
            preferred_project_id=proj_choice.id,
            tags="High Intent, Demo Preloaded"
        )
        db.add(lead)
        db.flush()


        if i <= 10:
            f_type = random.choice([FollowupType.CALL, FollowupType.WHATSAPP, FollowupType.SITE_VISIT])
            f = Followup(
                lead_id=lead.id,
                assigned_to_id=admin_user.id,
                title=f"Scheduled {f_type.value} with {lead_name}",
                type=f_type,
                scheduled_at=datetime.now(timezone.utc) + timedelta(hours=random.randint(1, 48)),
                status=FollowupStatus.PENDING
            )
            db.add(f)

    # Record Demo Audit entry for security tracking
    audit_entry = DemoAudit(
        email=email,
        phone_clean=clean_phone,
        company_name=company_name_clean,
        ip_address=client_ip,
        created_at=datetime.utcnow()
    )
    db.add(audit_entry)

    db.commit()
    db.refresh(admin_user)

    # Issue Auth Tokens
    token_data = {"user_id": admin_user.id, "email": admin_user.email, "role": admin_user.role.value, "is_demo": True}
    access_token = create_access_token(data=token_data)
    refresh_token = create_refresh_token(data=token_data)

    return RegisterDemoResponse(
        success=True,
        access_token=access_token,
        refresh_token=refresh_token,
        is_demo_mode=True,
        user={
            "id": admin_user.id,
            "email": admin_user.email,
            "name": admin_user.name,
            "role": admin_user.role.value,
            "firm_name": req.company_name
        },
        workspace_name=f"{req.company_name} Demo Workspace",
        message="Demo Workspace created successfully with 50 sample leads & analytics!"
    )

@router.get("/plans")
def get_plans(db: Session = Depends(get_db)):
    plans = [
        {
            "id": 1,
            "name": "Starter",
            "code": "starter",
            "price_monthly": 1999.0,
            "price_yearly": 19990.0,
            "platform_fee": 499.0,
            "max_users": 3,
            "max_leads": 1000,
            "features": ["3 User Licenses", "Up to 1,000 Leads", "Basic Followup Reminders", "Standard Reports"]
        },
        {
            "id": 2,
            "name": "Professional",
            "code": "professional",
            "price_monthly": 4999.0,
            "price_yearly": 49990.0,
            "platform_fee": 499.0,
            "max_users": 10,
            "max_leads": 10000,
            "features": ["10 User Licenses", "Up to 10,000 Leads", "Real-Time Voice Alarms", "Commission Calculation Engine", "CSV Data Export", "Priority Support"]
        },
        {
            "id": 3,
            "name": "Enterprise",
            "code": "enterprise",
            "price_monthly": 14999.0,
            "price_yearly": 149990.0,
            "platform_fee": 999.0,
            "max_users": 50,
            "max_leads": 100000,
            "features": ["Unlimited User Licenses", "Unlimited Leads", "Dedicated Account Manager", "Custom Webhooks & API Integration", "Multi-Tenant Broker Network", "24/7 Phone & Email Support"]
        }
    ]
    return plans
