import re
import json
from datetime import datetime, timezone, timedelta
from typing import Dict, Any, Tuple, Optional
from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.models.lead import Lead, LeadStatus, LeadPriority, LeadNote, LeadStatusHistory
from app.models.user import User, UserRole
from app.models.project import Project
from app.models.followup import Followup, FollowupType, FollowupStatus
from app.models.notification import Notification
from app.models.activity_log import ActivityLog
from app.models.lead_source import (
    LeadSourceIntegration, LeadSourceEvent, SourceType, EventProcessingStatus
)
from app.services.lead_health_service import update_lead_health
from app.services.lead_assignment_service import LeadAssignmentService

class UniversalIngestionService:

    @staticmethod
    def normalize_phone(phone_str: Optional[str]) -> str:
        """
        Normalizes phone numbers to standard Indian mobile format (+91XXXXXXXXXX)
        or international E.164.
        """
        if not phone_str:
            return ""
        cleaned = re.sub(r'[^\d+]', '', str(phone_str))
        if cleaned.startswith('+'):
            cleaned = cleaned[1:]
        if cleaned.startswith('0'):
            cleaned = cleaned.lstrip('0')
        # Standard Indian 10-digit mobile number
        if len(cleaned) == 10 and cleaned.isdigit():
            cleaned = "91" + cleaned
        return f"+{cleaned}" if cleaned else ""

    @staticmethod
    def parse_payload(source_type: str, payload: Dict[str, Any]) -> Dict[str, Any]:
        """
        Extracts standardized real estate lead fields from various source adapters.
        """
        data = {
            "name": "Anonymous Inquiry",
            "phone": "",
            "email": None,
            "budget_min": None,
            "budget_max": None,
            "preferred_location": None,
            "preferred_configuration": None,
            "project_name": None,
            "project_id": None,
            "campaign_name": None,
            "ad_name": None,
            "source_lead_id": None,
            "notes": None,
            "tags": None,
            "structured_requirements": {}
        }

        st = source_type.upper()

        # 1. META LEAD ADS ADAPTER
        if "META" in st or "FACEBOOK" in st or "INSTAGRAM" in st:
            # Meta sends form responses in entry[0].changes[0].value or direct test dict
            val_dict = payload
            if "entry" in payload and isinstance(payload["entry"], list) and len(payload["entry"]) > 0:
                entry_0 = payload["entry"][0]
                changes = entry_0.get("changes", [])
                if changes and isinstance(changes, list) and len(changes) > 0:
                    val_dict = changes[0].get("value", {})

            field_data = val_dict.get("field_data", [])
            data["campaign_name"] = val_dict.get("campaign_name") or payload.get("campaign_name") or val_dict.get("adset_name") or "Meta Ad Campaign"
            data["ad_name"] = val_dict.get("ad_name") or payload.get("ad_name")
            data["source_lead_id"] = str(val_dict.get("leadgen_id") or val_dict.get("lead_id") or payload.get("lead_id") or payload.get("id") or "")

            if isinstance(field_data, list):
                for item in field_data:
                    name = (item.get("name") or "").lower()
                    values = item.get("values", [])
                    val = values[0] if values else ""
                    if "full_name" in name or "name" in name:
                        data["name"] = val
                    elif "phone" in name or "mobile" in name:
                        data["phone"] = val
                    elif "email" in name:
                        data["email"] = val
                    elif "budget" in name or "price" in name:
                        data["structured_requirements"]["budget_raw"] = val
                        nums = re.findall(r'\d+', val)
                        if len(nums) >= 2:
                            data["budget_min"] = float(nums[0])
                            data["budget_max"] = float(nums[1])
                        elif len(nums) == 1:
                            data["budget_max"] = float(nums[0])
                    elif "location" in name or "city" in name:
                        data["preferred_location"] = val
                    elif "bhk" in name or "type" in name or "config" in name:
                        data["preferred_configuration"] = val

            # Direct fallback if flat dict provided in val_dict or payload
            if not data["phone"]:
                data["phone"] = val_dict.get("phone") or payload.get("phone") or val_dict.get("mobile") or payload.get("mobile") or ""
            if not data["email"]:
                data["email"] = val_dict.get("email") or payload.get("email")
            if data["name"] == "Anonymous Inquiry":
                data["name"] = val_dict.get("name") or payload.get("name") or data["name"]
            if not data["preferred_configuration"]:
                data["preferred_configuration"] = val_dict.get("configuration") or payload.get("configuration") or val_dict.get("bhk")
            if not data["preferred_location"]:
                data["preferred_location"] = val_dict.get("location") or payload.get("location") or val_dict.get("city")


        # 2. HOUSING.COM ADAPTER
        elif "HOUSING" in st:
            data["source_lead_id"] = str(payload.get("lead_id") or payload.get("enquiry_id") or "")
            data["name"] = payload.get("lead_name") or payload.get("name") or "Housing Buyer"
            data["phone"] = payload.get("lead_phone") or payload.get("phone") or ""
            data["email"] = payload.get("lead_email") or payload.get("email")
            data["preferred_location"] = payload.get("locality") or payload.get("city") or payload.get("location")
            data["preferred_configuration"] = payload.get("bhk_config") or payload.get("configuration")
            data["campaign_name"] = payload.get("campaign_name") or payload.get("project_name") or "Housing Portal"
            data["project_name"] = payload.get("project_name")
            
            p_min = payload.get("price_min") or payload.get("budget_min")
            p_max = payload.get("price_max") or payload.get("budget_max")
            if p_min: data["budget_min"] = float(p_min)
            if p_max: data["budget_max"] = float(p_max)
            data["tags"] = "Housing, High Intent"

        # 3. 99ACRES ADAPTER
        elif "99ACRES" in st or "99" in st:
            data["source_lead_id"] = str(payload.get("verification_id") or payload.get("lead_id") or "")
            data["name"] = payload.get("sender_name") or payload.get("name") or "99acres Buyer"
            data["phone"] = payload.get("sender_phone") or payload.get("phone") or ""
            data["email"] = payload.get("sender_email") or payload.get("email")
            data["preferred_location"] = payload.get("city") or payload.get("locality") or payload.get("location")
            data["preferred_configuration"] = payload.get("property_type") or payload.get("configuration")
            data["project_name"] = payload.get("project_name")
            data["campaign_name"] = payload.get("campaign") or "99acres Verified Enquiry"
            
            b_val = payload.get("budget_range") or payload.get("budget")
            if b_val:
                nums = re.findall(r'\d+', str(b_val))
                if len(nums) >= 2:
                    data["budget_min"] = float(nums[0])
                    data["budget_max"] = float(nums[1])
                elif len(nums) == 1:
                    data["budget_max"] = float(nums[0])
            data["tags"] = "99acres, Verified Buyer"

        # 4. WEBSITE / PUBLIC FORM ADAPTER
        elif "WEBSITE" in st:
            data["name"] = payload.get("name") or "Website Visitor"
            data["phone"] = payload.get("phone") or ""
            data["email"] = payload.get("email")
            data["preferred_location"] = payload.get("preferred_location") or payload.get("location")
            data["preferred_configuration"] = payload.get("preferred_configuration") or payload.get("configuration")
            data["project_id"] = payload.get("preferred_project_id") or payload.get("project_id")
            data["project_name"] = payload.get("project_name")
            data["campaign_name"] = payload.get("utm_campaign") or payload.get("campaign") or "Official Website"
            data["notes"] = payload.get("message") or payload.get("notes")
            if payload.get("budget_min"): data["budget_min"] = float(payload["budget_min"])
            if payload.get("budget_max"): data["budget_max"] = float(payload["budget_max"])
            data["tags"] = "Direct Website, Organic"

        # 5. GENERIC WEBHOOK / API FALLBACK
        else:
            data["name"] = payload.get("name") or payload.get("full_name") or "Incoming Lead"
            data["phone"] = payload.get("phone") or payload.get("mobile") or ""
            data["email"] = payload.get("email")
            data["preferred_location"] = payload.get("location") or payload.get("city")
            data["preferred_configuration"] = payload.get("configuration") or payload.get("bhk")
            data["project_name"] = payload.get("project_name")
            data["campaign_name"] = payload.get("campaign") or payload.get("source") or "External API"
            data["notes"] = payload.get("notes") or payload.get("comments")
            if payload.get("budget_min"): data["budget_min"] = float(payload["budget_min"])
            if payload.get("budget_max"): data["budget_max"] = float(payload["budget_max"])

        return data

    @classmethod
    def ingest_lead(
        cls,
        db: Session,
        organization_id: int,
        source_type: str,
        raw_payload: Dict[str, Any],
        external_event_id: Optional[str] = None,
        integration_id: Optional[int] = None
    ) -> Dict[str, Any]:
        """
        Executes the end-to-end Universal Ingestion Pipeline:
        Validate -> Idempotency Check -> Normalize -> Duplicate Check -> Assign -> SLA -> Audit.
        """
        now = datetime.now(timezone.utc)
        clean_ext_id = str(external_event_id).strip() if external_event_id else None

        # Step 1: Idempotency Verification
        if clean_ext_id:
            existing_event = db.query(LeadSourceEvent).filter(
                LeadSourceEvent.organization_id == organization_id,
                LeadSourceEvent.external_event_id == clean_ext_id
            ).first()
            if existing_event and existing_event.lead_id:
                existing_lead = db.query(Lead).filter(Lead.id == existing_event.lead_id).first()
                if existing_lead:
                    return {
                        "status": "DUPLICATE_EVENT_IGNORED",
                        "message": f"Event '{clean_ext_id}' was already processed. Idempotent response returned.",
                        "lead_id": existing_lead.id,
                        "lead_name": existing_lead.name,
                        "is_duplicate": True
                    }

        # Step 2: Integration lookup or resolution
        integration = None
        if integration_id:
            integration = db.query(LeadSourceIntegration).filter(
                LeadSourceIntegration.id == integration_id,
                LeadSourceIntegration.organization_id == organization_id
            ).first()
        if not integration:
            integration = db.query(LeadSourceIntegration).filter(
                LeadSourceIntegration.organization_id == organization_id,
                LeadSourceIntegration.source_type == source_type,
                LeadSourceIntegration.is_active == True
            ).first()

        # Step 3: Parse Payload through Source Adapter
        parsed = cls.parse_payload(source_type, raw_payload)
        normalized_phone = cls.normalize_phone(parsed["phone"])
        if not normalized_phone and not parsed.get("email"):
            raise ValueError("Lead payload must contain at least a valid phone number or email address.")

        # Update integration stats
        if integration:
            integration.total_received = (integration.total_received or 0) + 1
            integration.last_event_at = now

        # Step 4: Duplicate Detection within Organization
        existing_lead = None
        match_field = None
        if normalized_phone:
            existing_lead = db.query(Lead).filter(
                Lead.organization_id == organization_id,
                Lead.is_deleted == False,
                or_(Lead.phone == normalized_phone, Lead.normalized_phone == normalized_phone, Lead.phone == parsed["phone"])
            ).first()
            if existing_lead:
                match_field = "phone"

        if not existing_lead and parsed.get("email"):
            existing_lead = db.query(Lead).filter(
                Lead.organization_id == organization_id,
                Lead.is_deleted == False,
                Lead.email == parsed["email"]
            ).first()
            if existing_lead:
                match_field = "email"

        # Case A: DUPLICATE FOUND — Maintain Multi-Source Attribution Timeline
        if existing_lead:
            # Re-activate if was marked Lost
            was_reactivated = False
            if existing_lead.status in [LeadStatus.LOST, "Lost"]:
                existing_lead.status = LeadStatus.CONTACTED
                was_reactivated = True

            # Update latest contact timestamp and deal values if newer information exists
            existing_lead.last_activity_at = now
            if parsed.get("budget_max") and (parsed["budget_max"] > (existing_lead.budget_max or 0)):
                existing_lead.budget_max = parsed["budget_max"]
                existing_lead.deal_value = parsed["budget_max"]

            # Log timeline note
            campaign_tag = f" (Campaign: {parsed['campaign_name']})" if parsed.get('campaign_name') else ""
            db.add(LeadNote(
                lead_id=existing_lead.id,
                created_by_id=existing_lead.assigned_to_id or 1,
                note_text=f"🔄 [Multi-Source Re-engagement] Buyer inquired again via {source_type}{campaign_tag}. Status: {existing_lead.status.value if hasattr(existing_lead.status, 'value') else existing_lead.status}."
            ))

            # Record event in vault
            source_event = LeadSourceEvent(
                organization_id=organization_id,
                integration_id=integration.id if integration else None,
                external_event_id=clean_ext_id,
                source_type=source_type,
                raw_payload=json.dumps(raw_payload),
                parsed_payload=json.dumps(parsed),
                status=EventProcessingStatus.DUPLICATE_ATTACHED.value,
                lead_id=existing_lead.id,
                is_duplicate=True,
                duplicate_match_field=match_field,
                processed_at=now
            )
            db.add(source_event)
            if integration:
                integration.total_processed = (integration.total_processed or 0) + 1

            # Recalculate health score
            update_lead_health(existing_lead, db, now=now, commit=False)
            db.commit()
            db.refresh(existing_lead)

            return {
                "status": "DUPLICATE_ATTACHED",
                "message": f"Existing lead found via {match_field}. Multi-source event timeline preserved without overwriting history.",
                "lead_id": existing_lead.id,
                "lead_name": existing_lead.name,
                "is_duplicate": True,
                "was_reactivated": was_reactivated
            }

        # Case B: NEW LEAD — Execute Intelligent Ingestion Pipeline
        sla_mins = integration.sla_minutes if integration else 15
        sla_deadline = now + timedelta(minutes=sla_mins)
        default_prio = integration.default_priority if integration else "Medium"
        if parsed.get("budget_max", 0) >= 100: # 1 Cr+
            default_prio = "High"

        # Resolve Project if project name or id given
        target_project_id = parsed.get("project_id")
        if not target_project_id and parsed.get("project_name"):
            proj = db.query(Project).filter(
                Project.organization_id == organization_id,
                Project.is_deleted == False,
                Project.name.ilike(f"%{parsed['project_name']}%")
            ).first()
            if proj:
                target_project_id = proj.id
        if not target_project_id and integration and integration.default_project_id:
            target_project_id = integration.default_project_id

        # Intelligent Assignment Engine
        deal_est = parsed.get("budget_max") or parsed.get("budget_min") or 50.0
        assignee_id, rule_name = LeadAssignmentService.assign_lead(
            db=db,
            organization_id=organization_id,
            source_type=source_type,
            deal_value=deal_est,
            project_id=target_project_id,
            integration=integration
        )

        # Create Lead record
        new_lead = Lead(
            organization_id=organization_id,
            name=parsed["name"],
            phone=normalized_phone or parsed["phone"],
            email=parsed.get("email"),
            source=source_type,
            status=LeadStatus.NEW,
            priority=LeadPriority.HIGH if default_prio == "High" else LeadPriority.MEDIUM,
            budget_min=parsed.get("budget_min"),
            budget_max=parsed.get("budget_max"),
            preferred_location=parsed.get("preferred_location"),
            preferred_configuration=parsed.get("preferred_configuration"),
            preferred_project_id=target_project_id,
            assigned_to_id=assignee_id,
            created_by_id=assignee_id,
            tags=parsed.get("tags") or f"{source_type}, Ingested",
            
            # Real Estate Revenue OS Fields
            source_lead_id=parsed.get("source_lead_id"),
            campaign_name=parsed.get("campaign_name"),
            ad_name=parsed.get("ad_name"),
            normalized_phone=normalized_phone,
            sla_deadline=sla_deadline,
            sla_status="PENDING",
            assignment_rule=rule_name,
            assigned_at=now,
            deal_value=deal_est,
            booking_probability=15.0, # Initial probability for freshly qualified inquiry
            structured_requirements_json=json.dumps(parsed.get("structured_requirements") or {}),
            stage_entered_at=now,
            last_activity_at=now
        )
        db.add(new_lead)
        db.flush()

        # Initial Health Calculation
        update_lead_health(new_lead, db, now=now, commit=False)

        # Auto-create first contact follow-up task
        db.add(Followup(
            organization_id=organization_id,
            lead_id=new_lead.id,
            assigned_to_id=assignee_id,
            type=FollowupType.CALL,
            status=FollowupStatus.PENDING,
            title=f"First Outreach: {new_lead.name}",
            scheduled_at=now + timedelta(minutes=10),
            notes=f"Initial outreach SLA: Call {new_lead.name} regarding {source_type} inquiry."
        ))

        # Notification to Assigned Executive
        db.add(Notification(
            organization_id=organization_id,
            user_id=assignee_id,
            title=f"⚡ New {source_type} Lead: {new_lead.name}",
            message=f"₹{deal_est}L inquiry from {parsed.get('campaign_name') or source_type}. Respond within {sla_mins}m SLA.",
            type="warning" if default_prio == "High" else "info",
            severity="HIGH" if default_prio == "High" else "MEDIUM",
            action_url=f"/leads?lead_id={new_lead.id}",
            entity_type="LEAD",
            entity_id=new_lead.id
        ))

        # Status History
        db.add(LeadStatusHistory(
            lead_id=new_lead.id,
            changed_by_id=assignee_id,
            old_status=None,
            new_status=LeadStatus.NEW.value,
            remarks=f"Ingested automatically via {source_type} ({rule_name})"
        ))

        # Activity Log
        db.add(ActivityLog(
            user_id=assignee_id,
            user_name="System Ingestion",
            action="AUTO_INGEST_LEAD",
            module="Leads",
            details=f"Created and assigned lead '{new_lead.name}' from {source_type} using {rule_name}"
        ))

        # Record in LeadSourceEvents vault
        source_event = LeadSourceEvent(
            organization_id=organization_id,
            integration_id=integration.id if integration else None,
            external_event_id=clean_ext_id,
            source_type=source_type,
            raw_payload=json.dumps(raw_payload),
            parsed_payload=json.dumps(parsed),
            status=EventProcessingStatus.PROCESSED.value,
            lead_id=new_lead.id,
            is_duplicate=False,
            processed_at=now
        )
        db.add(source_event)
        if integration:
            integration.total_processed = (integration.total_processed or 0) + 1

        db.commit()
        db.refresh(new_lead)

        return {
            "status": "CREATED_AND_ASSIGNED",
            "message": f"Successfully ingested new lead '{new_lead.name}' from {source_type}.",
            "lead_id": new_lead.id,
            "lead_name": new_lead.name,
            "assigned_to_id": assignee_id,
            "assignment_rule": rule_name,
            "sla_deadline": sla_deadline.isoformat(),
            "is_duplicate": False
        }
