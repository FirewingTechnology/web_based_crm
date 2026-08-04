from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.schemas.auth import LoginRequest, Token, RefreshRequest
from app.schemas.user import UserResponse
from app.utils.security import verify_password, create_access_token, create_refresh_token, decode_token
from app.middleware.auth_middleware import get_current_user

router = APIRouter(prefix="/auth", tags=["Authentication"])

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

    user = db.query(User).filter(User.email == email, User.is_deleted == False).first()
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

from datetime import datetime
from app.models.saas import Subscription, Organization

@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    org = db.query(Organization).filter(Organization.name == current_user.firm_name).first()
    
    trial_expires_at = None
    is_trial_expired = False
    trial_seconds_remaining = 0

    if org:
        sub = db.query(Subscription).filter(Subscription.organization_id == org.id).first()
        if sub and sub.status in ["Trial", "Demo", "Expired"]:
            trial_expires_at = sub.end_date
            now_naive = datetime.utcnow()
            diff_seconds = int((sub.end_date - now_naive).total_seconds())
            
            if diff_seconds <= 0 or sub.status == "Expired":
                is_trial_expired = True
                trial_seconds_remaining = 0
                if sub.status != "Expired":
                    sub.status = "Expired"
                    db.commit()
            else:
                trial_seconds_remaining = diff_seconds

    resp_data = UserResponse.from_orm(current_user).dict()
    resp_data["trial_expires_at"] = trial_expires_at
    resp_data["is_trial_expired"] = is_trial_expired
    resp_data["trial_seconds_remaining"] = trial_seconds_remaining
    return resp_data

