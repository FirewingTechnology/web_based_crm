from datetime import datetime, timezone
from typing import List, Dict, Optional
from sqlalchemy.orm import Session
from app.models.user import User, UserRole
from app.models.lead import Lead, LeadStatus
from app.models.site_visit import SiteVisit, SiteVisitStatus
from app.models.booking import Booking, BookingStatus
from app.models.commission import Commission, CommissionStage
from app.schemas.revenue_analytics import (
    FunnelStageMetric,
    ChannelAttributionMetric,
    RevenueAnalyticsResponse,
)

class RevenueAnalyticsService:

    @staticmethod
    def get_revenue_funnel_analytics(
        db: Session,
        current_user: User,
        time_period: str = "All Time"
    ) -> RevenueAnalyticsResponse:
        # Base queries with RBAC / tenant filtering
        lead_q = db.query(Lead).filter(Lead.is_deleted == False)
        visit_q = db.query(SiteVisit).filter(SiteVisit.is_deleted == False)
        booking_q = db.query(Booking).filter(Booking.is_deleted == False)
        commission_q = db.query(Commission).filter(Commission.is_deleted == False)

        if current_user.role != UserRole.SUPERADMIN and current_user.organization_id:
            lead_q = lead_q.filter(Lead.organization_id == current_user.organization_id)
            visit_q = visit_q.filter(SiteVisit.organization_id == current_user.organization_id)
            booking_q = booking_q.filter(Booking.organization_id == current_user.organization_id)
            commission_q = commission_q.filter(Commission.organization_id == current_user.organization_id)

        if current_user.role == UserRole.SALES_EXECUTIVE:
            lead_q = lead_q.filter(Lead.assigned_to_id == current_user.id)
            visit_q = visit_q.filter(SiteVisit.sales_executive_id == current_user.id)
            booking_q = booking_q.filter(Booking.assigned_executive_id == current_user.id)

        leads = lead_q.all()
        visits = visit_q.all()
        bookings = [b for b in booking_q.all() if b.status != BookingStatus.CANCELLED]
        commissions = commission_q.all()

        total_inquiries = len(leads)
        inquiries_val = sum((l.budget_max or l.budget_min or 5000000.0) for l in leads)

        # 1. Qualified Leads
        qualified_leads = [
            l for l in leads 
            if l.status not in (LeadStatus.NEW, LeadStatus.LOST, "New", "Lost")
        ]
        qualified_count = len(qualified_leads)
        qualified_val = sum((l.budget_max or l.budget_min or 5000000.0) for l in qualified_leads)

        # 2. Site Visits Scheduled
        visits_scheduled_count = len(visits)
        visits_scheduled_val = qualified_val * 0.7 if qualified_val > 0 else 0.0

        # 3. Site Visits Completed
        completed_visits = [
            v for v in visits 
            if v.status in (SiteVisitStatus.COMPLETED, "Completed")
        ]
        visits_completed_count = len(completed_visits)
        visits_completed_val = visits_scheduled_val * (visits_completed_count / visits_scheduled_count) if visits_scheduled_count > 0 else 0.0

        # 4. Bookings Confirmed
        bookings_count = len(bookings)
        closed_revenue = sum(b.total_deal_value for b in bookings)

        # 5. Commission Realized
        paid_commissions = [
            c for c in commissions 
            if (c.stage and str(c.stage).upper() in ("PAID", "PAYABLE")) or c.payout_status == "Paid"
        ]
        realized_comm_count = len(paid_commissions)
        total_commission = sum(c.builder_commission_amount for c in commissions)

        # 6. Cycle time in days
        cycle_days_list = []
        for b in bookings:
            if b.lead and b.lead.created_at and b.booking_date:
                lead_dt = b.lead.created_at.replace(tzinfo=None) if b.lead.created_at.tzinfo else b.lead.created_at
                bk_dt = b.booking_date.replace(tzinfo=None) if b.booking_date.tzinfo else b.booking_date
                diff = (bk_dt - lead_dt).days
                if diff >= 0:
                    cycle_days_list.append(diff)
        avg_cycle_days = round(sum(cycle_days_list) / len(cycle_days_list), 1) if cycle_days_list else 14.5

        # 7. Funnel Stages with Drop-off calculations
        raw_stages = [
            ("inquiries", "1. Buyer Inquiries", total_inquiries, inquiries_val),
            ("qualified", "2. Qualified Leads", qualified_count, qualified_val),
            ("visits_scheduled", "3. Site Visits Scheduled", visits_scheduled_count, visits_scheduled_val),
            ("visits_completed", "4. Site Visits Conducted", visits_completed_count, visits_completed_val),
            ("bookings", "5. Bookings Confirmed", bookings_count, closed_revenue),
            ("revenue", "6. Commission Realized", realized_comm_count, total_commission),
        ]

        funnel_stages: List[FunnelStageMetric] = []
        prev_count = total_inquiries or 1

        for idx, (key, label, count, val) in enumerate(raw_stages):
            if idx == 0:
                conv_pct = 100.0
                drop_count = 0
                drop_pct = 0.0
            else:
                conv_pct = round((count / prev_count * 100.0), 1) if prev_count > 0 else 0.0
                drop_count = max(0, prev_count - count)
                drop_pct = round((drop_count / prev_count * 100.0), 1) if prev_count > 0 else 0.0

            funnel_stages.append(FunnelStageMetric(
                stage_key=key,
                stage_label=label,
                count=count,
                value_inr=round(val, 2),
                conversion_from_prev_pct=conv_pct,
                dropoff_count=drop_count,
                dropoff_pct=drop_pct,
            ))
            prev_count = count or 1

        # 8. Identify biggest bottleneck
        active_dropoffs = [s for s in funnel_stages[1:] if s.dropoff_pct > 0]
        if active_dropoffs:
            bottleneck = max(active_dropoffs, key=lambda s: s.dropoff_pct)
            bottleneck_stage = bottleneck.stage_label
            if "Site Visits Scheduled" in bottleneck.stage_label:
                bottleneck_insight = f"{bottleneck.dropoff_pct}% of qualified buyers do not book a site visit. Solution: Implement Chauffeur pickup and personalized RERA brochure WhatsApp pitch."
            elif "Site Visits Conducted" in bottleneck.stage_label:
                bottleneck_insight = f"{bottleneck.dropoff_pct}% of scheduled visits are cancelled or no-show. Solution: Enable automated WhatsApp reminder with cab driver details 3 hours before pickup."
            elif "Bookings Confirmed" in bottleneck.stage_label:
                bottleneck_insight = f"{bottleneck.dropoff_pct}% visit-to-booking drop-off detected. Solution: Deliver automated multi-slab cost sheets and token payment link within 60 mins of visit."
            else:
                bottleneck_insight = f"Highest attrition at {bottleneck.stage_label} ({bottleneck.dropoff_pct}% drop-off). Accelerated follow-ups required."
        else:
            bottleneck_stage = "None"
            bottleneck_insight = "Funnel conversion operating within healthy benchmark parameters."

        # 9. Channel Attribution & Source Quality
        channel_buckets: Dict[str, Dict] = {}
        # Prepopulate standard real estate channels
        standard_sources = ["Google Ads", "Facebook/Meta", "99acres", "MagicBricks", "Housing.com", "CP Network", "Direct Walk-in", "Referral"]
        for s in standard_sources:
            channel_buckets[s] = {
                "inquiries": 0,
                "qualified": 0,
                "site_visits": 0,
                "bookings": 0,
                "deal_value": 0.0,
                "commission": 0.0,
            }

        lead_source_map = {l.id: (l.source or "Direct Walk-in") for l in leads}
        for l in leads:
            src = l.source or "Direct Walk-in"
            if src not in channel_buckets:
                channel_buckets[src] = {"inquiries": 0, "qualified": 0, "site_visits": 0, "bookings": 0, "deal_value": 0.0, "commission": 0.0}
            channel_buckets[src]["inquiries"] += 1
            if l.status not in (LeadStatus.NEW, LeadStatus.LOST, "New", "Lost"):
                channel_buckets[src]["qualified"] += 1

        for v in visits:
            src = lead_source_map.get(v.lead_id, "Direct Walk-in")
            if src in channel_buckets:
                channel_buckets[src]["site_visits"] += 1

        for b in bookings:
            src = lead_source_map.get(b.lead_id, "Direct Walk-in")
            if src in channel_buckets:
                channel_buckets[src]["bookings"] += 1
                channel_buckets[src]["deal_value"] += b.total_deal_value
                if b.commission:
                    channel_buckets[src]["commission"] += b.commission.builder_commission_amount

        channel_metrics: List[ChannelAttributionMetric] = []
        for src, data in channel_buckets.items():
            inq = data["inquiries"]
            bks = data["bookings"]
            vsts = data["site_visits"]
            conv = round((bks / inq * 100.0), 1) if inq > 0 else 0.0
            visit_rate = (vsts / inq * 100.0) if inq > 0 else 0.0

            # Quality score composite (0-100)
            score = int(min(100, (conv * 8.0) + (visit_rate * 0.8) + (bks * 10.0)))
            if inq == 0:
                score = 0

            if score >= 80:
                grade = "A+"
            elif score >= 65:
                grade = "A"
            elif score >= 45:
                grade = "B"
            elif score >= 25:
                grade = "C"
            else:
                grade = "D"

            channel_metrics.append(ChannelAttributionMetric(
                source=src,
                inquiries=inq,
                qualified=data["qualified"],
                site_visits=vsts,
                bookings=bks,
                deal_value_inr=round(data["deal_value"], 2),
                commission_inr=round(data["commission"], 2),
                conversion_rate=conv,
                quality_score=score,
                grade=grade,
            ))

        channel_metrics.sort(key=lambda c: (c.deal_value_inr, c.bookings, c.inquiries), reverse=True)

        overall_conv = round((bookings_count / total_inquiries * 100.0), 1) if total_inquiries > 0 else 0.0

        return RevenueAnalyticsResponse(
            time_period=time_period,
            total_inquiries=total_inquiries,
            total_visits=visits_completed_count,
            total_bookings=bookings_count,
            total_closed_revenue=round(closed_revenue, 2),
            total_commission=round(total_commission, 2),
            overall_conversion_rate=overall_conv,
            avg_cycle_days=avg_cycle_days,
            bottleneck_stage=bottleneck_stage,
            bottleneck_insight=bottleneck_insight,
            funnel_stages=funnel_stages,
            channels=channel_metrics,
        )
