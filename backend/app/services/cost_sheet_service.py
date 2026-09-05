import random
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from app.models.project import Project, ProjectStatus
from app.models.lead import Lead, LeadStatus
from app.models.builder import Builder
from app.models.booking import Booking, BookingStatus
from app.models.commission import Commission, PayoutStatus
from app.models.user import User, UserRole
from app.models.activity_log import ActivityLog
from app.models.lead import LeadStatusHistory
from app.schemas.cost_sheet import (
    CostSheetCalculateRequest,
    CostSheetBreakdown,
    PaymentMilestone,
    CostSheetResponse,
    QuickBookFromCostSheetRequest,
)

def format_inr(number: float) -> str:
    """Format Indian currency string (e.g. 12500000 -> ₹1.25 Cr, 4500000 -> ₹45.00 Lakhs)"""
    if number >= 10000000:
        cr = number / 10000000.0
        return f"₹{cr:.2f} Cr"
    elif number >= 100000:
        lakhs = number / 100000.0
        return f"₹{lakhs:.2f} Lakhs"
    else:
        return f"₹{number:,.0f}"

class CostSheetService:

    @staticmethod
    def get_project_defaults(project_id: int, db: Session, current_user: User) -> dict:
        proj_query = db.query(Project).filter(Project.id == project_id, Project.is_deleted == False)
        if current_user.role != UserRole.SUPERADMIN and current_user.organization_id:
            proj_query = proj_query.filter(
                (Project.organization_id == current_user.organization_id) | (Project.organization_id.is_(None))
            )
        project = proj_query.first()
        if not project:
            raise ValueError("Project not found")

        # Estimate default sqft & rate from min/max price
        avg_price_inr = ((project.min_price + project.max_price) / 2.0) * 100000.0
        default_sqft = 1500.0
        default_rate = round(avg_price_inr / default_sqft)

        is_ready = project.status == ProjectStatus.READY_TO_MOVE
        gst_rate = 0.0 if is_ready else 5.0

        return {
            "project_id": project.id,
            "project_name": project.name,
            "builder_name": project.builder.name if project.builder else "Builder",
            "location": project.location,
            "configuration": project.configuration,
            "super_builtup_area_sqft": default_sqft,
            "base_rate_per_sqft": float(default_rate),
            "floor_number": 5,
            "floor_rise_rate_per_sqft": 25.0,
            "plc_rate_per_sqft": 0.0,
            "car_parking_slots": 1,
            "car_parking_rate": 400000.0,
            "clubhouse_charges": 350000.0,
            "possession_charges": 150000.0,
            "gst_rate_pct": gst_rate,
            "stamp_duty_rate_pct": 7.0,
            "registration_fee": 30000.0,
        }

    @staticmethod
    def calculate_cost_sheet(req: CostSheetCalculateRequest, db: Session, current_user: User) -> CostSheetResponse:
        proj_query = db.query(Project).filter(Project.id == req.project_id, Project.is_deleted == False)
        if current_user.role != UserRole.SUPERADMIN and current_user.organization_id:
            proj_query = proj_query.filter(
                (Project.organization_id == current_user.organization_id) | (Project.organization_id.is_(None))
            )
        project = proj_query.first()
        if not project:
            raise ValueError("Project not found")

        # A. Agreement Value items
        bsp = req.super_builtup_area_sqft * req.base_rate_per_sqft
        # Floor rise typically kicks in above floor 4
        frc_floors = max(0, req.floor_number - 4)
        frc = frc_floors * req.floor_rise_rate_per_sqft * req.super_builtup_area_sqft
        plc = req.plc_rate_per_sqft * req.super_builtup_area_sqft
        parking = req.car_parking_slots * req.car_parking_rate
        agreement_value = (bsp + frc + plc + parking) - req.discount_amount

        # B. Additional Charges
        additional_charges = req.clubhouse_charges + req.possession_charges

        # C. Statutory Levies
        gst = round(agreement_value * (req.gst_rate_pct / 100.0))
        stamp_duty = round(agreement_value * (req.stamp_duty_rate_pct / 100.0))
        reg_fee = req.registration_fee
        statutory_charges = gst + stamp_duty + reg_fee

        # D. Grand Total
        grand_total = agreement_value + additional_charges + statutory_charges
        token_amount = round(agreement_value * 0.10) # 10% standard booking token

        breakdown = CostSheetBreakdown(
            base_selling_price=round(bsp),
            floor_rise_charges=round(frc),
            plc_charges=round(plc),
            car_parking_charges=round(parking),
            discount_amount=round(req.discount_amount),
            total_agreement_value=round(agreement_value),

            clubhouse_charges=round(req.clubhouse_charges),
            possession_charges=round(req.possession_charges),
            total_additional_charges=round(additional_charges),

            gst_amount=round(gst),
            stamp_duty_amount=round(stamp_duty),
            registration_fee=round(reg_fee),
            total_statutory_charges=round(statutory_charges),

            grand_total=round(grand_total),
            token_booking_amount=token_amount,
        )

        # Standard Construction Linked Payment Schedule (CLP)
        schedule = [
            PaymentMilestone(
                milestone_name="1. Booking Token Advance",
                percentage=10.0,
                amount=round(agreement_value * 0.10),
                due_condition="At the time of Booking / Application"
            ),
            PaymentMilestone(
                milestone_name="2. Allotment & Agreement Execution",
                percentage=10.0,
                amount=round(agreement_value * 0.10),
                due_condition="Within 30 days of booking / execution of Builder-Buyer Agreement (BBA)"
            ),
            PaymentMilestone(
                milestone_name="3. Casting of Ground Floor Slab",
                percentage=15.0,
                amount=round(agreement_value * 0.15),
                due_condition="On completion of Foundation & Plinth"
            ),
            PaymentMilestone(
                milestone_name="4. Superstructure Floor Slabs",
                percentage=25.0,
                amount=round(agreement_value * 0.25),
                due_condition="Equated installments as floor slabs are cast"
            ),
            PaymentMilestone(
                milestone_name="5. Internal Brickwork & Plastering",
                percentage=15.0,
                amount=round(agreement_value * 0.15),
                due_condition="On completion of unit internal plaster & electrical conduit"
            ),
            PaymentMilestone(
                milestone_name="6. Flooring, Plumbing & External Painting",
                percentage=15.0,
                amount=round(agreement_value * 0.15),
                due_condition="On completion of tiling, MEP, and facade painting"
            ),
            PaymentMilestone(
                milestone_name="7. Notice of Possession & Handover",
                percentage=10.0,
                amount=round(agreement_value * 0.10) + additional_charges + statutory_charges,
                due_condition="On offer of possession + club/statutory charges"
            ),
        ]

        builder_name = project.builder.name if project.builder else "Developer"

        # Client WhatsApp Summary
        whatsapp_summary = (
            f"🏢 *PROPERTY COST SHEET & QUOTATION*\n"
            f"*{project.name}* by {builder_name}\n"
            f"📍 Location: {project.location}\n"
            f"🚪 Unit: *{req.unit_number}* ({req.configuration})\n"
            f"📐 Area: {req.super_builtup_area_sqft} sq.ft @ ₹{req.base_rate_per_sqft}/sq.ft\n\n"
            f"📋 *Cost Breakdown*:\n"
            f"• Base Selling Price: {format_inr(bsp)}\n"
        )
        if frc > 0:
            whatsapp_summary += f"• Floor Rise (Floor {req.floor_number}): {format_inr(frc)}\n"
        if plc > 0:
            whatsapp_summary += f"• Preferential Location (PLC): {format_inr(plc)}\n"
        if parking > 0:
            whatsapp_summary += f"• Reserved Car Parking ({req.car_parking_slots} slot): {format_inr(parking)}\n"
        if req.discount_amount > 0:
            whatsapp_summary += f"• Special Incentive Discount: -{format_inr(req.discount_amount)}\n"
            
        whatsapp_summary += (
            f"──────────────\n"
            f"🔹 *Agreement Value*: *{format_inr(agreement_value)}*\n\n"
            f"🏗️ *Clubhouse & Dev Charges*: {format_inr(additional_charges)}\n"
            f"🏛️ *Govt Duties & Taxes* (GST + Stamp Duty): {format_inr(statutory_charges)}\n"
            f"──────────────\n"
            f"🌟 *All-Inclusive Grand Total*: *{format_inr(grand_total)}*\n"
            f"💳 *Booking Token Required*: *{format_inr(token_amount)}* (10%)\n\n"
            f"Would you like us to block this unit and schedule the allotment paperwork?"
        )

        return CostSheetResponse(
            project_id=project.id,
            project_name=project.name,
            builder_name=builder_name,
            location=project.location,
            unit_number=req.unit_number,
            configuration=req.configuration,
            super_builtup_area_sqft=req.super_builtup_area_sqft,
            base_rate_per_sqft=req.base_rate_per_sqft,
            breakdown=breakdown,
            payment_schedule=schedule,
            whatsapp_summary=whatsapp_summary,
        )

    @staticmethod
    def quick_book_from_cost_sheet(
        req: QuickBookFromCostSheetRequest,
        db: Session,
        current_user: User
    ) -> Booking:
        cost_sheet = CostSheetService.calculate_cost_sheet(req, db, current_user)

        lead = db.query(Lead).filter(Lead.id == req.lead_id, Lead.is_deleted == False).first()
        if not lead:
            raise ValueError("Lead not found")

        project = db.query(Project).filter(Project.id == req.project_id).first()
        if not project:
            raise ValueError("Project not found")

        # Auto-advance lead status to BOOKED
        now = datetime.now(timezone.utc).replace(tzinfo=None)
        old_status = lead.status.value if hasattr(lead.status, "value") else str(lead.status)
        lead.status = LeadStatus.BOOKED
        lead.last_activity_at = now
        lead.stage_entered_at = now
        db.add(LeadStatusHistory(
            lead_id=lead.id,
            changed_by_id=current_user.id,
            old_status=old_status,
            new_status="Booked",
            remarks=f"Booked via Indian Cost Sheet Generator ({req.unit_number})"
        ))

        # Booking number
        booking_num = f"BK-{datetime.now().year}-{random.randint(1000, 9999)}"
        token_amount = req.token_amount_paid or cost_sheet.breakdown.token_booking_amount

        exec_id = req.assigned_executive_id or lead.assigned_to_id or current_user.id

        booking = Booking(
            organization_id=lead.organization_id or current_user.organization_id,
            booking_number=booking_num,
            lead_id=lead.id,
            project_id=project.id,
            builder_id=project.builder_id,
            assigned_executive_id=exec_id,
            broker_id=req.broker_id,
            unit_number=req.unit_number,
            booking_amount=token_amount,
            total_deal_value=cost_sheet.breakdown.total_agreement_value,
            booking_date=now,
            status=BookingStatus.CONFIRMED,
            notes=req.notes or f"Generated via Cost Sheet. Grand Total with taxes: {format_inr(cost_sheet.breakdown.grand_total)}"
        )
        db.add(booking)
        db.flush()

        # Generate commission
        builder = project.builder
        builder_rate = builder.commission_rate if builder else 3.5
        builder_comm = cost_sheet.breakdown.total_agreement_value * (builder_rate / 100.0)
        exec_rate = 0.5
        exec_comm = cost_sheet.breakdown.total_agreement_value * (exec_rate / 100.0)
        company_margin = builder_comm - exec_comm

        comm = Commission(
            organization_id=booking.organization_id,
            booking_id=booking.id,
            builder_commission_rate=builder_rate,
            builder_commission_amount=builder_comm,
            executive_commission_rate=exec_rate,
            executive_commission_amount=exec_comm,
            broker_commission_rate=1.0 if req.broker_id else 0.0,
            broker_commission_amount=0.0,
            company_margin_amount=company_margin,
            payout_status=PayoutStatus.PENDING,
            remarks=f"Auto-generated commission for cost sheet booking {booking_num}"
        )
        db.add(comm)

        # Log activity
        db.add(ActivityLog(
            user_id=current_user.id,
            user_name=current_user.name,
            action="CREATED_BOOKING",
            module="Bookings",
            details=f"Booked unit {req.unit_number} for {lead.name} at {format_inr(cost_sheet.breakdown.total_agreement_value)}"
        ))

        db.commit()
        db.refresh(booking)
        return booking
