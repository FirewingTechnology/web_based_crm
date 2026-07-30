from datetime import datetime
from pydantic import BaseModel

class DashboardStats(BaseModel):
    total_leads: int
    new_leads_today: int
    total_bookings: int
    total_pipeline_value: float # in Lakhs / Crores
    total_revenue_generated: float
    total_commission_earned: float
    pending_followups_count: int
    overdue_followups_count: int

class MonthlySalesChart(BaseModel):
    month: str
    revenue: float
    bookings_count: int

class LeadSourceDistribution(BaseModel):
    source: str
    count: int

class LeadStatusDistribution(BaseModel):
    status: str
    count: int

class NotificationResponse(BaseModel):
    id: int
    user_id: int
    title: str
    message: str
    type: str
    is_read: bool
    created_at: datetime

    class Config:
        from_attributes = True

class ActivityLogResponse(BaseModel):
    id: int
    user_name: str
    action: str
    module: str
    details: str
    created_at: datetime

    class Config:
        from_attributes = True
