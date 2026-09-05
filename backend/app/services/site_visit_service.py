import random
from datetime import datetime, timezone
from typing import Optional, Dict, Any
from sqlalchemy.orm import Session

from app.models.site_visit import SiteVisit, SiteVisitStatus, BuyerInterestLevel
from app.models.lead import Lead, LeadStatus
from app.models.user import User
from app.models.project import Project
from app.models.followup import Followup, FollowupType, FollowupStatus
from app.models.activity_log import ActivityLog
from app.schemas.site_visit import SiteVisitCreate
from app.services.lead_health_service import update_lead_health

def generate_otp() -> str:
    """Generates a 4-digit verification code for client pickup / site check-in."""
    return str(random.randint(1000, 9999))

def schedule_site_visit(
    db: Session,
    payload: SiteVisitCreate,
    current_user: User
) -> SiteVisit:
    """
    Schedules a new VIP Site Visit, provisions OTP, links executive/chauffeur,
    syncs lead status to 'Site Visit Scheduled', and logs initial calendar task.
    """
    now = datetime.now(timezone.utc).replace(tzinfo=None)
    lead = db.query(Lead).filter(Lead.id == payload.lead_id).first()
    if not lead:
        raise ValueError("Lead not found")
        
    project = db.query(Project).filter(Project.id == payload.project_id).first()
    if not project:
        raise ValueError("Project not found")

    exec_id = payload.sales_executive_id or lead.assigned_to_id or current_user.id
    otp = generate_otp()

    visit = SiteVisit(
        organization_id=lead.organization_id or current_user.organization_id,
        lead_id=lead.id,
        project_id=project.id,
        sales_executive_id=exec_id,
        scheduled_at=payload.scheduled_at,
        pickup_location=payload.pickup_location,
        pickup_time=payload.pickup_time,
        driver_name=payload.driver_name,
        driver_phone=payload.driver_phone,
        cab_vehicle_number=payload.cab_vehicle_number,
        otp_code=otp,
        is_otp_verified=False,
        status=SiteVisitStatus.SCHEDULED
    )
    db.add(visit)

    # Advance Lead Status to Site Visit Scheduled
    lead.status = LeadStatus.SITE_VISIT
    lead.stage_entered_at = now
    lead.last_activity_at = now

    # Also create/sync corresponding Followup calendar record
    followup = Followup(
        organization_id=lead.organization_id,
        lead_id=lead.id,
        assigned_to_id=exec_id,
        type=FollowupType.SITE_VISIT,
        status=FollowupStatus.PENDING,
        title=f"VIP Site Visit: {lead.name} to {project.name}",
        scheduled_at=payload.scheduled_at,
        notes=f"Pickup: {payload.pickup_location or 'Direct Walk-in'}. Driver: {payload.driver_name or 'N/A'}. OTP: {otp}"
    )
    db.add(followup)

    update_lead_health(lead, db, commit=False)

    activity = ActivityLog(
        user_id=current_user.id,
        user_name=current_user.name,
        action="SITE_VISIT_SCHEDULED",
        module="Site Visits",
        details=f"Scheduled site visit for {lead.name} to {project.name} on {payload.scheduled_at.strftime('%d %b %Y %I:%M %p')}"
    )
    db.add(activity)

    db.commit()
    db.refresh(visit)
    return visit

def verify_visit_otp(
    db: Session,
    visit: SiteVisit,
    otp_input: str,
    current_user: User
) -> bool:
    """Verifies client arrival OTP code and transitions status to In Transit/Verified."""
    if visit.otp_code.strip() != otp_input.strip():
        return False

    now = datetime.now(timezone.utc).replace(tzinfo=None)
    visit.is_otp_verified = True
    if visit.status == SiteVisitStatus.SCHEDULED:
        visit.status = SiteVisitStatus.IN_TRANSIT

    activity = ActivityLog(
        user_id=current_user.id,
        user_name=current_user.name,
        action="SITE_VISIT_OTP_VERIFIED",
        module="Site Visits",
        details=f"Verified OTP {otp_input} for site visit #{visit.id}"
    )
    db.add(activity)
    db.commit()
    db.refresh(visit)
    return True

def record_visit_completion(
    db: Session,
    visit: SiteVisit,
    status_str: str,
    feedback_rating: Optional[int] = None,
    buyer_interest_level: Optional[str] = None,
    preferred_unit: Optional[str] = None,
    discussion_notes: Optional[str] = None,
    auto_advance_lead: bool = True,
    current_user: Optional[User] = None
) -> SiteVisit:
    """Records final visit outcome, customer rating, and auto-advances lead pipeline."""
    now = datetime.now(timezone.utc).replace(tzinfo=None)
    
    # Map status
    visit.status = getattr(SiteVisitStatus, status_str.upper().replace(" ", "_"), SiteVisitStatus.COMPLETED)
    if visit.status == SiteVisitStatus.COMPLETED:
        visit.completed_at = now
        visit.is_otp_verified = True

    if feedback_rating:
        visit.feedback_rating = feedback_rating
    if buyer_interest_level:
        visit.buyer_interest_level = getattr(BuyerInterestLevel, buyer_interest_level.upper().replace(" ", "_"), BuyerInterestLevel.WARM)
    if preferred_unit:
        visit.preferred_unit = preferred_unit
    if discussion_notes:
        visit.discussion_notes = discussion_notes

    lead = visit.lead
    if lead:
        lead.last_activity_at = now
        # Auto-advance pipeline to Negotiation if client visited and is positive
        if auto_advance_lead and visit.status == SiteVisitStatus.COMPLETED:
            lead.status = LeadStatus.NEGOTIATION
            lead.stage_entered_at = now

        update_lead_health(lead, db, commit=False)

    # Sync calendar followup
    pending_followup = db.query(Followup).filter(
        Followup.lead_id == visit.lead_id,
        Followup.type == FollowupType.SITE_VISIT,
        Followup.status == FollowupStatus.PENDING
    ).first()
    if pending_followup:
        pending_followup.status = FollowupStatus.COMPLETED
        pending_followup.completed_at = now
        pending_followup.outcome = f"Rating: {feedback_rating}/5. Interest: {buyer_interest_level}. Unit: {preferred_unit}"

    db.commit()
    db.refresh(visit)
    return visit
