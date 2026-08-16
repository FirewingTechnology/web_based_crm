from datetime import datetime, timezone, timedelta
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Organization, Workspace, Subscription, Payment, User, UserRole, Plan, Lead
from app.schemas.saas import SaaSAnalyticsResponse, CreateOfflineTenantRequest, UpdateQuotaRequest, UpgradePlanRequest, ExtendSubscriptionRequest
from app.middleware.auth_middleware import get_current_user
from app.utils.security import get_password_hash
from app.services.email_service import send_welcome_credentials_email

router = APIRouter(prefix="/superadmin", tags=["SaaS Super Admin Panel"])

def check_superadmin_access(current_user: User = Depends(get_current_user)):
    if current_user.role != UserRole.SUPERADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access Denied: Platform Owner Super Admin privileges required."
        )
    return current_user


@router.get("/analytics", response_model=SaaSAnalyticsResponse)
def get_saas_analytics(
    db: Session = Depends(get_db),
    admin: User = Depends(check_superadmin_access)
):
    total_customers = db.query(Organization).filter(Organization.is_deleted == False).count()
    active_subscriptions = db.query(Subscription).filter(Subscription.status == "Active", Subscription.is_deleted == False).count()
    demo_workspaces = db.query(Workspace).filter(Workspace.is_demo == True, Workspace.is_deleted == False).count()
    
    payments = db.query(Payment).filter(Payment.status == "Captured", Payment.is_deleted == False).all()
    total_revenue = sum(p.total_amount for p in payments) if payments else 0.0
    
    mrr = round(total_revenue / 12, 2) if total_revenue > 0 else 0.0
    arr = round(mrr * 12, 2)
    
    # Real dynamic MoM growth rate calculation
    now = datetime.now(timezone.utc)
    this_month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    last_month_end = this_month_start - timedelta(seconds=1)
    last_month_start = last_month_end.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    
    this_month_rev = sum(
        p.total_amount for p in payments 
        if p.created_at and (p.created_at.replace(tzinfo=timezone.utc) if getattr(p.created_at, 'tzinfo', None) is None else p.created_at) >= this_month_start
    )
    last_month_rev = sum(
        p.total_amount for p in payments 
        if p.created_at and last_month_start <= (p.created_at.replace(tzinfo=timezone.utc) if getattr(p.created_at, 'tzinfo', None) is None else p.created_at) <= last_month_end
    )
    
    if last_month_rev > 0:
        growth_rate_pct = round(((this_month_rev - last_month_rev) / last_month_rev) * 100, 1)
    elif this_month_rev > 0:
        growth_rate_pct = 100.0
    else:
        growth_rate_pct = 0.0

    return SaaSAnalyticsResponse(
        mrr=mrr,
        arr=arr,
        total_customers=total_customers,
        active_subscriptions=active_subscriptions,
        demo_workspaces=demo_workspaces,
        total_revenue=total_revenue,
        growth_rate_pct=growth_rate_pct
    )

@router.get("/organizations")
def list_organizations(
    db: Session = Depends(get_db),
    admin: User = Depends(check_superadmin_access)
):
    orgs = db.query(Organization).all()
    result = []
    for org in orgs:
        sub = db.query(Subscription).filter(Subscription.organization_id == org.id).first()
        admin_user = db.query(User).filter(User.firm_name == org.name, User.role == UserRole.ADMIN).first()
        
        plan_code = getattr(sub, 'plan_code', None) if sub else None
        max_users = getattr(sub, 'max_users', None) if sub else None
        
        if sub and not plan_code and getattr(sub, 'plan_id', None):
            plan = db.query(Plan).filter(Plan.id == sub.plan_id).first()
            if plan:
                plan_code = plan.code
                max_users = plan.max_users
                
        result.append({
            "id": org.id,
            "name": org.name,
            "company_type": org.company_type,
            "city": org.city or "Mumbai",
            "state": org.state or "Maharashtra",
            "is_active": org.is_active,
            "admin_name": admin_user.name if admin_user else "System Admin",
            "admin_email": admin_user.email if admin_user else "N/A",
            "subscription_status": sub.status if sub else "Trial",
            "plan_code": plan_code or "professional",
            "seats_limit": max_users or 15,
            "created_at": org.created_at.strftime("%Y-%m-%d") if getattr(org, 'created_at', None) else "2026-01-01"
        })
    return result

@router.get("/admins")
def list_tenant_admins(
    db: Session = Depends(get_db),
    admin: User = Depends(check_superadmin_access)
):
    admins = db.query(User).filter(User.role.in_([UserRole.ADMIN, UserRole.SUPERADMIN])).all()
    result = []
    for u in admins:
        org = None
        if u.firm_name:
            org = db.query(Organization).filter(Organization.name == u.firm_name).first()
        if not org and u.organization_id:
            org = db.query(Organization).filter(Organization.id == u.organization_id).first()
            
        sub = db.query(Subscription).filter(Subscription.organization_id == org.id).first() if org else None
        
        team_seats_used = db.query(User).filter(User.firm_name == u.firm_name).count() if u.firm_name else 1
        total_leads = db.query(Lead).count() if u.role == UserRole.ADMIN else 0
        
        plan_code = getattr(sub, 'plan_code', None) if sub else None
        seats_limit = getattr(sub, 'max_users', None) if sub else None
        max_leads = getattr(sub, 'max_leads', None) if sub else None
        
        if sub and not plan_code and getattr(sub, 'plan_id', None):
            plan = db.query(Plan).filter(Plan.id == sub.plan_id).first()
            if plan:
                plan_code = plan.code
                seats_limit = plan.max_users
                max_leads = plan.max_leads

        seats_limit = seats_limit or 15
        max_leads = max_leads or 5000
        has_reached_quota = team_seats_used >= seats_limit
        
        result.append({
            "id": u.id,
            "name": u.name,
            "email": u.email,
            "phone": u.phone or "N/A",
            "firm_name": u.firm_name or "REALVION Platform",
            "role": u.role.value if hasattr(u.role, 'value') else u.role,
            "is_active": u.is_active,
            "plan_name": (plan_code or "ENTERPRISE").upper(),
            "team_seats_used": team_seats_used,
            "seats_limit": seats_limit,
            "total_leads": total_leads,
            "max_leads": max_leads,
            "has_reached_quota": has_reached_quota,
            "created_at": u.created_at.strftime("%Y-%m-%d") if getattr(u, 'created_at', None) else "2026-01-01"
        })
    return result

from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks

@router.post("/create-tenant")
def create_offline_tenant(
    req: CreateOfflineTenantRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    admin: User = Depends(check_superadmin_access)
):

    existing_user = db.query(User).filter(User.email == req.admin_email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="An account with this email address already exists.")

    # 1. Create Organization
    now = datetime.now(timezone.utc)
    base_slug = req.company_name.lower().strip().replace(" ", "-")
    import re
    cleaned_slug = re.sub(r'[^a-z0-9\-]', '', base_slug) or "org"
    unique_slug = f"{cleaned_slug}-{int(now.timestamp())}"
    
    org = Organization(
        name=req.company_name,
        slug=unique_slug,
        company_type=req.company_type,
        city=req.city,
        state=req.state,
        is_active=True
    )
    db.add(org)
    db.commit()
    db.refresh(org)

    # 2. Create Workspace
    workspace = Workspace(
        organization_id=org.id,
        name=f"{req.company_name} Main Workspace",
        is_demo=False
    )
    db.add(workspace)
    db.commit()
    db.refresh(workspace)

    # 3. Create Admin User
    admin_user = User(
        organization_id=org.id,
        name=req.admin_name,
        email=req.admin_email,
        phone=req.admin_phone,
        hashed_password=get_password_hash(req.admin_password),
        role=UserRole.ADMIN,
        firm_name=req.company_name,
        is_active=True
    )
    db.add(admin_user)
    db.commit()
    db.refresh(admin_user)

    # 4. Create Subscription
    now = datetime.now(timezone.utc)
    sub = Subscription(
        organization_id=org.id,
        plan_code=req.plan_code,
        status="Active",
        start_date=now,
        end_date=now + timedelta(days=365),
        max_users=req.seats_limit,
        max_leads=10000
    )
    db.add(sub)
    db.commit()

    # 5. Log Payment record (Offline Cash / Manual Sales Override)
    pay = Payment(
        organization_id=org.id,
        workspace_id=workspace.id,
        subscription_id=sub.id,
        razorpay_order_id=f"order_offline_{int(now.timestamp())}",
        razorpay_payment_id=f"pay_offline_{int(now.timestamp())}",
        amount=4999.0 if req.plan_code == "professional" else 14999.0,
        platform_fee=499.0,
        gst_amount=989.64,
        total_amount=6487.64,
        status="Captured",
        payment_method=req.payment_method
    )
    db.add(pay)
    db.commit()

    # 6. Dispatch Welcome Credentials Email
    login_url = "https://web-based-crm-1.onrender.com/login"
    background_tasks.add_task(send_welcome_credentials_email, req.admin_email, req.admin_name, req.admin_password, login_url)

    return {
        "success": True,
        "message": f"Tenant '{req.company_name}' and Admin '{req.admin_name}' provisioned successfully via {req.payment_method}.",
        "admin_email": req.admin_email,
        "organization_id": org.id
    }


@router.post("/admins/{user_id}/reset-password")
def reset_admin_password(
    user_id: int,
    new_password: str = "Admin@123",
    db: Session = Depends(get_db),
    admin: User = Depends(check_superadmin_access)
):
    target_user = db.query(User).filter(User.id == user_id).first()
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")
        
    target_user.hashed_password = get_password_hash(new_password)
    db.commit()
    return {"success": True, "message": f"Password for {target_user.name} ({target_user.email}) reset successfully to '{new_password}'."}

@router.post("/organizations/{org_id}/suspend")
def toggle_suspend_organization(
    org_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(check_superadmin_access)
):
    org = db.query(Organization).filter(Organization.id == org_id).first()
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")
        
    org.is_active = not org.is_active
    db.commit()
    
    status_str = "activated" if org.is_active else "suspended"
    return {"success": True, "message": f"Organization {org.name} has been {status_str}."}

@router.delete("/organizations/{org_id}")
def delete_organization(
    org_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(check_superadmin_access)
):
    org = db.query(Organization).filter(Organization.id == org_id).first()
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")
        
    org.is_deleted = True
    org.is_active = False
    db.commit()
    
    return {"success": True, "message": f"Organization {org.name} deleted successfully."}


# ─── NEW: Upgrade Plan ───────────────────────────────────────────────────────

@router.post("/admins/{user_id}/upgrade-plan")
def upgrade_admin_plan(
    user_id: int,
    req: UpgradePlanRequest,
    db: Session = Depends(get_db),
    admin: User = Depends(check_superadmin_access)
):
    """Change a tenant admin's plan code, seat/lead quota, and renew subscription."""
    target_user = db.query(User).filter(User.id == user_id).first()
    if not target_user:
        raise HTTPException(status_code=404, detail="Admin user not found.")

    # Find their org
    org = None
    if target_user.organization_id:
        org = db.query(Organization).filter(Organization.id == target_user.organization_id).first()
    if not org and target_user.firm_name:
        org = db.query(Organization).filter(
            Organization.name == target_user.firm_name
        ).first()

    if not org:
        raise HTTPException(status_code=404, detail="No organization found for this admin.")

    now = datetime.now(timezone.utc)
    sub = db.query(Subscription).filter(
        Subscription.organization_id == org.id
    ).order_by(Subscription.id.desc()).first()

    if sub:
        sub.plan_code = req.plan_code
        sub.status = "Active"
        sub.max_users = req.seats_limit
        sub.max_leads = req.max_leads
        sub.end_date = now + timedelta(days=req.extend_days)
    else:
        sub = Subscription(
            organization_id=org.id,
            plan_code=req.plan_code,
            status="Active",
            start_date=now,
            end_date=now + timedelta(days=req.extend_days),
            max_users=req.seats_limit,
            max_leads=req.max_leads,
            auto_renew=True
        )
        db.add(sub)

    org.is_active = True
    db.commit()

    return {
        "success": True,
        "message": f"Plan for '{target_user.name}' ({target_user.email}) upgraded to '{req.plan_code.upper()}' — {req.seats_limit} seats, {req.max_leads} leads, valid for {req.extend_days} days.",
        "plan_code": req.plan_code,
        "seats_limit": req.seats_limit,
        "max_leads": req.max_leads,
        "end_date": (now + timedelta(days=req.extend_days)).isoformat()
    }


# ─── NEW: Extend Subscription ─────────────────────────────────────────────────

@router.post("/admins/{user_id}/extend-subscription")
def extend_admin_subscription(
    user_id: int,
    req: ExtendSubscriptionRequest,
    db: Session = Depends(get_db),
    admin: User = Depends(check_superadmin_access)
):
    """Add N days to a tenant admin's subscription end_date."""
    target_user = db.query(User).filter(User.id == user_id).first()
    if not target_user:
        raise HTTPException(status_code=404, detail="Admin user not found.")

    org = None
    if target_user.organization_id:
        org = db.query(Organization).filter(Organization.id == target_user.organization_id).first()
    if not org and target_user.firm_name:
        org = db.query(Organization).filter(Organization.name == target_user.firm_name).first()

    if not org:
        raise HTTPException(status_code=404, detail="No organization found for this admin.")

    sub = db.query(Subscription).filter(
        Subscription.organization_id == org.id
    ).order_by(Subscription.id.desc()).first()

    if not sub:
        raise HTTPException(status_code=404, detail="No subscription found. Use upgrade-plan to create one.")

    now = datetime.now(timezone.utc)
    base = sub.end_date if sub.end_date and sub.end_date > now.replace(tzinfo=None) else now.replace(tzinfo=None)
    sub.end_date = base + timedelta(days=req.extend_days)
    sub.status = "Active"
    org.is_active = True
    db.commit()

    return {
        "success": True,
        "message": f"Subscription for '{target_user.name}' extended by {req.extend_days} days. New end date: {sub.end_date.strftime('%Y-%m-%d')}.",
        "new_end_date": sub.end_date.isoformat()
    }


# ─── NEW: Recent Payments ─────────────────────────────────────────────────────

@router.get("/recent-payments")
def get_recent_payments(
    limit: int = 20,
    db: Session = Depends(get_db),
    admin: User = Depends(check_superadmin_access)
):
    """Latest payments across all tenants with org and admin context."""
    payments = db.query(Payment).order_by(Payment.id.desc()).limit(limit).all()
    result = []
    for p in payments:
        org = db.query(Organization).filter(Organization.id == p.organization_id).first() if p.organization_id else None
        adm = db.query(User).filter(
            User.organization_id == p.organization_id,
            User.role == UserRole.ADMIN
        ).first() if p.organization_id else None
        result.append({
            "id": p.id,
            "payment_id": getattr(p, 'razorpay_payment_id', None) or f"PAY-{p.id}",
            "order_id": getattr(p, 'razorpay_order_id', None) or f"ORD-{p.id}",
            "org_name": org.name if org else "Unknown",
            "admin_name": adm.name if adm else "N/A",
            "admin_email": adm.email if adm else "N/A",
            "amount": p.amount,
            "total_amount": p.total_amount,
            "status": p.status,
            "payment_method": getattr(p, 'payment_method', 'Razorpay'),
            "created_at": p.created_at.strftime("%Y-%m-%d %H:%M") if getattr(p, 'created_at', None) else "N/A"
        })
    return result

