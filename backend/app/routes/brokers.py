from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.broker import BrokerProfile
from app.models.user import User, UserRole
from app.schemas.broker import BrokerCreate, BrokerUpdate, BrokerResponse
from app.utils.security import get_password_hash
from app.middleware.auth_middleware import get_current_user, RequireRole

router = APIRouter(prefix="/brokers", tags=["Brokers"])

@router.get("", response_model=list[BrokerResponse])
def get_brokers(
    search: str | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(BrokerProfile).join(User).filter(BrokerProfile.is_deleted == False)

    if current_user.role != UserRole.SUPERADMIN and current_user.organization_id:
        query = query.filter(User.organization_id == current_user.organization_id)

    if search:
        query = query.filter(
            (BrokerProfile.firm_name.ilike(f"%{search}%")) | (BrokerProfile.contact_person.ilike(f"%{search}%"))
        )
    return query.order_by(BrokerProfile.firm_name).all()

from sqlalchemy import func
from app.models.saas import Organization

@router.post("", response_model=BrokerResponse, status_code=status.HTTP_201_CREATED)
def create_broker(
    broker_in: BrokerCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(RequireRole([UserRole.ADMIN, UserRole.MANAGER]))
):
    clean_email = broker_in.email.lower().strip()
    existing_user = db.query(User).filter(func.lower(User.email) == clean_email, User.is_deleted == False).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="User with this email already exists")

    org_id = current_user.organization_id
    firm_name = broker_in.firm_name or current_user.firm_name
    if not org_id and firm_name:
        org = db.query(Organization).filter(func.lower(Organization.name) == firm_name.lower().strip()).first()
        if org:
            org_id = org.id
            current_user.organization_id = org_id
            db.commit()

    # Create User account for broker
    user = User(
        organization_id=org_id,
        name=broker_in.contact_person,
        email=clean_email,
        hashed_password=get_password_hash(broker_in.password),
        role=UserRole.BROKER,
        phone=broker_in.phone,
        firm_name=firm_name
    )
    db.add(user)
    db.flush()

    broker = BrokerProfile(
        user_id=user.id,
        firm_name=broker_in.firm_name,
        contact_person=broker_in.contact_person,
        phone=broker_in.phone,
        email=broker_in.email,
        address=broker_in.address,
        commission_rate=broker_in.commission_rate
    )
    db.add(broker)
    db.commit()
    db.refresh(broker)

    return broker

@router.put("/{broker_id}", response_model=BrokerResponse)
def update_broker(
    broker_id: int,
    broker_in: BrokerUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(RequireRole([UserRole.ADMIN, UserRole.MANAGER]))
):
    broker = db.query(BrokerProfile).filter(BrokerProfile.id == broker_id, BrokerProfile.is_deleted == False).first()
    if not broker:
        raise HTTPException(status_code=404, detail="Broker profile not found")

    for field, value in broker_in.model_dump(exclude_unset=True).items():
        setattr(broker, field, value)

    db.commit()
    db.refresh(broker)
    return broker

@router.delete("/{broker_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_broker(
    broker_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(RequireRole([UserRole.ADMIN]))
):
    broker = db.query(BrokerProfile).filter(BrokerProfile.id == broker_id, BrokerProfile.is_deleted == False).first()
    if not broker:
        raise HTTPException(status_code=404, detail="Broker profile not found")

    broker.is_deleted = True
    db.commit()
