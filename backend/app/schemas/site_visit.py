from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class SiteVisitCreate(BaseModel):
    lead_id: int
    project_id: int
    scheduled_at: datetime
    sales_executive_id: Optional[int] = None
    pickup_location: Optional[str] = None
    pickup_time: Optional[str] = None
    driver_name: Optional[str] = None
    driver_phone: Optional[str] = None
    cab_vehicle_number: Optional[str] = None

class SiteVisitUpdate(BaseModel):
    scheduled_at: Optional[datetime] = None
    pickup_location: Optional[str] = None
    pickup_time: Optional[str] = None
    driver_name: Optional[str] = None
    driver_phone: Optional[str] = None
    cab_vehicle_number: Optional[str] = None
    status: Optional[str] = None
    feedback_rating: Optional[int] = None
    buyer_interest_level: Optional[str] = None
    preferred_unit: Optional[str] = None
    discussion_notes: Optional[str] = None

class SiteVisitStatusUpdate(BaseModel):
    status: str # Scheduled, In Transit, Completed, Cancelled, No Show
    feedback_rating: Optional[int] = None
    buyer_interest_level: Optional[str] = None
    preferred_unit: Optional[str] = None
    discussion_notes: Optional[str] = None
    auto_advance_lead: bool = True

class SiteVisitVerifyOtp(BaseModel):
    otp_code: str

class SiteVisitResponse(BaseModel):
    id: int
    lead_id: int
    lead_name: Optional[str] = None
    lead_phone: Optional[str] = None
    project_id: int
    project_name: Optional[str] = None
    sales_executive_id: int
    sales_executive_name: Optional[str] = None
    scheduled_at: datetime
    completed_at: Optional[datetime] = None
    pickup_location: Optional[str] = None
    pickup_time: Optional[str] = None
    driver_name: Optional[str] = None
    driver_phone: Optional[str] = None
    cab_vehicle_number: Optional[str] = None
    otp_code: str
    is_otp_verified: bool
    status: str
    feedback_rating: Optional[int] = None
    buyer_interest_level: Optional[str] = None
    preferred_unit: Optional[str] = None
    discussion_notes: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True
