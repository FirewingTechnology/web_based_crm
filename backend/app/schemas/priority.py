from typing import Optional, List
from pydantic import BaseModel

class PriorityItemSchema(BaseModel):
    id: str
    type: str
    priority_rank: int
    badge_label: str
    title: str
    lead_id: int
    lead_name: str
    lead_phone: str
    deal_value: float
    status: str
    scheduled_at: Optional[str] = None
    due_label: str
    reason: str
    recommended_action: str
    health_score: int
    health_category: str
    assigned_to_name: Optional[str] = None

class TodayPrioritiesResponse(BaseModel):
    total_priorities: int
    overdue_count: int
    today_actions_count: int
    post_visit_count: int
    hot_leads_count: int
    closing_count: int
    risk_count: int
    items: List[PriorityItemSchema]
