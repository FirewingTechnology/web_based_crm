from datetime import datetime
from pydantic import BaseModel

class SalesTargetBase(BaseModel):
    user_id: int
    month_year: str # e.g. "2026-07"
    target_amount: float # Lakhs
    target_bookings: int = 5

class SalesTargetCreate(SalesTargetBase):
    pass

class SalesTargetUpdate(BaseModel):
    target_amount: float | None = None
    target_bookings: int | None = None
    achieved_amount: float | None = None
    achieved_bookings: int | None = None

class SalesTargetResponse(SalesTargetBase):
    id: int
    user_name: str | None = None
    achieved_amount: float
    achieved_bookings: int
    achievement_percentage: float = 0.0
    created_at: datetime

    class Config:
        from_attributes = True
