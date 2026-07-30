from sqlalchemy import Column, Integer, String, Float, ForeignKey, Text
from sqlalchemy.orm import relationship
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
    commission_rate = Column(Float, default=1.5, nullable=False) # standard broker commission %
    total_deals = Column(Integer, default=0, nullable=False)
    total_revenue_generated = Column(Float, default=0.0, nullable=False)
    performance_score = Column(Float, default=5.0, nullable=False)

    # Relationships
    user = relationship("User")
    bookings = relationship("Booking", back_populates="broker")
