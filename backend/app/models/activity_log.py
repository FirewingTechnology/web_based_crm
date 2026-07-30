from sqlalchemy import Column, Integer, String, Text, ForeignKey
from sqlalchemy.orm import relationship
from app.database import BaseModel

class ActivityLog(BaseModel):
    __tablename__ = "activity_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    user_name = Column(String(100), nullable=False)
    action = Column(String(100), nullable=False) # e.g. "CREATED_LEAD", "STATUS_CHANGED"
    module = Column(String(50), nullable=False) # e.g. "Leads", "Bookings"
    details = Column(Text, nullable=False)

    user = relationship("User")
