from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.sales_target import SalesTarget
from app.models.user import User, UserRole
from app.schemas.sales_target import SalesTargetCreate, SalesTargetUpdate, SalesTargetResponse
from app.middleware.auth_middleware import get_current_user, RequireRole

router = APIRouter(prefix="/sales", tags=["Sales Management"])

from app.models.booking import Booking, BookingStatus

def format_target_response(t: SalesTarget, db: Session) -> SalesTargetResponse:
    res = SalesTargetResponse.model_validate(t)
    res.user_name = t.user.name if t.user else "Unknown"

    bookings = db.query(Booking).filter(
        Booking.assigned_executive_id == t.user_id,
        Booking.status != BookingStatus.CANCELLED,
        Booking.is_deleted == False
    ).all()

    month_bookings = [
        b for b in bookings
        if b.booking_date and b.booking_date.strftime("%Y-%m") == t.month_year
    ]

    if month_bookings:
        real_count = len(month_bookings)
        real_lakhs = sum(
            (b.total_deal_value / 100000.0) if b.total_deal_value > 10000 else b.total_deal_value
            for b in month_bookings
        )
        res.achieved_bookings = real_count
        res.achieved_amount = round(real_lakhs, 2)
    else:
        res.achieved_amount = round(t.achieved_amount, 2)
        res.achieved_bookings = t.achieved_bookings

    res.achievement_percentage = round((res.achieved_amount / t.target_amount * 100), 1) if t.target_amount > 0 else 0.0
    return res

@router.get("/targets", response_model=list[SalesTargetResponse])
def get_sales_targets(
    month_year: str | None = None,
    user_id: int | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    curr_month = month_year or datetime.now().strftime("%Y-%m")

    # Auto-ensure target record exists for all active Sales Executives
    sales_execs = db.query(User).filter(
        User.role == UserRole.SALES_EXECUTIVE,
        User.is_active == True,
        User.is_deleted == False
    ).all()

    for exec_user in sales_execs:
        existing = db.query(SalesTarget).filter(
            SalesTarget.user_id == exec_user.id,
            SalesTarget.month_year == curr_month,
            SalesTarget.is_deleted == False
        ).first()

        if not existing:
            new_target = SalesTarget(
                user_id=exec_user.id,
                month_year=curr_month,
                target_amount=200.0,
                achieved_amount=0.0,
                target_bookings=5,
                achieved_bookings=0
            )
            db.add(new_target)

    db.commit()

    query = db.query(SalesTarget).filter(SalesTarget.is_deleted == False)

    if current_user.role != UserRole.SUPERADMIN and current_user.organization_id:
        query = query.join(User).filter(User.organization_id == current_user.organization_id)

    if current_user.role == UserRole.SALES_EXECUTIVE:

        query = query.filter(SalesTarget.user_id == current_user.id)
    elif user_id:
        query = query.filter(SalesTarget.user_id == user_id)

    if month_year:
        query = query.filter(SalesTarget.month_year == month_year)

    targets = query.order_by(SalesTarget.month_year.desc()).all()
    return [format_target_response(t, db) for t in targets]

@router.post("/targets", response_model=SalesTargetResponse, status_code=status.HTTP_201_CREATED)
def create_sales_target(
    target_in: SalesTargetCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(RequireRole([UserRole.ADMIN, UserRole.MANAGER]))
):
    target = SalesTarget(**target_in.model_dump())
    db.add(target)
    db.commit()
    db.refresh(target)

    return format_target_response(target, db)

@router.put("/targets/{target_id}", response_model=SalesTargetResponse)
def update_sales_target(
    target_id: int,
    target_in: SalesTargetUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(RequireRole([UserRole.ADMIN, UserRole.MANAGER]))
):
    target = db.query(SalesTarget).filter(SalesTarget.id == target_id, SalesTarget.is_deleted == False).first()
    if not target:
        raise HTTPException(status_code=404, detail="Sales target record not found")

    for field, value in target_in.model_dump(exclude_unset=True).items():
        setattr(target, field, value)

    db.commit()
    db.refresh(target)
    return format_target_response(target, db)
