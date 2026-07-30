from datetime import datetime
from pydantic import BaseModel
from app.models.followup import FollowupType, FollowupStatus

class FollowupBase(BaseModel):
    lead_id: int
    assigned_to_id: int
    type: FollowupType = FollowupType.CALL
    title: str
    scheduled_at: datetime
    notes: str | None = None

class FollowupCreate(FollowupBase):
    pass

class FollowupUpdate(BaseModel):
    type: FollowupType | None = None
    title: str | None = None
    scheduled_at: datetime | None = None
    status: FollowupStatus | None = None
    notes: str | None = None
    outcome: str | None = None

class FollowupResponse(FollowupBase):
    id: int
    status: FollowupStatus
    completed_at: datetime | None = None
    outcome: str | None = None
    lead_name: str | None = None
    lead_phone: str | None = None
    assigned_to_name: str | None = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
