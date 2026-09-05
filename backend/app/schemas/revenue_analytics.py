from typing import List, Optional
from pydantic import BaseModel

class FunnelStageMetric(BaseModel):
    stage_key: str
    stage_label: str
    count: int
    value_inr: float
    conversion_from_prev_pct: float
    dropoff_count: int
    dropoff_pct: float

class ChannelAttributionMetric(BaseModel):
    source: str
    inquiries: int
    qualified: int
    site_visits: int
    bookings: int
    deal_value_inr: float
    commission_inr: float
    conversion_rate: float
    quality_score: int
    grade: str # "A+" | "A" | "B" | "C" | "D"

class RevenueAnalyticsResponse(BaseModel):
    time_period: str
    total_inquiries: int
    total_visits: int
    total_bookings: int
    total_closed_revenue: float
    total_commission: float
    overall_conversion_rate: float
    avg_cycle_days: float
    bottleneck_stage: str
    bottleneck_insight: str
    funnel_stages: List[FunnelStageMetric]
    channels: List[ChannelAttributionMetric]
