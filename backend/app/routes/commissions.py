from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.commission import Commission, PayoutStatus
from app.models.booking import Booking
from app.models.user import User, UserRole
from app.schemas.booking import CommissionResponse, CommissionUpdate
from app.schemas.commission_ledger import (
    CommissionStageUpdate,
    CommissionItemResponse,
    CommissionCommandCenterResponse,
)
from app.services.commission_service import CommissionService
from app.middleware.auth_middleware import get_current_user, RequireRole

router = APIRouter(prefix="/commissions", tags=["Commissions"])

@router.get("/aging-summary", response_model=CommissionCommandCenterResponse)
def get_commission_command_center(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    try:
        return CommissionService.get_command_center(db, current_user)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.patch("/{commission_id}/stage", response_model=CommissionItemResponse)
def update_commission_stage(
    commission_id: int,
    update_in: CommissionStageUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(RequireRole([UserRole.ADMIN, UserRole.MANAGER]))
):
    try:
        return CommissionService.update_commission_stage(commission_id, update_in, db, current_user)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("", response_model=list[CommissionItemResponse])
def get_commissions(
    payout_status: PayoutStatus | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    center = CommissionService.get_command_center(db, current_user)
    items = center.commissions
    if payout_status:
        items = [c for c in items if c.payout_status == (payout_status.value if hasattr(payout_status, "value") else payout_status)]
    return items


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
