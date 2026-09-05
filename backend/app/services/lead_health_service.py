import json
from datetime import datetime, timezone, timedelta
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_, func

from app.models.lead import Lead, LeadStatus, LeadPriority
from app.models.followup import Followup, FollowupStatus, FollowupType

def get_now() -> datetime:
    return datetime.now(timezone.utc).replace(tzinfo=None)

def normalize_dt(dt: Optional[datetime]) -> Optional[datetime]:
    if dt is not None and dt.tzinfo is not None:
        return dt.replace(tzinfo=None)
    return dt

def calculate_lead_health(lead: Lead, db: Session, now: Optional[datetime] = None) -> Dict[str, Any]:
    """
    Computes real estate revenue health score (0-100), health category,
    detected risk reasons, and next recommended action for a lead.
    """
    if now is None:
        now = get_now()
    else:
        now = normalize_dt(now)

    # Terminal state: Booked Deal
    status_val = lead.status.value if hasattr(lead.status, "value") else str(lead.status)
    if status_val == "Booked" or lead.status == LeadStatus.BOOKED:
        return {
            "health_score": 100,
            "health_category": "Excellent",
            "health_reasons": ["Deal booked and revenue secured."],
            "recommended_action": "Complete buyer documentation & track builder commission disbursement.",
            "is_high_value": (lead.budget_max or lead.budget_min or 0) >= 100,
            "days_in_stage": 0,
            "days_since_last_activity": 0
        }

    # Terminal state: Lost Lead
    if status_val == "Lost" or lead.status == LeadStatus.LOST:
        lost_cause = lead.lost_reason or "No specific lost reason provided."
        return {
            "health_score": 10,
            "health_category": "Lost Risk",
            "health_reasons": [f"Deal marked lost: {lost_cause}"],
            "recommended_action": "Evaluate lost reason or schedule for 90-day cold database re-engagement.",
            "is_high_value": (lead.budget_max or lead.budget_min or 0) >= 100,
            "days_in_stage": max(0, (now - normalize_dt(lead.stage_entered_at or lead.updated_at or lead.created_at or now)).days),
            "days_since_last_activity": max(0, (now - normalize_dt(lead.last_activity_at or lead.updated_at or lead.created_at or now)).days)
        }

    score = 100
    reasons: List[str] = []
    actions: List[str] = []

    created_at = normalize_dt(lead.created_at or now)
    last_act = normalize_dt(lead.last_activity_at or lead.updated_at or created_at)
    stage_entered = normalize_dt(lead.stage_entered_at or lead.updated_at or created_at)

    days_since_last_activity = max(0, (now - last_act).days)
    hours_since_last_activity = max(0, (now - last_act).total_seconds() / 3600.0)
    days_in_stage = max(0, (now - stage_entered).days)
    hours_since_created = max(0, (now - created_at).total_seconds() / 3600.0)

    deal_value = lead.budget_max or lead.budget_min or 0.0
    is_high_value = deal_value >= 100.0 # >= ₹1 Cr (100 Lakhs)

    # Fetch active followups
    followups = [f for f in lead.followups if not f.is_deleted]
    pending_followups = [
        f for f in followups 
        if f.status in [FollowupStatus.PENDING, FollowupStatus.OVERDUE]
    ]
    completed_followups = [
        f for f in followups 
        if f.status == FollowupStatus.COMPLETED
    ]

    # -------------------------------------------------------------
    # Rule 1: Untouched Lead (>24h without note or followup)
    # -------------------------------------------------------------
    notes_count = len([n for n in lead.notes_list if not getattr(n, "is_deleted", False)])
    if status_val == "New" and notes_count == 0 and len(followups) == 0 and hours_since_created >= 24:
        score -= 25
        reasons.append("Untouched lead: No call note or follow-up initiated after >24h of creation.")
        actions.append("Initiate immediate first contact via Phone Call or WhatsApp.")

    # -------------------------------------------------------------
    # Rule 2: Overdue Follow-up
    # -------------------------------------------------------------
    overdue_followups = [
        f for f in pending_followups
        if f.status == FollowupStatus.OVERDUE or (f.scheduled_at and f.scheduled_at < now)
    ]
    if overdue_followups:
        max_overdue_hours = max((now - normalize_dt(f.scheduled_at)).total_seconds() / 3600.0 for f in overdue_followups if f.scheduled_at)
        if max_overdue_hours >= 72:
            score -= 35
            reasons.append(f"Severe overdue follow-up: Task pending for {int(max_overdue_hours // 24)} days past schedule.")
            actions.append("Urgently complete overdue follow-up call today.")
        else:
            score -= 25
            reasons.append("Overdue follow-up pending action.")
            actions.append("Execute scheduled follow-up call immediately.")

    # -------------------------------------------------------------
    # Rule 3: Hot Lead Without Action (High/Urgent priority with no activity >48h)
    # -------------------------------------------------------------
    priority_val = lead.priority.value if hasattr(lead.priority, "value") else str(lead.priority)
    if priority_val in ["High", "Urgent"] and hours_since_last_activity >= 48:
        score -= 25
        reasons.append(f"High-priority ({priority_val}) prospect with zero activity in {int(hours_since_last_activity)} hours.")
        actions.append("High-intent escalation: Reach out with fresh unit inventory or pricing today.")

    # -------------------------------------------------------------
    # Rule 4: Stuck Lead (Stage Stagnation)
    # -------------------------------------------------------------
    stage_thresholds = {
        "New": (5, "Lead stuck in 'New' status without qualification."),
        "Contacted": (7, "Prospect stuck in 'Contacted' stage without progression to Site Visit/Qualified."),
        "Qualified": (10, "Qualified buyer stagnant without scheduling a site visit."),
        "Site Visit Scheduled": (7, "Site Visit stage pending resolution for over a week."),
        "Negotiation": (14, "In Negotiation for over 14 days; deal is at risk of stalling.")
    }
    if status_val in stage_thresholds:
        threshold_days, reason_text = stage_thresholds[status_val]
        if days_in_stage >= threshold_days:
            score -= 20
            reasons.append(f"{reason_text} ({days_in_stage} days in stage)")
            if status_val in ["New", "Contacted"]:
                actions.append("Review qualification details and schedule project presentation.")
            elif status_val == "Qualified":
                actions.append("Offer chauffeur-driven site visit or exclusive weekend viewing.")
            elif status_val == "Negotiation":
                actions.append("Present developer payment plan or closing discount.")

    # -------------------------------------------------------------
    # Rule 5: Inactive Salesperson (Assigned agent inactive > 5 days)
    # -------------------------------------------------------------
    if lead.assigned_to_id and days_since_last_activity >= 5:
        score -= 15
        reasons.append(f"Assigned sales agent inactive on this prospect for {days_since_last_activity} days.")
        actions.append("Manager intervention: Follow up with assigned agent or reassign lead.")

    # -------------------------------------------------------------
    # Rule 6: Post-Site-Visit with No Next Action
    # -------------------------------------------------------------
    has_site_visit = any(f.type == FollowupType.SITE_VISIT and f.status == FollowupStatus.COMPLETED for f in followups)
    has_site_visit = has_site_visit or (status_val == "Site Visit Scheduled" and days_in_stage >= 3)
    has_upcoming_followup = any(f.status == FollowupStatus.PENDING and f.scheduled_at and f.scheduled_at >= now for f in followups)

    if has_site_visit and not has_upcoming_followup:
        score -= 30
        reasons.append("Post-site-visit revenue leak: Site visit conducted but no subsequent follow-up is scheduled.")
        actions.append("Schedule post-visit feedback call and unit cost breakdown within 24 hours.")

    # -------------------------------------------------------------
    # Rule 7: High-Value Lead at Risk (Budget >= ₹1 Cr with any active risk)
    # -------------------------------------------------------------
    if is_high_value and score < 100:
        score -= 15
        reasons.append(f"High-value deal (₹{deal_value:.0f}L) at risk of revenue leakage.")
        actions.insert(0, "Senior leadership escalation: Direct touchpoint by Sales Director / HOD.")

    # -------------------------------------------------------------
    # Rule 8: Repeated Postponement (>= 2 postponements)
    # -------------------------------------------------------------
    postponements = lead.postponement_count or 0
    if postponements >= 2:
        score -= 20
        reasons.append(f"Repeated postponement: Interactions rescheduled {postponements} times.")
        actions.append("Re-qualify buyer timeline and offer flexible virtual consultation.")

    # -------------------------------------------------------------
    # Rule 9: Lead Going Cold (>= 10 days of total inactivity)
    # -------------------------------------------------------------
    if days_since_last_activity >= 10:
        score -= 25
        reasons.append(f"Lead going cold: No logged engagement for {days_since_last_activity} days.")
        actions.append("Trigger automated WhatsApp re-engagement drip or share newly launched inventory.")

    # Clamp health score between 5 and 100
    score = max(5, min(100, score))

    # Determine health category
    if score >= 90:
        category = "Excellent"
    elif score >= 70:
        category = "Healthy"
    elif score >= 50:
        category = "At Risk"
    elif score >= 30:
        category = "Critical"
    else:
        category = "Lost Risk"

    # Default actions & reasons if healthy
    if not reasons:
        reasons = ["Cadence is healthy. Regular buyer engagement maintained."]
    if not actions:
        if status_val == "New":
            actions.append("Qualify budget, timeline, and preferred unit configurations.")
        elif status_val == "Contacted":
            actions.append("Present shortlisted inventory and lock in Site Visit date.")
        elif status_val == "Qualified":
            actions.append("Confirm chauffeur pickup and schedule on-site demo.")
        elif status_val == "Site Visit Scheduled":
            actions.append("Send location pin, developer brochure & confirm arrival.")
        elif status_val == "Negotiation":
            actions.append("Finalize unit selection, token payment structure & closing terms.")
        else:
            actions.append("Continue regular scheduled touchpoints.")

    recommended_action = actions[0] if actions else "Continue scheduled follow-up."

    return {
        "health_score": score,
        "health_category": category,
        "health_reasons": reasons,
        "recommended_action": recommended_action,
        "is_high_value": is_high_value,
        "days_in_stage": days_in_stage,
        "days_since_last_activity": days_since_last_activity
    }

def update_lead_health(lead: Lead, db: Session, now: Optional[datetime] = None, commit: bool = True) -> Dict[str, Any]:
    """
    Evaluates health and updates the database fields directly on the Lead instance.
    """
    res = calculate_lead_health(lead, db, now=now)
    lead.health_score = res["health_score"]
    lead.health_category = res["health_category"]
    lead.health_reasons_json = json.dumps(res["health_reasons"])
    lead.recommended_action = res["recommended_action"]
    
    if commit:
        db.commit()
    return res

def bulk_recalculate_health(db: Session, organization_id: Optional[int] = None) -> int:
    """
    Recalculates health scores for all active leads in the database or organization.
    """
    now = get_now()
    query = db.query(Lead).filter(Lead.is_deleted == False)
    if organization_id:
        query = query.filter(Lead.organization_id == organization_id)

    leads = query.all()
    for lead in leads:
        update_lead_health(lead, db, now=now, commit=False)
    
    db.commit()
    return len(leads)

def get_health_summary(db: Session, organization_id: Optional[int] = None) -> Dict[str, Any]:
    """
    Aggregates revenue health breakdown, pipeline value at risk,
    and top leakage drivers across the organization.
    """
    now = get_now()
    query = db.query(Lead).filter(Lead.is_deleted == False)
    if organization_id:
        query = query.filter(Lead.organization_id == organization_id)

    leads = query.all()
    total_leads = len(leads)
    
    excellent_count = 0
    healthy_count = 0
    at_risk_count = 0
    critical_count = 0
    lost_risk_count = 0
    pipeline_value_at_risk = 0.0 # in Lakhs
    high_value_at_risk_count = 0
    reason_frequencies: Dict[str, int] = {}

    for l in leads:
        # If health score not calculated or outdated, compute it
        if l.health_score is None or not l.health_reasons_json:
            health = update_lead_health(l, db, now=now, commit=False)
            score = health["health_score"]
            cat = health["health_category"]
            reasons = health["health_reasons"]
        else:
            score = l.health_score
            cat = l.health_category
            try:
                reasons = json.loads(l.health_reasons_json) if l.health_reasons_json else []
            except Exception:
                reasons = []

        if cat == "Excellent":
            excellent_count += 1
        elif cat == "Healthy":
            healthy_count += 1
        elif cat == "At Risk":
            at_risk_count += 1
        elif cat == "Critical":
            critical_count += 1
        else: # Lost Risk
            lost_risk_count += 1

        val = l.budget_max or l.budget_min or 0.0
        if cat in ["At Risk", "Critical", "Lost Risk"]:
            pipeline_value_at_risk += val
            if val >= 100.0:
                high_value_at_risk_count += 1

            for r in reasons:
                # Group generic reason prefixes for clean chart summary
                clean_r = r.split("(")[0].strip()
                reason_frequencies[clean_r] = reason_frequencies.get(clean_r, 0) + 1

    db.commit()

    # Sort top leakage reasons
    sorted_reasons = sorted(
        [{"reason": k, "count": v} for k, v in reason_frequencies.items()],
        key=lambda x: x["count"],
        reverse=True
    )[:6]

    return {
        "total_leads": total_leads,
        "excellent_count": excellent_count,
        "healthy_count": healthy_count,
        "at_risk_count": at_risk_count,
        "critical_count": critical_count,
        "lost_risk_count": lost_risk_count,
        "pipeline_value_at_risk": round(pipeline_value_at_risk, 2),
        "high_value_at_risk_count": high_value_at_risk_count,
        "top_leakage_reasons": sorted_reasons
    }
