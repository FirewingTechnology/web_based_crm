from datetime import datetime, timezone, timedelta
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.database import get_db
from app.models.site_visit import SiteVisit, SiteVisitStatus
from app.models.commission import Commission, CommissionStage
from app.models.lead import Lead, LeadStatus, LeadPriority
from app.models.booking import Booking, BookingStatus
from app.models.followup import Followup, FollowupStatus
from app.models.builder import Builder
from app.models.project import Project
from app.models.user import User, UserRole
from app.schemas.report import DashboardStats, MonthlySalesChart, LeadSourceDistribution, LeadStatusDistribution
from app.schemas.revenue_analytics import RevenueAnalyticsResponse
from app.services.revenue_analytics_service import RevenueAnalyticsService
from app.middleware.auth_middleware import get_current_user
from app.utils.csv_utils import generate_csv_response

router = APIRouter(prefix="/reports", tags=["Reports & Analytics"])

@router.get("/revenue-funnel", response_model=RevenueAnalyticsResponse)
def get_revenue_funnel_analytics(
    time_period: str = "All Time",
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Returns end-to-end sales funnel conversion metrics, stage-by-stage drop-off leakage, and marketing source attribution.
    """
    return RevenueAnalyticsService.get_revenue_funnel_analytics(db, current_user, time_period=time_period)

@router.get("/dashboard-stats", response_model=DashboardStats)
def get_dashboard_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    now = datetime.now(timezone.utc)
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)

    # Leads, Bookings, Followups queries with tenant & role scoping
    lead_query = db.query(Lead).filter(Lead.is_deleted == False)
    booking_query = db.query(Booking).filter(Booking.is_deleted == False)
    followup_query = db.query(Followup).filter(Followup.is_deleted == False)

    if current_user.role != UserRole.SUPERADMIN and current_user.organization_id:
        lead_query = lead_query.filter(Lead.organization_id == current_user.organization_id)
        booking_query = booking_query.filter(Booking.organization_id == current_user.organization_id)
        followup_query = followup_query.filter(Followup.organization_id == current_user.organization_id)

    if current_user.role == UserRole.SALES_EXECUTIVE:
        lead_query = lead_query.filter(Lead.assigned_to_id == current_user.id)
        booking_query = booking_query.filter(Booking.assigned_executive_id == current_user.id)
        followup_query = followup_query.filter(Followup.assigned_to_id == current_user.id)

    total_leads = lead_query.count()
    new_leads_today = lead_query.filter(Lead.created_at >= today_start).count()
    total_bookings = booking_query.count()
    
    # Calculate pipeline valuation (sum of budget_max of active leads)
    active_leads = lead_query.filter(Lead.status.notin_([LeadStatus.BOOKED, LeadStatus.LOST])).all()
    pipeline_val = sum([(l.budget_max or l.budget_min or 0.0) for l in active_leads])

    # Total revenue generated from bookings
    bookings = booking_query.all()
    total_rev = sum([b.total_deal_value for b in bookings])

    # Total commission earned
    booking_ids = [b.id for b in bookings]
    commissions = db.query(Commission).filter(Commission.booking_id.in_(booking_ids), Commission.is_deleted == False).all() if booking_ids else []
    total_comm = sum([c.company_margin_amount for c in commissions])

    pending_followups = followup_query.filter(Followup.status == FollowupStatus.PENDING).count()
    overdue_followups = followup_query.filter(Followup.status == FollowupStatus.OVERDUE).count()

    return DashboardStats(
        total_leads=total_leads,
        new_leads_today=new_leads_today,
        total_bookings=total_bookings,
        total_pipeline_value=pipeline_val,
        total_revenue_generated=total_rev,
        total_commission_earned=total_comm,
        pending_followups_count=pending_followups,
        overdue_followups_count=overdue_followups
    )

@router.get("/monthly-sales", response_model=list[MonthlySalesChart])
def get_monthly_sales_chart(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    results = []
    now = datetime.now()
    for i in range(5, -1, -1):
        month_dt = now - timedelta(days=i*30)
        m_str = month_dt.strftime("%b %Y")
        
        year = month_dt.year
        month = month_dt.month
        start_of_month = datetime(year, month, 1, 0, 0, 0)
        if month == 12:
            start_of_next_month = datetime(year + 1, 1, 1, 0, 0, 0)
        else:
            start_of_next_month = datetime(year, month + 1, 1, 0, 0, 0)

        q = db.query(Booking).filter(
            Booking.is_deleted == False,
            Booking.booking_date >= start_of_month,
            Booking.booking_date < start_of_next_month
        )
        if current_user.role != UserRole.SUPERADMIN and current_user.organization_id:
            q = q.filter(Booking.organization_id == current_user.organization_id)
        if current_user.role == UserRole.SALES_EXECUTIVE:
            q = q.filter(Booking.assigned_executive_id == current_user.id)

        b_list = q.all()
        rev = sum([b.total_deal_value for b in b_list])
        results.append(MonthlySalesChart(month=m_str, revenue=rev, bookings_count=len(b_list)))
    return results

@router.get("/lead-sources", response_model=list[LeadSourceDistribution])
def get_lead_sources_distribution(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    q = db.query(Lead.source, func.count(Lead.id)).filter(Lead.is_deleted == False)
    if current_user.role != UserRole.SUPERADMIN and current_user.organization_id:
        q = q.filter(Lead.organization_id == current_user.organization_id)
    if current_user.role == UserRole.SALES_EXECUTIVE:
        q = q.filter(Lead.assigned_to_id == current_user.id)
    results = q.group_by(Lead.source).all()
    return [LeadSourceDistribution(source=r[0] or "Direct", count=r[1]) for r in results]

@router.get("/lead-statuses", response_model=list[LeadStatusDistribution])
def get_lead_statuses_distribution(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    q = db.query(Lead.status, func.count(Lead.id)).filter(Lead.is_deleted == False)
    if current_user.role != UserRole.SUPERADMIN and current_user.organization_id:
        q = q.filter(Lead.organization_id == current_user.organization_id)
    if current_user.role == UserRole.SALES_EXECUTIVE:
        q = q.filter(Lead.assigned_to_id == current_user.id)
    results = q.group_by(Lead.status).all()
    return [LeadStatusDistribution(status=r[0].value if hasattr(r[0], 'value') else str(r[0]), count=r[1]) for r in results]

@router.get("/export/{report_type}")
def export_report_csv(report_type: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if report_type == "bookings":
        bookings = db.query(Booking).filter(Booking.is_deleted == False).all()
        fieldnames = ["Booking Number", "Date", "Lead", "Project", "Builder", "Executive", "Unit Number", "Deal Value (INR)", "Token Amount (INR)", "Status"]
        rows = [{
            "Booking Number": b.booking_number,
            "Date": b.booking_date.strftime("%Y-%m-%d"),
            "Lead": b.lead.name if b.lead else "",
            "Project": b.project.name if b.project else "",
            "Builder": b.builder.name if b.builder else "",
            "Executive": b.assigned_executive.name if b.assigned_executive else "",
            "Unit Number": b.unit_number,
            "Deal Value (INR)": b.total_deal_value,
            "Token Amount (INR)": b.booking_amount,
            "Status": b.status.value
        } for b in bookings]
        return generate_csv_response("bookings_report.csv", fieldnames, rows)

    elif report_type == "commissions":
        commissions = db.query(Commission).filter(Commission.is_deleted == False).all()
        fieldnames = ["Booking Number", "Project", "Builder Comm %", "Builder Comm (INR)", "Executive Comm %", "Executive Comm (INR)", "Company Margin (INR)", "Payout Status"]
        rows = [{
            "Booking Number": c.booking.booking_number,
            "Project": c.booking.project.name if c.booking.project else "",
            "Builder Comm %": c.builder_commission_rate,
            "Builder Comm (INR)": c.builder_commission_amount,
            "Executive Comm %": c.executive_commission_rate,
            "Executive Comm (INR)": c.executive_commission_amount,
            "Company Margin (INR)": c.company_margin_amount,
            "Payout Status": c.payout_status.value
        } for c in commissions]
        return generate_csv_response("commissions_report.csv", fieldnames, rows)

    elif report_type == "builders":
        builders = db.query(Builder).filter(Builder.is_deleted == False).all()
        fieldnames = ["Builder Name", "Company", "Contact Person", "Phone", "Email", "Commission Rate %", "Projects Count"]
        rows = [{
            "Builder Name": b.name,
            "Company": b.company,
            "Contact Person": b.contact_person,
            "Phone": b.phone,
            "Email": b.email,
            "Commission Rate %": b.commission_rate,
            "Projects Count": len([p for p in b.projects if not p.is_deleted])
        } for b in builders]
        return generate_csv_response("builders_report.csv", fieldnames, rows)

    else:
        raise HTTPException(status_code=400, detail="Invalid report type specified")


@router.get("/revenue-attribution")
def get_revenue_attribution_report(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Computes end-to-end source-to-revenue attribution:
    Ingestion source & campaign -> Leads -> Site Visits -> Bookings -> Closed Deal Value & Margin.
    """
    lead_q = db.query(Lead).filter(Lead.is_deleted == False)
    if current_user.role != UserRole.SUPERADMIN and current_user.organization_id:
        lead_q = lead_q.filter(Lead.organization_id == current_user.organization_id)
    if current_user.role == UserRole.SALES_EXECUTIVE:
        lead_q = lead_q.filter(Lead.assigned_to_id == current_user.id)

    leads = lead_q.all()
    lead_ids = [l.id for l in leads]

    # Site visits for these leads
    site_visits = db.query(SiteVisit).filter(SiteVisit.lead_id.in_(lead_ids), SiteVisit.is_deleted == False).all() if lead_ids else []
    visit_lead_ids = set(v.lead_id for v in site_visits)

    # Bookings for these leads
    bookings = db.query(Booking).filter(Booking.lead_id.in_(lead_ids), Booking.is_deleted == False).all() if lead_ids else []
    booking_map = {b.lead_id: b for b in bookings}

    # Commissions for these bookings
    booking_ids = [b.id for b in bookings]
    commissions = db.query(Commission).filter(Commission.booking_id.in_(booking_ids), Commission.is_deleted == False).all() if booking_ids else []
    comm_map = {}
    for c in commissions:
        comm_map[c.booking_id] = comm_map.get(c.booking_id, 0.0) + float(c.company_margin_amount or 0.0)

    # Aggregate by source
    source_stats = {}
    campaign_stats = {}

    for lead in leads:
        src = (lead.source or "Other").strip()
        cmp = (lead.campaign_name or "Direct / Unassigned").strip()

        if src not in source_stats:
            source_stats[src] = {
                "source": src,
                "leads": 0,
                "site_visits": 0,
                "bookings": 0,
                "deal_value": 0.0,
                "revenue": 0.0
            }
        source_stats[src]["leads"] += 1
        if lead.id in visit_lead_ids:
            source_stats[src]["site_visits"] += 1
        if lead.id in booking_map:
            b = booking_map[lead.id]
            source_stats[src]["bookings"] += 1
            source_stats[src]["deal_value"] += float(b.total_deal_value or 0.0)
            source_stats[src]["revenue"] += comm_map.get(b.id, 0.0)

        if cmp not in campaign_stats:
            campaign_stats[cmp] = {
                "campaign": cmp,
                "source": src,
                "leads": 0,
                "site_visits": 0,
                "bookings": 0,
                "deal_value": 0.0,
                "revenue": 0.0
            }
        campaign_stats[cmp]["leads"] += 1
        if lead.id in visit_lead_ids:
            campaign_stats[cmp]["site_visits"] += 1
        if lead.id in booking_map:
            b = booking_map[lead.id]
            campaign_stats[cmp]["bookings"] += 1
            campaign_stats[cmp]["deal_value"] += float(b.total_deal_value or 0.0)
            campaign_stats[cmp]["revenue"] += comm_map.get(b.id, 0.0)

    # Compute conversion rates
    sources_list = []
    for s in source_stats.values():
        s["conversion_rate"] = round((s["bookings"] / s["leads"] * 100), 2) if s["leads"] > 0 else 0.0
        s["avg_deal_value"] = round((s["deal_value"] / s["bookings"]), 2) if s["bookings"] > 0 else 0.0
        sources_list.append(s)

    campaigns_list = []
    for c in campaign_stats.values():
        c["conversion_rate"] = round((c["bookings"] / c["leads"] * 100), 2) if c["leads"] > 0 else 0.0
        campaigns_list.append(c)

    sources_list.sort(key=lambda x: x["revenue"], reverse=True)
    campaigns_list.sort(key=lambda x: x["revenue"], reverse=True)

    total_leads = len(leads)
    total_deal_value = sum(s["deal_value"] for s in sources_list)
    total_revenue = sum(s["revenue"] for s in sources_list)
    total_bookings = sum(s["bookings"] for s in sources_list)

    return {
        "summary": {
            "total_leads": total_leads,
            "total_bookings": total_bookings,
            "overall_conversion_rate": round((total_bookings / total_leads * 100), 2) if total_leads > 0 else 0.0,
            "total_deal_value": total_deal_value,
            "total_realized_revenue": total_revenue
        },
        "sources": sources_list,
        "campaigns": campaigns_list[:15]
    }


@router.get("/business-today")
def get_business_today_command_center(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Executive & Management "Business Today" command center.
    Surfaces active pipeline, at-risk revenue, site visits, SLA breaches, and prioritized action items.
    """
    from app.models.call import CallRecord

    now = datetime.now(timezone.utc)
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    today_end = today_start + timedelta(days=1)

    lead_q = db.query(Lead).filter(Lead.is_deleted == False)
    visit_q = db.query(SiteVisit).filter(SiteVisit.is_deleted == False)
    comm_q = db.query(Commission).filter(Commission.is_deleted == False)
    call_q = db.query(CallRecord)

    if current_user.role != UserRole.SUPERADMIN and current_user.organization_id:
        lead_q = lead_q.filter(Lead.organization_id == current_user.organization_id)
        visit_q = visit_q.filter(SiteVisit.organization_id == current_user.organization_id)
        comm_q = comm_q.filter(Commission.organization_id == current_user.organization_id)
        call_q = call_q.filter(CallRecord.organization_id == current_user.organization_id)

    if current_user.role == UserRole.SALES_EXECUTIVE:
        lead_q = lead_q.filter(Lead.assigned_to_id == current_user.id)
        visit_q = visit_q.filter(SiteVisit.executive_id == current_user.id)

    # 1. Active pipeline (leads not lost/booked)
    active_leads = lead_q.filter(Lead.status.notin_([LeadStatus.BOOKED, LeadStatus.LOST])).all()
    pipeline_sum = sum(float(l.deal_value or l.budget_max or l.budget_min or 0.0) for l in active_leads)
    active_pipeline_cr = round(pipeline_sum / 10000000.0, 2)  # Convert to Crores

    # 2. At-risk deals (health <= 40 or SLA breached or overdue follow-up)
    at_risk_leads = [
        l for l in active_leads
        if (l.health_score is not None and l.health_score <= 40)
        or l.sla_status == "BREACHED"
        or (l.sla_deadline and l.sla_deadline < now and not l.first_response_at)
    ]
    at_risk_val = sum(float(l.deal_value or l.budget_max or l.budget_min or 0.0) for l in at_risk_leads)
    at_risk_lakhs = round(at_risk_val / 100000.0, 2)  # Convert to Lakhs

    # 3. Site visits today
    visits_today = visit_q.filter(SiteVisit.scheduled_at >= today_start, SiteVisit.scheduled_at < today_end).all()
    visits_verified = sum(1 for v in visits_today if v.geofence_status == "VERIFIED")
    visits_pending = len(visits_today) - visits_verified

    # 4. Pending commissions
    pending_comms = comm_q.filter(Commission.stage != CommissionStage.PAID).all()
    pending_comm_val = sum(float(c.company_margin_amount or 0.0) for c in pending_comms)
    pending_comm_lakhs = round(pending_comm_val / 100000.0, 2)

    # 5. SLA breaches today
    sla_breaches = [
        l for l in active_leads
        if l.sla_status == "BREACHED"
        or (l.sla_deadline and l.sla_deadline < now and not l.first_response_at)
    ]

    # 6. Ingested today & calls today
    leads_today = lead_q.filter(Lead.created_at >= today_start).count()
    calls_today = call_q.filter(CallRecord.created_at >= today_start).count()

    # 7. Urgent action items (top 8 requiring immediate manager attention)
    action_items = []
    for l in at_risk_leads[:5]:
        action_items.append({
            "type": "SLA_OR_AT_RISK",
            "title": f"At-Risk Deal: {l.name}".strip(),
            "lead_id": l.id,
            "phone": l.phone,
            "project": (l.preferred_project.name if l.preferred_project else "General"),
            "budget": f"₹{(l.deal_value or l.budget_max or 0):,.0f}",
            "reason": "SLA Response Breached" if (l.sla_status == "BREACHED" or (l.sla_deadline and l.sla_deadline < now and not l.first_response_at)) else "Low Engagement Health Score",
            "urgency": "HIGH"
        })

    for v in visits_today[:3]:
        action_items.append({
            "type": "SITE_VISIT_TODAY",
            "title": f"Site Visit Today ({v.scheduled_at.strftime('%I:%M %p')})",
            "lead_id": v.lead_id,
            "phone": v.lead.phone if v.lead else "",
            "project": v.project.name if v.project else "General",
            "budget": "Site Visit",
            "reason": f"Geofence: {v.geofence_status or 'PENDING_CHECKIN'}",
            "urgency": "MEDIUM"
        })

    return {
        "date": now.strftime("%A, %d %B %Y"),
        "kpis": {
            "active_pipeline_cr": active_pipeline_cr,
            "at_risk_lakhs": at_risk_lakhs,
            "site_visits_today": len(visits_today),
            "site_visits_verified": visits_verified,
            "site_visits_pending": visits_pending,
            "pending_commissions_lakhs": pending_comm_lakhs,
            "sla_breaches_count": len(sla_breaches),
            "leads_ingested_today": leads_today,
            "calls_logged_today": calls_today
        },
        "urgent_action_items": action_items
    }

