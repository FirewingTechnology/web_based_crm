from sqlalchemy import Column, Integer, String, Float, ForeignKey
from sqlalchemy.orm import relationship
from app.database import BaseModel

class SalesTarget(BaseModel):
    __tablename__ = "sales_targets"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    month_year = Column(String(20), nullable=False, index=True) # Format: YYYY-MM e.g. "2026-07"
    target_amount = Column(Float, nullable=False) # In Lakhs / Crores
    achieved_amount = Column(Float, default=0.0, nullable=False)
    target_bookings = Column(Integer, default=5, nullable=False)
    achieved_bookings = Column(Integer, default=0, nullable=False)

    user = relationship("User", back_populates="sales_targets")
