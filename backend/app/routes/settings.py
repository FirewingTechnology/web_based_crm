from fastapi import APIRouter, Depends
from app.models.user import User, UserRole
from app.middleware.auth_middleware import get_current_user, RequireRole

router = APIRouter(prefix="/settings", tags=["Settings"])

DEFAULT_LEAD_SOURCES = ["Direct", "Referral", "99acres", "MagicBricks", "Facebook Ads", "Google Ads", "Walk-in", "Instagram"]
DEFAULT_TAGS = ["VIP", "NRI", "High Intent", "Ready Buyer", "Investor", "First Time Buyer"]

@router.get("/lead-sources")
def get_lead_sources(current_user: User = Depends(get_current_user)):
    return DEFAULT_LEAD_SOURCES

@router.get("/lead-tags")
def get_lead_tags(current_user: User = Depends(get_current_user)):
    return DEFAULT_TAGS
