import os
import json
from typing import List, Dict, Any, Optional
from datetime import datetime, timezone, timedelta
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.models.user import User, UserRole
from app.models.lead import Lead, LeadStatus, LeadPriority
from app.models.followup import Followup, FollowupStatus
from app.models.commission import Commission, CommissionStage
from app.models.booking import Booking
from app.models.site_visit import SiteVisit, SiteVisitStatus


def _get_now():
    return datetime.now(timezone.utc).replace(tzinfo=None)


class CopilotService:
    """
    Wraps OpenAI GPT-4o with live CRM context injection.
    Every query includes a system prompt with real CRM data for the tenant,
    giving the LLM accurate, grounded answers instead of hallucinations.
    """

    SYSTEM_PROMPT_TEMPLATE = """You are REALVION Copilot — an expert Real Estate Revenue Operating System AI assistant.
You work inside a real estate CRM used by sales executives, managers, and brokers in India.
You have access to LIVE CRM DATA for the user's organization (injected below).

Your personality:
- Extremely helpful, professional, warm, and concise
- You speak like an experienced real estate sales coach
- You give specific, actionable recommendations based on the actual data
- You NEVER fabricate numbers — always reference the injected data
- When you don't know something, say "I don't have that data right now"
- Keep answers short and actionable unless asked for detail
- Use bullet points, bold text, and emojis where helpful for readability
- Always output valid JSON matching the schema: {{"answer": "...", "suggested_actions": [{{"label": "...", "url": "..."}}]}}

LIVE CRM SNAPSHOT (as of {timestamp}):
User: {user_name} | Role: {user_role} | Org: {org_name}

--- PIPELINE DATA ---
{crm_context}
---

Always respond with ONLY a JSON object. No markdown code fences, no extra text.
Schema: {{"answer": "your detailed response here", "suggested_actions": [{{"label": "Button Label", "url": "/admin/path"}}]}}
"""

    @staticmethod
    def build_crm_context(db: Session, user: User) -> str:
        """Assembles a compact, text-based CRM snapshot for GPT context injection."""
        org_id = user.organization_id
        now = _get_now()
        today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
        tomorrow = today_start + timedelta(days=1)

        lines = []

        try:
            # Base filters
            def base_lead(q):
                q = q.filter(Lead.is_deleted == False)
                if org_id:
                    q = q.filter(Lead.organization_id == org_id)
                if user.role in [UserRole.SALES_EXECUTIVE, UserRole.BROKER]:
                    q = q.filter(Lead.assigned_to_id == user.id)
                return q

            # Hot leads
            hot_leads = base_lead(db.query(Lead)).filter(
                Lead.health_score >= 70,
                Lead.status.notin_([LeadStatus.BOOKED, LeadStatus.LOST])
            ).order_by(Lead.health_score.desc()).limit(5).all()

            if hot_leads:
                lines.append(f"HOT LEADS ({len(hot_leads)} high-priority):")
                for l in hot_leads:
                    lines.append(f"  - {l.name} | Budget: ₹{l.budget_max or l.budget_min or 'N/A'}L | Status: {l.status} | Health: {l.health_score}/100 | Action: {l.recommended_action or 'Follow up'}")

            # At-risk leads
            risk_leads = base_lead(db.query(Lead)).filter(
                Lead.health_score < 40,
                Lead.status.notin_([LeadStatus.BOOKED, LeadStatus.LOST])
            ).limit(5).all()

            if risk_leads:
                lines.append(f"\nAT-RISK LEADS ({len(risk_leads)} leads losing momentum):")
                for l in risk_leads:
                    lines.append(f"  - {l.name} | Health: {l.health_score}/100 | Last contact: {l.last_contacted_at.strftime('%d %b') if l.last_contacted_at else 'Never'}")

            # Overdue follow-ups
            fu_query = db.query(Followup).filter(
                Followup.is_deleted == False,
                Followup.status == FollowupStatus.PENDING,
                Followup.scheduled_at < now
            )
            if org_id:
                fu_query = fu_query.filter(Followup.organization_id == org_id)
            if user.role in [UserRole.SALES_EXECUTIVE, UserRole.BROKER]:
                fu_query = fu_query.filter(Followup.assigned_to_id == user.id)
            overdue_fus = fu_query.count()
            lines.append(f"\nOVERDUE FOLLOW-UPS: {overdue_fus}")

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
            lines.append(f"TODAY'S FOLLOW-UPS: {today_fus.count()}")

            # Site visits
            sv_query = db.query(SiteVisit).filter(SiteVisit.is_deleted == False)
            if org_id:
                sv_query = sv_query.filter(SiteVisit.organization_id == org_id)
            if user.role in [UserRole.SALES_EXECUTIVE, UserRole.BROKER]:
                sv_query = sv_query.filter(SiteVisit.sales_executive_id == user.id)
            today_svs = sv_query.filter(
                SiteVisit.scheduled_at >= today_start,
                SiteVisit.scheduled_at < tomorrow
            ).count()
            lines.append(f"TODAY'S SITE VISITS: {today_svs}")

            # Commissions (admin/manager only)
            if user.role not in [UserRole.SALES_EXECUTIVE, UserRole.BROKER]:
                comm_query = db.query(Commission).filter(
                    Commission.is_deleted == False,
                    Commission.stage != CommissionStage.PAID
                )
                if org_id:
                    comm_query = comm_query.filter(Commission.organization_id == org_id)
                unpaid_comms = comm_query.all()
                total_unpaid = sum(c.net_receivable or c.builder_commission_amount or 0 for c in unpaid_comms)
                overdue_30 = [c for c in unpaid_comms if (c.days_overdue or 0) >= 30]
                lines.append(f"\nCOMMISSION RECEIVABLES:")
                lines.append(f"  - Total unpaid: ₹{total_unpaid/100000:.2f}L across {len(unpaid_comms)} invoices")
                lines.append(f"  - Overdue 30+ days: {len(overdue_30)} invoices")

            # Pipeline summary
            total_leads = base_lead(db.query(Lead)).filter(
                Lead.status.notin_([LeadStatus.LOST])
            ).count()
            booked_leads = base_lead(db.query(Lead)).filter(Lead.status == LeadStatus.BOOKED).count()
            lines.append(f"\nPIPELINE: {total_leads} active leads | {booked_leads} booked this cycle")

        except Exception as e:
            lines.append(f"[Context assembly error: {str(e)[:100]}]")

        return "\n".join(lines) if lines else "No CRM data available yet."

    @staticmethod
    def ask_openai(
        system_prompt: str,
        history: List[Dict[str, str]],
        user_query: str
    ) -> Dict[str, Any]:
        """
        Calls OpenAI GPT-4o-mini with conversation history.
        Returns parsed {answer, suggested_actions} dict.
        """
        try:
            from openai import OpenAI
            api_key = os.getenv("OPENAI_API_KEY", "")
            if not api_key or api_key == "sk-your-openai-key-here":
                return {
                    "answer": (
                        "⚠️ **REALVION Copilot AI is not yet configured.**\n\n"
                        "Please ask your administrator to add the OpenAI API key to the platform settings. "
                        "Once configured, I'll be able to answer all your sales questions with live CRM intelligence."
                    ),
                    "suggested_actions": [{"label": "Go to Settings", "url": "/admin/settings"}]
                }

            client = OpenAI(api_key=api_key)

            messages = [{"role": "system", "content": system_prompt}]

            # Add conversation history (last 10 turns to save tokens)
            for h in history[-10:]:
                messages.append({"role": h.get("role", "user"), "content": h.get("content", "")})

            # Add the current query
            messages.append({"role": "user", "content": user_query})

            response = client.chat.completions.create(
                model="gpt-4o-mini",
                messages=messages,
                temperature=0.4,
                max_tokens=800,
                response_format={"type": "json_object"}
            )

            raw_content = response.choices[0].message.content or "{}"
            parsed = json.loads(raw_content)

            return {
                "answer": parsed.get("answer", "I couldn't generate a response. Please try again."),
                "suggested_actions": parsed.get("suggested_actions", [])
            }

        except json.JSONDecodeError:
            # GPT didn't return valid JSON — return raw text
            raw = response.choices[0].message.content if response else ""
            return {"answer": raw or "Sorry, I encountered a parsing error.", "suggested_actions": []}
        except Exception as e:
            err_str = str(e)
            if "api_key" in err_str.lower() or "authentication" in err_str.lower():
                return {
                    "answer": "❌ Invalid OpenAI API Key. Please update the key in your .env file.",
                    "suggested_actions": []
                }
            elif "rate_limit" in err_str.lower():
                return {
                    "answer": "⏳ OpenAI rate limit reached. Please try again in a moment.",
                    "suggested_actions": []
                }
            else:
                return {
                    "answer": f"⚠️ AI service error: {err_str[:150]}. Please try again.",
                    "suggested_actions": []
                }

    @classmethod
    def get_system_prompt(cls, db: Session, user: User) -> str:
        """Builds the full system prompt with live CRM context."""
        crm_context = cls.build_crm_context(db, user)
        org_name = "Your Organization"
        try:
            if user.organization_id:
                from app.models.saas import Organization
                org = db.query(Organization).filter(Organization.id == user.organization_id).first()
                if org:
                    org_name = org.name
        except Exception:
            pass

        return cls.SYSTEM_PROMPT_TEMPLATE.format(
            timestamp=_get_now().strftime("%d %b %Y, %I:%M %p IST"),
            user_name=user.name,
            user_role=user.role.value if hasattr(user.role, 'value') else str(user.role),
            org_name=org_name,
            crm_context=crm_context
        )
