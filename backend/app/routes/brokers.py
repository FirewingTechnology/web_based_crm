from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional

from app.database import get_db
from app.models.broker import BrokerProfile, CoBrokingDeal
from app.models.user import User, UserRole
from app.models.saas import Organization
from app.schemas.broker import (
    BrokerCreate, BrokerUpdate, BrokerResponse,
    BrokerTierConfig, BrokerTierUpdateRequest,
    ProjectCollateralResponse, CoBrokingDealCreate, CoBrokingDealResponse
)
from app.utils.security import get_password_hash
from app.middleware.auth_middleware import get_current_user, RequireRole
from app.services.broker_collaboration_service import (
    CP_TIERS_CONFIG, get_tier_config, auto_evaluate_broker_tier, generate_project_collaterals
)

router = APIRouter(prefix="/brokers", tags=["Brokers"])

def enrich_broker_response(broker: BrokerProfile, db: Session) -> BrokerResponse:
    """Computes sub-broker team counts and parent firm name for a broker profile."""
    resp = BrokerResponse.model_validate(broker)
    sub_count = db.query(BrokerProfile).filter(
        BrokerProfile.parent_broker_id == broker.id,
        BrokerProfile.is_deleted == False
    ).count()
    resp.sub_broker_count = sub_count
    
    if broker.parent_broker_id:
        parent = db.query(BrokerProfile).filter(BrokerProfile.id == broker.parent_broker_id).first()
        if parent:
            resp.parent_firm_name = parent.firm_name
    return resp

# 1. FIXED ROUTES FIRST (to avoid /{broker_id} path collision)
@router.get("/tiers", response_model=List[BrokerTierConfig])
def get_broker_tiers(current_user: User = Depends(get_current_user)):
    """Returns the CP volume commission tiers and incentive structure."""
    return CP_TIERS_CONFIG

@router.get("/co-broking", response_model=List[CoBrokingDealResponse])
def get_co_broking_deals(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Lists registered co-broking agreements with commission split breakdowns."""
    query = db.query(CoBrokingDeal).filter(CoBrokingDeal.is_deleted == False)
    if current_user.role != UserRole.SUPERADMIN and current_user.organization_id:
        query = query.filter(
            (CoBrokingDeal.organization_id == current_user.organization_id) | (CoBrokingDeal.organization_id.is_(None))
        )
    
    deals = query.order_by(CoBrokingDeal.created_at.desc()).all()
    results = []
    for d in deals:
        item = CoBrokingDealResponse.model_validate(d)
        if d.primary_broker:
            item.primary_broker_name = d.primary_broker.firm_name
        if d.secondary_broker:
            item.secondary_broker_name = d.secondary_broker.firm_name
        if d.project:
            item.project_name = d.project.name
        results.append(item)
    return results

@router.post("/co-broking", response_model=CoBrokingDealResponse, status_code=status.HTTP_201_CREATED)
def register_co_broking_deal(
    payload: CoBrokingDealCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Registers a new co-broking agreement between 2 channel partner firms with custom split percentages."""
    primary = db.query(BrokerProfile).filter(BrokerProfile.id == payload.primary_broker_id).first()
    if not primary:
        raise HTTPException(status_code=404, detail="Primary broker not found")
    
    if payload.secondary_broker_id:
        sec = db.query(BrokerProfile).filter(BrokerProfile.id == payload.secondary_broker_id).first()
        if not sec:
            raise HTTPException(status_code=404, detail="Secondary broker not found")

    if abs((payload.primary_split_pct + payload.secondary_split_pct) - 100.0) > 0.01:
        raise HTTPException(status_code=400, detail="Primary and secondary split percentages must total exactly 100%")

    deal = CoBrokingDeal(
        organization_id=current_user.organization_id,
        primary_broker_id=payload.primary_broker_id,
        secondary_broker_id=payload.secondary_broker_id,
        lead_id=payload.lead_id,
        project_id=payload.project_id,
        client_name=payload.client_name,
        client_phone=payload.client_phone,
        primary_split_pct=payload.primary_split_pct,
        secondary_split_pct=payload.secondary_split_pct,
        expected_deal_value=payload.expected_deal_value,
        status="ACTIVE",
        notes=payload.notes
    )
    db.add(deal)
    db.commit()
    db.refresh(deal)

    item = CoBrokingDealResponse.model_validate(deal)
    if deal.primary_broker:
        item.primary_broker_name = deal.primary_broker.firm_name
    if deal.secondary_broker:
        item.secondary_broker_name = deal.secondary_broker.firm_name
    if deal.project:
        item.project_name = deal.project.name
    return item

# 2. STANDARD LIST & CREATE BROKER ROUTES
@router.get("", response_model=List[BrokerResponse])
def get_brokers(
    search: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(BrokerProfile).join(User).filter(BrokerProfile.is_deleted == False)

    if current_user.role != UserRole.SUPERADMIN and current_user.organization_id:
        query = query.filter(
            (User.organization_id == current_user.organization_id) | (User.organization_id.is_(None))
        )

    if search:
        query = query.filter(
            (BrokerProfile.firm_name.ilike(f"%{search}%")) | (BrokerProfile.contact_person.ilike(f"%{search}%"))
        )
    brokers = query.order_by(BrokerProfile.firm_name).all()
    return [enrich_broker_response(b, db) for b in brokers]

@router.post("", response_model=BrokerResponse, status_code=status.HTTP_201_CREATED)
def create_broker(
    broker_in: BrokerCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(RequireRole([UserRole.ADMIN, UserRole.MANAGER]))
):
    clean_email = broker_in.email.lower().strip()
    existing_user = db.query(User).filter(func.lower(User.email) == clean_email, User.is_deleted == False).first()
    if existing_user:
        raise HTTPException(status_code=400, detail=f"User with email '{clean_email}' already exists. Please use a different email address.")

    org_id = current_user.organization_id
    firm_name = (broker_in.firm_name or "").strip()
    if not firm_name:
        firm_name = f"{broker_in.contact_person} (Independent Broker)"

    if not org_id and firm_name:
        org = db.query(Organization).filter(func.lower(Organization.name) == firm_name.lower()).first()
        if org:
            org_id = org.id
            current_user.organization_id = org_id
            db.commit()

    # Create User account for broker
    user = User(
        organization_id=org_id,
        name=broker_in.contact_person,
        email=clean_email,
        hashed_password=get_password_hash(broker_in.password or "Broker@123"),
        role=UserRole.BROKER,
        phone=broker_in.phone,
        firm_name=firm_name
    )
    db.add(user)
    db.flush()

    broker = BrokerProfile(
        user_id=user.id,
        firm_name=firm_name,
        contact_person=broker_in.contact_person,
        phone=broker_in.phone,
        email=clean_email,
        address=broker_in.address,
        commission_rate=broker_in.commission_rate,
        tier=broker_in.tier or "Silver",
        parent_broker_id=broker_in.parent_broker_id,
        rera_number=broker_in.rera_number
    )
    db.add(broker)
    db.commit()
    db.refresh(broker)

    return enrich_broker_response(broker, db)

# 3. PARAMETERIZED BROKER DETAIL & ACTIONS
@router.get("/{broker_id}", response_model=BrokerResponse)
def get_broker(
    broker_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(BrokerProfile).join(User).filter(BrokerProfile.id == broker_id, BrokerProfile.is_deleted == False)
    if current_user.role != UserRole.SUPERADMIN and current_user.organization_id:
        query = query.filter(
            (User.organization_id == current_user.organization_id) | (User.organization_id.is_(None))
        )
    broker = query.first()
    if not broker:
        raise HTTPException(status_code=404, detail="Broker profile not found")
    return enrich_broker_response(broker, db)

@router.put("/{broker_id}", response_model=BrokerResponse)
def update_broker(
    broker_id: int,
    broker_in: BrokerUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(RequireRole([UserRole.ADMIN, UserRole.MANAGER]))
):
    query = db.query(BrokerProfile).join(User).filter(BrokerProfile.id == broker_id, BrokerProfile.is_deleted == False)
    if current_user.role != UserRole.SUPERADMIN and current_user.organization_id:
        query = query.filter(
            (User.organization_id == current_user.organization_id) | (User.organization_id.is_(None))
        )
    broker = query.first()
    if not broker:
        raise HTTPException(status_code=404, detail="Broker profile not found")

    update_dict = broker_in.model_dump(exclude_unset=True)
    if "email" in update_dict and update_dict["email"]:
        clean_email = update_dict["email"].lower().strip()
        update_dict["email"] = clean_email
        if broker.user and broker.user.email != clean_email:
            existing = db.query(User).filter(func.lower(User.email) == clean_email, User.id != broker.user_id, User.is_deleted == False).first()
            if existing:
                raise HTTPException(status_code=400, detail=f"User with email '{clean_email}' already exists.")
            broker.user.email = clean_email

    if "contact_person" in update_dict and update_dict["contact_person"] and broker.user:
        broker.user.name = update_dict["contact_person"]
    if "phone" in update_dict and update_dict["phone"] and broker.user:
        broker.user.phone = update_dict["phone"]
    if "firm_name" in update_dict and update_dict["firm_name"] and broker.user:
        broker.user.firm_name = update_dict["firm_name"]

    for field, value in update_dict.items():
        setattr(broker, field, value)

    db.commit()
    db.refresh(broker)
    return enrich_broker_response(broker, db)

@router.patch("/{broker_id}/tier", response_model=BrokerResponse)
def update_broker_tier(
    broker_id: int,
    payload: Optional[BrokerTierUpdateRequest] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(RequireRole([UserRole.ADMIN, UserRole.MANAGER]))
):
    """Assigns or recalculates CP Tier and updates base commission rate accordingly."""
    broker = db.query(BrokerProfile).filter(BrokerProfile.id == broker_id, BrokerProfile.is_deleted == False).first()
    if not broker:
        raise HTTPException(status_code=404, detail="Broker profile not found")

    if payload and payload.tier:
        new_tier = payload.tier.title()
    else:
        new_tier = auto_evaluate_broker_tier(broker)

    cfg = get_tier_config(new_tier)
    broker.tier = new_tier
    broker.commission_rate = cfg["effective_commission_pct"]

    db.commit()
    db.refresh(broker)
    return enrich_broker_response(broker, db)

@router.get("/{broker_id}/collaterals", response_model=List[ProjectCollateralResponse])
def get_broker_collaterals(
    broker_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Returns co-branded project marketing kits, brochures, and WhatsApp share links."""
    broker = db.query(BrokerProfile).filter(BrokerProfile.id == broker_id, BrokerProfile.is_deleted == False).first()
    if not broker:
        raise HTTPException(status_code=404, detail="Broker profile not found")

    return generate_project_collaterals(broker, db)

@router.delete("/{broker_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_broker(
    broker_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(RequireRole([UserRole.ADMIN]))
):
    query = db.query(BrokerProfile).join(User).filter(BrokerProfile.id == broker_id, BrokerProfile.is_deleted == False)
    if current_user.role != UserRole.SUPERADMIN and current_user.organization_id:
        query = query.filter(
            (User.organization_id == current_user.organization_id) | (User.organization_id.is_(None))
        )
    broker = query.first()
    if not broker:
        raise HTTPException(status_code=404, detail="Broker profile not found")

    broker.is_deleted = True
    if broker.user:
        broker.user.is_deleted = True
    db.commit()
