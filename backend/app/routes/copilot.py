from typing import Dict, Any, List, Optional
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User, UserRole
from app.models.support_ticket import SupportTicket, SupportMessage, TicketStatus, MessageSenderRole
from app.middleware.auth_middleware import get_current_user
from app.services.copilot_service import CopilotService

router = APIRouter(prefix="/copilot", tags=["AI CRM Copilot"])


# ─── Request / Response Schemas ──────────────────────────────────────────────

class ChatMessage(BaseModel):
    role: str   # "user" or "assistant"
    content: str

class CopilotQueryRequest(BaseModel):
    query: str
    history: Optional[List[ChatMessage]] = []

class CopilotQueryResponse(BaseModel):
    query: str
    answer: str
    suggested_actions: List[Dict[str, str]]
    data_points: Dict[str, Any]

class SupportTicketRequest(BaseModel):
    subject: Optional[str] = "I need help from a human agent"

class SupportMessageRequest(BaseModel):
    message: str

class AssignAgentRequest(BaseModel):
    agent_id: int


# ─── AI Copilot Query ─────────────────────────────────────────────────────────

@router.post("/query", response_model=CopilotQueryResponse)
def ask_crm_copilot(
    payload: CopilotQueryRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Real OpenAI GPT-4o-mini powered CRM Copilot with live data context injection.
    Supports multi-turn conversation history.
    """
    system_prompt = CopilotService.get_system_prompt(db, current_user)

    history_dicts = [{"role": m.role, "content": m.content} for m in (payload.history or [])]

    result = CopilotService.ask_openai(
        system_prompt=system_prompt,
        history=history_dicts,
        user_query=payload.query
    )

    return CopilotQueryResponse(
        query=payload.query,
        answer=result["answer"],
        suggested_actions=result.get("suggested_actions", []),
        data_points={}
    )


# ─── Support Ticket: Executive Opens Request ──────────────────────────────────

@router.post("/support/request")
def request_human_support(
    payload: SupportTicketRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Executive opens a human support ticket."""
    # Check if user already has an open/assigned ticket
    existing = db.query(SupportTicket).filter(
        SupportTicket.requester_id == current_user.id,
        SupportTicket.status.in_([TicketStatus.OPEN, TicketStatus.ASSIGNED])
    ).first()
    if existing:
        return {
            "ticket_id": existing.id,
            "status": existing.status,
            "message": "You already have an active support ticket.",
            "assigned_agent": existing.assigned_agent.name if existing.assigned_agent else None
        }

    ticket = SupportTicket(
        organization_id=current_user.organization_id,
        requester_id=current_user.id,
        subject=payload.subject,
        status=TicketStatus.OPEN
    )
    db.add(ticket)
    db.flush()

    # Auto-add a system message to the thread
    opening_msg = SupportMessage(
        ticket_id=ticket.id,
        sender_id=None,
        sender_role=MessageSenderRole.AI,
        message=(
            f"🎫 Support ticket #{ticket.id} created.\n\n"
            f"**Subject**: {payload.subject}\n\n"
            "A support agent will be assigned shortly. You'll be notified here when they connect."
        )
    )
    db.add(opening_msg)
    db.commit()
    db.refresh(ticket)

    return {
        "ticket_id": ticket.id,
        "status": ticket.status,
        "message": "Support ticket created. An agent will be assigned shortly.",
        "assigned_agent": None
    }


# ─── Support Tickets: Admin/Agent Views ───────────────────────────────────────

@router.get("/support/tickets")
def list_support_tickets(
    status_filter: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    SuperAdmin/Admin/Manager sees all support tickets.
    Sales Executive sees only their own tickets.
    """
    query = db.query(SupportTicket)

    if current_user.role in [UserRole.SALES_EXECUTIVE, UserRole.BROKER]:
        # Executive: see only their own tickets
        query = query.filter(SupportTicket.requester_id == current_user.id)
    elif current_user.role not in [UserRole.SUPERADMIN]:
        # Admin/Manager: see tickets from their org
        if current_user.organization_id:
            query = query.filter(SupportTicket.organization_id == current_user.organization_id)

    if status_filter:
        try:
            ts = TicketStatus(status_filter.upper())
            query = query.filter(SupportTicket.status == ts)
        except ValueError:
            pass

    tickets = query.order_by(SupportTicket.created_at.desc()).all()

    result = []
    for t in tickets:
        result.append({
            "id": t.id,
            "subject": t.subject,
            "status": t.status,
            "requester_name": t.requester.name if t.requester else "Unknown",
            "requester_email": t.requester.email if t.requester else "",
            "requester_role": t.requester.role if t.requester else "",
            "organization_id": t.organization_id,
            "assigned_agent_name": t.assigned_agent.name if t.assigned_agent else None,
            "assigned_agent_id": t.assigned_agent_id,
            "created_at": t.created_at.isoformat() if t.created_at else None,
            "resolved_at": t.resolved_at.isoformat() if t.resolved_at else None,
            "message_count": len(t.messages)
        })

    return {"tickets": result, "total": len(result)}


# ─── Assign Agent to Ticket ───────────────────────────────────────────────────

@router.post("/support/tickets/{ticket_id}/assign")
def assign_support_agent(
    ticket_id: int,
    payload: AssignAgentRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """SuperAdmin assigns a support agent to an open ticket."""
    if current_user.role not in [UserRole.SUPERADMIN, UserRole.ADMIN]:
        raise HTTPException(status_code=403, detail="Only SuperAdmin or Admin can assign agents.")

    ticket = db.query(SupportTicket).filter(SupportTicket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found.")

    agent = db.query(User).filter(User.id == payload.agent_id).first()
    if not agent:
        raise HTTPException(status_code=404, detail="Agent user not found.")

    if agent.role not in [UserRole.SUPERADMIN, UserRole.ADMIN, UserRole.MANAGER]:
        raise HTTPException(status_code=400, detail="Assigned user must be Admin or Manager role.")

    ticket.assigned_agent_id = payload.agent_id
    ticket.status = TicketStatus.ASSIGNED

    # Notify in thread
    assign_msg = SupportMessage(
        ticket_id=ticket.id,
        sender_id=None,
        sender_role=MessageSenderRole.AI,
        message=f"✅ **{agent.name}** has been assigned to your support request. They will respond shortly."
    )
    db.add(assign_msg)
    db.commit()

    return {"message": f"Ticket #{ticket_id} assigned to {agent.name}.", "agent_name": agent.name}


# ─── Send Message in Ticket Thread ───────────────────────────────────────────

@router.post("/support/tickets/{ticket_id}/message")
def send_ticket_message(
    ticket_id: int,
    payload: SupportMessageRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Send a message in the support ticket thread."""
    ticket = db.query(SupportTicket).filter(SupportTicket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found.")

    # Authorization: only requester, assigned agent, or superadmin can message
    is_requester = ticket.requester_id == current_user.id
    is_agent = ticket.assigned_agent_id == current_user.id
    is_superadmin = current_user.role == UserRole.SUPERADMIN

    if not (is_requester or is_agent or is_superadmin):
        raise HTTPException(status_code=403, detail="Not authorized to message this ticket.")

    if ticket.status in [TicketStatus.RESOLVED, TicketStatus.CLOSED]:
        raise HTTPException(status_code=400, detail="Cannot send messages to a resolved ticket.")

    # Determine sender role
    if is_requester:
        sender_role = MessageSenderRole.EXECUTIVE
    else:
        sender_role = MessageSenderRole.AGENT

    msg = SupportMessage(
        ticket_id=ticket_id,
        sender_id=current_user.id,
        sender_role=sender_role,
        message=payload.message.strip()
    )
    db.add(msg)
    db.commit()
    db.refresh(msg)

    return {
        "id": msg.id,
        "message": msg.message,
        "sender_role": msg.sender_role,
        "sender_name": current_user.name,
        "created_at": msg.created_at.isoformat() if msg.created_at else None
    }


# ─── Get Ticket Messages ──────────────────────────────────────────────────────

@router.get("/support/tickets/{ticket_id}/messages")
def get_ticket_messages(
    ticket_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all messages in a support ticket thread."""
    ticket = db.query(SupportTicket).filter(SupportTicket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found.")

    is_requester = ticket.requester_id == current_user.id
    is_agent = ticket.assigned_agent_id == current_user.id
    is_superadmin = current_user.role == UserRole.SUPERADMIN
    is_admin = current_user.role in [UserRole.ADMIN, UserRole.MANAGER]

    if not (is_requester or is_agent or is_superadmin or is_admin):
        raise HTTPException(status_code=403, detail="Not authorized to view this ticket.")

    messages = []
    for m in ticket.messages:
        messages.append({
            "id": m.id,
            "sender_role": m.sender_role,
            "sender_name": m.sender.name if m.sender else "REALVION AI",
            "message": m.message,
            "created_at": m.created_at.isoformat() if m.created_at else None
        })

    return {
        "ticket_id": ticket_id,
        "status": ticket.status,
        "subject": ticket.subject,
        "assigned_agent": ticket.assigned_agent.name if ticket.assigned_agent else None,
        "messages": messages
    }


# ─── Get My Ticket Status ─────────────────────────────────────────────────────

@router.get("/support/my-ticket")
def get_my_active_ticket(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Executive polls this to check if they have an active ticket and get latest messages."""
    ticket = db.query(SupportTicket).filter(
        SupportTicket.requester_id == current_user.id,
        SupportTicket.status.in_([TicketStatus.OPEN, TicketStatus.ASSIGNED])
    ).order_by(SupportTicket.created_at.desc()).first()

    if not ticket:
        return {"ticket": None}

    messages = []
    for m in ticket.messages:
        messages.append({
            "id": m.id,
            "sender_role": m.sender_role,
            "sender_name": m.sender.name if m.sender else "REALVION AI",
            "message": m.message,
            "created_at": m.created_at.isoformat() if m.created_at else None
        })

    return {
        "ticket": {
            "id": ticket.id,
            "status": ticket.status,
            "subject": ticket.subject,
            "assigned_agent": ticket.assigned_agent.name if ticket.assigned_agent else None,
            "assigned_agent_id": ticket.assigned_agent_id,
            "created_at": ticket.created_at.isoformat() if ticket.created_at else None,
            "messages": messages
        }
    }


# ─── Resolve Ticket ───────────────────────────────────────────────────────────

@router.post("/support/tickets/{ticket_id}/resolve")
def resolve_ticket(
    ticket_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Agent or Admin marks a ticket as resolved."""
    ticket = db.query(SupportTicket).filter(SupportTicket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found.")

    is_agent = ticket.assigned_agent_id == current_user.id
    is_superadmin = current_user.role == UserRole.SUPERADMIN
    is_admin = current_user.role in [UserRole.ADMIN]
    is_requester = ticket.requester_id == current_user.id

    if not (is_agent or is_superadmin or is_admin or is_requester):
        raise HTTPException(status_code=403, detail="Not authorized to resolve this ticket.")

    ticket.status = TicketStatus.RESOLVED
    ticket.resolved_at = datetime.now(timezone.utc).replace(tzinfo=None)

    close_msg = SupportMessage(
        ticket_id=ticket.id,
        sender_id=current_user.id,
        sender_role=MessageSenderRole.AGENT,
        message="✅ This support session has been marked as resolved. Feel free to open a new ticket if you need further assistance."
    )
    db.add(close_msg)
    db.commit()

    return {"message": "Ticket resolved.", "ticket_id": ticket_id}


# ─── List Available Agents (for SuperAdmin assign dropdown) ───────────────────

@router.get("/support/agents")
def list_available_agents(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Returns list of Admin/Manager users who can be assigned as support agents."""
    if current_user.role not in [UserRole.SUPERADMIN, UserRole.ADMIN]:
        raise HTTPException(status_code=403, detail="Admin access required.")

    agents_query = db.query(User).filter(
        User.is_active == True,
        User.role.in_([UserRole.SUPERADMIN, UserRole.ADMIN, UserRole.MANAGER])
    )

    # For non-superadmin, scope to same org
    if current_user.role != UserRole.SUPERADMIN and current_user.organization_id:
        agents_query = agents_query.filter(User.organization_id == current_user.organization_id)

    agents = agents_query.all()
    return {
        "agents": [
            {"id": a.id, "name": a.name, "email": a.email, "role": a.role}
            for a in agents
        ]
    }
