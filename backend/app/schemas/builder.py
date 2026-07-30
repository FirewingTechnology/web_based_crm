from datetime import datetime
from pydantic import BaseModel

class BuilderBase(BaseModel):
    name: str
    company: str
    contact_person: str
    phone: str
    email: str
    address: str | None = None
    commission_rate: float = 3.0
    notes: str | None = None

class BuilderCreate(BuilderBase):
    pass

class BuilderUpdate(BaseModel):
    name: str | None = None
    company: str | None = None
    contact_person: str | None = None
    phone: str | None = None
    email: str | None = None
    address: str | None = None
    commission_rate: float | None = None
    notes: str | None = None

class BuilderResponse(BuilderBase):
    id: int
    created_at: datetime
    updated_at: datetime
    projects_count: int = 0

    class Config:
        from_attributes = True
