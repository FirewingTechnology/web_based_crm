from sqlalchemy import Column, Integer, String, Text, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from app.database import BaseModel

class Notification(BaseModel):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    title = Column(String(150), nullable=False)
    message = Column(Text, nullable=False)
    type = Column(String(50), default="info", nullable=False) # info, warning, success
    is_read = Column(Boolean, default=False, nullable=False)

    user = relationship("User", back_populates="notifications")
