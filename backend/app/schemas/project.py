from datetime import datetime
from pydantic import BaseModel
from app.models.project import ProjectStatus

class ProjectBase(BaseModel):
    name: str
    builder_id: int | None = None
    location: str
    configuration: str
    min_price: float
    max_price: float
    possession_date: str | None = None
    rera_id: str | None = None
    status: ProjectStatus = ProjectStatus.UNDER_CONSTRUCTION
    amenities: str | None = None
    brochure_url: str | None = None
    description: str | None = None

class ProjectCreate(ProjectBase):
    new_builder_name: str | None = None

class ProjectUpdate(BaseModel):
    name: str | None = None
    builder_id: int | None = None
    location: str | None = None
    configuration: str | None = None
    min_price: float | None = None
    max_price: float | None = None
    possession_date: str | None = None
    rera_id: str | None = None
    status: ProjectStatus | None = None
    amenities: str | None = None
    brochure_url: str | None = None
    description: str | None = None

class ProjectResponse(ProjectBase):
    id: int
    builder_name: str | None = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
