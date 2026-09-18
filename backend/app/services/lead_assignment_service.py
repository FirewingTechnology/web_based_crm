from datetime import datetime, timezone
from typing import Tuple, Optional
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models.user import User, UserRole
from app.models.lead import Lead, LeadStatus
from app.models.lead_source import LeadSourceIntegration

class LeadAssignmentService:

    @classmethod
    def assign_lead(
        cls,
        db: Session,
        organization_id: int,
        source_type: str,
        deal_value: float = 0.0,
        project_id: Optional[int] = None,
        integration: Optional[LeadSourceIntegration] = None
    ) -> Tuple[int, str]:
        """
        Determines the optimal sales executive for an incoming lead based on:
        1. Fixed source integration override
        2. High-value tier routing (>= 1 Cr to Manager / Senior Rep)
        3. Least-loaded active sales executive
        4. Round-robin rotation fallback
        """
        # Strategy 1: Explicit integration default
        if integration and integration.default_assigned_to_id:
            user = db.query(User).filter(
                User.id == integration.default_assigned_to_id,
                User.organization_id == organization_id,
                User.is_active == True,
                User.is_deleted == False
            ).first()
            if user:
                return user.id, f"Source Default Override ({integration.name})"

        # Strategy 2: High-Value Buyer Routing (>= 1 Cr)
        if deal_value >= 100.0:
            manager = db.query(User).filter(
                User.organization_id == organization_id,
                User.role.in_([UserRole.MANAGER, UserRole.ADMIN]),
                User.is_active == True,
                User.is_deleted == False
            ).first()
            if manager:
                return manager.id, "High-Value HNI Routing (Deal >= ₹1 Cr)"

        # Strategy 3: Least Loaded Active Sales Executive
        # Get active executives
        executives = db.query(User).filter(
            User.organization_id == organization_id,
            User.role.in_([UserRole.SALES_EXECUTIVE, UserRole.ADMIN]),
            User.is_active == True,
            User.is_deleted == False
        ).all()

        if not executives:
            # Fallback to any active user in org
            fallback = db.query(User).filter(
                User.organization_id == organization_id,
                User.is_active == True,
                User.is_deleted == False
            ).first()
            if fallback:
                return fallback.id, "Organization Fallback User"
            return 1, "System Root Fallback"

        # Count active open leads per executive
        lead_counts = db.query(
            Lead.assigned_to_id,
            func.count(Lead.id).label("open_count")
        ).filter(
            Lead.organization_id == organization_id,
            Lead.is_deleted == False,
            Lead.status.notin_([LeadStatus.BOOKED, LeadStatus.LOST, "Booked", "Lost"])
        ).group_by(Lead.assigned_to_id).all()

        count_map = {row[0]: row[1] for row in lead_counts if row[0] is not None}

        # Find executive with minimum open leads
        sorted_execs = sorted(executives, key=lambda u: count_map.get(u.id, 0))
        least_loaded = sorted_execs[0]

        return least_loaded.id, f"Least Loaded Executive Capacity ({count_map.get(least_loaded.id, 0)} active leads)"
