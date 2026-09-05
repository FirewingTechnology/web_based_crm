from datetime import datetime, timezone, timedelta
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
import json

from app.models.lead import Lead
from app.models.user import User
from app.models.whatsapp import WhatsAppMessage
from app.models.activity_log import ActivityLog
from app.services.lead_health_service import update_lead_health

TEMPLATES_CONFIG: Dict[str, Dict[str, str]] = {
    "QUALIFICATION": {
        "title": "Lead Qualification & Preference Gathering",
        "description": "Inquire about buyer's configuration, budget, and move-in timeline",
        "category": "Qualification",
        "template": "Hi {lead_name}, thank you for your interest in {project_name}. To help us find the perfect unit matching your budget of {budget_range}, could you share your preferred BHK configuration and expected move-in timeline? Regards, {rep_name} - {company_name}."
    },
    "SITE_VISIT_CONFIRMATION": {
        "title": "Site Visit Confirmation & Location Pin",
        "description": "Confirm appointment with Google Maps navigation link and host details",
        "category": "Site Visit",
        "template": "Hi {lead_name}, your VIP site visit to {project_name} is confirmed for {visit_date} at {visit_time}. Location pin: {location_url}. Your sales executive {rep_name} ({rep_phone}) will assist you upon arrival. We look forward to hosting you!"
    },
    "POST_VISIT_FEEDBACK": {
        "title": "Post-Visit Experience & Floor Plans",
        "description": "Follow up immediately after site visit with unit options and pricing",
        "category": "Follow-up",
        "template": "Hi {lead_name}, thank you for visiting {project_name} today! We hope you loved the sample flat and amenities. How was your experience, and would you like us to share the exclusive pricing sheet with early-booking benefits? - {rep_name}, {company_name}"
    },
    "PAYMENT_REMINDER": {
        "title": "Token / Payment Milestone Reminder",
        "description": "Remind buyer of pending booking token or milestone payment",
        "category": "Closing",
        "template": "Dear {lead_name}, this is a gentle reminder regarding the token/booking installment of INR {amount} for unit {unit_number} at {project_name} due on {due_date}. Please find the payment details or link here: {payment_link}. Feel free to contact us for any assistance. - {company_name}"
    },
    "REENGAGEMENT_DRIP": {
        "title": "Cold / Stalled Lead Re-engagement",
        "description": "Revive inactive lead with fresh inventory or festive price advantage",
        "category": "Reactivation",
        "template": "Hi {lead_name}, we noticed you were exploring properties in {location_name}. We have just unlocked limited inventory with exclusive festive pricing at {project_name}. Would you like a 2-minute video walkthrough or floor plan? - {rep_name}, {company_name}"
    },
    "CUSTOM": {
        "title": "Custom Direct Message",
        "description": "Free-form personalized message",
        "category": "General",
        "template": "Hi {lead_name}, this is {rep_name} from {company_name}. "
    }
}

def get_template_context(lead: Optional[Lead], current_user: User) -> Dict[str, str]:
    """Generates standard variable substitution context from lead and user records."""
    lead_name = lead.name if lead else "there"
    rep_name = current_user.name or "Sales Team"
    rep_phone = getattr(current_user, "phone", None) or "+91 98765 43210"
    company_name = "REALVION Realty"
    
    project_name = "our premium project"
    location_name = "prime location"
    location_url = "https://maps.google.com/?q=Real+Estate+Project"
    
    if lead and lead.preferred_project:
        project_name = lead.preferred_project.name
        location_name = lead.preferred_project.location or project_name
        location_url = f"https://maps.google.com/?q={project_name.replace(' ', '+')}+{location_name.replace(' ', '+')}"
    elif lead and lead.preferred_location:
        location_name = lead.preferred_location
        location_url = f"https://maps.google.com/?q={lead.preferred_location.replace(' ', '+')}"

    budget_range = "your preferred range"
    if lead:
        if lead.budget_min and lead.budget_max:
            budget_range = f"₹{lead.budget_min:g}L - ₹{lead.budget_max:g}L"
        elif lead.budget_max:
            budget_range = f"up to ₹{lead.budget_max:g}L"
        elif lead.budget_min:
            budget_range = f"from ₹{lead.budget_min:g}L"

    tomorrow = (datetime.now(timezone.utc) + timedelta(days=1)).strftime("%d %b %Y")

    return {
        "lead_name": lead_name,
        "rep_name": rep_name,
        "rep_phone": rep_phone,
        "company_name": company_name,
        "project_name": project_name,
        "location_name": location_name,
        "location_url": location_url,
        "budget_range": budget_range,
        "visit_date": tomorrow,
        "visit_time": "11:00 AM",
        "unit_number": "A-1204",
        "amount": "1,00,000",
        "due_date": "within 48 hours",
        "payment_link": "https://realvion.com/pay"
    }

def render_all_templates(lead: Optional[Lead], current_user: User) -> List[Dict[str, Any]]:
    """Renders all predefined templates with interpolated variables for a given lead."""
    context = get_template_context(lead, current_user)
    results = []

    for key, item in TEMPLATES_CONFIG.items():
        rendered_body = item["template"]
        for var_name, var_val in context.items():
            rendered_body = rendered_body.replace(f"{{{var_name}}}", str(var_val))
        
        results.append({
            "key": key,
            "title": item["title"],
            "description": item["description"],
            "category": item["category"],
            "raw_template": item["template"],
            "rendered_body": rendered_body,
        })

    return results

def log_whatsapp_message(
    db: Session,
    lead: Lead,
    current_user: User,
    template_key: Optional[str],
    recipient_phone: str,
    message_body: str,
    metadata: Optional[Dict[str, Any]] = None,
    status: str = "SENT"
) -> WhatsAppMessage:
    """
    Logs a WhatsApp communication in the database, updates the lead's last activity timestamp,
    triggers health score recalculation, and logs an activity event.
    """
    now = datetime.now(timezone.utc).replace(tzinfo=None)
    
    msg = WhatsAppMessage(
        organization_id=lead.organization_id or getattr(current_user, "organization_id", None),
        lead_id=lead.id,
        sender_id=current_user.id,
        template_key=template_key or "CUSTOM",
        recipient_phone=recipient_phone,
        recipient_name=lead.name,
        message_body=message_body,
        status=status,
        sent_at=now,
        delivered_at=now if status in ["DELIVERED", "READ", "REPLIED"] else None,
        read_at=now if status in ["READ", "REPLIED"] else None,
        replied_at=now if status == "REPLIED" else None,
        metadata_json=json.dumps(metadata) if metadata else None
    )
    db.add(msg)
    
    # Update lead activity timestamp to refresh health status
    lead.last_activity_at = now
    
    # Recalculate health
    update_lead_health(lead, db, commit=False)

    # Activity log
    activity = ActivityLog(
        user_id=current_user.id,
        user_name=current_user.name,
        action="WHATSAPP_MESSAGE_SENT",
        module="Leads",
        details=f"Initiated WhatsApp [{template_key or 'CUSTOM'}] to {lead.name} ({recipient_phone})"
    )
    db.add(activity)

    db.commit()
    db.refresh(msg)
    return msg
