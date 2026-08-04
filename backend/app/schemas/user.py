from datetime import datetime
from pydantic import BaseModel, EmailStr
from app.models.user import UserRole

class UserBase(BaseModel):
    name: str
    email: EmailStr
    role: UserRole
    phone: str | None = None
    firm_name: str | None = None
    avatar_url: str | None = None

class UserCreate(UserBase):
    password: str

class UserUpdate(BaseModel):
    name: str | None = None
    phone: str | None = None
    firm_name: str | None = None
    role: UserRole | None = None
    is_active: bool | None = None
    avatar_url: str | None = None

class UserResponse(UserBase):
    id: int
    is_active: bool
    created_at: datetime
    updated_at: datetime
    trial_expires_at: datetime | None = None
    is_trial_expired: bool = False
    trial_seconds_remaining: int = 0

    class Config:
        from_attributes = True

