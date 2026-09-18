from datetime import datetime, timezone, timedelta
from typing import Dict, List, Optional
from sqlalchemy.orm import Session
from app.models.lead import Lead, LeadStatus
from app.models.user import User, UserRole
from app.models.notification import Notification

class SLAService:

    @classmethod
    def mark_first_response(cls, lead: Lead, db: Session, channel: str = "Call") -> bool:
        """
        Marks the first response timestamp when an executive contacts a lead via call,
        WhatsApp, or notes, successfully completing or recording the SLA outcome.
        """
        if lead.first_response_at is not None:
            return False # Already responded

        now = datetime.now(timezone.utc)
        lead.first_response_at = now
        lead.last_activity_at = now

        if lead.sla_deadline and now <= lead.sla_deadline:
            lead.sla_status = "MET"
        else:
            lead.sla_status = "BREACHED"

        return True

    @classmethod
    def evaluate_sla_and_escalate(cls, db: Session, organization_id: Optional[int] = None) -> Dict[str, int]:
        """
        Evaluates active leads with pending response SLAs and escalates breaches:
        - Breach <= 30m: Informs Sales Manager
        - Breach > 30m: Critical Escalation to Org Admin
        """
        now = datetime.now(timezone.utc)
        cutoff_24h = now - timedelta(hours=24)

        query = db.query(Lead).filter(
            Lead.is_deleted == False,
            Lead.first_response_at.is_(None),
            Lead.sla_deadline.isnot(None),
            Lead.status.notin_([LeadStatus.BOOKED, LeadStatus.LOST, "Booked", "Lost"])
        )
        if organization_id:
            query = query.filter(Lead.organization_id == organization_id)

        pending_leads = query.all()

        breached_count = 0
        reminded_count = 0

        for l in pending_leads:
            deadline = l.sla_deadline
            if deadline.tzinfo is None:
                deadline = deadline.replace(tzinfo=timezone.utc)

            # Check if breached
            if now > deadline:
                l.sla_status = "BREACHED"
                breached_count += 1
                breach_minutes = int((now - deadline).total_seconds() / 60)

                # Find managers & admins for escalation
                managers = db.query(User).filter(
                    User.organization_id == l.organization_id,
                    User.role.in_([UserRole.MANAGER, UserRole.ADMIN]),
                    User.is_active == True,
                    User.is_deleted == False
                ).all()

                # Deduplicate escalation within last 4 hours
                existing_esc = db.query(Notification).filter(
                    Notification.entity_type == "LEAD_SLA",
                    Notification.entity_id == l.id,
                    Notification.created_at >= (now - timedelta(hours=4)),
                    Notification.is_deleted == False
                ).first()

                if not existing_esc and managers:
                    severity = "CRITICAL" if breach_minutes >= 30 else "HIGH"
                    title = f"⏰ SLA Breach Escalation: {l.name} ({breach_minutes}m Overdue)"
                    msg = (
                        f"Lead from {l.source} assigned to {l.assigned_to.name if l.assigned_to else 'Unassigned'} "
                        f"exceeded response SLA by {breach_minutes} minutes. Immediate outreach or re-assignment required."
                    )

                    for m in managers:
                        db.add(Notification(
                            organization_id=l.organization_id,
                            user_id=m.id,
                            title=title,
                            message=msg,
                            type="critical" if severity == "CRITICAL" else "warning",
                            severity=severity,
                            action_url=f"/leads?lead_id={l.id}",
                            entity_type="LEAD_SLA",
                            entity_id=l.id
                        ))

            # Upcoming reminder: within 5 minutes of deadline
            elif (deadline - now).total_seconds() <= 300 and l.assigned_to_id:
                existing_rem = db.query(Notification).filter(
                    Notification.entity_type == "LEAD_SLA_REMINDER",
                    Notification.entity_id == l.id,
                    Notification.is_deleted == False
                ).first()

                if not existing_rem:
                    reminded_count += 1
                    db.add(Notification(
                        organization_id=l.organization_id,
                        user_id=l.assigned_to_id,
                        title=f"⚡ Action Required: {l.name} SLA expires soon",
                        message=f"You have less than 5 minutes remaining to reach out to {l.name} before SLA escalates to manager.",
                        type="warning",
                        severity="MEDIUM",
                        action_url=f"/leads?lead_id={l.id}",
                        entity_type="LEAD_SLA_REMINDER",
                        entity_id=l.id
                    ))

        if breached_count > 0 or reminded_count > 0:
            db.commit()

        return {"breached_escalated": breached_count, "reminders_sent": reminded_count}
