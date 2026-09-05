from datetime import datetime
from pydantic import BaseModel
from typing import List, Optional
from app.models.commission import PayoutStatus, CommissionStage

class CommissionStageUpdate(BaseModel):
    stage: CommissionStage
    invoice_number: Optional[str] = None
    invoice_date: Optional[datetime] = None
    due_date: Optional[datetime] = None
    paid_date: Optional[datetime] = None
    payment_reference: Optional[str] = None
    remarks: Optional[str] = None

class CommissionItemResponse(BaseModel):
    id: int
    organization_id: Optional[int] = None
    booking_id: int
    booking_number: str
    unit_number: str
    lead_name: str
    builder_name: str
    project_name: str
    executive_name: str
    broker_name: Optional[str] = None
    total_deal_value: float

    builder_commission_rate: float
    builder_commission_amount: float
    gst_rate: float
    gst_amount: float
    tds_rate: float
    tds_amount: float
    net_receivable: float

    executive_commission_rate: float
    executive_commission_amount: float
    company_margin_amount: float

    stage: str
    payout_status: str
    invoice_number: Optional[str] = None
    invoice_date: Optional[datetime] = None
    due_date: Optional[datetime] = None
    paid_date: Optional[datetime] = None
    payment_reference: Optional[str] = None

    aging_bucket: str
    days_overdue: int
    remarks: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

class CommissionAgingBucketSummary(BaseModel):
    bucket: str
    count: int
    total_amount: float

class CommissionCommandCenterResponse(BaseModel):
    total_receivable: float
    total_overdue: float
    total_collected: float
    total_expected_unbilled: float
    aging_buckets: List[CommissionAgingBucketSummary]
    stage_breakdown: dict
    commissions: List[CommissionItemResponse]
