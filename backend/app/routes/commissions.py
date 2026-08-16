from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.commission import Commission, PayoutStatus
from app.models.booking import Booking
from app.models.user import User, UserRole
from app.schemas.booking import CommissionResponse, CommissionUpdate
from app.middleware.auth_middleware import get_current_user, RequireRole

router = APIRouter(prefix="/commissions", tags=["Commissions"])

@router.get("", response_model=list[dict])
def get_commissions(
    payout_status: PayoutStatus | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Commission).join(Booking).filter(Commission.is_deleted == False, Booking.is_deleted == False)

    from sqlalchemy import or_
    if current_user.role != UserRole.SUPERADMIN and current_user.organization_id:
        query = query.filter(or_(Commission.organization_id == current_user.organization_id, Booking.organization_id == current_user.organization_id))


    if current_user.role == UserRole.SALES_EXECUTIVE:
        query = query.filter(Booking.assigned_executive_id == current_user.id)
    elif current_user.role == UserRole.BROKER:
        from app.models.broker import BrokerProfile
        broker_prof = db.query(BrokerProfile).filter(BrokerProfile.user_id == current_user.id).first()
        if broker_prof:
            query = query.filter(Booking.broker_id == broker_prof.id)
        else:
            return []

    if payout_status:
        query = query.filter(Commission.payout_status == payout_status)

    commissions = query.order_by(Commission.created_at.desc()).all()
    
    result = []
    for c in commissions:
        result.append({
            "id": c.id,
            "booking_id": c.booking_id,
            "booking_number": c.booking.booking_number,
            "lead_name": c.booking.lead.name if c.booking.lead else "Unknown",
            "project_name": c.booking.project.name if c.booking.project else "Unknown",
            "builder_name": c.booking.builder.name if c.booking.builder else "Unknown",
            "executive_name": c.booking.assigned_executive.name if c.booking.assigned_executive else "Unknown",
            "broker_name": c.booking.broker.firm_name if c.booking.broker else None,
            "total_deal_value": c.booking.total_deal_value,
            "builder_commission_rate": c.builder_commission_rate,
            "builder_commission_amount": c.builder_commission_amount,
            "executive_commission_rate": c.executive_commission_rate,
            "executive_commission_amount": c.executive_commission_amount,
            "broker_commission_rate": c.broker_commission_rate,
            "broker_commission_amount": c.broker_commission_amount,
            "company_margin_amount": c.company_margin_amount,
            "payout_status": c.payout_status.value,
            "remarks": c.remarks,
            "created_at": c.created_at
        })
    return result

@router.put("/{commission_id}", response_model=CommissionResponse)
def update_commission_status(
    commission_id: int,
    commission_in: CommissionUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(RequireRole([UserRole.ADMIN, UserRole.MANAGER]))
):
    commission = db.query(Commission).filter(Commission.id == commission_id, Commission.is_deleted == False).first()
    if not commission:
        raise HTTPException(status_code=404, detail="Commission record not found")

    for field, value in commission_in.model_dump(exclude_unset=True).items():
        setattr(commission, field, value)

    db.commit()
    db.refresh(commission)
    return CommissionResponse.model_validate(commission)
