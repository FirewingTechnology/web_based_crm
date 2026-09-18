import enum
from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Text, Boolean, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from app.database import BaseModel

class AutomationEventTrigger(str, enum.Enum):
    LEAD_INGESTED = "LEAD_INGESTED"
    SLA_BREACHED = "SLA_BREACHED"
    CALL_COMPLETED = "CALL_COMPLETED"
    SITE_VISIT_SCHEDULED = "SITE_VISIT_SCHEDULED"
    SITE_VISIT_COMPLETED = "SITE_VISIT_COMPLETED"
    BOOKING_CREATED = "BOOKING_CREATED"
    COMMISSION_OVERDUE = "COMMISSION_OVERDUE"

class AutomationRule(BaseModel):
    __tablename__ = "automation_rules"

    id = Column(Integer, primary_key=True, index=True)
    organization_id = Column(Integer, ForeignKey("organizations.id"), nullable=False, index=True)
    name = Column(String(150), nullable=False)
    description = Column(Text, nullable=True)
    
    event_trigger = Column(String(50), nullable=False, index=True)
    conditions_json = Column(Text, nullable=False) # JSON: array of {field, op, value}
    actions_json = Column(Text, nullable=False) # JSON: array of {action, params}
    
    is_active = Column(Boolean, default=True, nullable=False)
    execution_count = Column(Integer, default=0, nullable=False)
    last_executed_at = Column(DateTime, nullable=True)

    organization = relationship("Organization")
