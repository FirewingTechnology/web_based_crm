import random
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import or_
from app.database import get_db
from app.models.booking import Booking, BookingStatus
from app.models.commission import Commission, PayoutStatus
from app.models.lead import Lead, LeadStatus
from app.models.project import Project
from app.models.builder import Builder
from app.models.broker import BrokerProfile
from app.models.user import User, UserRole
from app.models.sales_target import SalesTarget
from app.models.activity_log import ActivityLog
from app.schemas.booking import BookingCreate, BookingUpdate, BookingResponse, CommissionResponse
from app.middleware.auth_middleware import get_current_user

router = APIRouter(prefix="/bookings", tags=["Bookings"])

def format_booking_response(b: Booking) -> BookingResponse:
    res = BookingResponse.model_validate(b)
    res.builder_name = b.builder.name if b.builder else "Unknown"
    res.project_name = b.project.name if b.project else "Unknown"
    res.lead_name = b.lead.name if b.lead else "Unknown"
    res.executive_name = b.assigned_executive.name if b.assigned_executive else "Unknown"
    res.broker_name = b.broker.firm_name if b.broker else None
    
    if b.commission:
        res.commission = CommissionResponse.model_validate(b.commission)
    return res

@router.get("", response_model=list[BookingResponse])
def get_bookings(
    status: BookingStatus | None = None,
    assigned_executive_id: int | None = None,
    my_bookings_only: bool = False,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Auto-sync any existing leads marked as Booked for this organization that don't have a Booking record
    booked_leads_query = db.query(Lead).filter(Lead.status == LeadStatus.BOOKED, Lead.is_deleted == False)
    if current_user.role != UserRole.SUPERADMIN and current_user.organization_id:
        booked_leads_query = booked_leads_query.filter(Lead.organization_id == current_user.organization_id)
    booked_leads = booked_leads_query.all()
    for lead in booked_leads:
        existing = db.query(Booking).filter(Booking.lead_id == lead.id, Booking.is_deleted == False).first()
        if not existing:
            project = None
            if lead.preferred_project_id:
                project = db.query(Project).filter(Project.id == lead.preferred_project_id, Project.is_deleted == False).first()
            if not project:
                p_query = db.query(Project).filter(Project.is_deleted == False)
                if current_user.organization_id:
                    p_query = p_query.filter(
                        (Project.organization_id == current_user.organization_id) | (Project.organization_id.is_(None))
                    )
                project = p_query.first()

            if project:
                builder = project.builder
                raw_budget = lead.budget_max or lead.budget_min
                if raw_budget:
                    # Convert budget from Lakhs to INR (e.g. 30 -> 30,00,000 INR)
                    deal_val = float(raw_budget * 100000.0) if raw_budget <= 1000.0 else float(raw_budget)
                else:
                    # Fallback to project pricing in Lakhs converted to INR
                    proj_lakhs = project.max_price or project.min_price or 50.0
                    deal_val = float(proj_lakhs * 100000.0) if proj_lakhs <= 1000.0 else float(proj_lakhs)

                booking_amt = round(deal_val * 0.05) # 5% token booking amount
                booking_num = f"BK-{datetime.now().year}-{random.randint(1000, 9999)}"
                exec_id = lead.assigned_to_id or current_user.id

                unit_label = f"Unit {random.randint(101, 1509)}"
                if lead.preferred_configuration:
                    unit_label = f"{lead.preferred_configuration} - {unit_label}"

                booking = Booking(
                    organization_id=lead.organization_id or current_user.organization_id,
                    booking_number=booking_num,
                    lead_id=lead.id,
                    project_id=project.id,
                    builder_id=builder.id,
                    assigned_executive_id=exec_id,
                    unit_number=unit_label,
                    booking_amount=booking_amt,
                    total_deal_value=deal_val,
                    status=BookingStatus.CONFIRMED,
                    notes=f"Auto-created booking matched with customer budget (₹{deal_val/100000:.2f} Lakhs)"
                )
                db.add(booking)
                db.flush()

                builder_rate = builder.commission_rate if builder else 3.5
                builder_comm = deal_val * (builder_rate / 100.0)
                exec_rate = 0.5
                exec_comm = deal_val * (exec_rate / 100.0)
                company_margin = builder_comm - exec_comm

                commission = Commission(
                    organization_id=lead.organization_id or current_user.organization_id,
                    booking_id=booking.id,
                    builder_commission_rate=builder_rate,
                    builder_commission_amount=builder_comm,
                    executive_commission_rate=exec_rate,
                    executive_commission_amount=exec_comm,
                    company_margin_amount=company_margin,
                    payout_status=PayoutStatus.PENDING
                )
                db.add(commission)
                db.commit()

    query = db.query(Booking).filter(Booking.is_deleted == False)

    if current_user.role != UserRole.SUPERADMIN and current_user.organization_id:
        query = query.filter(Booking.organization_id == current_user.organization_id)

    if my_bookings_only or current_user.role == UserRole.SALES_EXECUTIVE:
        query = query.filter(Booking.assigned_executive_id == current_user.id)
    elif current_user.role == UserRole.BROKER:
        # Check broker profile id
        broker_prof = db.query(BrokerProfile).filter(BrokerProfile.user_id == current_user.id).first()
        if broker_prof:
            query = query.filter(Booking.broker_id == broker_prof.id)
        else:
            query = query.filter(Booking.id == -1)
    elif assigned_executive_id:
        query = query.filter(Booking.assigned_executive_id == assigned_executive_id)

    if status:
        query = query.filter(Booking.status == status)

    bookings = query.order_by(Booking.booking_date.desc()).all()
    return [format_booking_response(b) for b in bookings]

@router.get("/{booking_id}", response_model=BookingResponse)
def get_booking(booking_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    query = db.query(Booking).filter(Booking.id == booking_id, Booking.is_deleted == False)
    if current_user.role != UserRole.SUPERADMIN and current_user.organization_id:
        query = query.filter(Booking.organization_id == current_user.organization_id)
    booking = query.first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    return format_booking_response(booking)


@router.post("", response_model=BookingResponse, status_code=status.HTTP_201_CREATED)
def create_booking(
    booking_in: BookingCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    lead = db.query(Lead).filter(Lead.id == booking_in.lead_id, Lead.is_deleted == False).first()
    if not lead:
        raise HTTPException(status_code=404, detail="Selected lead does not exist")

    project = db.query(Project).filter(Project.id == booking_in.project_id, Project.is_deleted == False).first()
    if not project:
        raise HTTPException(status_code=404, detail="Selected project does not exist")

    builder = project.builder

    # Auto-normalize deal value & booking amount if entered in Lakhs (e.g. 30 -> 30,00,000 INR)
    deal_val = float(booking_in.total_deal_value)
    if deal_val <= 1000.0:
        deal_val = deal_val * 100000.0

    booking_amt = float(booking_in.booking_amount)
    if booking_amt <= 100.0:
        booking_amt = booking_amt * 100000.0

    # Generate Booking Number e.g. BK-2026-8941
    booking_num = f"BK-{datetime.now().year}-{random.randint(1000, 9999)}"

    booking = Booking(
        organization_id=lead.organization_id or current_user.organization_id,
        booking_number=booking_num,
        lead_id=booking_in.lead_id,
        project_id=booking_in.project_id,
        builder_id=builder.id,
        assigned_executive_id=booking_in.assigned_executive_id,
        broker_id=booking_in.broker_id,
        unit_number=booking_in.unit_number,
        booking_amount=booking_amt,
        total_deal_value=deal_val,
        status=BookingStatus.CONFIRMED,
        notes=booking_in.notes
    )
    db.add(booking)
    db.flush()

    # Automatically Update Lead status to Booked
    lead.status = LeadStatus.BOOKED

    # Calculate Commission Split
    builder_rate = builder.commission_rate if builder else 3.0
    builder_comm = deal_val * (builder_rate / 100.0)

    exec_rate = 0.5
    exec_comm = deal_val * (exec_rate / 100.0)

    broker_rate = 0.0
    broker_comm = 0.0
    if booking_in.broker_id:
        broker_prof = db.query(BrokerProfile).filter(BrokerProfile.id == booking_in.broker_id).first()
        if broker_prof:
            broker_rate = broker_prof.commission_rate
            broker_comm = deal_val * (broker_rate / 100.0)
            broker_prof.total_deals += 1
            broker_prof.total_revenue_generated += deal_val

    company_margin = builder_comm - exec_comm - broker_comm

    commission = Commission(
        booking_id=booking.id,
        builder_commission_rate=builder_rate,
        builder_commission_amount=builder_comm,
        executive_commission_rate=exec_rate,
        executive_commission_amount=exec_comm,
        broker_commission_rate=broker_rate,
        broker_commission_amount=broker_comm,
        company_margin_amount=company_margin,
        payout_status=PayoutStatus.PENDING
    )
    db.add(commission)

    # Update Sales Target for Executive
    current_month_str = datetime.now().strftime("%Y-%m")
    target = db.query(SalesTarget).filter(
        SalesTarget.user_id == booking_in.assigned_executive_id,
        SalesTarget.month_year == current_month_str,
        SalesTarget.is_deleted == False
    ).first()

    if target:
        deal_val_lakhs = (booking_in.total_deal_value / 100000.0) if booking_in.total_deal_value > 10000 else booking_in.total_deal_value
        target.achieved_amount += deal_val_lakhs
        target.achieved_bookings += 1

    # Audit log
    db.add(ActivityLog(
        user_id=current_user.id,
        user_name=current_user.name,
        action="CREATE_BOOKING",
        module="Bookings",
        details=f"Created booking '{booking_num}' for Lead '{lead.name}' - Unit {booking.unit_number}"
    ))

    db.commit()
    db.refresh(booking)
    return format_booking_response(booking)

@router.put("/{booking_id}", response_model=BookingResponse)
def update_booking(
    booking_id: int,
    booking_in: BookingUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    booking = db.query(Booking).filter(Booking.id == booking_id, Booking.is_deleted == False).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")

    for field, value in booking_in.model_dump(exclude_unset=True).items():
        setattr(booking, field, value)

    db.commit()
    db.refresh(booking)
    return format_booking_response(booking)
