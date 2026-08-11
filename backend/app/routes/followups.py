from datetime import datetime, timezone, timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_
from app.database import get_db
from app.models.followup import Followup, FollowupStatus, FollowupType
from app.models.lead import Lead
from app.models.user import User, UserRole
from app.schemas.followup import FollowupCreate, FollowupUpdate, FollowupResponse
from app.middleware.auth_middleware import get_current_user

router = APIRouter(prefix="/followups", tags=["Followups"])

def format_followup_response(f: Followup) -> FollowupResponse:
    res = FollowupResponse.model_validate(f)
    res.lead_name = f.lead.name if f.lead else "Unknown"
    res.lead_phone = f.lead.phone if f.lead else ""
    res.assigned_to_name = f.assigned_to.name if f.assigned_to else "Unknown"
    return res

@router.get("", response_model=list[FollowupResponse])
def get_followups(
    status: FollowupStatus | None = None,
    type: FollowupType | None = None,
    filter_period: str | None = None, # "today", "overdue", "pending", "completed"
    my_followups_only: bool = False,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Followup).filter(Followup.is_deleted == False)

    if current_user.role != UserRole.SUPERADMIN and current_user.organization_id:
        query = query.filter(Followup.organization_id == current_user.organization_id)

    if my_followups_only or current_user.role in [UserRole.SALES_EXECUTIVE, UserRole.BROKER]:

        query = query.filter(Followup.assigned_to_id == current_user.id)

    if status:
        query = query.filter(Followup.status == status)
    if type:
        query = query.filter(Followup.type == type)

    now = datetime.now()
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    today_end = today_start + timedelta(days=1)
    yesterday_start_str = today_start.strftime("%Y-%m-%d %H:%M:%S")

    # Only mark pending followups scheduled BEFORE today (00:00:00) as OVERDUE
    db.query(Followup).filter(
        Followup.is_deleted == False,
        Followup.status == FollowupStatus.PENDING,
        Followup.scheduled_at < yesterday_start_str
    ).update({"status": FollowupStatus.OVERDUE}, synchronize_session=False)
    db.commit()

    if filter_period == "today":
        query = query.filter(
            Followup.scheduled_at >= today_start,
            Followup.scheduled_at < today_end
        )
    elif filter_period == "overdue":
        query = query.filter(Followup.status == FollowupStatus.OVERDUE)
    elif filter_period == "pending":
        query = query.filter(Followup.status == FollowupStatus.PENDING)
    elif filter_period == "completed":
        query = query.filter(Followup.status == FollowupStatus.COMPLETED)

    followups = query.order_by(Followup.scheduled_at.asc()).all()
    return [format_followup_response(f) for f in followups]

@router.get("/{followup_id}", response_model=FollowupResponse)
def get_followup(followup_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    query = db.query(Followup).filter(Followup.id == followup_id, Followup.is_deleted == False)
    if current_user.role != UserRole.SUPERADMIN and current_user.organization_id:
        query = query.filter(Followup.organization_id == current_user.organization_id)
    f = query.first()
    if not f:
        raise HTTPException(status_code=404, detail="Followup not found")
    return format_followup_response(f)

@router.post("", response_model=FollowupResponse, status_code=status.HTTP_201_CREATED)
def create_followup(
    followup_in: FollowupCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    lead = db.query(Lead).filter(Lead.id == followup_in.lead_id, Lead.is_deleted == False).first()
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")

    f_data = followup_in.model_dump()
    f_data["organization_id"] = current_user.organization_id
    followup = Followup(**f_data)
    db.add(followup)
    db.commit()
    db.refresh(followup)

    return format_followup_response(followup)


@router.put("/{followup_id}", response_model=FollowupResponse)
def update_followup(
    followup_id: int,
    followup_in: FollowupUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    followup = db.query(Followup).filter(Followup.id == followup_id, Followup.is_deleted == False).first()
    if not followup:
        raise HTTPException(status_code=404, detail="Followup not found")

    update_data = followup_in.model_dump(exclude_unset=True)
    
    # If marking as completed
    if update_data.get("status") == FollowupStatus.COMPLETED and followup.status != FollowupStatus.COMPLETED:
        followup.completed_at = datetime.now(timezone.utc)

    for field, value in update_data.items():
        setattr(followup, field, value)

    db.commit()
    db.refresh(followup)
    return format_followup_response(followup)

@router.delete("/{followup_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_followup(
    followup_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    followup = db.query(Followup).filter(Followup.id == followup_id, Followup.is_deleted == False).first()
    if not followup:
        raise HTTPException(status_code=404, detail="Followup not found")

    followup.is_deleted = True
    db.commit()
