from datetime import datetime, timezone, timedelta
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_

from app.models.user import User, UserRole
from app.models.lead import Lead, LeadStatus, LeadPriority
from app.models.followup import Followup, FollowupStatus, FollowupType

def get_now() -> datetime:
    return datetime.now(timezone.utc).replace(tzinfo=None)

def get_today_priorities(user: User, db: Session) -> Dict[str, Any]:
    """
    Ranks and categorizes today's high-impact actions for the sales rep or manager.
    Answers: What must be executed right now to prevent revenue leakage and close deals?
    """
    now = get_now()
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    today_end = today_start + timedelta(days=1)

    # 1. Base query scoping
    leads_query = db.query(Lead).filter(Lead.is_deleted == False)
    followups_query = db.query(Followup).filter(Followup.is_deleted == False)

    if user.role != UserRole.SUPERADMIN and user.organization_id:
        leads_query = leads_query.filter(Lead.organization_id == user.organization_id)
        followups_query = followups_query.filter(Followup.organization_id == user.organization_id)

    is_rep = user.role in [UserRole.SALES_EXECUTIVE, UserRole.BROKER]
    if is_rep:
        leads_query = leads_query.filter(or_(Lead.assigned_to_id == user.id, Lead.created_by_id == user.id))
        followups_query = followups_query.filter(Followup.assigned_to_id == user.id)

    leads = leads_query.all()
    followups = followups_query.all()

    # Index followups by lead_id
    lead_followups_map: Dict[int, List[Followup]] = {}
    for f in followups:
        lead_followups_map.setdefault(f.lead_id, []).append(f)

    priority_items: List[Dict[str, Any]] = []

    # -------------------------------------------------------------
    # Category 1: Overdue Follow-ups (Priority Rank 1)
    # -------------------------------------------------------------
    for f in followups:
        if f.status in [FollowupStatus.OVERDUE, FollowupStatus.PENDING] and f.scheduled_at and f.scheduled_at < today_start:
            lead = f.lead
            if not lead or lead.is_deleted:
                continue
            delay_days = max(1, (today_start - f.scheduled_at).days)
            priority_items.append({
                "id": f"followup-overdue-{f.id}",
                "type": "overdue_followup",
                "priority_rank": 1,
                "badge_label": "Overdue Follow-up",
                "title": f.title,
                "lead_id": lead.id,
                "lead_name": lead.name,
                "lead_phone": lead.phone,
                "deal_value": lead.budget_max or lead.budget_min or 0.0,
                "status": lead.status.value if hasattr(lead.status, "value") else str(lead.status),
                "scheduled_at": f.scheduled_at.isoformat() if f.scheduled_at else None,
                "due_label": f"{delay_days}d overdue",
                "reason": f"Follow-up delayed by {delay_days} days past scheduled deadline.",
                "recommended_action": "Call lead immediately to recover sales momentum.",
                "health_score": lead.health_score or 50,
                "health_category": lead.health_category or "At Risk",
                "assigned_to_name": f.assigned_to.name if f.assigned_to else (lead.assigned_to.name if lead.assigned_to else "Unassigned")
            })

    # -------------------------------------------------------------
    # Category 2: Today's Scheduled Site Visits & Calls (Priority Rank 2)
    # -------------------------------------------------------------
    for f in followups:
        if f.status == FollowupStatus.PENDING and f.scheduled_at and today_start <= f.scheduled_at < today_end:
            lead = f.lead
            if not lead or lead.is_deleted:
                continue
            is_visit = f.type == FollowupType.SITE_VISIT
            priority_items.append({
                "id": f"followup-today-{f.id}",
                "type": "today_site_visit" if is_visit else "today_followup",
                "priority_rank": 2,
                "badge_label": "Today's Site Visit" if is_visit else "Today's Follow-up",
                "title": f.title,
                "lead_id": lead.id,
                "lead_name": lead.name,
                "lead_phone": lead.phone,
                "deal_value": lead.budget_max or lead.budget_min or 0.0,
                "status": lead.status.value if hasattr(lead.status, "value") else str(lead.status),
                "scheduled_at": f.scheduled_at.isoformat() if f.scheduled_at else None,
                "due_label": f.scheduled_at.strftime("%I:%M %p") if f.scheduled_at else "Today",
                "reason": "Scheduled task due for completion today.",
                "recommended_action": "Send confirmation WhatsApp & execute meeting/site demo.",
                "health_score": lead.health_score or 80,
                "health_category": lead.health_category or "Healthy",
                "assigned_to_name": f.assigned_to.name if f.assigned_to else (lead.assigned_to.name if lead.assigned_to else "Unassigned")
            })

    # -------------------------------------------------------------
    # Category 3: Post-Site-Visit Follow-up Needed (Priority Rank 3)
    # -------------------------------------------------------------
    for lead in leads:
        status_str = lead.status.value if hasattr(lead.status, "value") else str(lead.status)
        if status_str in ["Booked", "Lost"]:
            continue
        l_followups = lead_followups_map.get(lead.id, [])
        has_completed_visit = any(f.type == FollowupType.SITE_VISIT and f.status == FollowupStatus.COMPLETED for f in l_followups)
        has_upcoming = any(f.status == FollowupStatus.PENDING and f.scheduled_at and f.scheduled_at >= now for f in l_followups)
        
        if (has_completed_visit or status_str == "Site Visit Scheduled") and not has_upcoming:
            priority_items.append({
                "id": f"lead-postvisit-{lead.id}",
                "type": "post_visit",
                "priority_rank": 3,
                "badge_label": "Post-Visit Action Required",
                "title": f"Follow-up on Site Visit for {lead.name}",
                "lead_id": lead.id,
                "lead_name": lead.name,
                "lead_phone": lead.phone,
                "deal_value": lead.budget_max or lead.budget_min or 0.0,
                "status": status_str,
                "scheduled_at": None,
                "due_label": "Urgent",
                "reason": "Site visit conducted or pending without subsequent negotiation follow-up.",
                "recommended_action": "Schedule post-visit feedback call and send unit quotation.",
                "health_score": lead.health_score or 60,
                "health_category": lead.health_category or "At Risk",
                "assigned_to_name": lead.assigned_to.name if lead.assigned_to else "Unassigned"
            })

    # -------------------------------------------------------------
    # Category 4: Hot Leads Requiring Action (Priority Rank 4)
    # -------------------------------------------------------------
    for lead in leads:
        status_str = lead.status.value if hasattr(lead.status, "value") else str(lead.status)
        priority_str = lead.priority.value if hasattr(lead.priority, "value") else str(lead.priority)
        if status_str in ["Booked", "Lost"]:
            continue
        
        if priority_str in ["High", "Urgent"]:
            last_act = lead.last_activity_at or lead.updated_at or lead.created_at or now
            hours_since = (now - last_act).total_seconds() / 3600.0
            if hours_since >= 24 or status_str == "New":
                priority_items.append({
                    "id": f"lead-hot-{lead.id}",
                    "type": "hot_lead",
                    "priority_rank": 4,
                    "badge_label": "Hot Lead Attention",
                    "title": f"High Intent: {lead.name} ({priority_str} Priority)",
                    "lead_id": lead.id,
                    "lead_name": lead.name,
                    "lead_phone": lead.phone,
                    "deal_value": lead.budget_max or lead.budget_min or 0.0,
                    "status": status_str,
                    "scheduled_at": None,
                    "due_label": f"{int(hours_since)}h since touch",
                    "reason": f"High intent prospect with no touchpoint in {int(hours_since)} hours.",
                    "recommended_action": lead.recommended_action or "Share fresh inventory brochure and confirm intent.",
                    "health_score": lead.health_score or 70,
                    "health_category": lead.health_category or "Healthy",
                    "assigned_to_name": lead.assigned_to.name if lead.assigned_to else "Unassigned"
                })

    # -------------------------------------------------------------
    # Category 5: Booking / Closing Opportunities (Priority Rank 5)
    # -------------------------------------------------------------
    for lead in leads:
        status_str = lead.status.value if hasattr(lead.status, "value") else str(lead.status)
        if status_str == "Negotiation":
            priority_items.append({
                "id": f"lead-closer-{lead.id}",
                "type": "closing_opportunity",
                "priority_rank": 5,
                "badge_label": "Closing Opportunity",
                "title": f"Deal Closing: {lead.name} in Negotiation",
                "lead_id": lead.id,
                "lead_name": lead.name,
                "lead_phone": lead.phone,
                "deal_value": lead.budget_max or lead.budget_min or 0.0,
                "status": status_str,
                "scheduled_at": None,
                "due_label": "High Revenue",
                "reason": "Deal in active final negotiation phase.",
                "recommended_action": "Submit developer incentive offer & secure booking token.",
                "health_score": lead.health_score or 75,
                "health_category": lead.health_category or "Healthy",
                "assigned_to_name": lead.assigned_to.name if lead.assigned_to else "Unassigned"
            })

    # -------------------------------------------------------------
    # Category 6: Leads at Risk / Revenue Leakage (Priority Rank 6)
    # -------------------------------------------------------------
    for lead in leads:
        status_str = lead.status.value if hasattr(lead.status, "value") else str(lead.status)
        if status_str in ["Booked", "Lost"]:
            continue
        score = lead.health_score if lead.health_score is not None else 100
        val = lead.budget_max or lead.budget_min or 0.0
        if score < 50 or (val >= 100.0 and score < 70):
            priority_items.append({
                "id": f"lead-risk-{lead.id}",
                "type": "lead_at_risk",
                "priority_rank": 6,
                "badge_label": "Revenue Leakage Risk",
                "title": f"Deal at Risk: {lead.name} (Score: {score})",
                "lead_id": lead.id,
                "lead_name": lead.name,
                "lead_phone": lead.phone,
                "deal_value": val,
                "status": status_str,
                "scheduled_at": None,
                "due_label": f"Score {score}",
                "reason": lead.health_reasons_json or "Pipeline stagnation or inactivity risk.",
                "recommended_action": lead.recommended_action or "Senior intervention required.",
                "health_score": score,
                "health_category": lead.health_category or "At Risk",
                "assigned_to_name": lead.assigned_to.name if lead.assigned_to else "Unassigned"
            })

    # Deduplicate priority items by lead_id + type
    seen = set()
    deduped_items = []
    for item in priority_items:
        key = (item["lead_id"], item["type"])
        if key not in seen:
            seen.add(key)
            deduped_items.append(item)

    # Sort by priority_rank ascending, then deal_value descending
    deduped_items.sort(key=lambda x: (x["priority_rank"], -x["deal_value"]))

    overdue_count = sum(1 for x in deduped_items if x["type"] == "overdue_followup")
    today_actions_count = sum(1 for x in deduped_items if "today" in x["type"])
    post_visit_count = sum(1 for x in deduped_items if x["type"] == "post_visit")
    hot_leads_count = sum(1 for x in deduped_items if x["type"] == "hot_lead")
    closing_count = sum(1 for x in deduped_items if x["type"] == "closing_opportunity")
    risk_count = sum(1 for x in deduped_items if x["type"] == "lead_at_risk")

    return {
        "total_priorities": len(deduped_items),
        "overdue_count": overdue_count,
        "today_actions_count": today_actions_count,
        "post_visit_count": post_visit_count,
        "hot_leads_count": hot_leads_count,
        "closing_count": closing_count,
        "risk_count": risk_count,
        "items": deduped_items
    }
