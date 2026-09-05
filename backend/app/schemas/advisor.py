from typing import Optional, List
from pydantic import BaseModel

class NextBestActionResponse(BaseModel):
    lead_id: int
    lead_name: str
    current_status: str
    suggested_next_status: Optional[str] = None
    primary_action: str
    suggested_channel: str
    urgency: str
    talking_points: List[str]
    stage_progression_readiness: bool
    blockers: List[str]
    health_score: int
    health_category: str
