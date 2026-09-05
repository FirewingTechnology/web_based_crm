from typing import List, Optional
from pydantic import BaseModel

class PerformanceBadge(BaseModel):
    code: str
    title: str
    icon: str
    description: str
    color: str

class ExecutiveScorecard(BaseModel):
    user_id: int
    name: str
    email: str
    role: str
    rank: int

    # Financial & Deal Metrics (amounts in INR Lakhs)
    target_amount: float
    achieved_amount: float
    achievement_percentage: float

    target_bookings: int
    achieved_bookings: int

    # Operational Activity
    site_visits_conducted: int
    leads_assigned: int
    conversion_rate: float
    followup_adherence_rate: float
    pending_followups: int
    overdue_followups: int

    # Run-rate Projection
    projected_run_rate: float
    pace_status: str # "EXCEEDING" | "ON_TRACK" | "BEHIND_PACE" | "AT_RISK"

    badges: List[PerformanceBadge]

class LeaderboardSummary(BaseModel):
    month_year: str
    days_elapsed: int
    total_days: int

    total_org_target: float
    total_org_achieved: float
    org_achievement_percentage: float
    projected_org_run_rate: float
    org_pace_status: str

    podium: List[ExecutiveScorecard]
    rankings: List[ExecutiveScorecard]
