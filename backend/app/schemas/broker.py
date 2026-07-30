from datetime import datetime
from pydantic import BaseModel, EmailStr

class BrokerBase(BaseModel):
    firm_name: str
    contact_person: str
    phone: str
    email: EmailStr
    address: str | None = None
    commission_rate: float = 1.5

class BrokerCreate(BrokerBase):
    password: str = "Broker@123"

class BrokerUpdate(BaseModel):
    firm_name: str | None = None
    contact_person: str | None = None
    phone: str | None = None
    email: EmailStr | None = None
    address: str | None = None
    commission_rate: float | None = None

class BrokerResponse(BrokerBase):
    id: int
    user_id: int
    total_deals: int
    total_revenue_generated: float
    performance_score: float
    created_at: datetime

    class Config:
        from_attributes = True
