from datetime import datetime, timezone, timedelta
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.database import get_db
from app.models.lead import Lead, LeadStatus
from app.models.booking import Booking, BookingStatus
from app.models.commission import Commission
from app.models.followup import Followup, FollowupStatus
from app.models.builder import Builder
from app.models.project import Project
from app.models.user import User, UserRole
from app.schemas.report import DashboardStats, MonthlySalesChart, LeadSourceDistribution, LeadStatusDistribution
from app.middleware.auth_middleware import get_current_user
from app.utils.csv_utils import generate_csv_response

router = APIRouter(prefix="/reports", tags=["Reports & Analytics"])

@router.get("/dashboard-stats", response_model=DashboardStats)
def get_dashboard_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    now = datetime.now(timezone.utc)
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)

    # Leads query
    lead_query = db.query(Lead).filter(Lead.is_deleted == False)
    booking_query = db.query(Booking).filter(Booking.is_deleted == False)
    followup_query = db.query(Followup).filter(Followup.is_deleted == False)

    if current_user.role == UserRole.SALES_EXECUTIVE:
        lead_query = lead_query.filter(Lead.assigned_to_id == current_user.id)
        booking_query = booking_query.filter(Booking.assigned_executive_id == current_user.id)
        followup_query = followup_query.filter(Followup.assigned_to_id == current_user.id)

    total_leads = lead_query.count()
    new_leads_today = lead_query.filter(Lead.created_at >= today_start).count()

    total_bookings = booking_query.count()
    
    # Calculate pipeline valuation (sum of budget_max of active leads)
    active_leads = lead_query.filter(Lead.status.notin_([LeadStatus.BOOKED, LeadStatus.LOST])).all()
    pipeline_val = sum([(l.budget_max or l.budget_min or 50.0) for l in active_leads])

    # Total revenue generated from bookings
    bookings = booking_query.all()
    total_rev = sum([b.total_deal_value for b in bookings])

    # Total commission earned by company
    commissions = db.query(Commission).filter(Commission.is_deleted == False).all()
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
    # Group bookings by month for past 6 months
    results = []
    now = datetime.now()
    for i in range(5, -1, -1):
        month_dt = now - timedelta(days=i*30)
        m_str = month_dt.strftime("%b %Y")
        
        # Filter for this month
        b_list = db.query(Booking).filter(
            Booking.is_deleted == False,
            func.strftime("%Y-%m", Booking.booking_date) == month_dt.strftime("%Y-%m")
        ).all()
        
        rev = sum([b.total_deal_value for b in b_list])
        results.append(MonthlySalesChart(month=m_str, revenue=rev, bookings_count=len(b_list)))
    return results

@router.get("/lead-sources", response_model=list[LeadSourceDistribution])
def get_lead_sources_distribution(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    results = db.query(Lead.source, func.count(Lead.id)).filter(Lead.is_deleted == False).group_by(Lead.source).all()
    return [LeadSourceDistribution(source=r[0] or "Direct", count=r[1]) for r in results]

@router.get("/lead-statuses", response_model=list[LeadStatusDistribution])
def get_lead_statuses_distribution(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    results = db.query(Lead.status, func.count(Lead.id)).filter(Lead.is_deleted == False).group_by(Lead.status).all()
    return [LeadStatusDistribution(status=r[0].value, count=r[1]) for r in results]

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
