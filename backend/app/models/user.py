import enum
from sqlalchemy import Column, Integer, String, Enum, Boolean
from sqlalchemy.orm import relationship
from app.database import BaseModel

class UserRole(str, enum.Enum):
    SUPERADMIN = "Super Admin"
    ADMIN = "Admin"
    MANAGER = "Manager"
    SALES_EXECUTIVE = "Sales Executive"
    BROKER = "Broker"


class User(BaseModel):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    email = Column(String(150), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    role = Column(Enum(UserRole), nullable=False, default=UserRole.SALES_EXECUTIVE)
    phone = Column(String(20), nullable=True)
    firm_name = Column(String(150), nullable=True) # For Brokers or CP firms
    is_active = Column(Boolean, default=True, nullable=False)
    avatar_url = Column(String(255), nullable=True)

    # Relationships
    assigned_leads = relationship("Lead", back_populates="assigned_to", foreign_keys="Lead.assigned_to_id")
    created_leads = relationship("Lead", back_populates="created_by", foreign_keys="Lead.created_by_id")
    followups = relationship("Followup", back_populates="assigned_to")
    sales_targets = relationship("SalesTarget", back_populates="user")
    bookings = relationship("Booking", back_populates="assigned_executive")
    notifications = relationship("Notification", back_populates="user")
