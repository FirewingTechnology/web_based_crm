from pydantic import BaseModel
from typing import List, Optional

class CriteriaMatchDetail(BaseModel):
    criterion: str  # Budget, Location, Configuration, Developer/Timeline
    status: str     # MATCHED, PARTIAL, MISMATCHED, UNSPECIFIED
    score_percentage: float
    detail: str

class LeadInventoryMatch(BaseModel):
    project_id: int
    project_name: str
    builder_name: str
    location: str
    configuration: str
    min_price: float
    max_price: float
    possession_date: Optional[str] = None
    status: str
    brochure_url: Optional[str] = None
    rera_id: Optional[str] = None
    match_score: int  # 0 to 100
    match_tier: str   # EXCELLENT_MATCH, GOOD_MATCH, PARTIAL_MATCH, LOW_MATCH
    criteria_breakdown: List[CriteriaMatchDetail]
    match_reasons: List[str]
    gap_reasons: List[str]
    whatsapp_pitch: str
    recommended_action: str

class LeadInventoryMatchResponse(BaseModel):
    lead_id: int
    lead_name: str
    buyer_budget: str
    buyer_location: Optional[str] = None
    buyer_configuration: Optional[str] = None
    total_projects_evaluated: int
    matches: List[LeadInventoryMatch]

class MatchedLeadItem(BaseModel):
    lead_id: int
    lead_name: str
    phone: str
    email: Optional[str] = None
    status: str
    assigned_to_name: Optional[str] = None
    budget_range: str
    preferred_location: Optional[str] = None
    preferred_configuration: Optional[str] = None
    match_score: int
    match_tier: str
    match_reasons: List[str]
    gap_reasons: List[str]
    whatsapp_pitch: str

class ProjectMatchingLeadsResponse(BaseModel):
    project_id: int
    project_name: str
    builder_name: str
    total_leads_evaluated: int
    matched_leads: List[MatchedLeadItem]
