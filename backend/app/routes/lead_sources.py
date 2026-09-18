import json
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.lead_source import LeadSourceIntegration, LeadSourceEvent, SourceType
from app.models.user import User, UserRole
from app.middleware.auth_middleware import get_current_user, RequireRole

router = APIRouter(prefix="/lead-sources", tags=["Lead Source Integrations"])

class LeadSourceCreate(BaseModel):
    name: str
    source_type: str
    webhook_secret: Optional[str] = None
    api_key: Optional[str] = None
    default_project_id: Optional[int] = None
    default_assigned_to_id: Optional[int] = None
    default_priority: str = "Medium"
    sla_minutes: int = 15
    config_json: Optional[str] = None

class LeadSourceUpdate(BaseModel):
    name: Optional[str] = None
    is_active: Optional[bool] = None
    webhook_secret: Optional[str] = None
    api_key: Optional[str] = None
    default_project_id: Optional[int] = None
    default_assigned_to_id: Optional[int] = None
    default_priority: Optional[str] = None
    sla_minutes: Optional[int] = None
    config_json: Optional[str] = None

class LeadSourceResponse(BaseModel):
    id: int
    organization_id: int
    name: str
    source_type: str
    is_active: bool
    webhook_url: str
    default_project_id: Optional[int] = None
    default_project_name: Optional[str] = None
    default_assigned_to_id: Optional[int] = None
    default_assigned_to_name: Optional[str] = None
    default_priority: str
    sla_minutes: int
    total_received: int
    total_processed: int
    failed_events_count: int
    last_sync_status: str
    last_event_at: Optional[str] = None

    class Config:
        from_attributes = True

@router.get("", response_model=List[LeadSourceResponse])
def list_lead_sources(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Lists all configured lead sources, credentials, and live health metrics for the organization."""
    query = db.query(LeadSourceIntegration).filter(
        LeadSourceIntegration.is_deleted == False
    )
    if current_user.role != UserRole.SUPERADMIN and current_user.organization_id:
        query = query.filter(LeadSourceIntegration.organization_id == current_user.organization_id)

    items = query.all()
    results = []
    for it in items:
        res = LeadSourceResponse(
            id=it.id,
            organization_id=it.organization_id,
            name=it.name,
            source_type=it.source_type,
            is_active=it.is_active,
            webhook_url=f"https://web-based-crm.onrender.com/api/v1/ingest/webhook/{it.id}",
            default_project_id=it.default_project_id,
            default_project_name=it.default_project.name if it.default_project else None,
            default_assigned_to_id=it.default_assigned_to_id,
            default_assigned_to_name=it.default_assigned_to.name if it.default_assigned_to else None,
            default_priority=it.default_priority,
            sla_minutes=it.sla_minutes,
            total_received=it.total_received or 0,
            total_processed=it.total_processed or 0,
            failed_events_count=it.failed_events_count or 0,
            last_sync_status=it.last_sync_status or "CONNECTED",
            last_event_at=it.last_event_at.isoformat() if it.last_event_at else None
        )
        results.append(res)
    return results

@router.post("", response_model=LeadSourceResponse, status_code=status.HTTP_201_CREATED)
def create_lead_source(
    payload: LeadSourceCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(RequireRole([UserRole.ADMIN, UserRole.MANAGER]))
):
    """Provisions a new real-time lead source integration with dedicated webhook endpoint."""
    integration = LeadSourceIntegration(
        organization_id=current_user.organization_id or 1,
        name=payload.name,
        source_type=payload.source_type,
        webhook_secret=payload.webhook_secret,
        api_key=payload.api_key,
        default_project_id=payload.default_project_id,
        default_assigned_to_id=payload.default_assigned_to_id,
        default_priority=payload.default_priority,
        sla_minutes=payload.sla_minutes,
        config_json=payload.config_json,
        last_sync_status="CONNECTED"
    )
    db.add(integration)
    db.commit()
    db.refresh(integration)

    return LeadSourceResponse(
        id=integration.id,
        organization_id=integration.organization_id,
        name=integration.name,
        source_type=integration.source_type,
        is_active=integration.is_active,
        webhook_url=f"https://web-based-crm.onrender.com/api/v1/ingest/webhook/{integration.id}",
        default_project_id=integration.default_project_id,
        default_project_name=integration.default_project.name if integration.default_project else None,
        default_assigned_to_id=integration.default_assigned_to_id,
        default_assigned_to_name=integration.default_assigned_to.name if integration.default_assigned_to else None,
        default_priority=integration.default_priority,
        sla_minutes=integration.sla_minutes,
        total_received=0,
        total_processed=0,
        failed_events_count=0,
        last_sync_status="CONNECTED",
        last_event_at=None
    )

@router.put("/{source_id}", response_model=LeadSourceResponse)
def update_lead_source(
    source_id: int,
    payload: LeadSourceUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(RequireRole([UserRole.ADMIN, UserRole.MANAGER]))
):
    """Updates lead source parameters, SLA thresholds, or toggles active status."""
    integration = db.query(LeadSourceIntegration).filter(
        LeadSourceIntegration.id == source_id,
        LeadSourceIntegration.is_deleted == False
    )
    if current_user.role != UserRole.SUPERADMIN:
        integration = integration.filter(LeadSourceIntegration.organization_id == current_user.organization_id)
    it = integration.first()
    if not it:
        raise HTTPException(status_code=404, detail="Lead source not found")

    for k, v in payload.model_dump(exclude_unset=True).items():
        setattr(it, k, v)

    db.commit()
    db.refresh(it)

    return LeadSourceResponse(
        id=it.id,
        organization_id=it.organization_id,
        name=it.name,
        source_type=it.source_type,
        is_active=it.is_active,
        webhook_url=f"https://web-based-crm.onrender.com/api/v1/ingest/webhook/{it.id}",
        default_project_id=it.default_project_id,
        default_project_name=it.default_project.name if it.default_project else None,
        default_assigned_to_id=it.default_assigned_to_id,
        default_assigned_to_name=it.default_assigned_to.name if it.default_assigned_to else None,
        default_priority=it.default_priority,
        sla_minutes=it.sla_minutes,
        total_received=it.total_received or 0,
        total_processed=it.total_processed or 0,
        failed_events_count=it.failed_events_count or 0,
        last_sync_status=it.last_sync_status or "CONNECTED",
        last_event_at=it.last_event_at.isoformat() if it.last_event_at else None
    )

@router.get("/{source_id}/events")
def list_lead_source_events(
    source_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Returns the immutable idempotency and ingestion event log for an integration."""
    events = db.query(LeadSourceEvent).filter(
        LeadSourceEvent.integration_id == source_id,
        LeadSourceEvent.organization_id == current_user.organization_id
    ).order_by(LeadSourceEvent.id.desc()).limit(50).all()

    return [{
        "id": ev.id,
        "external_event_id": ev.external_event_id,
        "source_type": ev.source_type,
        "status": ev.status,
        "lead_id": ev.lead_id,
        "is_duplicate": ev.is_duplicate,
        "duplicate_match_field": ev.duplicate_match_field,
        "received_at": ev.received_at.isoformat() if ev.received_at else None,
        "error_message": ev.error_message
    } for ev in events]
