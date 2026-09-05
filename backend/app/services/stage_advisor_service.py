from datetime import datetime, timezone, timedelta
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session

from app.models.lead import Lead, LeadStatus, LeadPriority
from app.models.followup import Followup, FollowupStatus, FollowupType

def get_next_best_action(lead: Lead, db: Session) -> Dict[str, Any]:
    """
    Computes real-time Next Best Action, talking points, channel recommendation,
    stage progression readiness, and prerequisite blockers for a lead.
    """
    status_val = lead.status.value if hasattr(lead.status, "value") else str(lead.status)
    priority_val = lead.priority.value if hasattr(lead.priority, "value") else str(lead.priority)
    deal_val = lead.budget_max or lead.budget_min or 0.0

    # Collect followups
    followups = [f for f in lead.followups if not f.is_deleted]
    pending_followups = [f for f in followups if f.status == FollowupStatus.PENDING]
    completed_followups = [f for f in followups if f.status == FollowupStatus.COMPLETED]
    has_site_visit = any(f.type == FollowupType.SITE_VISIT and f.status == FollowupStatus.COMPLETED for f in followups)
    
    # 1. Evaluate Stage Readiness and Blockers
    blockers: List[str] = []
    talking_points: List[str] = []
    readiness = False
    suggested_next_status: Optional[str] = None
    primary_action = ""
    suggested_channel = "Call"
    urgency = "Normal"

    if priority_val in ["High", "Urgent"]:
        urgency = "High"

    now = datetime.now(timezone.utc).replace(tzinfo=None)
    overdue_followups = [f for f in followups if f.status == FollowupStatus.OVERDUE or (f.scheduled_at and f.scheduled_at < now and f.status == FollowupStatus.PENDING)]
    if overdue_followups:
        urgency = "Urgent"

    # Evaluation by pipeline stage
    if status_val == "New":
        suggested_next_status = "Contacted"
        primary_action = "Initiate first contact call & qualify buyer requirements"
        suggested_channel = "Call" if priority_val in ["High", "Urgent"] else "WhatsApp"
        
        talking_points = [
            f"Acknowledge inquiry from source ({lead.source}) and confirm interest.",
            f"Verify preferred configuration ({lead.preferred_configuration or '2/3/4 BHK'}) and location ({lead.preferred_location or 'City Center'}).",
            "Inquire about buyer timeline: Immediate purchase vs. 6-12 month horizon.",
            "Offer to send detailed project walkthroughs and floor plans via WhatsApp."
        ]

        if not lead.phone:
            blockers.append("Missing contact phone number")
        
        # Check readiness to move to Contacted
        notes_count = len([n for n in lead.notes_list if not getattr(n, "is_deleted", False)])
        if notes_count > 0 or len(followups) > 0:
            readiness = True

    elif status_val == "Contacted":
        suggested_next_status = "Qualified"
        primary_action = "Lock in budget & pitch chauffeur-driven site visit"
        suggested_channel = "Call"

        talking_points = [
            f"Discuss matching projects in {lead.preferred_location or 'target micro-market'} within ₹{deal_val:.0f}L budget.",
            "Share curated master plan and unit layout options via WhatsApp.",
            "Highlight developer launch incentives and limited inventory in preferred tower.",
            "Invite prospect for an on-site visit with complimentary chauffeur pickup this weekend."
        ]

        if not lead.budget_max and not lead.budget_min:
            blockers.append("Budget range (min/max) not yet specified")
        if not lead.preferred_location:
            blockers.append("Preferred location not documented")

        if (lead.budget_max or lead.budget_min) and lead.preferred_location:
            readiness = True

    elif status_val == "Qualified":
        suggested_next_status = "Site Visit Scheduled"
        primary_action = "Schedule site visit & confirm chauffeur pickup time"
        suggested_channel = "Call"

        talking_points = [
            "Propose specific site visit slots (Saturday 11 AM or Sunday 3 PM).",
            "Confirm chauffeur pickup address or send Google Maps pin to sales gallery.",
            "Inform buyer that developer sales head will be available for an exclusive unit briefing.",
            "Prepare comparative project analysis against competitors in the same sector."
        ]

        has_scheduled_visit = any(f.type == FollowupType.SITE_VISIT and f.status == FollowupStatus.PENDING for f in followups)
        if not has_scheduled_visit:
            blockers.append("Site visit task has not been scheduled yet")
        else:
            readiness = True

    elif status_val == "Site Visit Scheduled":
        suggested_next_status = "Negotiation"
        primary_action = "Conduct site tour & transition immediately to commercial terms"
        suggested_channel = "In-Person"

        talking_points = [
            "Walk prospect through sample mockup flat and showcase actual construction progress.",
            "Highlight key unit USPs: corner view, Vastu orientation, high ceiling, ventilation.",
            "Discuss flexible construction-linked (CLP) or 20:80 developer payment structures.",
            "Present exclusive 48-hour spot booking discount on floor rise or car parking."
        ]

        if not has_site_visit:
            blockers.append("Site visit completion report / feedback not yet logged")
        else:
            readiness = True

    elif status_val == "Negotiation":
        suggested_next_status = "Booked"
        primary_action = "Submit final cost sheet & collect token booking advance"
        suggested_channel = "In-Person" if deal_val >= 100 else "Call"
        urgency = "High"

        talking_points = [
            "Review official developer cost breakdown including GST, IFMS, and registration estimates.",
            f"Emphasize unit scarcity: 'Only 2 inventory units remain on this stack at current rate.'",
            "Assist prospect with booking advance payment link, RTGS bank details, or cheque collection.",
            "Confirm documentation required for builder KYC and Buyer Agreement (BBA)."
        ]

        if deal_val == 0:
            blockers.append("Agreed deal valuation is missing")
        else:
            readiness = True

    elif status_val == "Booked":
        suggested_next_status = None
        primary_action = "Verify builder booking form & track commission disbursement"
        suggested_channel = "Call"
        talking_points = [
            "Send congratulations message and official real estate agency receipt.",
            "Ensure Builder Buyer Agreement (BBA) is drafted and signed within 14 days.",
            "Submit broker commission invoice to developer accounts team."
        ]
        readiness = False

    elif status_val == "Lost":
        suggested_next_status = None
        primary_action = "Document competitor/reason and enroll in 90-day cold revival"
        suggested_channel = "WhatsApp"
        talking_points = [
            f"Record lost reason accurately ({lead.lost_reason or 'Competitor / Budget mismatch'}).",
            "Maintain polite rapport for future real estate referrals.",
            "Tag for quarterly re-engagement campaign."
        ]
        if not lead.lost_reason:
            blockers.append("Specific lost reason was not recorded")
        readiness = False

    return {
        "lead_id": lead.id,
        "lead_name": lead.name,
        "current_status": status_val,
        "suggested_next_status": suggested_next_status,
        "primary_action": primary_action,
        "suggested_channel": suggested_channel,
        "urgency": urgency,
        "talking_points": talking_points,
        "stage_progression_readiness": readiness,
        "blockers": blockers,
        "health_score": lead.health_score or 100,
        "health_category": lead.health_category or "Healthy"
    }
