from sqlalchemy import Column, Integer, String, Float, ForeignKey, Text, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from app.database import BaseModel

class BrokerProfile(BaseModel):
    __tablename__ = "broker_profiles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)
    firm_name = Column(String(150), nullable=False, index=True)
    contact_person = Column(String(100), nullable=False)
    phone = Column(String(20), nullable=False)
    email = Column(String(150), nullable=False)
    address = Column(Text, nullable=True)
    rera_number = Column(String(100), nullable=True)
    
    # CP Collaboration & Performance Tiers
    tier = Column(String(50), default="Silver", nullable=False, index=True) # Silver, Gold, Platinum
    commission_rate = Column(Float, default=1.5, nullable=False) # standard broker commission %
    total_deals = Column(Integer, default=0, nullable=False)
    total_revenue_generated = Column(Float, default=0.0, nullable=False)
    performance_score = Column(Float, default=5.0, nullable=False)
    
    # Sub-broker / Network Hierarchy
    parent_broker_id = Column(Integer, ForeignKey("broker_profiles.id"), nullable=True, index=True)

    # Relationships
    user = relationship("User")
    bookings = relationship("Booking", back_populates="broker")
    sub_brokers = relationship("BrokerProfile", backref="parent_broker", remote_side=[id])

class CoBrokingDeal(BaseModel):
    __tablename__ = "co_broking_deals"

    id = Column(Integer, primary_key=True, index=True)
    organization_id = Column(Integer, ForeignKey("organizations.id"), nullable=True, index=True)
    primary_broker_id = Column(Integer, ForeignKey("broker_profiles.id"), nullable=False, index=True)
    secondary_broker_id = Column(Integer, ForeignKey("broker_profiles.id"), nullable=True, index=True)
    lead_id = Column(Integer, ForeignKey("leads.id"), nullable=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=True, index=True)

    client_name = Column(String(100), nullable=False)
    client_phone = Column(String(20), nullable=False)
    primary_split_pct = Column(Float, default=50.0, nullable=False) # e.g. 60%
    secondary_split_pct = Column(Float, default=50.0, nullable=False) # e.g. 40%
    expected_deal_value = Column(Float, nullable=True) # in Lakhs
    status = Column(String(50), default="ACTIVE", nullable=False, index=True) # ACTIVE, CLOSED, EXPIRED, CANCELLED
    notes = Column(Text, nullable=True)

    # Relationships
    primary_broker = relationship("BrokerProfile", foreign_keys=[primary_broker_id])
    secondary_broker = relationship("BrokerProfile", foreign_keys=[secondary_broker_id])
    lead = relationship("Lead")
    project = relationship("Project")
