import enum
from sqlalchemy import Column, Integer, String, Float, Text, ForeignKey, Enum
from sqlalchemy.orm import relationship
from app.database import BaseModel

class ProjectStatus(str, enum.Enum):
    UNDER_CONSTRUCTION = "Under Construction"
    READY_TO_MOVE = "Ready to Move"
    NEW_LAUNCH = "New Launch"
    SOLD_OUT = "Sold Out"

class Project(BaseModel):
    __tablename__ = "projects"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(150), nullable=False, index=True) # e.g. Godrej Woods
    builder_id = Column(Integer, ForeignKey("builders.id"), nullable=False)
    location = Column(String(200), nullable=False, index=True) # Sector 150, Noida
    configuration = Column(String(100), nullable=False) # e.g. 2, 3, 4 BHK Apartments
    min_price = Column(Float, nullable=False) # in Lakhs or Crores (e.g. 1.25 Cr -> 125.0 in Lakhs)
    max_price = Column(Float, nullable=False)
    possession_date = Column(String(50), nullable=True) # e.g. Dec 2027
    rera_id = Column(String(100), nullable=True, index=True)
    status = Column(Enum(ProjectStatus), default=ProjectStatus.UNDER_CONSTRUCTION, nullable=False)
    amenities = Column(Text, nullable=True) # Comma separated or JSON string
    brochure_url = Column(String(255), nullable=True)
    description = Column(Text, nullable=True)

    # Relationships
    builder = relationship("Builder", back_populates="projects")
    bookings = relationship("Booking", back_populates="project")
