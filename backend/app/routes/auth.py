from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User, UserRole
from app.schemas.auth import LoginRequest, Token, RefreshRequest
from app.schemas.user import UserResponse
from app.utils.security import verify_password, create_access_token, create_refresh_token, decode_token
from app.middleware.auth_middleware import get_current_user

router = APIRouter(prefix="/auth", tags=["Authentication"])

from datetime import datetime, timedelta
from sqlalchemy import func
from app.models.saas import Subscription, Organization

@router.post("/login", response_model=Token)
async def login(request: Request, db: Session = Depends(get_db)):
    email = None
    password = None

    content_type = request.headers.get("content-type", "")
    if "application/x-www-form-urlencoded" in content_type or "multipart/form-data" in content_type:
        form = await request.form()
        email = form.get("username") or form.get("email")
        password = form.get("password")
    else:
        try:
            body = await request.json()
            email = body.get("email")
            password = body.get("password")
        except Exception:
            raise HTTPException(status_code=400, detail="Invalid request payload")

    if not email or not password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email and password are required"
        )

    clean_email = email.lower().strip()
    user = db.query(User).filter(func.lower(User.email) == clean_email, User.is_deleted == False).first()
    if not user or not verify_password(password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password"
        )
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Account is deactivated. Contact Administrator."
        )

    token_data = {"user_id": user.id, "email": user.email, "role": user.role.value}
    access_token = create_access_token(data=token_data)
    refresh_token = create_refresh_token(data=token_data)

    return Token(access_token=access_token, refresh_token=refresh_token)

@router.post("/refresh", response_model=Token)
def refresh_token(request: RefreshRequest, db: Session = Depends(get_db)):
    payload = decode_token(request.refresh_token, is_refresh=True)
    if not payload or payload.get("type") != "refresh":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired refresh token"
        )
    
    user_id = payload.get("user_id")
    user = db.query(User).filter(User.id == user_id, User.is_deleted == False).first()
    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User no longer active"
        )

    token_data = {"user_id": user.id, "email": user.email, "role": user.role.value}
    new_access_token = create_access_token(data=token_data)
    new_refresh_token = create_refresh_token(data=token_data)

    return Token(access_token=new_access_token, refresh_token=new_refresh_token)

@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    # SuperAdmin account never expires
    if current_user.role == UserRole.SUPERADMIN:
        resp_data = UserResponse.from_orm(current_user).dict()
        resp_data["trial_expires_at"] = None
        resp_data["is_trial_expired"] = False
        resp_data["trial_seconds_remaining"] = 864000
        return resp_data

    trial_expires_at = None
    is_trial_expired = False
    trial_seconds_remaining = 0

    # Query Organization strictly bound to this user
    org = None
    if getattr(current_user, "organization_id", None):
        org = db.query(Organization).filter(Organization.id == current_user.organization_id).first()

    if not org and current_user.firm_name:
        org = db.query(Organization).filter(
            func.lower(Organization.name) == current_user.firm_name.lower().strip()
        ).order_by(Organization.id.asc()).first()
        if org:
            current_user.organization_id = org.id
            db.commit()

    now_naive = datetime.utcnow()

    if org:
        sub = db.query(Subscription).filter(
            Subscription.organization_id == org.id
        ).order_by(Subscription.id.desc()).first()

        if sub:
            if sub.status == "Active":
                is_trial_expired = False
                trial_seconds_remaining = 864000
            else:
                end_dt = sub.end_date
                if end_dt and getattr(end_dt, "tzinfo", None) is not None:
                    end_dt = end_dt.replace(tzinfo=None)
                trial_expires_at = end_dt
                diff_seconds = int((end_dt - now_naive).total_seconds())

                if diff_seconds <= 0 or sub.status == "Expired":
                    is_trial_expired = True
                    trial_seconds_remaining = 0
                    if sub.status != "Expired":
                        sub.status = "Expired"
                        db.commit()
                else:
                    is_trial_expired = False
                    trial_seconds_remaining = diff_seconds
        else:
            created_at = org.created_at or current_user.created_at
            if created_at and getattr(created_at, "tzinfo", None) is not None:
                created_at = created_at.replace(tzinfo=None)
            trial_end = created_at + timedelta(hours=1)
            trial_expires_at = trial_end
            diff_seconds = int((trial_end - now_naive).total_seconds())
            if diff_seconds <= 0:
                is_trial_expired = True
                trial_seconds_remaining = 0
            else:
                is_trial_expired = False
                trial_seconds_remaining = diff_seconds
    else:
        created_at = current_user.created_at
        if created_at and getattr(created_at, "tzinfo", None) is not None:
            created_at = created_at.replace(tzinfo=None)
        trial_end = created_at + timedelta(hours=1)
        trial_expires_at = trial_end
        diff_seconds = int((trial_end - now_naive).total_seconds())
        if diff_seconds <= 0:
            is_trial_expired = True
            trial_seconds_remaining = 0
        else:
            is_trial_expired = False
            trial_seconds_remaining = diff_seconds

    resp_data = UserResponse.from_orm(current_user).dict()
    resp_data["trial_expires_at"] = trial_expires_at
    resp_data["is_trial_expired"] = is_trial_expired
    resp_data["trial_seconds_remaining"] = trial_seconds_remaining
    return resp_data



