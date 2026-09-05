from typing import List, Dict, Any, Optional
import urllib.parse
from sqlalchemy.orm import Session

from app.models.broker import BrokerProfile
from app.models.project import Project

CP_TIERS_CONFIG: List[Dict[str, Any]] = [
    {
        "tier": "Silver",
        "min_revenue_lakhs": 0.0,
        "base_commission_pct": 1.5,
        "volume_kicker_pct": 0.0,
        "effective_commission_pct": 1.5,
        "perks": [
            "Standard CP Portal Access",
            "Digital Project Collaterals Access",
            "Direct Builder Billing Support"
        ]
    },
    {
        "tier": "Gold",
        "min_revenue_lakhs": 500.0, # ₹5 Crore
        "base_commission_pct": 2.0,
        "volume_kicker_pct": 0.25,
        "effective_commission_pct": 2.25,
        "perks": [
            "Priority Site Visit & Chauffeur Slots",
            "+0.25% Volume Kicker on Closed Sales",
            "Dedicated Relationship Manager",
            "Fast-track Commission Payouts (Within 7 Days)"
        ]
    },
    {
        "tier": "Platinum",
        "min_revenue_lakhs": 1500.0, # ₹15 Crore
        "base_commission_pct": 2.5,
        "volume_kicker_pct": 0.5,
        "effective_commission_pct": 3.0,
        "perks": [
            "Exclusive Pre-launch Inventory & Floor Allocations",
            "+0.50% Master Volume Kicker",
            "Co-branded Event & Digital Marketing Sponsorship",
            "48-Hour Priority Commission Payouts",
            "Executive Builder Council Representation"
        ]
    }
]

def get_tier_config(tier_name: str) -> Dict[str, Any]:
    for t in CP_TIERS_CONFIG:
        if t["tier"].lower() == tier_name.lower():
            return t
    return CP_TIERS_CONFIG[0]

def auto_evaluate_broker_tier(broker: BrokerProfile) -> str:
    """Calculates tier entitlement based on cumulative sales revenue generated."""
    rev = broker.total_revenue_generated or 0.0
    if rev >= 1500.0:
        return "Platinum"
    elif rev >= 500.0:
        return "Gold"
    return "Silver"

def generate_project_collaterals(broker: BrokerProfile, db: Session) -> List[Dict[str, Any]]:
    """Generates customized marketing kits and co-branded digital share links for a broker."""
    projects = db.query(Project).filter(Project.is_deleted == False).all()
    collaterals = []

    for p in projects:
        amenities_list = [a.strip() for a in (p.amenities or "").split(",") if a.strip()]
        price_range = f"₹{p.min_price:g}L - ₹{p.max_price:g}L" if p.min_price and p.max_price else "On Request"

        share_text = (
            f"✨ Exclusive Opportunity at *{p.name}* ({p.location})\n"
            f"🏡 Configuration: {p.configuration}\n"
            f"💰 Price Range: {price_range}\n"
            f"🔑 Possession: {p.possession_date or 'Under Construction'}\n"
            f"🌟 Highlights: {', '.join(amenities_list[:3]) if amenities_list else 'Luxury Amenities'}\n\n"
            f"For floor plans, unit allocations, and private site visits, connect with:\n"
            f"*{broker.contact_person}* | *{broker.firm_name}*\n"
            f"📞 Phone: {broker.phone}"
        )

        encoded_text = urllib.parse.quote(share_text)
        clean_phone = "".join([c for c in broker.phone if c.isdigit()])
        if len(clean_phone) == 10:
            clean_phone = "91" + clean_phone
        wa_link = f"https://wa.me/?text={encoded_text}"

        collaterals.append({
            "project_id": p.id,
            "project_name": p.name,
            "location": p.location,
            "configuration": p.configuration,
            "price_range": price_range,
            "brochure_url": p.brochure_url,
            "amenities": amenities_list,
            "co_branded_share_text": share_text,
            "co_branded_whatsapp_link": wa_link
        })

    return collaterals
