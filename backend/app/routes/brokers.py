from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.database import get_db
from app.models.broker import BrokerProfile
from app.models.user import User, UserRole
from app.models.saas import Organization
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
        query = query.filter(
            (User.organization_id == current_user.organization_id) | (User.organization_id.is_(None))
        )

    if search:
        query = query.filter(
            (BrokerProfile.firm_name.ilike(f"%{search}%")) | (BrokerProfile.contact_person.ilike(f"%{search}%"))
        )
    return query.order_by(BrokerProfile.firm_name).all()

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
    return broker

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
    return broker

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
