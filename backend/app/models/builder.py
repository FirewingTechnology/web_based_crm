from sqlalchemy import Column, Integer, String, Float, Text
from sqlalchemy.orm import relationship
from app.database import BaseModel

class Builder(BaseModel):
    __tablename__ = "builders"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(150), nullable=False, index=True) # e.g. Godrej Properties
    company = Column(String(150), nullable=False)
    contact_person = Column(String(100), nullable=False)
    phone = Column(String(20), nullable=False)
    email = Column(String(150), nullable=False)
    address = Column(String(255), nullable=True)
    commission_rate = Column(Float, default=3.0, nullable=False) # default commission percentage
    notes = Column(Text, nullable=True)

    # Relationships
    projects = relationship("Project", back_populates="builder", cascade="all, delete-orphan")
    bookings = relationship("Booking", back_populates="builder")
