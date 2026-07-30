import random
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.orm import Session
from sqlalchemy import or_
from app.database import get_db
from app.models.lead import Lead, LeadNote, LeadStatusHistory, LeadStatus, LeadPriority
from app.models.user import User, UserRole
from app.models.activity_log import ActivityLog
from app.models.booking import Booking, BookingStatus
from app.models.commission import Commission, PayoutStatus
from app.models.project import Project
from app.models.sales_target import SalesTarget
from app.models.notification import Notification
from app.schemas.lead import LeadCreate, LeadUpdate, LeadResponse, LeadNoteCreate, LeadNoteResponse, LeadStatusHistoryResponse
from app.middleware.auth_middleware import get_current_user
from app.utils.csv_utils import generate_csv_response, parse_leads_csv

router = APIRouter(prefix="/leads", tags=["Leads"])

def format_lead_response(lead: Lead) -> LeadResponse:
    res = LeadResponse.model_validate(lead)
    res.assigned_to_name = lead.assigned_to.name if lead.assigned_to else None
    res.created_by_name = lead.created_by.name if lead.created_by else None
    res.preferred_project_name = lead.preferred_project.name if lead.preferred_project else None
    
    formatted_notes = []
    for n in lead.notes_list:
        n_res = LeadNoteResponse.model_validate(n)
        n_res.author_name = n.author.name if n.author else "Unknown"
        formatted_notes.append(n_res)
    res.notes_list = formatted_notes
    
    formatted_history = []
    for h in lead.history_list:
        h_res = LeadStatusHistoryResponse.model_validate(h)
        h_res.changed_by_name = h.changed_by.name if h.changed_by else "System"
        formatted_history.append(h_res)
    res.history_list = formatted_history
    
    return res

@router.get("", response_model=list[LeadResponse])
def get_leads(
    status: LeadStatus | None = None,
    priority: LeadPriority | None = None,
    source: str | None = None,
    assigned_to_id: int | None = None,
    search: str | None = None,
    my_leads_only: bool = False,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Lead).filter(Lead.is_deleted == False)

    # Role level scoping: Sales Execs / Brokers default to seeing their assigned leads if my_leads_only is True
    if my_leads_only or current_user.role in [UserRole.SALES_EXECUTIVE, UserRole.BROKER]:
        query = query.filter(or_(Lead.assigned_to_id == current_user.id, Lead.created_by_id == current_user.id))
    elif assigned_to_id:
        query = query.filter(Lead.assigned_to_id == assigned_to_id)

    if status:
        query = query.filter(Lead.status == status)
    if priority:
        query = query.filter(Lead.priority == priority)
    if source:
        query = query.filter(Lead.source == source)
    if search:
        query = query.filter(
            or_(
                Lead.name.ilike(f"%{search}%"),
                Lead.phone.ilike(f"%{search}%"),
                Lead.email.ilike(f"%{search}%"),
                Lead.preferred_location.ilike(f"%{search}%")
            )
        )

    leads = query.order_by(Lead.updated_at.desc()).all()
    return [format_lead_response(l) for l in leads]

@router.get("/export-csv")
def export_leads_csv(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Lead).filter(Lead.is_deleted == False)
    if current_user.role in [UserRole.SALES_EXECUTIVE, UserRole.BROKER]:
        query = query.filter(or_(Lead.assigned_to_id == current_user.id, Lead.created_by_id == current_user.id))
    
    leads = query.all()
    fieldnames = ["ID", "Name", "Phone", "Email", "Source", "Status", "Priority", "Budget Min", "Budget Max", "Location", "Configuration", "Assigned To", "Tags"]
    rows = []
    for l in leads:
        rows.append({
            "ID": l.id,
            "Name": l.name,
            "Phone": l.phone,
            "Email": l.email or "",
            "Source": l.source,
            "Status": l.status.value,
            "Priority": l.priority.value,
            "Budget Min": l.budget_min or "",
            "Budget Max": l.budget_max or "",
            "Location": l.preferred_location or "",
            "Configuration": l.preferred_configuration or "",
            "Assigned To": l.assigned_to.name if l.assigned_to else "Unassigned",
            "Tags": l.tags or ""
        })
    return generate_csv_response("brokeros_leads_export.csv", fieldnames, rows)

@router.post("/import-csv", status_code=status.HTTP_201_CREATED)
async def import_leads_csv(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if not file.filename.endswith(".csv"):
        raise HTTPException(status_code=400, detail="File must be a CSV format")

    content = await file.read()
    parsed_data = parse_leads_csv(content.decode("utf-8", errors="ignore"))
    
    imported_count = 0
    for item in parsed_data:
        if not item.get("name") or not item.get("phone"):
            continue
        
        # Check duplicate by phone
        existing = db.query(Lead).filter(Lead.phone == item["phone"], Lead.is_deleted == False).first()
        if existing:
            continue

        lead = Lead(
            name=item["name"],
            phone=item["phone"],
            email=item.get("email"),
            source=item.get("source", "CSV Import"),
            status=LeadStatus.NEW,
            priority=LeadPriority.MEDIUM,
            budget_min=item.get("budget_min"),
            budget_max=item.get("budget_max"),
            preferred_location=item.get("preferred_location"),
            preferred_configuration=item.get("preferred_configuration"),
            tags=item.get("tags"),
            created_by_id=current_user.id,
            assigned_to_id=current_user.id
        )
        db.add(lead)
        imported_count += 1

    db.commit()
    
    # Audit log
    db.add(ActivityLog(
        user_id=current_user.id,
        user_name=current_user.name,
        action="IMPORT_LEADS_CSV",
        module="Leads",
        details=f"Imported {imported_count} leads from CSV file '{file.filename}'"
    ))
    db.commit()

    return {"message": f"Successfully imported {imported_count} leads", "count": imported_count}

@router.get("/{lead_id}", response_model=LeadResponse)
def get_lead(lead_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    lead = db.query(Lead).filter(Lead.id == lead_id, Lead.is_deleted == False).first()
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")
    return format_lead_response(lead)

@router.post("", response_model=LeadResponse, status_code=status.HTTP_201_CREATED)
def create_lead(
    lead_in: LeadCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    lead_dict = lead_in.model_dump(exclude={"initial_note"})
    
    # If no assignee provided, default to creator
    if not lead_dict.get("assigned_to_id"):
        lead_dict["assigned_to_id"] = current_user.id
    lead_dict["created_by_id"] = current_user.id

    lead = Lead(**lead_dict)
    db.add(lead)
    db.commit()
    db.refresh(lead)

    # Status history entry
    db.add(LeadStatusHistory(
        lead_id=lead.id,
        changed_by_id=current_user.id,
        old_status=None,
        new_status=lead.status.value,
        remarks="Lead created in system"
    ))

    # Add initial note if provided
    if lead_in.initial_note:
        db.add(LeadNote(
            lead_id=lead.id,
            created_by_id=current_user.id,
            note_text=lead_in.initial_note
        ))

    # Activity log
    db.add(ActivityLog(
        user_id=current_user.id,
        user_name=current_user.name,
        action="CREATE_LEAD",
        module="Leads",
        details=f"Created lead '{lead.name}' ({lead.phone})"
    ))

    db.commit()
    db.refresh(lead)
    return format_lead_response(lead)

@router.put("/{lead_id}", response_model=LeadResponse)
def update_lead(
    lead_id: int,
    lead_in: LeadUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    lead = db.query(Lead).filter(Lead.id == lead_id, Lead.is_deleted == False).first()
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")

    old_status = lead.status.value if hasattr(lead.status, "value") else str(lead.status)
    update_data = lead_in.model_dump(exclude_unset=True)

    for field, value in update_data.items():
        setattr(lead, field, value)

    # If status changed, record in LeadStatusHistory
    if "status" in update_data:
        new_status_str = update_data["status"].value if hasattr(update_data["status"], "value") else str(update_data["status"])
        if new_status_str != old_status:
            db.add(LeadStatusHistory(
                lead_id=lead.id,
                changed_by_id=current_user.id,
                old_status=old_status,
                new_status=new_status_str,
                remarks=f"Status updated by {current_user.name}"
            ))

    # If lead status is BOOKED, check if a Booking record exists; if not, auto-create one
    current_status_val = lead.status.value if hasattr(lead.status, "value") else str(lead.status)
    if current_status_val == "Booked" or lead.status == LeadStatus.BOOKED:
        lead.status = LeadStatus.BOOKED
        existing_booking = db.query(Booking).filter(Booking.lead_id == lead.id, Booking.is_deleted == False).first()
        if not existing_booking:
            project = None
            if lead.preferred_project_id:
                project = db.query(Project).filter(Project.id == lead.preferred_project_id, Project.is_deleted == False).first()
            if not project:
                project = db.query(Project).filter(Project.is_deleted == False).first()
            if project:
                builder = project.builder
                deal_val = lead.budget_max or lead.budget_min or 15000000.0
                if deal_val < 100000:
                    deal_val = 15000000.0
                booking_amt = deal_val * 0.05
                booking_num = f"BK-{datetime.now().year}-{random.randint(1000, 9999)}"
                exec_id = lead.assigned_to_id or current_user.id
                builder_id = builder.id if builder else None
                builder_rate = builder.commission_rate if builder else 3.5

                booking = Booking(
                    booking_number=booking_num,
                    lead_id=lead.id,
                    project_id=project.id,
                    builder_id=builder_id,
                    assigned_executive_id=exec_id,
                    unit_number=f"Tower A - {random.randint(101, 1509)}",
                    booking_amount=booking_amt,
                    total_deal_value=deal_val,
                    status=BookingStatus.CONFIRMED,
                    notes=f"Auto-created booking for lead '{lead.name}'"
                )
                db.add(booking)
                db.flush()

                # Calculate Commission
                builder_comm = deal_val * (builder_rate / 100.0)
                exec_rate = 0.5
                exec_comm = deal_val * (exec_rate / 100.0)
                company_margin = builder_comm - exec_comm

                commission = Commission(
                    booking_id=booking.id,
                    builder_commission_rate=builder_rate,
                    builder_commission_amount=builder_comm,
                    executive_commission_rate=exec_rate,
                    executive_commission_amount=exec_comm,
                    company_margin_amount=company_margin,
                    payout_status=PayoutStatus.PENDING
                )
                db.add(commission)

                # Update Executive Sales Target
                current_month_str = datetime.now().strftime("%Y-%m")
                target = db.query(SalesTarget).filter(
                    SalesTarget.user_id == exec_id,
                    SalesTarget.month_year == current_month_str,
                    SalesTarget.is_deleted == False
                ).first()
                if target:
                    deal_val_lakhs = (deal_val / 100000.0) if deal_val > 10000 else deal_val
                    target.achieved_amount += deal_val_lakhs
                    target.achieved_bookings += 1

                # Activity Log
                db.add(ActivityLog(
                    user_id=current_user.id,
                    user_name=current_user.name,
                    action="AUTO_CREATE_BOOKING",
                    module="Bookings",
                    details=f"Created booking {booking_num} for lead '{lead.name}' upon status change to Booked"
                ))

                # Notification
                db.add(Notification(
                    user_id=exec_id,
                    title="🎉 New Deal Booked!",
                    message=f"Lead '{lead.name}' status changed to Booked. Booking ref {booking_num} created.",
                    type="deal_closed"
                ))

    db.commit()
    db.refresh(lead)
    return format_lead_response(lead)

@router.post("/{lead_id}/notes", response_model=LeadNoteResponse, status_code=status.HTTP_201_CREATED)
def add_lead_note(
    lead_id: int,
    note_in: LeadNoteCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    lead = db.query(Lead).filter(Lead.id == lead_id, Lead.is_deleted == False).first()
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")

    note = LeadNote(
        lead_id=lead_id,
        created_by_id=current_user.id,
        note_text=note_in.note_text
    )
    db.add(note)
    db.commit()
    db.refresh(note)

    res = LeadNoteResponse.model_validate(note)
    res.author_name = current_user.name
    return res

@router.delete("/{lead_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_lead(
    lead_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    lead = db.query(Lead).filter(Lead.id == lead_id, Lead.is_deleted == False).first()
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")

    lead.is_deleted = True
    db.commit()
