from datetime import datetime
from pydantic import BaseModel
from app.models.booking import BookingStatus
from app.models.commission import PayoutStatus

class CommissionResponse(BaseModel):
    id: int
    booking_id: int
    builder_commission_rate: float
    builder_commission_amount: float
    executive_commission_rate: float
    executive_commission_amount: float
    broker_commission_rate: float
    broker_commission_amount: float
    company_margin_amount: float
    payout_status: PayoutStatus
    remarks: str | None = None

    class Config:
        from_attributes = True

class CommissionUpdate(BaseModel):
    payout_status: PayoutStatus | None = None
    remarks: str | None = None

class BookingBase(BaseModel):
    lead_id: int
    project_id: int
    assigned_executive_id: int
    broker_id: int | None = None
    unit_number: str
    booking_amount: float # token amount
    total_deal_value: float # total price
    notes: str | None = None

class BookingCreate(BookingBase):
    pass

class BookingUpdate(BaseModel):
    status: BookingStatus | None = None
    notes: str | None = None

class BookingResponse(BookingBase):
    id: int
    booking_number: str
    builder_id: int
    builder_name: str | None = None
    project_name: str | None = None
    lead_name: str | None = None
    executive_name: str | None = None
    broker_name: str | None = None
    status: BookingStatus
    booking_date: datetime
    created_at: datetime
    commission: CommissionResponse | None = None

    class Config:
        from_attributes = True
