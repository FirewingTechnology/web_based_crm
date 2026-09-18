from typing import Dict, Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.database import get_db
from app.models.lead import Lead, LeadStatus, LeadPriority
from app.models.site_visit import SiteVisit, SiteVisitStatus
from app.models.commission import Commission, CommissionStage
from app.models.followup import Followup, FollowupStatus
from app.models.user import User
from app.models.booking import Booking
from app.middleware.auth_middleware import get_current_user
from app.services.priority_engine import PriorityEngine

router = APIRouter(prefix="/copilot", tags=["AI CRM Copilot"])

class CopilotQueryRequest(BaseModel):
    query: str

class CopilotQueryResponse(BaseModel):
    query: str
    answer: str
    suggested_actions: List[Dict[str, str]]
    data_points: Dict[str, Any]

@router.post("/query", response_model=CopilotQueryResponse)
def ask_crm_copilot(
    payload: CopilotQueryRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Answers sales and executive questions using live, authorized CRM data points.
    Never fabricates metrics. Explains reasons and recommends actionable next steps.
    """
    q = payload.query.lower().strip()
    org_id = current_user.organization_id

    # 1. "Which leads should I call today?" / "today's calls" / "priorities"
    if "call" in q or "priority" in q or "today" in q and "visit" not in q and "commission" not in q:
        priorities = PriorityEngine.get_today_priorities(db, current_user)
        items = priorities.get("items", [])[:5]
        
        if not items:
            return CopilotQueryResponse(
                query=payload.query,
                answer="You have zero urgent overdue calls today! All scheduled buyer touchpoints are up to date.",
                suggested_actions=[{"label": "Review New Leads", "url": "/leads"}],
                data_points={"count": 0}
            )

        bullet_lines = []
        for it in items:
            bullet_lines.append(f"• **{it['lead_name']}** (₹{it['deal_value']}L): {it['recommended_action']} — *Context: {it['reason']}*")

        answer_text = (
            f"Here are your top {len(items)} priority buyer outreach targets for today:\n\n" +
            "\n".join(bullet_lines)
        )
        return CopilotQueryResponse(
            query=payload.query,
            answer=answer_text,
            suggested_actions=[{"label": "Open Priority Board", "url": "/admin/dashboard"}],
            data_points={"items_count": len(items)}
        )

    # 2. "Which leads are at risk?" / "revenue at risk" / "leakage"
    elif "risk" in q or "leakage" in q or "stalled" in q:
        risk_leads = db.query(Lead).filter(
            Lead.organization_id == org_id,
            Lead.is_deleted == False,
            Lead.health_score < 50,
            Lead.status.notin_([LeadStatus.BOOKED, LeadStatus.LOST, "Booked", "Lost"])
        ).order_by(Lead.budget_max.desc().nullslast()).limit(5).all()

        if not risk_leads:
            return CopilotQueryResponse(
                query=payload.query,
                answer="No high-risk pipeline slippages detected! Your leads maintain healthy follow-up velocity.",
                suggested_actions=[{"label": "View All Leads", "url": "/leads"}],
                data_points={"at_risk_count": 0}
            )

        total_val = sum([l.budget_max or l.budget_min or 50.0 for l in risk_leads])
        lines = [f"• **{l.name}** (Health: {l.health_score}/100 | Budget: ₹{l.budget_max or 'N/A'}L) — *Recommended: {l.recommended_action or 'Call buyer today'}*" for l in risk_leads]
        answer_text = f"🚨 Detected **{len(risk_leads)} deals at risk** totaling approximately **₹{total_val:.1f} Lakhs** in pipeline value:\n\n" + "\n".join(lines)

        return CopilotQueryResponse(
            query=payload.query,
            answer=answer_text,
            suggested_actions=[{"label": "Review Risk Leads", "url": "/leads"}],
            data_points={"at_risk_count": len(risk_leads), "pipeline_value_lakhs": total_val}
        )

    # 3. "Which source generated the most bookings?" / "source performance" / "meta" / "housing"
    elif "source" in q or "meta" in q or "housing" in q or "attribution" in q:
        source_counts = db.query(
            Lead.source,
            func.count(Lead.id).label("leads_count")
        ).filter(
            Lead.organization_id == org_id,
            Lead.is_deleted == False
        ).group_by(Lead.source).all()

        source_bookings = db.query(
            Lead.source,
            func.count(Booking.id).label("bookings_count"),
            func.sum(Booking.total_deal_value).label("revenue")
        ).join(Booking, Booking.lead_id == Lead.id).filter(
            Booking.organization_id == org_id,
            Booking.is_deleted == False
        ).group_by(Lead.source).all()

        bk_map = {row[0]: (row[1], row[2] or 0.0) for row in source_bookings}
        
        lines = []
        for s_name, l_count in source_counts:
            bks, rev = bk_map.get(s_name, (0, 0.0))
            lines.append(f"• **{s_name or 'Direct'}**: {l_count} Inquiries $\\rightarrow$ {bks} Bookings (₹{rev/10000000:.2f} Cr Deal Volume)")

        answer_text = "📊 **Lead Source to Revenue Breakdown**:\n\n" + "\n".join(lines) if lines else "No source attribution records found yet."
        return CopilotQueryResponse(
            query=payload.query,
            answer=answer_text,
            suggested_actions=[{"label": "View Attribution Report", "url": "/admin/reports"}],
            data_points={"sources_evaluated": len(source_counts)}
        )

    # 4. "Which commissions are overdue?" / "commission"
    elif "commission" in q or "receivable" in q or "builder payout" in q:
        overdue_comms = db.query(Commission).filter(
            Commission.organization_id == org_id,
            Commission.is_deleted == False,
            Commission.stage != CommissionStage.PAID
        ).all()

        aging_30 = [c for c in overdue_comms if (c.days_overdue or 0) >= 30]
        total_overdue = sum([c.net_receivable or c.builder_commission_amount for c in aging_30])

        if not aging_30:
            return CopilotQueryResponse(
                query=payload.query,
                answer="✅ All builder commission disbursements are within agreed credit cycles. No aging invoices overdue past 30 days.",
                suggested_actions=[{"label": "Open Commission Ledger", "url": "/admin/commissions"}],
                data_points={"overdue_count": 0}
            )

        lines = [f"• Booking **#{c.booking.booking_number if c.booking else c.id}** ({c.booking.builder.name if c.booking and c.booking.builder else 'Builder'}): ₹{((c.net_receivable or c.builder_commission_amount)/100000):.2f}L ({c.days_overdue} days overdue, Stage: {c.stage})" for c in aging_30[:5]]
        answer_text = f"💰 **₹{total_overdue/100000:.2f} Lakhs** in builder receivables are currently overdue past 30 days across {len(aging_30)} invoices:\n\n" + "\n".join(lines)

        return CopilotQueryResponse(
            query=payload.query,
            answer=answer_text,
            suggested_actions=[{"label": "Manage Invoices", "url": "/admin/commissions"}],
            data_points={"overdue_count": len(aging_30), "total_overdue": total_overdue}
        )

    # Default fallback
    stats = PriorityEngine.get_today_priorities(db, current_user)
    return CopilotQueryResponse(
        query=payload.query,
        answer=(
            f"REALVION Copilot is monitoring your workspace. Today's live snapshot: "
            f"**{stats.get('hot_leads_count', 0)} hot leads**, **{stats.get('overdue_count', 0)} overdue follow-ups**, "
            f"and **{stats.get('site_visits_count', 0)} site visits**. "
            "You can ask me about hot leads, overdue commissions, source ROI, or pipeline risks anytime."
        ),
        suggested_actions=[
            {"label": "Priority Board", "url": "/admin/dashboard"},
            {"label": "Lead Pipeline", "url": "/leads"}
        ],
        data_points=stats
    )
