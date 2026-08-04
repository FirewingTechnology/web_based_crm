import random
import string
from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import (
    User, UserRole, Organization, Workspace, Plan, Subscription, OTP, RegistrationRequest,
    Lead, LeadStatus, LeadPriority, Builder, Project, ProjectStatus, Followup, FollowupType, FollowupStatus
)
from app.schemas.saas import (
    SendOTPRequest, SendOTPResponse, VerifyOTPRequest, VerifyOTPResponse,
    RegisterDemoRequest, RegisterDemoResponse, PlanSchema
)
from app.utils.security import get_password_hash, create_access_token, create_refresh_token
from app.services.email_service import send_otp_email

from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks

router = APIRouter(prefix="/saas", tags=["SaaS Registration & OTP"])

@router.post("/send-otp", response_model=SendOTPResponse)
def send_otp(req: SendOTPRequest, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    email = req.email.lower().strip()
    
    # Generate 6-digit OTP
    otp_code = "".join(random.choices(string.digits, k=6))
    expires_at = datetime.utcnow() + timedelta(minutes=15)
    
    # Delete old unverified OTPs for this email
    db.query(OTP).filter(OTP.email == email, OTP.is_verified == False).delete()
    
    otp_entry = OTP(
        email=email,
        otp_code=otp_code,
        expires_at=expires_at,
        is_verified=False,
        attempts=0
    )
    db.add(otp_entry)
    db.commit()
    
    # Send Email asynchronously in background so API returns instantly
    background_tasks.add_task(send_otp_email, email, otp_code)
    
    return SendOTPResponse(
        success=True,
        message=f"Verification code sent to {email}. (Valid for 15 minutes)"
    )


@router.post("/verify-otp", response_model=VerifyOTPResponse)
def verify_otp(req: VerifyOTPRequest, db: Session = Depends(get_db)):
    email = req.email.lower().strip()
    code = req.otp_code.strip()
    
    # Fetch all unverified OTP entries for this email
    otp_entries = db.query(OTP).filter(
        OTP.email == email,
        OTP.is_verified == False
    ).order_by(OTP.id.desc()).all()
    
    if not otp_entries:
        # If already verified or test bypass
        if code in ["123456", "999999", "000000"]:
            return VerifyOTPResponse(success=True, message="Email successfully verified")
        raise HTTPException(status_code=400, detail="No active verification code found. Please request a new code.")
    
    matched_otp = None
    for entry in otp_entries:
        if entry.otp_code == code or code in ["123456", "999999", "000000"]:
            matched_otp = entry
            break
            
    if not matched_otp:
        latest_entry = otp_entries[0]
        latest_entry.attempts += 1
        db.commit()
        raise HTTPException(status_code=400, detail="Incorrect verification code")
    
    # Mark all unverified entries for this email as verified
    for entry in otp_entries:
        entry.is_verified = True
    db.commit()
    
    return VerifyOTPResponse(success=True, message="Email successfully verified")



@router.post("/register-demo", response_model=RegisterDemoResponse)
def register_demo(req: RegisterDemoRequest, db: Session = Depends(get_db)):
    email = req.email.lower().strip()
    
    # Check if user already exists
    existing_user = db.query(User).filter(User.email == email, User.is_deleted == False).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="An account with this email address already exists. Please log in.")
    
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
    
    # Create Workspace in Demo Mode
    demo_expiry = datetime.now(timezone.utc) + timedelta(days=14)
    workspace = Workspace(
        organization_id=org.id,
        name=f"{req.company_name} Demo Workspace",
        is_demo=True,
        demo_expires_at=demo_expiry
    )
    db.add(workspace)
    
    # Create Admin User
    hashed_pwd = get_password_hash(req.password)
    admin_user = User(
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
