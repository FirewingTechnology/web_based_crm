import hmac
import hashlib
import time
from datetime import datetime, timezone, timedelta
from typing import Dict, Any, Optional
from sqlalchemy.orm import Session

from app.models.call import CallRecord, CallDirection, CallStatus, CallOutcome
from app.models.lead import Lead
from app.models.user import User, UserRole
from app.models.followup import Followup, FollowupType, FollowupStatus
from app.models.activity_log import ActivityLog
from app.services.sla_service import SLAService
from app.services.lead_health_service import update_lead_health
from app.config import settings

class CallService:

    @classmethod
    def log_call(
        cls,
        db: Session,
        lead_id: int,
        executive: User,
        phone_number: str,
        direction: str = CallDirection.OUTBOUND.value,
        call_status: str = CallStatus.CONNECTED.value,
        outcome: str = CallOutcome.INTERESTED.value,
        duration_seconds: int = 0,
        recording_url: Optional[str] = None,
        notes: Optional[str] = None,
        transcript_text: Optional[str] = None,
        ai_summary: Optional[str] = None,
        ai_next_action: Optional[str] = None
    ) -> CallRecord:
        """
        Logs a real telecom or VoIP call event to the CRM lead,
        satisfies SLA timers, creates next follow-up action, and updates health.
        """
        now = datetime.now(timezone.utc)

        lead_query = db.query(Lead).filter(
            Lead.id == lead_id,
            Lead.is_deleted == False
        )
        if executive.role != UserRole.SUPERADMIN and executive.organization_id:
            lead_query = lead_query.filter(
                (Lead.organization_id == executive.organization_id) | (Lead.organization_id.is_(None))
            )
        lead = lead_query.first()
        if not lead:
            raise ValueError("Lead not found or does not belong to your organization.")

        org_id = executive.organization_id or lead.organization_id or 1

        # Create Call Record
        record = CallRecord(
            organization_id=org_id,
            lead_id=lead.id,
            executive_id=executive.id,
            phone_number=phone_number or lead.phone,
            direction=direction,
            call_status=call_status,
            outcome=outcome,
            duration_seconds=duration_seconds,
            recording_url=recording_url,
            recording_consent_obtained=True,
            notes=notes,
            transcript_text=transcript_text,
            ai_summary=ai_summary,
            ai_next_action=ai_next_action,
            started_at=now - timedelta(seconds=duration_seconds),
            ended_at=now
        )
        db.add(record)
        db.flush()

        # Mark SLA First Response
        SLAService.mark_first_response(lead, db, channel="Call")
        lead.last_activity_at = now

        # Automated Follow-up Task Creation based on Call Outcome
        task_notes = None
        task_delta_days = 1
        if outcome == CallOutcome.SITE_VISIT_AGREED.value:
            task_notes = f"📅 Schedule Site Visit: {lead.name} agreed during call to tour properties."
            task_delta_days = 2
        elif outcome == CallOutcome.CALL_BACK.value:
            task_notes = f"📞 Call Back Requested: Follow up with {lead.name} regarding property preferences."
            task_delta_days = 1
        elif outcome == CallOutcome.INTERESTED.value:
            task_notes = f"✨ Send Inventory Options: Share project brochures and cost sheets with {lead.name}."
            task_delta_days = 1

        if task_notes:
            db.add(Followup(
                organization_id=org_id,
                lead_id=lead.id,
                assigned_to_id=executive.id,
                type=FollowupType.CALL,
                status=FollowupStatus.PENDING,
                title=f"Call Follow-up: {lead.name}",
                scheduled_at=now + timedelta(days=task_delta_days),
                notes=task_notes
            ))

        # Activity Log
        mins = duration_seconds // 60
        secs = duration_seconds % 60
        dur_str = f"{mins}m {secs}s" if mins > 0 else f"{secs}s"
        db.add(ActivityLog(
            user_id=executive.id,
            user_name=executive.name,
            action="LOG_CALL",
            module="Calls",
            details=f"{direction} call with {lead.name} ({dur_str}) - Outcome: {outcome}"
        ))

        # Update Lead Health Score
        update_lead_health(lead, db, now=now, commit=False)
        db.commit()
        db.refresh(record)

        return record

    @classmethod
    def generate_secure_playback_url(cls, call_id: int, user: User, db: Session) -> Dict[str, Any]:
        """
        Generates a lawful, signed temporary playback URL with access auditing.
        Recordings are strictly access-controlled and never exposed through public static paths.
        """
        query = db.query(CallRecord).filter(CallRecord.id == call_id)
        if user.role != UserRole.SUPERADMIN and user.organization_id:
            query = query.filter(CallRecord.organization_id == user.organization_id)
        record = query.first()
        if not record or not record.recording_url:
            raise ValueError("Call recording not found or access denied.")

        # Create time-limited signature valid for 15 minutes
        expires = int(time.time()) + 900
        data_to_sign = f"{call_id}:{user.id}:{expires}"
        sig = hmac.new(settings.SECRET_KEY.encode(), data_to_sign.encode(), hashlib.sha256).hexdigest()

        # Audit playback access
        db.add(ActivityLog(
            user_id=user.id,
            user_name=user.name,
            action="PLAY_CALL_RECORDING",
            module="Compliance",
            details=f"Authorized playback access for Call #{call_id} (Lead #{record.lead_id})"
        ))
        db.commit()

        signed_url = f"/api/v1/calls/{call_id}/stream?token={sig}&expires={expires}&user_id={user.id}"
        return {
            "call_id": call_id,
            "signed_stream_url": signed_url,
            "expires_in_seconds": 900,
            "duration_seconds": record.duration_seconds
        }
