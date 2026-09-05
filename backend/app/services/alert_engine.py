from datetime import datetime, timezone, timedelta
from typing import List, Dict
from sqlalchemy.orm import Session
from app.models.user import User, UserRole
from app.models.lead import Lead, LeadStatus
from app.models.site_visit import SiteVisit, SiteVisitStatus
from app.models.commission import Commission, CommissionStage
from app.models.notification import Notification
from app.models.activity_log import ActivityLog

def _normalize_dt(dt: datetime | None) -> datetime | None:
    if dt is not None and dt.tzinfo is not None:
        return dt.replace(tzinfo=None)
    return dt

class AlertEngine:

    @staticmethod
    def evaluate_and_generate_alerts(db: Session, current_user: User) -> Dict[str, int]:
        """
        Scans leads, site visits, and commissions for revenue leakage risks,
        and generates prioritized, deduplicated notifications.
        """
        now = _normalize_dt(datetime.now(timezone.utc))
        cutoff_24h = now - timedelta(hours=24)

        created_count = 0

        # Scope targets: notify relevant users (organization admins and assigned reps)
        target_org_id = current_user.organization_id

        # Find org admins to receive supervisory alerts
        admin_users_q = db.query(User).filter(
            User.role.in_([UserRole.ADMIN, UserRole.MANAGER]),
            User.is_active == True,
            User.is_deleted == False
        )
        if target_org_id:
            admin_users_q = admin_users_q.filter(User.organization_id == target_org_id)
        org_admins = admin_users_q.all()
        if not org_admins:
            org_admins = [current_user]

        # 1. High-Value Leads at Risk (CRITICAL)
        leads_q = db.query(Lead).filter(
            Lead.is_deleted == False,
            Lead.status.notin_([LeadStatus.BOOKED, LeadStatus.LOST, "Booked", "Lost"])
        )
        if target_org_id:
            leads_q = leads_q.filter(Lead.organization_id == target_org_id)

        leads = leads_q.all()
        for l in leads:
            is_high_value = (l.budget_max or l.budget_min or 0) >= 10000000.0 # 1 Cr+
            is_unhealthy = (l.health_score is not None and l.health_score < 40)

            if is_high_value and is_unhealthy:
                # Check deduplication
                existing = db.query(Notification).filter(
                    Notification.entity_type == "LEAD",
                    Notification.entity_id == l.id,
                    Notification.created_at >= cutoff_24h,
                    Notification.is_deleted == False
                ).first()

                if not existing:
                    recipients = org_admins[:]
                    if l.assigned_to and l.assigned_to not in recipients:
                        recipients.append(l.assigned_to)

                    for rec in recipients:
                        db.add(Notification(
                            organization_id=l.organization_id,
                            user_id=rec.id,
                            title=f"🚨 High-Value Buyer at Risk: {l.name}",
                            message=f"₹{((l.budget_max or 10000000)/10000000):.1f} Cr buyer has low health score ({l.health_score or 0}/100) with stalled follow-up. Immediate outreach advised.",
                            type="critical",
                            severity="CRITICAL",
                            action_url=f"/leads?lead_id={l.id}",
                            entity_type="LEAD",
                            entity_id=l.id
                        ))
                        created_count += 1

        # 2. Overdue Site Visits (HIGH)
        one_hour_ago = now - timedelta(hours=1)
        visits_q = db.query(SiteVisit).filter(
            SiteVisit.status.in_([SiteVisitStatus.SCHEDULED, "Scheduled", SiteVisitStatus.IN_TRANSIT, "In Transit"]),
            SiteVisit.scheduled_at <= one_hour_ago,
            SiteVisit.is_deleted == False
        )
        if target_org_id:
            visits_q = visits_q.filter(SiteVisit.organization_id == target_org_id)

        overdue_visits = visits_q.all()
        for v in overdue_visits:
            existing = db.query(Notification).filter(
                Notification.entity_type == "SITE_VISIT",
                Notification.entity_id == v.id,
                Notification.created_at >= cutoff_24h,
                Notification.is_deleted == False
            ).first()

            if not existing:
                recipients = org_admins[:]
                if v.sales_executive and v.sales_executive not in recipients:
                    recipients.append(v.sales_executive)

                for rec in recipients:
                    db.add(Notification(
                        organization_id=v.organization_id,
                        user_id=rec.id,
                        title=f"⏰ Overdue Site Visit: {v.lead.name if v.lead else 'Buyer'}",
                        message=f"Site visit to {v.project.name if v.project else 'Project'} scheduled for {v.scheduled_at.strftime('%d %b %I:%M %p')} has not been verified or completed.",
                        type="warning",
                        severity="HIGH",
                        action_url="/site-visits",
                        entity_type="SITE_VISIT",
                        entity_id=v.id
                    ))
                    created_count += 1

        # 3. Overdue Builder Commission Invoices (HIGH / CRITICAL)
        comm_q = db.query(Commission).filter(
            Commission.stage.notin_([CommissionStage.PAID, "PAID", "Paid"]),
            Commission.is_deleted == False
        )
        if target_org_id:
            comm_q = comm_q.filter(Commission.organization_id == target_org_id)

        overdue_comms = [c for c in comm_q.all() if (c.days_overdue or 0) >= 30]
        for c in overdue_comms:
            existing = db.query(Notification).filter(
                Notification.entity_type == "COMMISSION",
                Notification.entity_id == c.id,
                Notification.created_at >= cutoff_24h,
                Notification.is_deleted == False
            ).first()

            if not existing:
                severity = "CRITICAL" if c.days_overdue >= 60 else "HIGH"
                builder_name = c.booking.builder.name if c.booking and c.booking.builder else "Builder"
                for rec in org_admins:
                    db.add(Notification(
                        organization_id=c.organization_id,
                        user_id=rec.id,
                        title=f"💰 Aging Commission Overdue: {builder_name}",
                        message=f"₹{(c.net_receivable or c.builder_commission_amount):,.0f} receivable from {builder_name} is {c.days_overdue} days overdue ({c.aging_bucket}). Follow up on payment clearance.",
                        type="warning",
                        severity=severity,
                        action_url="/commissions",
                        entity_type="COMMISSION",
                        entity_id=c.id
                    ))
                    created_count += 1

        # 4. Unassigned Incoming Inquiries (MEDIUM)
        unassigned_q = db.query(Lead).filter(
            Lead.assigned_to_id.is_(None),
            Lead.created_at >= (now - timedelta(hours=48)),
            Lead.is_deleted == False
        )
        if target_org_id:
            unassigned_q = unassigned_q.filter(Lead.organization_id == target_org_id)

        unassigned_leads = unassigned_q.all()
        for u in unassigned_leads:
            existing = db.query(Notification).filter(
                Notification.entity_type == "LEAD_UNASSIGNED",
                Notification.entity_id == u.id,
                Notification.created_at >= cutoff_24h,
                Notification.is_deleted == False
            ).first()

            if not existing:
                for rec in org_admins:
                    db.add(Notification(
                        organization_id=u.organization_id,
                        user_id=rec.id,
                        title=f"📥 Unassigned Buyer Inquiry: {u.name}",
                        message=f"New inquiry from {u.source or 'Website'} (Budget: {u.budget_min or 'Flexible'} - {u.budget_max or 'Flexible'}) requires sales rep allocation.",
                        type="info",
                        severity="MEDIUM",
                        action_url="/leads",
                        entity_type="LEAD_UNASSIGNED",
                        entity_id=u.id
                    ))
                    created_count += 1

        if created_count > 0:
            db.commit()

        return {"alerts_generated": created_count}
