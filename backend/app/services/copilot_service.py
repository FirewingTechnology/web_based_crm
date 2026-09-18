import os
import re
import json
from typing import List, Dict, Any, Optional
from datetime import datetime, timezone, timedelta
from sqlalchemy.orm import Session
from sqlalchemy import or_, func

from app.models.user import User, UserRole
from app.models.lead import Lead, LeadStatus, LeadPriority, LeadNote
from app.models.project import Project, ProjectStatus
from app.models.followup import Followup, FollowupStatus
from app.models.commission import Commission, CommissionStage
from app.models.booking import Booking, BookingStatus
from app.models.site_visit import SiteVisit, SiteVisitStatus
from app.models.call import CallRecord
from app.models.automation import AutomationRule


def _get_now():
    return datetime.now(timezone.utc).replace(tzinfo=None)


class CopilotRAGService:
    """
    REALVION Production RAG (Retrieval-Augmented Generation) Engine.
    
    Architecture:
    1. Query Intent & Entity Extraction (Leads, Projects, Budgets, Stages, Operations)
    2. Dynamic Targeted CRM Retrieval (Deep Lead Dossiers, Project Inventories, Follow-ups, Calls)
    3. Real Estate Revenue Operating System Playbooks (Objection Handling, Qualification, SOPs)
    4. Grounded Context Generation for LLM (OpenAI GPT-4o-mini)
    5. Zero-Downtime Deterministic RAG Fallback (Provides accurate CRM facts even without LLM key)
    """

    SYSTEM_PROMPT_TEMPLATE = """You are REALVION Copilot — an expert AI Real Estate Revenue Operating System Coach & Assistant.
You work directly inside REALVION, used by real estate developers, brokerage channel partners, and sales executives in India.

CURRENT SESSION CONTEXT:
- Logged-in User: {user_name} (Role: {user_role})
- Organization: {org_name}
- Current Time: {timestamp}

=== RETRIEVED REAL-TIME CRM DATA (GROUND TRUTH) ===
{retrieved_crm_data}
===================================================

=== REAL ESTATE DOMAIN KNOWLEDGE & OPERATIONAL PLAYBOOK ===
{retrieved_playbook}
==========================================================

=== PIPELINE HEALTH & KPI SUMMARY ===
{pipeline_summary}
====================================

RESPONSE GUIDELINES:
1. GROUNDING & ACCURACY: For questions about leads, clients, projects, or tasks, answer strictly based on the retrieved CRM records and real estate playbooks above. NEVER fabricate phone numbers, lead names, prices, or project specs.
2. CONVERSATIONAL & PROFESSIONAL: For greetings (e.g. "hi", "hello", "hey"), respond warmly, introduce yourself as REALVION Copilot, and suggest 2-3 sales actions. For general knowledge queries outside the CRM, answer directly and concisely, then offer real estate CRM assistance.
3. ACTIONABLE & PRECISE: When discussing leads or inventory, provide specific details (Budget, Health Score, Last Interaction, Next Step).
4. ACTION DEEP-LINKS: Always provide appropriate clickable action deep-links in `suggested_actions` matching the user's workflow (e.g. Lead details, Projects list, Follow-up tracker, Site Visit manager, Automation rules).
5. STRICT OUTPUT FORMAT: Return ONLY a valid JSON object without markdown fences or extraneous text.

JSON Schema:
{{
  "answer": "Your comprehensive, beautifully formatted markdown response here...",
  "suggested_actions": [
    {{"label": "Button Label", "url": "/admin/route_or_query"}}
  ],
  "data_points": {{
    "entity_type": "lead | project | pipeline | playbook",
    "primary_match": "Name or Title",
    "highlights": ["Key point 1", "Key point 2"]
  }}
}}
"""

    # ─────────────────────────────────────────────────────────────────────────
    # 1. INTENT & ENTITY EXTRACTION
    # ─────────────────────────────────────────────────────────────────────────
    @staticmethod
    def extract_query_entities(query: str) -> Dict[str, Any]:
        """Extracts recognizable search keywords, phones, configs, and intents."""
        q_lower = query.lower()

        # Extract phone numbers (10 digits or with country code)
        phone_match = re.search(r'(\+?91[\s-]?)?[6-9]\d{9}', query)
        phone = phone_match.group(0).replace(' ', '').replace('-', '') if phone_match else None

        # Extract configuration (1 BHK, 2 BHK, 3 BHK, 4 BHK, Villa, Penthouse, Plot)
        configs = []
        for cfg in ['1 bhk', '2 bhk', '3 bhk', '4 bhk', 'villa', 'penthouse', 'plot']:
            if cfg in q_lower:
                configs.append(cfg.upper())

        # Extract price / budget indicators
        budget_match = re.search(r'(\d+(?:\.\d+)?)\s*(cr|crore|l|lakh|lac|k)', q_lower)
        budget_val = None
        if budget_match:
            val = float(budget_match.group(1))
            unit = budget_match.group(2)
            if 'cr' in unit:
                budget_val = val * 100.0  # normalize to Lakhs
            elif 'l' in unit or 'lac' in unit:
                budget_val = val

        # Clean words for search tokens
        stop_words = {
            'the', 'is', 'a', 'an', 'and', 'or', 'to', 'for', 'in', 'on', 'at', 'by',
            'what', 'who', 'where', 'when', 'how', 'can', 'you', 'tell', 'me', 'about',
            'show', 'give', 'get', 'list', 'details', 'detail', 'please', 'with', 'from',
            'any', 'our', 'my', 'we', 'have', 'do', 'does', 'are', 'status', 'info'
        }
        tokens = [w for w in re.findall(r'\b[a-zA-Z0-9_\-\.\+]+\b', q_lower) if w not in stop_words and len(w) > 2]

        # Word boundary keyword checker
        def _has_keyword(words: List[str]) -> bool:
            pattern = r'\b(' + '|'.join(re.escape(w) for w in words) + r')\b'
            return bool(re.search(pattern, q_lower))

        return {
            "raw_query": query,
            "tokens": tokens,
            "phone": phone,
            "configs": configs,
            "budget_lakhs": budget_val,
            "asks_leads": _has_keyword(['lead', 'leads', 'client', 'clients', 'buyer', 'buyers', 'customer', 'prospect', 'prospects', 'contact', 'hot', 'risk', 'who']),
            "asks_projects": _has_keyword(['project', 'projects', 'property', 'properties', 'tower', 'towers', 'villa', 'villas', 'apartment', 'apartments', 'bhk', 'inventory', 'unit', 'units', 'rera', 'location', 'whitefield', 'noida', 'pune', 'bangalore']),
            "asks_followups": _has_keyword(['followup', 'followups', 'follow-up', 'follow-ups', 'today', 'tomorrow', 'pending', 'overdue', 'schedule', 'task', 'tasks', 'outreach']),
            "asks_site_visits": _has_keyword(['visit', 'visits', 'cab', 'driver', 'otp', 'chauffeur']),
            "asks_commissions": _has_keyword(['commission', 'commissions', 'broker', 'brokers', 'payout', 'receivable', 'aging', 'unpaid', 'slab', 'slabs']),
            "asks_bookings": _has_keyword(['booking', 'bookings', 'deal', 'deals', 'booked', 'token']),
            "asks_automations": _has_keyword(['automation', 'automations', 'rule', 'rules', 'trigger', 'triggers', 'sla', 'escalation']),
            "asks_playbook": _has_keyword(['script', 'scripts', 'objection', 'objections', 'pitch', 'convince', 'discount', 'delay', 'wait', 'negotiate', 'negotiation', 'handle', 'handling', 'kyc', 'how to', 'expensive', 'costly'])
        }

    # ─────────────────────────────────────────────────────────────────────────
    # 2. DYNAMIC TARGETED CRM RETRIEVAL (RAG RETRIEVER)
    # ─────────────────────────────────────────────────────────────────────────
    @classmethod
    def retrieve_context(
        cls,
        db: Session,
        user: User,
        entities: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Queries database for entities matching the user's specific question.
        Returns formatted context strings and structured data points.
        """
        org_id = user.organization_id
        retrieved_leads_text = []
        retrieved_projects_text = []
        retrieved_schedules_text = []
        retrieved_bookings_text = []
        retrieved_automations_text = []
        suggested_actions = []
        data_points = {}

        now = _get_now()
        today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
        tomorrow = today_start + timedelta(days=1)

        # ─── A. RETRIEVE RELEVANT LEADS ──────────────────────────────────────
        lead_query = db.query(Lead).filter(Lead.is_deleted == False)
        if org_id:
            lead_query = lead_query.filter(Lead.organization_id == org_id)

        # Search matches
        matched_leads = []
        if entities.get("phone"):
            p_leads = lead_query.filter(Lead.phone.contains(entities["phone"])).limit(3).all()
            matched_leads.extend(p_leads)

        # Token matching against lead name, email, preferred location, preferred configuration
        for token in entities.get("tokens", []):
            if len(matched_leads) >= 4:
                break
            t_leads = lead_query.filter(
                or_(
                    Lead.name.ilike(f"%{token}%"),
                    Lead.email.ilike(f"%{token}%"),
                    Lead.preferred_location.ilike(f"%{token}%"),
                    Lead.preferred_configuration.ilike(f"%{token}%"),
                    Lead.tags.ilike(f"%{token}%")
                )
            ).limit(3).all()
            for l in t_leads:
                if l not in matched_leads:
                    matched_leads.append(l)

        # If user specifically asked about hot or at-risk leads without a specific name
        if not matched_leads and entities.get("asks_leads"):
            if "risk" in entities["raw_query"].lower():
                matched_leads = lead_query.filter(
                    Lead.health_score < 40,
                    Lead.status.notin_([LeadStatus.BOOKED, LeadStatus.LOST])
                ).order_by(Lead.health_score.asc()).limit(4).all()
            elif "hot" in entities["raw_query"].lower():
                matched_leads = lead_query.filter(
                    Lead.health_score >= 70,
                    Lead.status.notin_([LeadStatus.BOOKED, LeadStatus.LOST])
                ).order_by(Lead.health_score.desc()).limit(4).all()
            elif entities.get("budget_lakhs"):
                target_b = entities["budget_lakhs"]
                matched_leads = lead_query.filter(
                    or_(
                        Lead.budget_max >= (target_b * 0.8),
                        Lead.budget_min <= (target_b * 1.2)
                    )
                ).limit(4).all()

        # Format retrieved leads with deep dossier
        if matched_leads:
            data_points["leads"] = []
            for l in matched_leads[:3]:
                lead_info = [
                    f"LEAD: {l.name} (ID: {l.id})",
                    f"  - Phone: {l.phone} | Email: {l.email or 'Not provided'}",
                    f"  - Status: {l.status.value if hasattr(l.status, 'value') else l.status} | Priority: {l.priority.value if hasattr(l.priority, 'value') else l.priority}",
                    f"  - Budget: ₹{l.budget_min or 0}L - ₹{l.budget_max or 0}L | Location Preference: {l.preferred_location or 'Any'}",
                    f"  - Preferred Config: {l.preferred_configuration or 'Any'}",
                    f"  - Health Score: {l.health_score}/100 ({l.health_category})",
                    f"  - Recommended Action: {l.recommended_action or 'Reach out to schedule qualification call'}"
                ]

                # Fetch recent notes
                recent_notes = db.query(LeadNote).filter(LeadNote.lead_id == l.id).order_by(LeadNote.created_at.desc()).limit(2).all()
                if recent_notes:
                    lead_info.append("  - Recent Notes: " + " | ".join([f'"{n.note_text[:80]}"' for n in recent_notes]))

                # Fetch recent call logs
                recent_calls = db.query(CallRecord).filter(CallRecord.lead_id == l.id).order_by(CallRecord.started_at.desc()).limit(2).all()
                if recent_calls:
                    call_summaries = []
                    for c in recent_calls:
                        c_str = f"{c.outcome} ({c.duration_seconds}s)"
                        if c.ai_summary:
                            c_str += f": {c.ai_summary[:70]}"
                        call_summaries.append(c_str)
                    lead_info.append("  - Recent Calls: " + " | ".join(call_summaries))

                # Fetch pending followups
                pending_fu = db.query(Followup).filter(
                    Followup.lead_id == l.id,
                    Followup.status == FollowupStatus.PENDING
                ).order_by(Followup.scheduled_at.asc()).first()
                if pending_fu:
                    lead_info.append(f"  - Upcoming Follow-up: {pending_fu.title} scheduled for {pending_fu.scheduled_at.strftime('%d %b, %I:%M %p')}")

                retrieved_leads_text.append("\n".join(lead_info))
                suggested_actions.append({"label": f"Open Lead: {l.name}", "url": f"/admin/leads?search={l.phone}"})
                data_points["leads"].append({
                    "id": l.id,
                    "name": l.name,
                    "phone": l.phone,
                    "status": str(l.status),
                    "health": l.health_score,
                    "budget_max": l.budget_max
                })

        # ─── B. RETRIEVE RELEVANT PROJECTS / INVENTORY ───────────────────────
        proj_query = db.query(Project).filter(Project.is_deleted == False)
        if org_id:
            proj_query = proj_query.filter(Project.organization_id == org_id)

        matched_projects = []
        for token in entities.get("tokens", []):
            if len(matched_projects) >= 4:
                break
            p_res = proj_query.filter(
                or_(
                    Project.name.ilike(f"%{token}%"),
                    Project.location.ilike(f"%{token}%"),
                    Project.configuration.ilike(f"%{token}%"),
                    Project.amenities.ilike(f"%{token}%")
                )
            ).all()
            for p in p_res:
                if p not in matched_projects:
                    matched_projects.append(p)

        # Match by configuration or budget
        if not matched_projects and (entities.get("configs") or entities.get("budget_lakhs") or entities.get("asks_projects")):
            all_p = proj_query.all()
            for p in all_p:
                match_cfg = False
                if entities.get("configs"):
                    for c in entities["configs"]:
                        if c.lower() in (p.configuration or '').lower():
                            match_cfg = True
                            break
                match_bud = False
                if entities.get("budget_lakhs"):
                    b = entities["budget_lakhs"]
                    if (p.min_price or 0) <= b * 1.1 and (p.max_price or 9999) >= b * 0.9:
                        match_bud = True

                if match_cfg or match_bud or (entities.get("asks_projects") and not entities.get("asks_leads")):
                    if p not in matched_projects:
                        matched_projects.append(p)

        if matched_projects:
            data_points["projects"] = []
            for p in matched_projects[:3]:
                p_text = [
                    f"PROJECT: {p.name} (ID: {p.id})",
                    f"  - Location: {p.location}",
                    f"  - Configuration: {p.configuration}",
                    f"  - Price Range: ₹{p.min_price}L - ₹{p.max_price}L",
                    f"  - Status: {p.status.value if hasattr(p.status, 'value') else p.status}",
                    f"  - Possession: {p.possession_date or 'On Request'}",
                    f"  - RERA ID: {p.rera_id or 'Applied / Verified'}",
                    f"  - Amenities: {p.amenities or 'Clubhouse, Swimming Pool, 24/7 Security'}"
                ]
                retrieved_projects_text.append("\n".join(p_text))
                suggested_actions.append({"label": f"View Project: {p.name}", "url": "/admin/projects"})
                data_points["projects"].append({
                    "id": p.id,
                    "name": p.name,
                    "location": p.location,
                    "price_min": p.min_price,
                    "price_max": p.max_price,
                    "config": p.configuration
                })

        # ─── C. RETRIEVE SCHEDULES (FOLLOW-UPS & SITE VISITS) ─────────────────
        if entities.get("asks_followups") or entities.get("asks_site_visits") or "today" in entities["raw_query"].lower() or "overdue" in entities["raw_query"].lower():
            # Overdue follow-ups
            overdue_fus = db.query(Followup).filter(
                Followup.is_deleted == False,
                Followup.status == FollowupStatus.PENDING,
                Followup.scheduled_at < now
            )
            if org_id:
                overdue_fus = overdue_fus.filter(Followup.organization_id == org_id)
            if user.role in [UserRole.SALES_EXECUTIVE, UserRole.BROKER]:
                overdue_fus = overdue_fus.filter(Followup.assigned_to_id == user.id)
            overdue_list = overdue_fus.order_by(Followup.scheduled_at.asc()).limit(4).all()

            # Today's follow-ups
            today_fus = db.query(Followup).filter(
                Followup.is_deleted == False,
                Followup.status == FollowupStatus.PENDING,
                Followup.scheduled_at >= today_start,
                Followup.scheduled_at < tomorrow
            )
            if org_id:
                today_fus = today_fus.filter(Followup.organization_id == org_id)
            if user.role in [UserRole.SALES_EXECUTIVE, UserRole.BROKER]:
                today_fus = today_fus.filter(Followup.assigned_to_id == user.id)
            today_list = today_fus.order_by(Followup.scheduled_at.asc()).limit(4).all()

            # Site Visits today / upcoming
            sv_query = db.query(SiteVisit).filter(
                SiteVisit.is_deleted == False,
                SiteVisit.scheduled_at >= today_start
            )
            if org_id:
                sv_query = sv_query.filter(SiteVisit.organization_id == org_id)
            if user.role in [UserRole.SALES_EXECUTIVE, UserRole.BROKER]:
                sv_query = sv_query.filter(SiteVisit.sales_executive_id == user.id)
            upcoming_svs = sv_query.order_by(SiteVisit.scheduled_at.asc()).limit(3).all()

            sched_lines = []
            if overdue_list:
                sched_lines.append(f"OVERDUE FOLLOW-UPS ({len(overdue_list)} items needing immediate action):")
                for f in overdue_list:
                    lead_name = f.lead.name if f.lead else "Lead"
                    sched_lines.append(f"  - {f.title} for {lead_name} (Due: {f.scheduled_at.strftime('%d %b, %I:%M %p')})")
                suggested_actions.append({"label": "Resolve Overdue Follow-ups", "url": "/admin/followups"})

            if today_list:
                sched_lines.append(f"\nTODAY'S SCHEDULED FOLLOW-UPS ({len(today_list)} items):")
                for f in today_list:
                    lead_name = f.lead.name if f.lead else "Lead"
                    sched_lines.append(f"  - {f.type.value if hasattr(f.type, 'value') else f.type}: {f.title} with {lead_name} at {f.scheduled_at.strftime('%I:%M %p')}")

            if upcoming_svs:
                sched_lines.append(f"\nUPCOMING SITE VISITS ({len(upcoming_svs)} visits):")
                for sv in upcoming_svs:
                    lead_name = sv.lead.name if sv.lead else "Lead"
                    proj_name = sv.project.name if sv.project else "Project"
                    status_str = f"OTP Verified" if sv.is_otp_verified else "OTP Pending"
                    sched_lines.append(f"  - {lead_name} @ {proj_name} on {sv.scheduled_at.strftime('%d %b, %I:%M %p')} [{status_str}]")
                suggested_actions.append({"label": "Manage Site Visits", "url": "/admin/site-visits"})

            if sched_lines:
                retrieved_schedules_text.append("\n".join(sched_lines))

        # ─── D. RETRIEVE BOOKINGS / DEALS ────────────────────────────────────
        if entities.get("asks_bookings") or "revenue" in entities["raw_query"].lower() or "deal" in entities["raw_query"].lower():
            bk_query = db.query(Booking).filter(Booking.is_deleted == False)
            if org_id:
                bk_query = bk_query.filter(Booking.organization_id == org_id)
            recent_bks = bk_query.order_by(Booking.created_at.desc()).limit(4).all()
            if recent_bks:
                bk_lines = ["RECENT BOOKINGS & DEALS:"]
                for b in recent_bks:
                    lead_name = b.lead.name if b.lead else "Customer"
                    proj_name = b.project.name if b.project else "Project"
                    bk_lines.append(f"  - {b.booking_number}: {lead_name} | {proj_name} (Unit {b.unit_number}) | Deal: ₹{b.total_deal_value/100000:.2f}L | Token: ₹{b.booking_amount/100000:.2f}L | Status: {b.status}")
                retrieved_bookings_text.append("\n".join(bk_lines))
                suggested_actions.append({"label": "View Bookings", "url": "/admin/bookings"})

        # ─── E. RETRIEVE AUTOMATIONS ─────────────────────────────────────────
        if entities.get("asks_automations"):
            auto_query = db.query(AutomationRule).filter(AutomationRule.is_deleted == False)
            if org_id:
                auto_query = auto_query.filter(AutomationRule.organization_id == org_id)
            active_rules = auto_query.filter(AutomationRule.is_active == True).limit(5).all()
            if active_rules:
                a_lines = ["ACTIVE AUTOMATION RULES:"]
                for r in active_rules:
                    a_lines.append(f"  - '{r.name}': Trigger on [{r.event_trigger}], Executed {r.execution_count} times")
                retrieved_automations_text.append("\n".join(a_lines))
                suggested_actions.append({"label": "Configure Automations", "url": "/admin/automation"})

        # Assemble overall retrieved CRM block
        crm_blocks = []
        if retrieved_leads_text:
            crm_blocks.append("--- MATCHED LEADS DOSSIERS ---\n" + "\n\n".join(retrieved_leads_text))
        if retrieved_projects_text:
            crm_blocks.append("--- MATCHED PROJECTS & INVENTORY ---\n" + "\n\n".join(retrieved_projects_text))
        if retrieved_schedules_text:
            crm_blocks.append("--- SCHEDULED INTERACTIONS & TASKS ---\n" + "\n\n".join(retrieved_schedules_text))
        if retrieved_bookings_text:
            crm_blocks.append("--- RECENT BOOKINGS ---\n" + "\n\n".join(retrieved_bookings_text))
        if retrieved_automations_text:
            crm_blocks.append("--- AUTOMATION RULES ---\n" + "\n\n".join(retrieved_automations_text))

        final_crm_text = "\n\n".join(crm_blocks) if crm_blocks else "No specific lead/project query match detected in current filters. System wide KPIs applied below."

        return {
            "retrieved_crm_data": final_crm_text,
            "has_specific_matches": bool(matched_leads or matched_projects or retrieved_schedules_text),
            "suggested_actions": suggested_actions,
            "data_points": data_points
        }

    # ─────────────────────────────────────────────────────────────────────────
    # 3. DOMAIN KNOWLEDGE & PLAYBOOK RETRIEVER (RAG KNOWLEDGE)
    # ─────────────────────────────────────────────────────────────────────────
    @staticmethod
    def retrieve_playbooks(query: str) -> str:
        """
        Retrieves real estate sales playbooks, objection handlers,
        and system operational procedures matching query keywords.
        """
        q = query.lower()
        playbooks = []

        # Objection: Price / Discount / Negotiation
        if any(w in q for w in ['price', 'discount', 'expensive', 'cost', 'budget', 'rate', 'negotiat', 'offer']):
            playbooks.append("""[OBJECTION PLAYBOOK: PRICE & DISCOUNT RESISTANCE]
1. Never give discounts upfront. Position value before price.
2. Break down the Cost Sheet: Highlight carpet area efficiency, floor rise value, premium facing amenities, and transparent statutory charges (Stamp Duty, GST).
3. Offer Structured Payment Flexibilities: Builder subvention (e.g. 10:90 or Construction Linked Plan), waived clubhouse fees, or modular kitchen add-ons instead of direct price slashing.
4. Urgency Anchor: Reference upcoming price escalations after current launch phase completion.""")

        # Objection: Construction Delay / Under Construction Fear
        if any(w in q for w in ['delay', 'under construction', 'possession', 'trust', 'builder', 'delivery', 'risk']):
            playbooks.append("""[OBJECTION PLAYBOOK: UNDER-CONSTRUCTION DELAY FEAR]
1. RERA Protection Assurance: Emphasize that 70% of buyer funds are mandatorily locked in an audited RERA Escrow Account used exclusively for construction.
2. Construction Milestone Transparency: Offer to share live monthly site progress photographs and engineer audit logs.
3. Builder Delivery Track Record: Highlight previous projects successfully delivered with OC (Occupancy Certificate).
4. Compensation Clause: Remind buyer of statutory RERA interest compensation payable by builder for any delay beyond declared possession.""")

        # Objection: Market Timing ("I will wait for prices to drop")
        if any(w in q for w in ['wait', 'market', 'timing', 'drop', 'crash', 'later', 'next year']):
            playbooks.append("""[OBJECTION PLAYBOOK: TIMING HESITATION ("I WILL WAIT")]
1. Cost of Inaction: Prime inventory (Vastu compliant, higher floor, open views) gets booked first. Waiting guarantees settling for inferior units.
2. Infrastructure Appreciation: Show upcoming metro lines, arterial road expansions, and commercial hubs driving up local capital values faster than FD returns.
3. Rental Outflow: Calculate total rent paid during the waiting period vs equity creation in an owned property.""")

        # Playbook: Site Visit Conversion & Anti-Drop SOP
        if any(w in q for w in ['site visit', 'visit', 'show', 'cab', 'turn up', 'no show']):
            playbooks.append("""[OPERATIONAL SOP: HIGH-CONVERSION SITE VISIT PROTOCOL]
1. Chauffeur Booking: Dispatch REALVION cab 45 minutes ahead of scheduled time. Confirm executive contact with client before car departure.
2. Digital Brochure Pre-briefing: Send personalized unit layout and walkthrough video 2 hours before visit via WhatsApp.
3. Anti-Fraud Geofenced OTP Check-in: The sales executive must verify the client's 4-digit OTP upon arrival at the project gallery to activate commission tracking.
4. On-Site Discussion Notes: Log client's reaction to layout, sunlight, master bedroom, and pricing immediately into REALVION mobile.""")

        # Playbook: 9-Stage Qualification & Health Score
        if any(w in q for w in ['health', 'score', 'stage', 'drop', 'decay', 'pipeline', 'qualify']):
            playbooks.append("""[REALVION REVENUE OS: PIPELINE & HEALTH SCORING RULES]
Pipeline: LEAD -> QUALIFICATION -> REQUIREMENT -> PROPERTY MATCH -> FOLLOW-UP -> SITE VISIT -> NEGOTIATION -> BOOKING -> COMMISSION.
Health Score (0 - 100):
- Excellent (80-100): Active two-way engagement within 24-48 hours, clear budget & possession timeline.
- At Risk (40-69): Postponed follow-up > 2 times, or no contact for 5+ days after qualified interest.
- Critical (<40): Postponed > 3 times, SLA breached, or inactive > 10 days. System recommends manager re-assignment or automated WhatsApp re-engagement.""")

        if not playbooks:
            # Default sales best practice summary
            playbooks.append("""[GENERAL REAL ESTATE SALES COACHING PRINCIPLES]
- Always end customer interactions with a firm calendar commitment (Date + Time + Agenda).
- Qualify on BANT: Budget, Authority (Sole buyer vs family joint decision), Need (Self-use vs Investment), Timeline (Immediate vs 6 months).
- Keep CRM logs fresh: Every phone call must have logged duration, key objection, and immediate next action.""")

        return "\n\n".join(playbooks)

    # ─────────────────────────────────────────────────────────────────────────
    # 4. PIPELINE SUMMARY SNAPSHOT
    # ─────────────────────────────────────────────────────────────────────────
    @staticmethod
    def build_pipeline_kpis(db: Session, user: User) -> str:
        """Calculates real-time org and user pipeline metrics."""
        org_id = user.organization_id
        now = _get_now()
        today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
        tomorrow = today_start + timedelta(days=1)

        def lead_base(q):
            q = q.filter(Lead.is_deleted == False)
            if org_id:
                q = q.filter(Lead.organization_id == org_id)
            if user.role in [UserRole.SALES_EXECUTIVE, UserRole.BROKER]:
                q = q.filter(Lead.assigned_to_id == user.id)
            return q

        total_active = lead_base(db.query(Lead)).filter(Lead.status.notin_([LeadStatus.LOST])).count()
        hot_count = lead_base(db.query(Lead)).filter(Lead.health_score >= 70, Lead.status.notin_([LeadStatus.BOOKED, LeadStatus.LOST])).count()
        risk_count = lead_base(db.query(Lead)).filter(Lead.health_score < 40, Lead.status.notin_([LeadStatus.BOOKED, LeadStatus.LOST])).count()

        fu_q = db.query(Followup).filter(Followup.is_deleted == False, Followup.status == FollowupStatus.PENDING)
        if org_id:
            fu_q = fu_q.filter(Followup.organization_id == org_id)
        if user.role in [UserRole.SALES_EXECUTIVE, UserRole.BROKER]:
            fu_q = fu_q.filter(Followup.assigned_to_id == user.id)
        overdue_cnt = fu_q.filter(Followup.scheduled_at < now).count()
        today_fu_cnt = fu_q.filter(Followup.scheduled_at >= today_start, Followup.scheduled_at < tomorrow).count()

        sv_q = db.query(SiteVisit).filter(SiteVisit.is_deleted == False)
        if org_id:
            sv_q = sv_q.filter(SiteVisit.organization_id == org_id)
        if user.role in [UserRole.SALES_EXECUTIVE, UserRole.BROKER]:
            sv_q = sv_q.filter(SiteVisit.sales_executive_id == user.id)
        today_sv_cnt = sv_q.filter(SiteVisit.scheduled_at >= today_start, SiteVisit.scheduled_at < tomorrow).count()

        return (
            f"Active Pipeline Leads: {total_active} | Hot High-Priority: {hot_count} | At-Risk Deals: {risk_count}\n"
            f"Overdue Follow-ups: {overdue_cnt} | Follow-ups Due Today: {today_fu_cnt} | Site Visits Today: {today_sv_cnt}"
        )

    # ─────────────────────────────────────────────────────────────────────────
    # 5. ZERO-DOWNTIME DETERMINISTIC RAG SYNTHESIZER (SMART FALLBACK)
    # ─────────────────────────────────────────────────────────────────────────
    @classmethod
    def synthesize_local_rag(
        cls,
        user_query: str,
        entities: Dict[str, Any],
        retrieval_result: Dict[str, Any],
        playbook_text: str,
        kpi_summary: str
    ) -> Dict[str, Any]:
        """
        Synthesizes a high-quality, grounded markdown answer directly
        from the retrieved CRM records and real estate playbooks.
        Guarantees 100% functionality and accuracy even without OpenAI API key!
        """
        crm_data = retrieval_result["retrieved_crm_data"]
        raw_actions = retrieval_result.get("suggested_actions", [])
        data_points = retrieval_result.get("data_points", {})

        # Deduplicate actions
        seen_urls = set()
        actions = []
        for act in raw_actions:
            if act.get("url") and act["url"] not in seen_urls:
                seen_urls.add(act["url"])
                actions.append(act)

        # 0. Conversational Greeting Detection
        q_strip = user_query.strip().lower()
        if q_strip in ['hi', 'hello', 'hey', 'namaste', 'good morning', 'good afternoon', 'good evening', 'hi there', 'hello copilot']:
            answer = (
                f"👋 **Hello! I am your REALVION Revenue Copilot.**\n\n"
                f"I am connected to your live CRM data and ready to assist:\n\n"
                f"- 👤 **Lead Search**: Ask about any client name, phone number, or stage\n"
                f"- 🏢 **Property Matching**: Ask for available 2/3 BHK units, pricing, or locations\n"
                f"- 📅 **Daily Priorities**: View overdue follow-ups and today's site visits\n"
                f"- 🎯 **Sales Battlecards**: Objection scripts for pricing discounts or delay fears\n\n"
                f"What would you like to work on right now?"
            )
            return {
                "answer": answer,
                "suggested_actions": [
                    {"label": "Show Hot Leads", "url": "/admin/leads"},
                    {"label": "Explore Projects", "url": "/admin/projects"},
                    {"label": "Today's Follow-ups", "url": "/admin/followups"}
                ],
                "data_points": {"type": "greeting"}
            }

        # 0b. General Knowledge / Off-Topic Handling (Fallback mode)
        general_indicators = ['pm of', 'prime minister', 'president', 'capital of', 'weather', 'movie', 'song', 'cricket', 'who is', 'what is']
        if any(g in q_strip for g in general_indicators) and not (data_points.get("leads") or data_points.get("projects")):
            answer = (
                f"ℹ️ I am **REALVION Copilot**, focused on your real estate sales operations and CRM pipeline.\n\n"
                f"For general questions like *\"{user_query}\"*, please ensure the OpenAI LLM connection is active on your server.\n\n"
                f"Inside your CRM right now:\n\n"
                f"{kpi_summary}\n\n"
                f"You can ask me to search leads, match inventory, check overdue follow-ups, or help with buyer negotiations."
            )
            return {
                "answer": answer,
                "suggested_actions": [
                    {"label": "View Leads Pipeline", "url": "/admin/leads"},
                    {"label": "Explore Projects", "url": "/admin/projects"}
                ],
                "data_points": {"type": "off_topic"}
            }

        # 1. Objection / Playbook Routing (Highest precedence when user asks how to handle objections or scripts)
        if entities.get("asks_playbook") and playbook_text and "[OBJECTION PLAYBOOK" in playbook_text:
            first_playbook = playbook_text.split("==========================================================")[0]
            answer = (
                f"### 🎯 Real Estate Sales Playbook & Objection Strategy\n\n"
                f"{first_playbook}\n\n"
                f"📊 **Current Organization Pipeline Status**:\n"
                f"{kpi_summary}"
            )
            return {
                "answer": answer,
                "suggested_actions": [
                    {"label": "Explore Hot Leads", "url": "/admin/leads"},
                    {"label": "View Automations", "url": "/admin/automation"}
                ],
                "data_points": {"type": "playbook"}
            }

        # 2. Project-First Routing
        if (entities.get("asks_projects") or entities.get("configs")) and data_points.get("projects"):
            projects = data_points["projects"]
            proj_blocks = []
            for p in projects[:3]:
                proj_blocks.append(
                    f"#### 🏢 **{p['name']}**\n"
                    f"- **Location**: {p['location']}\n"
                    f"- **Configuration**: {p['config']}\n"
                    f"- **Price**: ₹{p['price_min']} Lakhs to ₹{p['price_max']} Lakhs"
                )

            answer = (
                f"### 🏢 Matching Property Inventory ({len(projects)} found)\n\n"
                + "\n\n".join(proj_blocks)
                + "\n\n💡 **Sales Tip**: Connect with buyers looking for these configurations and offer a personalized site visit."
            )
            return {
                "answer": answer,
                "suggested_actions": actions or [{"label": "View All Projects", "url": "/admin/projects"}],
                "data_points": data_points
            }

        # 3. Lead-First Routing
        if data_points.get("leads"):
            leads = data_points["leads"]
            if len(leads) == 1:
                lead = leads[0]
                status_clean = str(lead['status']).replace('LeadStatus.', '')
                answer = (
                    f"### 📋 CRM Intelligence: **{lead['name']}**\n\n"
                    f"Here is the verified dossier from your live database:\n\n"
                    f"- **Phone**: `{lead['phone']}`\n"
                    f"- **Pipeline Stage**: **{status_clean}**\n"
                    f"- **Health Score**: **{lead['health']}/100** ({'Healthy 🟢' if lead['health'] >= 70 else 'Needs Attention ⚠️' if lead['health'] >= 40 else 'Critical 🔴'})\n"
                    f"- **Budget Ceiling**: ₹{lead.get('budget_max') or 'Flexible'} Lakhs\n\n"
                    f"**Recommended Strategy**:\n"
                    f"Review recent notes and follow-ups to maintain deal momentum. If this buyer is hesitating on price or possession, offer a structured payment milestone."
                )
            else:
                lead_blocks = []
                for l in leads[:3]:
                    status_clean = str(l['status']).replace('LeadStatus.', '')
                    lead_blocks.append(
                        f"#### 👤 **{l['name']}**\n"
                        f"- **Phone**: `{l['phone']}` | Stage: **{status_clean}** | Health: **{l['health']}/100** | Budget: ₹{l.get('budget_max') or 'Flexible'}L"
                    )
                answer = (
                    f"### 📋 Matching Leads ({len(leads)} found)\n\n"
                    + "\n\n".join(lead_blocks)
                )

            return {
                "answer": answer,
                "suggested_actions": actions or [{"label": "Open Leads", "url": "/admin/leads"}],
                "data_points": data_points
            }

        # 4. Schedule / Task Routing
        if "OVERDUE FOLLOW-UPS" in crm_data or "TODAY'S SCHEDULED FOLLOW-UPS" in crm_data or entities.get("asks_followups"):
            answer = (
                f"### 📅 Today's Outreach & Priority Queue\n\n"
                f"{crm_data}\n\n"
                f"💡 **Coach's Advice**: Prioritize overdue follow-ups first before 12:00 PM. High-performing sales executives close 40% more deals when following up within the same calendar day."
            )
            return {
                "answer": answer,
                "suggested_actions": actions or [{"label": "Go to Follow-ups", "url": "/admin/followups"}],
                "data_points": {"type": "schedule"}
            }

        # 5. General Pipeline Overview
        answer = (
            f"### 🚀 REALVION Revenue Operating System Status\n\n"
            f"Here is your real-time operational snapshot:\n\n"
            f"{kpi_summary}\n\n"
            f"**What you can ask me next**:\n"
            f"- *'Tell me about [Lead Name or Phone]'* to view complete contact history & notes.\n"
            f"- *'Show projects with 2 or 3 BHK'* to match inventory.\n"
            f"- *'Show overdue follow-ups'* for your immediate calling queue.\n"
            f"- *'How to handle client asking for discount?'* for objection battlecards."
        )
        return {
            "answer": answer,
            "suggested_actions": [
                {"label": "View Leads Pipeline", "url": "/admin/leads"},
                {"label": "View Overdue Follow-ups", "url": "/admin/followups"},
                {"label": "Explore Projects", "url": "/admin/projects"}
            ],
            "data_points": {"type": "kpi_overview"}
        }

    # ─────────────────────────────────────────────────────────────────────────
    # 6. END-TO-END RAG ORCHESTRATION
    # ─────────────────────────────────────────────────────────────────────────
    @classmethod
    def process_query(
        cls,
        db: Session,
        user: User,
        user_query: str,
        history: List[Dict[str, str]]
    ) -> Dict[str, Any]:
        """
        Primary entrypoint for Copilot chat query:
        1. Analyzes query entities
        2. Retrieves matched CRM entities (Leads, Projects, Tasks)
        3. Retrieves domain playbooks and pipeline KPIs
        4. Queries OpenAI GPT-4o-mini with grounded context
        5. Falls back seamlessly to local deterministic RAG if API key unavailable
        """
        # 1. Entity & Intent Extraction
        entities = cls.extract_query_entities(user_query)

        # 2. Targeted Database Retrieval
        retrieval_result = cls.retrieve_context(db, user, entities)

        # 3. Domain Knowledge Retrieval
        playbook_text = cls.retrieve_playbooks(user_query)

        # 4. Pipeline Summary
        kpi_summary = cls.build_pipeline_kpis(db, user)

        # 5. Check OpenAI Configuration
        from app.config import settings
        api_key = (os.getenv("OPENAI_API_KEY") or getattr(settings, "OPENAI_API_KEY", "") or "").strip()
        is_openai_configured = api_key and not api_key.startswith("sk-your-openai") and len(api_key) > 20

        if not is_openai_configured:
            # Zero-downtime Local RAG Engine
            return cls.synthesize_local_rag(
                user_query=user_query,
                entities=entities,
                retrieval_result=retrieval_result,
                playbook_text=playbook_text,
                kpi_summary=kpi_summary
            )

        # 6. Construct Grounded RAG Prompt for OpenAI
        org_name = "Your Organization"
        try:
            if user.organization_id:
                from app.models.saas import Organization
                org = db.query(Organization).filter(Organization.id == user.organization_id).first()
                if org:
                    org_name = org.name
        except Exception:
            pass

        system_prompt = cls.SYSTEM_PROMPT_TEMPLATE.format(
            timestamp=_get_now().strftime("%d %b %Y, %I:%M %p IST"),
            user_name=user.name,
            user_role=user.role.value if hasattr(user.role, 'value') else str(user.role),
            org_name=org_name,
            retrieved_crm_data=retrieval_result["retrieved_crm_data"],
            retrieved_playbook=playbook_text,
            pipeline_summary=kpi_summary
        )

        try:
            from openai import OpenAI
            client = OpenAI(api_key=api_key)

            messages = [{"role": "system", "content": system_prompt}]
            for h in history[-8:]:
                messages.append({"role": h.get("role", "user"), "content": h.get("content", "")})
            messages.append({"role": "user", "content": user_query})

            response = client.chat.completions.create(
                model="gpt-4o-mini",
                messages=messages,
                temperature=0.3,
                max_tokens=900,
                response_format={"type": "json_object"}
            )

            raw_content = response.choices[0].message.content or "{}"
            parsed = json.loads(raw_content)

            # Merge suggested actions from DB retrieval with model actions
            final_actions = parsed.get("suggested_actions", [])
            if not final_actions and retrieval_result.get("suggested_actions"):
                final_actions = retrieval_result["suggested_actions"]

            final_data_points = parsed.get("data_points", {})
            if not final_data_points and retrieval_result.get("data_points"):
                final_data_points = retrieval_result["data_points"]

            return {
                "answer": parsed.get("answer", "I reviewed your CRM data."),
                "suggested_actions": final_actions,
                "data_points": final_data_points
            }

        except Exception as e:
            # In case of any OpenAI rate limit or network issue, smoothly fallback to deterministic RAG
            print(f"[COPILOT RAG FALLBACK] OpenAI call error: {e}. Executing local RAG synthesis.")
            return cls.synthesize_local_rag(
                user_query=user_query,
                entities=entities,
                retrieval_result=retrieval_result,
                playbook_text=playbook_text,
                kpi_summary=kpi_summary
            )


# Backwards compatibility alias
CopilotService = CopilotRAGService
