from datetime import datetime, timezone, timedelta
from typing import List, Dict
from sqlalchemy.orm import Session
from app.models.commission import Commission, CommissionStage, PayoutStatus
from app.models.booking import Booking
from app.models.user import User, UserRole
from app.models.activity_log import ActivityLog
from app.schemas.commission_ledger import (
    CommissionStageUpdate,
    CommissionItemResponse,
    CommissionAgingBucketSummary,
    CommissionCommandCenterResponse,
)

def _normalize_dt(dt: datetime | None) -> datetime | None:
    if dt is not None and dt.tzinfo is not None:
        return dt.replace(tzinfo=None)
    return dt

class CommissionService:

    @staticmethod
    def refresh_commission_metrics(comm: Commission, now: datetime | None = None) -> None:
        now = _normalize_dt(now or datetime.now(timezone.utc))

        # 1. Statutory taxes calculation (18% GST, 5% TDS under 194H)
        gst_rate = comm.gst_rate or 18.0
        tds_rate = comm.tds_rate or 5.0
        comm.gst_amount = round(comm.builder_commission_amount * (gst_rate / 100.0), 2)
        comm.tds_amount = round(comm.builder_commission_amount * (tds_rate / 100.0), 2)
        comm.net_receivable = round(comm.builder_commission_amount + comm.gst_amount - comm.tds_amount, 2)

        stage_val = (comm.stage.value if hasattr(comm.stage, "value") else str(comm.stage or "EXPECTED")).upper()

        # 2. Aging and overdue calculations
        if stage_val == "PAID" or comm.payout_status == PayoutStatus.PAID:
            comm.days_overdue = 0
            comm.aging_bucket = "Paid"
            return

        due_date = _normalize_dt(comm.due_date)
        if not due_date:
            # If due_date not explicitly set, default to invoice_date + 30 days or created_at + 45 days
            base_date = _normalize_dt(comm.invoice_date or comm.created_at or now)
            due_date = base_date + timedelta(days=30)
            comm.due_date = due_date

        if now > due_date:
            diff_days = (now - due_date).days
            comm.days_overdue = diff_days
            if diff_days <= 30:
                comm.aging_bucket = "0-30 Days"
            elif diff_days <= 60:
                comm.aging_bucket = "31-60 Days"
            elif diff_days <= 90:
                comm.aging_bucket = "61-90 Days"
            else:
                comm.aging_bucket = "90+ Days Overdue"
        else:
            comm.days_overdue = 0
            comm.aging_bucket = "Current"

    @staticmethod
    def format_commission_item(comm: Commission) -> CommissionItemResponse:
        b = comm.booking
        builder_name = b.builder.name if b and b.builder else "Builder"
        project_name = b.project.name if b and b.project else "Project"
        lead_name = b.lead.name if b and b.lead else "Buyer"
        exec_name = b.assigned_executive.name if b and b.assigned_executive else "Executive"
        broker_name = b.broker.firm_name if b and b.broker else None

        stage_str = (comm.stage.value if hasattr(comm.stage, "value") else str(comm.stage or "EXPECTED")).upper()
        status_str = comm.payout_status.value if hasattr(comm.payout_status, "value") else str(comm.payout_status)

        return CommissionItemResponse(
            id=comm.id,
            organization_id=comm.organization_id,
            booking_id=comm.booking_id,
            booking_number=b.booking_number if b else "BK-UNKNOWN",
            unit_number=b.unit_number if b else "N/A",
            lead_name=lead_name,
            builder_name=builder_name,
            project_name=project_name,
            executive_name=exec_name,
            broker_name=broker_name,
            total_deal_value=b.total_deal_value if b else 0.0,

            builder_commission_rate=comm.builder_commission_rate,
            builder_commission_amount=comm.builder_commission_amount,
            gst_rate=comm.gst_rate,
            gst_amount=comm.gst_amount,
            tds_rate=comm.tds_rate,
            tds_amount=comm.tds_amount,
            net_receivable=comm.net_receivable or comm.builder_commission_amount,

            executive_commission_rate=comm.executive_commission_rate,
            executive_commission_amount=comm.executive_commission_amount,
            company_margin_amount=comm.company_margin_amount,

            stage=stage_str,
            payout_status=status_str,
            invoice_number=comm.invoice_number,
            invoice_date=comm.invoice_date,
            due_date=comm.due_date,
            paid_date=comm.paid_date,
            payment_reference=comm.payment_reference,

            aging_bucket=comm.aging_bucket,
            days_overdue=comm.days_overdue,
            remarks=comm.remarks,
            created_at=comm.created_at,
        )

    @staticmethod
    def get_command_center(db: Session, current_user: User) -> CommissionCommandCenterResponse:
        now = _normalize_dt(datetime.now(timezone.utc))

        query = db.query(Commission).filter(Commission.is_deleted == False)
        if current_user.role != UserRole.SUPERADMIN and current_user.organization_id:
            query = query.filter(
                (Commission.organization_id == current_user.organization_id) | (Commission.organization_id.is_(None))
            )

        commissions = query.all()

        total_receivable = 0.0
        total_overdue = 0.0
        total_collected = 0.0
        total_expected_unbilled = 0.0

        bucket_counts: Dict[str, Dict[str, float]] = {
            "0-30 Days": {"count": 0, "amount": 0.0},
            "31-60 Days": {"count": 0, "amount": 0.0},
            "61-90 Days": {"count": 0, "amount": 0.0},
            "90+ Days Overdue": {"count": 0, "amount": 0.0},
        }

        stage_breakdown: Dict[str, Dict[str, float]] = {}

        formatted_items: List[CommissionItemResponse] = []

        for comm in commissions:
            CommissionService.refresh_commission_metrics(comm, now=now)
            stage_str = (comm.stage.value if hasattr(comm.stage, "value") else str(comm.stage or "EXPECTED")).upper()
            amt = comm.net_receivable or comm.builder_commission_amount

            # Stage tallies
            if stage_str not in stage_breakdown:
                stage_breakdown[stage_str] = {"count": 0, "amount": 0.0}
            stage_breakdown[stage_str]["count"] += 1
            stage_breakdown[stage_str]["amount"] += amt

            # Global aggregates
            if stage_str == "PAID":
                total_collected += amt
            elif stage_str == "EXPECTED":
                total_expected_unbilled += amt
            else:
                total_receivable += amt
                if comm.days_overdue > 0:
                    total_overdue += amt

            # Bucket tallies for active unpaid aging
            if stage_str in ("SUBMITTED", "APPROVED", "PAYABLE", "DISPUTED") and comm.days_overdue > 0:
                b_key = comm.aging_bucket
                if b_key in bucket_counts:
                    bucket_counts[b_key]["count"] += 1
                    bucket_counts[b_key]["amount"] += amt

            formatted_items.append(CommissionService.format_commission_item(comm))

        db.commit()

        # Sort: Highest overdue days first, then highest amount
        formatted_items.sort(key=lambda x: (x.days_overdue, x.net_receivable), reverse=True)

        aging_buckets = [
            CommissionAgingBucketSummary(
                bucket=k,
                count=int(v["count"]),
                total_amount=round(v["amount"], 2)
            )
            for k, v in bucket_counts.items()
        ]

        return CommissionCommandCenterResponse(
            total_receivable=round(total_receivable, 2),
            total_overdue=round(total_overdue, 2),
            total_collected=round(total_collected, 2),
            total_expected_unbilled=round(total_expected_unbilled, 2),
            aging_buckets=aging_buckets,
            stage_breakdown=stage_breakdown,
            commissions=formatted_items,
        )

    @staticmethod
    def update_commission_stage(
        commission_id: int,
        update_in: CommissionStageUpdate,
        db: Session,
        current_user: User
    ) -> CommissionItemResponse:
        comm_query = db.query(Commission).filter(Commission.id == commission_id, Commission.is_deleted == False)
        if current_user.role != UserRole.SUPERADMIN and current_user.organization_id:
            comm_query = comm_query.filter(
                (Commission.organization_id == current_user.organization_id) | (Commission.organization_id.is_(None))
            )
        comm = comm_query.first()
        if not comm:
            raise ValueError("Commission record not found or access denied")

        now = _normalize_dt(datetime.now(timezone.utc))
        old_stage = comm.stage.value if hasattr(comm.stage, "value") else str(comm.stage)
        new_stage = update_in.stage.value if hasattr(update_in.stage, "value") else str(update_in.stage)

        comm.stage = update_in.stage
        if update_in.invoice_number:
            comm.invoice_number = update_in.invoice_number
        if update_in.invoice_date:
            comm.invoice_date = _normalize_dt(update_in.invoice_date)
        if update_in.due_date:
            comm.due_date = _normalize_dt(update_in.due_date)
        if update_in.payment_reference:
            comm.payment_reference = update_in.payment_reference
        if update_in.remarks:
            comm.remarks = update_in.remarks

        # Stage specific logic
        new_stage_upper = new_stage.upper()
        if new_stage_upper == "SUBMITTED" and not comm.invoice_date:
            comm.invoice_date = now
            if not comm.due_date:
                comm.due_date = now + timedelta(days=30)
            comm.payout_status = PayoutStatus.PENDING

        elif new_stage_upper == "PAID":
            comm.paid_date = _normalize_dt(update_in.paid_date) or now
            comm.payout_status = PayoutStatus.PAID
            comm.days_overdue = 0
            comm.aging_bucket = "Paid"

        CommissionService.refresh_commission_metrics(comm, now=now)

        db.add(ActivityLog(
            user_id=current_user.id,
            user_name=current_user.name,
            action="COMMISSION_STAGE_UPDATE",
            module="Commissions",
            details=f"Commission #{comm.id} transitioned from {old_stage} to {new_stage} by {current_user.name}"
        ))

        db.commit()
        db.refresh(comm)
        return CommissionService.format_commission_item(comm)
