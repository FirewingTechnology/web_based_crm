import enum
from datetime import datetime
from sqlalchemy import Column, Integer, String, Enum, ForeignKey, Text, DateTime
from sqlalchemy.orm import relationship
from app.database import BaseModel


class TicketStatus(str, enum.Enum):
    OPEN = "OPEN"
    ASSIGNED = "ASSIGNED"
    RESOLVED = "RESOLVED"
    CLOSED = "CLOSED"


class MessageSenderRole(str, enum.Enum):
    AI = "AI"
    EXECUTIVE = "EXECUTIVE"
    AGENT = "AGENT"


class SupportTicket(BaseModel):
    __tablename__ = "support_tickets"

    id = Column(Integer, primary_key=True, index=True)
    organization_id = Column(Integer, ForeignKey("organizations.id"), nullable=True)
    requester_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    assigned_agent_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    status = Column(Enum(TicketStatus), default=TicketStatus.OPEN, nullable=False)
    subject = Column(String(255), nullable=False, default="Support Request")
    resolved_at = Column(DateTime, nullable=True)

    # Relationships
    requester = relationship("User", foreign_keys=[requester_id])
    assigned_agent = relationship("User", foreign_keys=[assigned_agent_id])
    messages = relationship("SupportMessage", back_populates="ticket", order_by="SupportMessage.created_at")


class SupportMessage(BaseModel):
    __tablename__ = "support_messages"

    id = Column(Integer, primary_key=True, index=True)
    ticket_id = Column(Integer, ForeignKey("support_tickets.id"), nullable=False)
    sender_id = Column(Integer, ForeignKey("users.id"), nullable=True)  # nullable for AI messages
    sender_role = Column(Enum(MessageSenderRole), nullable=False, default=MessageSenderRole.AI)
    message = Column(Text, nullable=False)

    # Relationships
    ticket = relationship("SupportTicket", back_populates="messages")
    sender = relationship("User", foreign_keys=[sender_id])
