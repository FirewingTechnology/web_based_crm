from datetime import datetime
from pydantic import BaseModel, EmailStr
from app.models.lead import LeadStatus, LeadPriority
from app.schemas.user import UserResponse

class LeadNoteCreate(BaseModel):
    note_text: str

class LeadNoteResponse(BaseModel):
    id: int
    lead_id: int
    created_by_id: int
    author_name: str | None = None
    note_text: str
    created_at: datetime

    class Config:
        from_attributes = True

class LeadStatusHistoryResponse(BaseModel):
    id: int
    lead_id: int
    changed_by_id: int
    changed_by_name: str | None = None
    old_status: str | None = None
    new_status: str
    remarks: str | None = None
    created_at: datetime

    class Config:
        from_attributes = True

class LeadBase(BaseModel):
    name: str
    phone: str
    email: EmailStr | None = None
    source: str = "Direct"
    status: LeadStatus = LeadStatus.NEW
    priority: LeadPriority = LeadPriority.MEDIUM
    budget_min: float | None = None
    budget_max: float | None = None
    preferred_location: str | None = None
    preferred_configuration: str | None = None
    preferred_project_id: int | None = None
    assigned_to_id: int | None = None
    tags: str | None = None

class LeadCreate(LeadBase):
    initial_note: str | None = None

class LeadUpdate(BaseModel):
    name: str | None = None
    phone: str | None = None
    email: EmailStr | None = None
    source: str | None = None
    status: LeadStatus | None = None
    priority: LeadPriority | None = None
    budget_min: float | None = None
    budget_max: float | None = None
    preferred_location: str | None = None
    preferred_configuration: str | None = None
    preferred_project_id: int | None = None
    assigned_to_id: int | None = None
    tags: str | None = None
    lost_reason: str | None = None
    postponement_count: int | None = None

class LeadResponse(LeadBase):
    id: int
    created_by_id: int | None = None
    assigned_to_name: str | None = None
    created_by_name: str | None = None
    preferred_project_name: str | None = None
    created_at: datetime
    updated_at: datetime
    notes_list: list[LeadNoteResponse] = []
    history_list: list[LeadStatusHistoryResponse] = []

    # Health & Leakage Engine
    health_score: int = 100
    health_category: str = "Healthy"
    health_reasons: list[str] = []
    recommended_action: str | None = None
    last_activity_at: datetime | None = None
    stage_entered_at: datetime | None = None
    postponement_count: int = 0
    lost_reason: str | None = None

    class Config:
        from_attributes = True

class LeadHealthDetailResponse(BaseModel):
    lead_id: int
    lead_name: str
    health_score: int
    health_category: str
    health_reasons: list[str]
    recommended_action: str | None
    is_high_value: bool
    days_in_stage: int
    days_since_last_activity: int

class LeakageReasonCount(BaseModel):
    reason: str
    count: int

class LeadHealthSummaryResponse(BaseModel):
    total_leads: int
    excellent_count: int
    healthy_count: int
    at_risk_count: int
    critical_count: int
    lost_risk_count: int
    pipeline_value_at_risk: float
    high_value_at_risk_count: int
    top_leakage_reasons: list[LeakageReasonCount]

