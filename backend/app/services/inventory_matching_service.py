import re
from typing import List, Tuple
from sqlalchemy.orm import Session
from app.models.lead import Lead, LeadStatus
from app.models.project import Project, ProjectStatus
from app.models.user import User, UserRole
from app.schemas.inventory_matching import (
    CriteriaMatchDetail,
    LeadInventoryMatch,
    LeadInventoryMatchResponse,
    MatchedLeadItem,
    ProjectMatchingLeadsResponse,
)

def _normalize_tokens(text: str | None) -> set[str]:
    if not text:
        return set()
    # Strip special punctuation and split into lowercase words
    cleaned = re.sub(r'[,/\\|\-\.]+', ' ', text.lower())
    stop_words = {"in", "at", "near", "road", "expressway", "phase", "sector", "sec", "nagar", "apartments", "extension", "west", "east", "north", "south"}
    tokens = {word.strip() for word in cleaned.split() if len(word.strip()) > 1}
    # Keep important tokens and numeric sector numbers
    return tokens

def _extract_bhk_numbers(text: str | None) -> set[int]:
    if not text:
        return set()
    norm = text.lower()
    results = set()

    # 1. Range like "2-4 BHK" or "2 to 4 BHK"
    range_match = re.search(r'(\d+)\s*(?:-|to)\s*(\d+)\s*(?:bhk|bedroom|bed)', norm)
    if range_match:
        start, end = int(range_match.group(1)), int(range_match.group(2))
        for n in range(start, end + 1):
            results.add(n)

    # 2. List like "2, 3, 4 BHK", "2/3/4 BHK", "2, 3 & 4 BHK"
    list_match = re.search(r'((?:\d+\s*[,/&]\s*)+\d+)\s*(?:bhk|bedroom|bed)', norm)
    if list_match:
        for d in re.findall(r'\d+', list_match.group(1)):
            results.add(int(d))

    # 3. Direct matches like "3 BHK", "2 Bedroom"
    for m in re.findall(r'(\d+)\s*(?:bhk|bedroom|bed)', norm):
        results.add(int(m))

    return results


def _calculate_budget_match(lead: Lead, project: Project) -> Tuple[float, str, str, str]:
    """
    Returns: (score_percentage 0..100, status, detail_text, gap_text)
    """
    l_min = lead.budget_min
    l_max = lead.budget_max
    p_min = project.min_price
    p_max = project.max_price

    if not l_min and not l_max:
        return 60.0, "UNSPECIFIED", f"Lead budget not recorded. Project is ₹{p_min}L - ₹{p_max}L.", ""

    # When both min and max are specified
    if l_min is not None and l_max is not None:
        # Check overlap
        overlap_start = max(l_min, p_min)
        overlap_end = min(l_max, p_max)
        if overlap_start <= overlap_end:
            # Overlap exists!
            overlap_range = overlap_end - overlap_start
            project_range = max(1.0, p_max - p_min)
            ratio = min(1.0, max(0.6, overlap_range / project_range))
            score = 80.0 + (ratio * 20.0)
            detail = f"Budget overlaps perfectly: Buyer budget (₹{l_min}L - ₹{l_max}L) covers project range (₹{p_min}L - ₹{p_max}L)."
            return score, "MATCHED", detail, ""
        elif p_min > l_max:
            # Project is more expensive than buyer's maximum budget
            stretch_pct = ((p_min - l_max) / l_max) * 100
            if stretch_pct <= 15:
                score = 55.0
                detail = f"Slight budget stretch: Project starts at ₹{p_min}L (+{int(stretch_pct)}% above buyer max ₹{l_max}L)."
                gap = f"Buyer max budget is ₹{l_max}L. Minimum unit in this project requires ₹{p_min}L ({int(stretch_pct)}% stretch)."
                return score, "PARTIAL", detail, gap
            else:
                score = 15.0
                detail = f"Project minimum (₹{p_min}L) exceeds buyer max (₹{l_max}L) by {int(stretch_pct)}%."
                gap = f"Substantial budget gap: ₹{p_min}L vs ₹{l_max}L budget limit."
                return score, "MISMATCHED", detail, gap
        else:
            # Project maximum is below buyer's minimum (buyer wants ultra-luxury, project is affordable)
            gap_pct = ((l_min - p_max) / l_min) * 100
            if gap_pct <= 20:
                score = 65.0
                detail = f"Project max ₹{p_max}L is slightly below buyer's preferred minimum ₹{l_min}L (Great value deal)."
                return score, "MATCHED", detail, ""
            else:
                score = 40.0
                detail = f"Project maximum (₹{p_max}L) is below buyer target segment (₹{l_min}L+)."
                gap = f"Project may be below buyer luxury expectation (₹{p_max}L vs ₹{l_min}L+)."
                return score, "PARTIAL", detail, gap

    # Only budget_max is specified
    if l_max is not None:
        if p_min <= l_max:
            score = 95.0
            detail = f"Project entry price ₹{p_min}L is well within buyer ceiling of ₹{l_max}L."
            return score, "MATCHED", detail, ""
        else:
            stretch_pct = ((p_min - l_max) / l_max) * 100
            if stretch_pct <= 15:
                score = 55.0
                detail = f"Starts at ₹{p_min}L, requiring {int(stretch_pct)}% stretch on buyer max ₹{l_max}L."
                gap = f"Requires {int(stretch_pct)}% budget stretch."
                return score, "PARTIAL", detail, gap
            else:
                score = 10.0
                detail = f"Project min ₹{p_min}L exceeds buyer budget ₹{l_max}L."
                gap = f"Exceeds max budget by {int(stretch_pct)}%."
                return score, "MISMATCHED", detail, gap

    # Only budget_min is specified
    if l_min is not None:
        if p_max >= l_min:
            score = 90.0
            detail = f"Project top range ₹{p_max}L satisfies buyer minimum requirement ₹{l_min}L."
            return score, "MATCHED", detail, ""
        else:
            score = 45.0
            detail = f"Project max ₹{p_max}L is lower than buyer minimum ₹{l_min}L."
            gap = f"Below buyer minimum budget."
            return score, "PARTIAL", detail, gap

    return 60.0, "UNSPECIFIED", "Budget not specified.", ""

def _calculate_location_match(lead: Lead, project: Project) -> Tuple[float, str, str, str]:
    if not lead.preferred_location or not lead.preferred_location.strip():
        return 65.0, "UNSPECIFIED", f"Lead has not specified a location preference. Project is located at {project.location}.", ""

    lead_loc = lead.preferred_location.strip().lower()
    proj_loc = project.location.strip().lower()

    # Exact or substring match
    if lead_loc in proj_loc or proj_loc in lead_loc:
        return 100.0, "MATCHED", f"Location matches perfectly: '{lead.preferred_location}' aligns with '{project.location}'.", ""

    # Token overlap (e.g. "Sector 150", "Noida", "Whitefield", "Gurgaon")
    lead_tokens = _normalize_tokens(lead.preferred_location)
    proj_tokens = _normalize_tokens(project.location)

    shared_tokens = lead_tokens.intersection(proj_tokens)
    if shared_tokens:
        overlap_ratio = len(shared_tokens) / max(1, len(lead_tokens))
        if overlap_ratio >= 0.5 or any(t.isdigit() for t in shared_tokens):
            score = 85.0
            detail = f"Strong location correlation in '{', '.join(shared_tokens).title()}': {project.location} fits buyer preference."
            return score, "MATCHED", detail, ""
        else:
            score = 65.0
            detail = f"Regional match ({', '.join(shared_tokens).title()}): {project.location} is in the same broader zone."
            return score, "PARTIAL", detail, ""

    return 15.0, "MISMATCHED", f"Location mismatch: Buyer prefers '{lead.preferred_location}', project is at '{project.location}'.", f"Project is in {project.location} instead of {lead.preferred_location}."

def _calculate_configuration_match(lead: Lead, project: Project) -> Tuple[float, str, str, str]:
    if not lead.preferred_configuration or not lead.preferred_configuration.strip():
        return 65.0, "UNSPECIFIED", f"No BHK configuration specified. Project offers {project.configuration}.", ""

    lead_bhks = _extract_bhk_numbers(lead.preferred_configuration)
    proj_bhks = _extract_bhk_numbers(project.configuration)

    if lead_bhks and proj_bhks:
        shared_bhks = lead_bhks.intersection(proj_bhks)
        if shared_bhks:
            bhk_str = ", ".join(f"{b} BHK" for b in sorted(shared_bhks))
            return 100.0, "MATCHED", f"Configuration match: {bhk_str} is actively available in {project.name}.", ""
        
        # Adjacent BHK (e.g. looking for 2 BHK, project has 3 BHK)
        min_diff = min(abs(lb - pb) for lb in lead_bhks for pb in proj_bhks)
        if min_diff == 1:
            return 60.0, "PARTIAL", f"Adjacent configuration: Buyer wants {lead.preferred_configuration}, project has {project.configuration}.", f"Project offers {project.configuration} (buyer asked for {lead.preferred_configuration})."
        else:
            return 20.0, "MISMATCHED", f"Configuration mismatch: Buyer wants {lead.preferred_configuration}, project offers {project.configuration}.", f"Size mismatch: {project.configuration} vs {lead.preferred_configuration}."

    # Substring search for types like Villa, Penthouse, Studio, Plot
    lead_conf_norm = lead.preferred_configuration.lower()
    proj_conf_norm = project.configuration.lower()
    for kw in ["villa", "penthouse", "studio", "plot", "office", "commercial", "shop"]:
        if kw in lead_conf_norm and kw in proj_conf_norm:
            return 100.0, "MATCHED", f"Unit category match: Both feature {kw.title()}.", ""

    if lead_conf_norm in proj_conf_norm or proj_conf_norm in lead_conf_norm:
        return 90.0, "MATCHED", f"Configuration match: {project.configuration} corresponds with buyer's requirement.", ""

    return 35.0, "PARTIAL", f"Buyer prefers {lead.preferred_configuration}; project offers {project.configuration}.", f"Offers {project.configuration}."

def _generate_whatsapp_pitch(lead: Lead, project: Project, match_score: int) -> str:
    lead_name = lead.name.split()[0] if lead.name else "Client"
    builder_name = project.builder.name if project.builder else "Renowned Builder"
    bhk_info = lead.preferred_configuration if lead.preferred_configuration else project.configuration
    
    msg = (
        f"Hi {lead_name}, greetings from REALVION! 🏢\n\n"
        f"Based on your property requirement ({bhk_info} around {lead.preferred_location or project.location}), "
        f"I strongly recommend taking a look at *{project.name}* by {builder_name}.\n\n"
        f"✨ *Key Highlights*:\n"
        f"📍 Location: {project.location}\n"
        f"💰 Price Range: ₹{project.min_price}L - ₹{project.max_price}L\n"
        f"🏡 Configurations: {project.configuration}\n"
        f"🏗️ Status: {project.status.value if hasattr(project.status, 'value') else project.status}\n"
    )
    if project.possession_date:
        msg += f"🗓️ Possession: {project.possession_date}\n"
    if project.rera_id:
        msg += f"🛡️ RERA: {project.rera_id}\n"
        
    msg += (
        f"\nWe are arranging exclusive VIP preview visits with complimentary chauffeur pick-up this week. "
        f"Would you like me to share the master layout brochure and reserve a preferred visit slot for you?"
    )
    return msg

class InventoryMatchingService:

    @staticmethod
    def match_inventory_for_lead(lead_id: int, db: Session, current_user: User) -> LeadInventoryMatchResponse:
        lead_query = db.query(Lead).filter(Lead.id == lead_id, Lead.is_deleted == False)
        if current_user.role != UserRole.SUPERADMIN and current_user.organization_id:
            lead_query = lead_query.filter(
                (Lead.organization_id == current_user.organization_id) | (Lead.organization_id.is_(None))
            )
        lead = lead_query.first()
        if not lead:
            raise ValueError("Lead not found or access denied")

        # Fetch all available projects
        proj_query = db.query(Project).filter(
            Project.is_deleted == False,
            Project.status != ProjectStatus.SOLD_OUT
        )
        if current_user.role != UserRole.SUPERADMIN and current_user.organization_id:
            proj_query = proj_query.filter(
                (Project.organization_id == current_user.organization_id) | (Project.organization_id.is_(None))
            )
        projects = proj_query.all()

        matches: List[LeadInventoryMatch] = []

        for p in projects:
            # 1. Budget Score (35% weight)
            b_score, b_status, b_detail, b_gap = _calculate_budget_match(lead, p)
            # 2. Location Score (30% weight)
            l_score, l_status, l_detail, l_gap = _calculate_location_match(lead, p)
            # 3. Configuration Score (25% weight)
            c_score, c_status, c_detail, c_gap = _calculate_configuration_match(lead, p)

            # 4. Preference & Developer bonus (10% weight)
            bonus_score = 50.0
            bonus_detail = "Verified developer inventory."
            if lead.preferred_project_id == p.id:
                bonus_score = 100.0
                bonus_detail = "Client explicitly selected this project as their preferred interest."
            elif p.status == ProjectStatus.READY_TO_MOVE and lead.tags and "ready" in lead.tags.lower():
                bonus_score = 90.0
                bonus_detail = "Ready to move status aligns with buyer's readiness tags."
            elif p.rera_id:
                bonus_score = 75.0
                bonus_detail = f"RERA certified ({p.rera_id}) with transparent construction status."

            # Weighted aggregate score
            total_score = (
                (b_score * 0.35) +
                (l_score * 0.30) +
                (c_score * 0.25) +
                (bonus_score * 0.10)
            )
            final_score = int(round(min(100.0, max(0.0, total_score))))

            # Tier classification
            if final_score >= 85:
                tier = "EXCELLENT_MATCH"
                action = "Schedule VIP Site Visit & Share Floor Plan"
            elif final_score >= 70:
                tier = "GOOD_MATCH"
                action = "Share Brochure on WhatsApp & Pitch Highlights"
            elif final_score >= 50:
                tier = "PARTIAL_MATCH"
                action = "Present as Value Alternative or Suggest Budget Stretch"
            else:
                tier = "LOW_MATCH"
                action = "Keep as Secondary Fallback"

            breakdown = [
                CriteriaMatchDetail(criterion="Budget Match", status=b_status, score_percentage=b_score, detail=b_detail),
                CriteriaMatchDetail(criterion="Location Fit", status=l_status, score_percentage=l_score, detail=l_detail),
                CriteriaMatchDetail(criterion="Configuration / BHK", status=c_status, score_percentage=c_score, detail=c_detail),
                CriteriaMatchDetail(criterion="Developer & Readiness", status="MATCHED" if bonus_score >= 70 else "PARTIAL", score_percentage=bonus_score, detail=bonus_detail),
            ]

            reasons = [item.detail for item in breakdown if item.status in ("MATCHED", "PARTIAL") and "not" not in item.detail.lower()][:3]
            gaps = [g for g in [b_gap, l_gap, c_gap] if g]

            pitch = _generate_whatsapp_pitch(lead, p, final_score)
            builder_name = p.builder.name if p.builder else "Renowned Builder"

            matches.append(
                LeadInventoryMatch(
                    project_id=p.id,
                    project_name=p.name,
                    builder_name=builder_name,
                    location=p.location,
                    configuration=p.configuration,
                    min_price=p.min_price,
                    max_price=p.max_price,
                    possession_date=p.possession_date,
                    status=p.status.value if hasattr(p.status, 'value') else str(p.status),
                    brochure_url=p.brochure_url,
                    rera_id=p.rera_id,
                    match_score=final_score,
                    match_tier=tier,
                    criteria_breakdown=breakdown,
                    match_reasons=reasons,
                    gap_reasons=gaps,
                    whatsapp_pitch=pitch,
                    recommended_action=action,
                )
            )

        # Sort descending by match score
        matches.sort(key=lambda m: m.match_score, reverse=True)

        budget_str = f"₹{lead.budget_min or 0}L - ₹{lead.budget_max or 0}L" if (lead.budget_min or lead.budget_max) else "Unspecified"

        return LeadInventoryMatchResponse(
            lead_id=lead.id,
            lead_name=lead.name,
            buyer_budget=budget_str,
            buyer_location=lead.preferred_location,
            buyer_configuration=lead.preferred_configuration,
            total_projects_evaluated=len(projects),
            matches=matches,
        )

    @staticmethod
    def match_leads_for_project(project_id: int, db: Session, current_user: User) -> ProjectMatchingLeadsResponse:
        proj_query = db.query(Project).filter(Project.id == project_id, Project.is_deleted == False)
        if current_user.role != UserRole.SUPERADMIN and current_user.organization_id:
            proj_query = proj_query.filter(
                (Project.organization_id == current_user.organization_id) | (Project.organization_id.is_(None))
            )
        project = proj_query.first()
        if not project:
            raise ValueError("Project not found or access denied")

        # Fetch active leads who are looking for property (not LOST, not BOOKED)
        leads_query = db.query(Lead).filter(
            Lead.is_deleted == False,
            Lead.status.notin_([LeadStatus.LOST, LeadStatus.BOOKED])
        )
        if current_user.role != UserRole.SUPERADMIN and current_user.organization_id:
            leads_query = leads_query.filter(
                (Lead.organization_id == current_user.organization_id) | (Lead.organization_id.is_(None))
            )
        leads = leads_query.all()

        matched_leads: List[MatchedLeadItem] = []

        for lead in leads:
            b_score, b_status, b_detail, b_gap = _calculate_budget_match(lead, project)
            l_score, l_status, l_detail, l_gap = _calculate_location_match(lead, project)
            c_score, c_status, c_detail, c_gap = _calculate_configuration_match(lead, project)

            bonus_score = 50.0
            if lead.preferred_project_id == project.id:
                bonus_score = 100.0

            total_score = (
                (b_score * 0.35) +
                (l_score * 0.30) +
                (c_score * 0.25) +
                (bonus_score * 0.10)
            )
            final_score = int(round(min(100.0, max(0.0, total_score))))

            # Filter to relevant matches (score >= 45)
            if final_score < 45:
                continue

            if final_score >= 85:
                tier = "EXCELLENT_MATCH"
            elif final_score >= 70:
                tier = "GOOD_MATCH"
            else:
                tier = "PARTIAL_MATCH"

            reasons = [r for r in [b_detail, l_detail, c_detail] if "mismatch" not in r.lower()][:2]
            gaps = [g for g in [b_gap, l_gap, c_gap] if g]
            pitch = _generate_whatsapp_pitch(lead, project, final_score)
            budget_str = f"₹{lead.budget_min or 0}L - ₹{lead.budget_max or 0}L" if (lead.budget_min or lead.budget_max) else "Unspecified"

            matched_leads.append(
                MatchedLeadItem(
                    lead_id=lead.id,
                    lead_name=lead.name,
                    phone=lead.phone,
                    email=lead.email,
                    status=lead.status.value if hasattr(lead.status, 'value') else str(lead.status),
                    assigned_to_name=lead.assigned_to.name if lead.assigned_to else "Unassigned",
                    budget_range=budget_str,
                    preferred_location=lead.preferred_location,
                    preferred_configuration=lead.preferred_configuration,
                    match_score=final_score,
                    match_tier=tier,
                    match_reasons=reasons,
                    gap_reasons=gaps,
                    whatsapp_pitch=pitch,
                )
            )

        matched_leads.sort(key=lambda m: m.match_score, reverse=True)
        builder_name = project.builder.name if project.builder else "Renowned Builder"

        return ProjectMatchingLeadsResponse(
            project_id=project.id,
            project_name=project.name,
            builder_name=builder_name,
            total_leads_evaluated=len(leads),
            matched_leads=matched_leads,
        )
