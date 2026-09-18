import enum
from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Text, Boolean, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from app.database import BaseModel

class SourceType(str, enum.Enum):
    META = "Meta"
    HOUSING = "Housing"
    NINETY_NINE_ACRES = "99acres"
    WEBSITE = "Website"
    WHATSAPP = "WhatsApp"
    GENERIC_WEBHOOK = "Generic Webhook"
    MANUAL = "Manual"
    CSV_IMPORT = "CSV Import"
    REFERRAL = "Referral"
    WALK_IN = "Walk-in"

class EventProcessingStatus(str, enum.Enum):
    PENDING = "Pending"
    PROCESSED = "Processed"
    DUPLICATE_ATTACHED = "Duplicate Attached"
    FAILED = "Failed"
    IGNORED = "Ignored"

class LeadSourceIntegration(BaseModel):
    __tablename__ = "lead_source_integrations"

    id = Column(Integer, primary_key=True, index=True)
    organization_id = Column(Integer, ForeignKey("organizations.id"), nullable=False, index=True)
    name = Column(String(150), nullable=False) # e.g. "Housing - Baner Luxury"
    source_type = Column(String(50), default=SourceType.GENERIC_WEBHOOK.value, nullable=False, index=True)
    is_active = Column(Boolean, default=True, nullable=False)
    
    webhook_secret = Column(String(100), nullable=True)
    api_key = Column(String(255), nullable=True)
    
    default_project_id = Column(Integer, ForeignKey("projects.id"), nullable=True)
    default_assigned_to_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    default_priority = Column(String(20), default="Medium", nullable=False)
    sla_minutes = Column(Integer, default=15, nullable=False) # Default 15m response SLA
    
    config_json = Column(Text, nullable=True) # JSON field mapping, campaign IDs, form IDs
    
    # Live Integration Health
    total_received = Column(Integer, default=0, nullable=False)
    total_processed = Column(Integer, default=0, nullable=False)
    failed_events_count = Column(Integer, default=0, nullable=False)
    last_event_at = Column(DateTime, nullable=True)
    last_sync_status = Column(String(50), default="CONNECTED", nullable=False) # CONNECTED, DEGRADED, ERROR
    error_summary = Column(Text, nullable=True)

    # Relationships
    organization = relationship("Organization")
    default_project = relationship("Project")
    default_assigned_to = relationship("User")
    events = relationship("LeadSourceEvent", back_populates="integration", cascade="all, delete-orphan")

class LeadSourceEvent(BaseModel):
    __tablename__ = "lead_source_events"

    id = Column(Integer, primary_key=True, index=True)
    organization_id = Column(Integer, ForeignKey("organizations.id"), nullable=False, index=True)
    integration_id = Column(Integer, ForeignKey("lead_source_integrations.id"), nullable=True, index=True)
    
    external_event_id = Column(String(200), nullable=True, index=True) # For idempotency deduplication
    source_type = Column(String(50), nullable=False, index=True)
    raw_payload = Column(Text, nullable=False)
    parsed_payload = Column(Text, nullable=True)
    
    status = Column(String(50), default=EventProcessingStatus.PENDING.value, nullable=False, index=True)
    lead_id = Column(Integer, ForeignKey("leads.id"), nullable=True, index=True)
    is_duplicate = Column(Boolean, default=False, nullable=False)
    duplicate_match_field = Column(String(50), nullable=True) # phone, email, etc.
    
    error_message = Column(Text, nullable=True)
    received_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    processed_at = Column(DateTime, nullable=True)

    integration = relationship("LeadSourceIntegration", back_populates="events")
    lead = relationship("Lead")
