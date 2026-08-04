from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User, UserRole
from app.schemas.user import UserCreate, UserUpdate, UserResponse
from app.utils.security import get_password_hash
from app.middleware.auth_middleware import get_current_user, RequireRole

router = APIRouter(prefix="/users", tags=["Users"])

@router.get("", response_model=list[UserResponse])
def get_users(
    role: UserRole | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(RequireRole([UserRole.ADMIN, UserRole.MANAGER]))
):
    query = db.query(User).filter(User.is_deleted == False)
    if role:
        query = query.filter(User.role == role)
    return query.order_by(User.name).all()

@router.post("", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def create_user(
    user_in: UserCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(RequireRole([UserRole.ADMIN]))
):
    existing = db.query(User).filter(User.email == user_in.email, User.is_deleted == False).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    user = User(
        name=user_in.name,
        email=user_in.email,
        hashed_password=get_password_hash(user_in.password),
        role=user_in.role,
        phone=user_in.phone,
        firm_name=user_in.firm_name or current_user.firm_name,
        avatar_url=user_in.avatar_url
    )

    db.add(user)
    db.commit()
    db.refresh(user)

    if user.role == UserRole.SALES_EXECUTIVE:
        from app.models.sales_target import SalesTarget
        from datetime import datetime
        curr_month = datetime.now().strftime("%Y-%m")
        target = SalesTarget(
            user_id=user.id,
            month_year=curr_month,
            target_amount=200.0,
            achieved_amount=0.0,
            target_bookings=5,
            achieved_bookings=0
        )
        db.add(target)
        db.commit()

    return user

@router.put("/{user_id}", response_model=UserResponse)
def update_user(
    user_id: int,
    user_in: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(RequireRole([UserRole.ADMIN]))
):
    user = db.query(User).filter(User.id == user_id, User.is_deleted == False).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    for field, value in user_in.model_dump(exclude_unset=True).items():
        setattr(user, field, value)

    db.commit()
    db.refresh(user)
    return user

@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(RequireRole([UserRole.ADMIN]))
):
    user = db.query(User).filter(User.id == user_id, User.is_deleted == False).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user.is_deleted = True
    db.commit()
