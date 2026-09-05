from datetime import datetime
from pydantic import BaseModel, EmailStr
from typing import Optional, List

class BrokerBase(BaseModel):
    firm_name: str
    contact_person: str
    phone: str
    email: EmailStr
    address: Optional[str] = None
    commission_rate: float = 1.5
    tier: str = "Silver" # Silver, Gold, Platinum
    parent_broker_id: Optional[int] = None
    rera_number: Optional[str] = None

class BrokerCreate(BrokerBase):
    password: str = "Broker@123"

class BrokerUpdate(BaseModel):
    firm_name: Optional[str] = None
    contact_person: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[EmailStr] = None
    address: Optional[str] = None
    commission_rate: Optional[float] = None
    tier: Optional[str] = None
    parent_broker_id: Optional[int] = None
    rera_number: Optional[str] = None

class BrokerResponse(BrokerBase):
    id: int
    user_id: int
    total_deals: int
    total_revenue_generated: float
    performance_score: float
    sub_broker_count: Optional[int] = 0
    parent_firm_name: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

class BrokerTierConfig(BaseModel):
    tier: str
    min_revenue_lakhs: float
    base_commission_pct: float
    volume_kicker_pct: float
    effective_commission_pct: float
    perks: List[str]

class BrokerTierUpdateRequest(BaseModel):
    tier: str

class ProjectCollateralResponse(BaseModel):
    project_id: int
    project_name: str
    location: str
    configuration: str
    price_range: str
    brochure_url: Optional[str] = None
    amenities: List[str]
    co_branded_share_text: str
    co_branded_whatsapp_link: str

class CoBrokingDealCreate(BaseModel):
    primary_broker_id: int
    secondary_broker_id: Optional[int] = None
    lead_id: Optional[int] = None
    project_id: Optional[int] = None
    client_name: str
    client_phone: str
    primary_split_pct: float = 50.0
    secondary_split_pct: float = 50.0
    expected_deal_value: Optional[float] = None
    notes: Optional[str] = None

class CoBrokingDealResponse(BaseModel):
    id: int
    primary_broker_id: int
    primary_broker_name: Optional[str] = None
    secondary_broker_id: Optional[int] = None
    secondary_broker_name: Optional[str] = None
    lead_id: Optional[int] = None
    project_id: Optional[int] = None
    project_name: Optional[str] = None
    client_name: str
    client_phone: str
    primary_split_pct: float
    secondary_split_pct: float
    expected_deal_value: Optional[float] = None
    status: str
    notes: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True
