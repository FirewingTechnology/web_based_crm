import calendar
from datetime import datetime, timezone
from typing import List, Optional
from sqlalchemy.orm import Session
from app.models.user import User, UserRole
from app.models.sales_target import SalesTarget
from app.models.booking import Booking, BookingStatus
from app.models.site_visit import SiteVisit, SiteVisitStatus
from app.models.lead import Lead
from app.models.followup import Followup, FollowupStatus
from app.schemas.performance import (
    PerformanceBadge,
    ExecutiveScorecard,
    LeaderboardSummary,
)

BADGE_DEFINITIONS = {
    "TOP_CLOSER": {
        "title": "Top Closer",
        "icon": "Crown",
        "description": "Highest deal revenue closed this month",
        "color": "amber",
    },
    "VISIT_CHAMPION": {
        "title": "Site Visit Champion",
        "icon": "Car",
        "description": "Most high-intent client site visits conducted",
        "color": "blue",
    },
    "TARGET_CRUSHER": {
        "title": "Target Crusher",
        "icon": "Target",
        "description": "Achieved 100%+ of monthly revenue quota",
        "color": "emerald",
    },
    "SPEED_DEMON": {
        "title": "Speed Demon",
        "icon": "Zap",
        "description": "90%+ on-time follow-up adherence and high velocity",
        "color": "indigo",
    },
    "RELIABLE_CLOSER": {
        "title": "Reliable Closer",
        "icon": "ShieldCheck",
        "description": "Closed deals with zero overdue client tasks",
        "color": "cyan",
    },
}

class PerformanceService:

    @staticmethod
    def get_leaderboard(
        db: Session,
        current_user: User,
        month_year: Optional[str] = None
    ) -> LeaderboardSummary:
        now = datetime.now(timezone.utc)
        curr_month_str = now.strftime("%Y-%m")
        selected_month = month_year or curr_month_str

        # Calculate month days elapsed and total days
        try:
            year, month = map(int, selected_month.split("-"))
            total_days = calendar.monthrange(year, month)[1]
            if now.year == year and now.month == month:
                days_elapsed = max(1, now.day)
            elif (now.year > year) or (now.year == year and now.month > month):
                days_elapsed = total_days
            else:
                days_elapsed = 1
        except Exception:
            year, month = now.year, now.month
            total_days = calendar.monthrange(year, month)[1]
            days_elapsed = max(1, now.day)
            selected_month = curr_month_str

        # Query all active sales executives (and managers/admins with targets)
        user_query = db.query(User).filter(
            User.is_active == True,
            User.is_deleted == False
        )
        if current_user.role != UserRole.SUPERADMIN and current_user.organization_id:
            user_query = user_query.filter(User.organization_id == current_user.organization_id)

        all_users = user_query.all()
        # Filter for sales personnel
        executives = [u for u in all_users if u.role in (UserRole.SALES_EXECUTIVE, UserRole.MANAGER, UserRole.ADMIN)]

        raw_scorecards = []

        for user in executives:
            # 1. Target
            target_record = db.query(SalesTarget).filter(
                SalesTarget.user_id == user.id,
                SalesTarget.month_year == selected_month,
                SalesTarget.is_deleted == False
            ).first()

            target_amount = target_record.target_amount if target_record else 0.0
            target_bookings = target_record.target_bookings if target_record else 5

            # 2. Bookings in month
            bookings_q = db.query(Booking).filter(
                Booking.assigned_executive_id == user.id,
                Booking.status != BookingStatus.CANCELLED,
                Booking.is_deleted == False
            ).all()

            month_bookings = [
                b for b in bookings_q
                if b.booking_date and b.booking_date.strftime("%Y-%m") == selected_month
            ]
            achieved_bookings = len(month_bookings)
            achieved_lakhs = sum(
                (b.total_deal_value / 100000.0) if b.total_deal_value > 10000 else b.total_deal_value
                for b in month_bookings
            )
            achieved_amount = round(achieved_lakhs, 2)

            achieved_pct = round((achieved_amount / target_amount * 100.0), 1) if target_amount > 0 else (100.0 if achieved_amount > 0 else 0.0)

            # 3. Site Visits conducted in month
            visits_q = db.query(SiteVisit).filter(
                SiteVisit.sales_executive_id == user.id,
                SiteVisit.is_deleted == False
            ).all()

            month_visits = [
                v for v in visits_q
                if (v.completed_at and v.completed_at.strftime("%Y-%m") == selected_month)
                or (v.scheduled_at and v.scheduled_at.strftime("%Y-%m") == selected_month and v.status in (SiteVisitStatus.COMPLETED, "Completed"))
            ]
            site_visits_conducted = len(month_visits)

            # 4. Leads assigned & conversion rate
            leads_assigned = db.query(Lead).filter(
                Lead.assigned_to_id == user.id,
                Lead.is_deleted == False
            ).count()
            conversion_rate = round((achieved_bookings / leads_assigned * 100.0), 1) if leads_assigned > 0 else 0.0

            # 5. Follow-ups in month & adherence
            followups = db.query(Followup).filter(
                Followup.assigned_to_id == user.id,
                Followup.is_deleted == False
            ).all()

            completed_fu = len([f for f in followups if f.status in (FollowupStatus.COMPLETED, "Completed")])
            overdue_fu = len([f for f in followups if f.status in (FollowupStatus.OVERDUE, "Overdue")])
            pending_fu = len([f for f in followups if f.status in (FollowupStatus.PENDING, "Pending")])

            total_rated_fu = completed_fu + overdue_fu
            followup_adherence = round((completed_fu / total_rated_fu * 100.0), 1) if total_rated_fu > 0 else 100.0

            # 6. Projected Run-Rate & Pace Status
            daily_run_rate = achieved_amount / days_elapsed
            projected_run_rate = round(daily_run_rate * total_days, 2)

            expected_to_date = (target_amount / total_days) * days_elapsed if target_amount > 0 else 0.0
            if target_amount <= 0:
                pace_status = "ON_TRACK" if achieved_amount > 0 else "BEHIND_PACE"
            elif achieved_amount >= target_amount:
                pace_status = "EXCEEDING"
            elif achieved_amount >= expected_to_date * 0.9:
                pace_status = "ON_TRACK"
            elif achieved_amount >= expected_to_date * 0.6:
                pace_status = "BEHIND_PACE"
            else:
                pace_status = "AT_RISK"

            raw_scorecards.append({
                "user_id": user.id,
                "name": user.name,
                "email": user.email,
                "role": user.role.value if hasattr(user.role, "value") else str(user.role),
                "target_amount": round(target_amount, 2),
                "achieved_amount": achieved_amount,
                "achievement_percentage": achieved_pct,
                "target_bookings": target_bookings,
                "achieved_bookings": achieved_bookings,
                "site_visits_conducted": site_visits_conducted,
                "leads_assigned": leads_assigned,
                "conversion_rate": conversion_rate,
                "followup_adherence_rate": followup_adherence,
                "pending_followups": pending_fu,
                "overdue_followups": overdue_fu,
                "projected_run_rate": projected_run_rate,
                "pace_status": pace_status,
                "badges": [],
            })

        # Sort: Achieved amount DESC, then Achieved bookings DESC, then Visits DESC
        raw_scorecards.sort(
            key=lambda s: (s["achieved_amount"], s["achieved_bookings"], s["site_visits_conducted"]),
            reverse=True
        )

        # Max values for dynamic badge attribution
        max_revenue = max([s["achieved_amount"] for s in raw_scorecards], default=0.0)
        max_visits = max([s["site_visits_conducted"] for s in raw_scorecards], default=0)

        rankings: List[ExecutiveScorecard] = []
        for idx, s in enumerate(raw_scorecards, start=1):
            badges: List[PerformanceBadge] = []

            if s["achieved_amount"] > 0 and s["achieved_amount"] == max_revenue:
                badges.append(PerformanceBadge(code="TOP_CLOSER", **BADGE_DEFINITIONS["TOP_CLOSER"]))

            if s["site_visits_conducted"] > 0 and s["site_visits_conducted"] == max_visits:
                badges.append(PerformanceBadge(code="VISIT_CHAMPION", **BADGE_DEFINITIONS["VISIT_CHAMPION"]))

            if s["achievement_percentage"] >= 100.0:
                badges.append(PerformanceBadge(code="TARGET_CRUSHER", **BADGE_DEFINITIONS["TARGET_CRUSHER"]))

            if s["followup_adherence_rate"] >= 90.0 and (s["site_visits_conducted"] >= 1 or s["achieved_bookings"] >= 1):
                badges.append(PerformanceBadge(code="SPEED_DEMON", **BADGE_DEFINITIONS["SPEED_DEMON"]))

            if s["overdue_followups"] == 0 and s["achieved_bookings"] > 0:
                badges.append(PerformanceBadge(code="RELIABLE_CLOSER", **BADGE_DEFINITIONS["RELIABLE_CLOSER"]))

            scorecard = ExecutiveScorecard(
                user_id=s["user_id"],
                name=s["name"],
                email=s["email"],
                role=s["role"],
                rank=idx,
                target_amount=s["target_amount"],
                achieved_amount=s["achieved_amount"],
                achievement_percentage=s["achievement_percentage"],
                target_bookings=s["target_bookings"],
                achieved_bookings=s["achieved_bookings"],
                site_visits_conducted=s["site_visits_conducted"],
                leads_assigned=s["leads_assigned"],
                conversion_rate=s["conversion_rate"],
                followup_adherence_rate=s["followup_adherence_rate"],
                pending_followups=s["pending_followups"],
                overdue_followups=s["overdue_followups"],
                projected_run_rate=s["projected_run_rate"],
                pace_status=s["pace_status"],
                badges=badges,
            )
            rankings.append(scorecard)

        # Organization totals
        total_org_target = round(sum(s.target_amount for s in rankings), 2)
        total_org_achieved = round(sum(s.achieved_amount for s in rankings), 2)
        org_achieved_pct = round((total_org_achieved / total_org_target * 100.0), 1) if total_org_target > 0 else 0.0
        projected_org_run_rate = round((total_org_achieved / days_elapsed) * total_days, 2)

        expected_org_to_date = (total_org_target / total_days) * days_elapsed if total_org_target > 0 else 0.0
        if total_org_target <= 0:
            org_pace = "ON_TRACK" if total_org_achieved > 0 else "BEHIND_PACE"
        elif total_org_achieved >= total_org_target:
            org_pace = "EXCEEDING"
        elif total_org_achieved >= expected_org_to_date * 0.9:
            org_pace = "ON_TRACK"
        elif total_org_achieved >= expected_org_to_date * 0.6:
            org_pace = "BEHIND_PACE"
        else:
            org_pace = "AT_RISK"

        return LeaderboardSummary(
            month_year=selected_month,
            days_elapsed=days_elapsed,
            total_days=total_days,
            total_org_target=total_org_target,
            total_org_achieved=total_org_achieved,
            org_achievement_percentage=org_achieved_pct,
            projected_org_run_rate=projected_org_run_rate,
            org_pace_status=org_pace,
            podium=rankings[:3],
            rankings=rankings,
        )
