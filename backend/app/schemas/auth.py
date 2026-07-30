from pydantic import BaseModel, EmailStr
from app.models.user import UserRole

class Token(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class RefreshRequest(BaseModel):
    refresh_token: str

class TokenData(BaseModel):
    user_id: int
    email: str
    role: UserRole
