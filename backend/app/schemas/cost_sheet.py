from pydantic import BaseModel
from typing import List, Optional

class PaymentMilestone(BaseModel):
    milestone_name: str
    percentage: float
    amount: float
    due_condition: str

class CostSheetCalculateRequest(BaseModel):
    lead_id: Optional[int] = None
    project_id: int
    unit_number: str
    configuration: str
    super_builtup_area_sqft: float
    base_rate_per_sqft: float
    floor_number: int = 1
    floor_rise_rate_per_sqft: float = 25.0
    plc_rate_per_sqft: float = 0.0
    car_parking_slots: int = 1
    car_parking_rate: float = 400000.0
    clubhouse_charges: float = 350000.0
    possession_charges: float = 150000.0
    gst_rate_pct: float = 5.0
    stamp_duty_rate_pct: float = 7.0
    registration_fee: float = 30000.0
    discount_amount: float = 0.0

class CostSheetBreakdown(BaseModel):
    base_selling_price: float
    floor_rise_charges: float
    plc_charges: float
    car_parking_charges: float
    discount_amount: float
    total_agreement_value: float

    clubhouse_charges: float
    possession_charges: float
    total_additional_charges: float

    gst_amount: float
    stamp_duty_amount: float
    registration_fee: float
    total_statutory_charges: float

    grand_total: float
    token_booking_amount: float # 10%

class CostSheetResponse(BaseModel):
    project_id: int
    project_name: str
    builder_name: str
    location: str
    unit_number: str
    configuration: str
    super_builtup_area_sqft: float
    base_rate_per_sqft: float
    breakdown: CostSheetBreakdown
    payment_schedule: List[PaymentMilestone]
    whatsapp_summary: str

class QuickBookFromCostSheetRequest(CostSheetCalculateRequest):
    lead_id: int
    broker_id: Optional[int] = None
    assigned_executive_id: Optional[int] = None
    token_amount_paid: Optional[float] = None
    notes: Optional[str] = None
