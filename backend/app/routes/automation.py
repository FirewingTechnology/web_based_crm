import json
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.automation import AutomationRule, AutomationEventTrigger
from app.models.user import User, UserRole
from app.middleware.auth_middleware import get_current_user, RequireRole
from app.services.sla_service import SLAService

router = APIRouter(prefix="/automation", tags=["Automation Center & Rule Builder"])

class AutomationRuleCreate(BaseModel):
    name: str
    description: Optional[str] = None
    event_trigger: str
    conditions_json: str # JSON string of [{field, op, value}]
    actions_json: str # JSON string of [{action, params}]

class AutomationRuleUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    event_trigger: Optional[str] = None
    conditions_json: Optional[str] = None
    actions_json: Optional[str] = None
    is_active: Optional[bool] = None

class AutomationRuleResponse(BaseModel):
    id: int
    organization_id: int
    name: str
    description: Optional[str] = None
    event_trigger: str
    conditions: List[Dict[str, Any]]
    actions: List[Dict[str, Any]]
    is_active: bool
    execution_count: int
    last_executed_at: Optional[str] = None

    class Config:
        from_attributes = True

@router.get("/rules", response_model=List[AutomationRuleResponse])
def list_automation_rules(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Lists all configured sales automation rules for the organization."""
    query = db.query(AutomationRule).filter(
        AutomationRule.organization_id == current_user.organization_id,
        AutomationRule.is_deleted == False
    ).order_by(AutomationRule.id.desc())

    rules = query.all()
    results = []
    for r in rules:
        try:
            conds = json.loads(r.conditions_json or "[]")
        except Exception:
            conds = []
        try:
            acts = json.loads(r.actions_json or "[]")
        except Exception:
            acts = []

        results.append(AutomationRuleResponse(
            id=r.id,
            organization_id=r.organization_id,
            name=r.name,
            description=r.description,
            event_trigger=r.event_trigger,
            conditions=conds,
            actions=acts,
            is_active=r.is_active,
            execution_count=r.execution_count or 0,
            last_executed_at=r.last_executed_at.isoformat() if r.last_executed_at else None
        ))
    return results

@router.post("/rules", response_model=AutomationRuleResponse, status_code=status.HTTP_201_CREATED)
def create_automation_rule(
    payload: AutomationRuleCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(RequireRole([UserRole.ADMIN, UserRole.MANAGER]))
):
    """Provisions a new dynamic sales automation rule via Visual Rule Builder."""
    # Validate JSON formats
    try:
        conds = json.loads(payload.conditions_json)
        acts = json.loads(payload.actions_json)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid JSON condition/action payload: {e}")

    rule = AutomationRule(
        organization_id=current_user.organization_id or 1,
        name=payload.name,
        description=payload.description,
        event_trigger=payload.event_trigger,
        conditions_json=payload.conditions_json,
        actions_json=payload.actions_json,
        is_active=True
    )
    db.add(rule)
    db.commit()
    db.refresh(rule)

    return AutomationRuleResponse(
        id=rule.id,
        organization_id=rule.organization_id,
        name=rule.name,
        description=rule.description,
        event_trigger=rule.event_trigger,
        conditions=conds,
        actions=acts,
        is_active=rule.is_active,
        execution_count=0,
        last_executed_at=None
    )

@router.put("/rules/{rule_id}", response_model=AutomationRuleResponse)
def update_automation_rule(
    rule_id: int,
    payload: AutomationRuleUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(RequireRole([UserRole.ADMIN, UserRole.MANAGER]))
):
    """Updates rule triggers, criteria, actions, or toggles active status."""
    rule = db.query(AutomationRule).filter(
        AutomationRule.id == rule_id,
        AutomationRule.organization_id == current_user.organization_id,
        AutomationRule.is_deleted == False
    ).first()
    if not rule:
        raise HTTPException(status_code=404, detail="Automation rule not found")

    for k, v in payload.model_dump(exclude_unset=True).items():
        setattr(rule, k, v)

    db.commit()
    db.refresh(rule)

    try:
        conds = json.loads(rule.conditions_json or "[]")
    except Exception:
        conds = []
    try:
        acts = json.loads(rule.actions_json or "[]")
    except Exception:
        acts = []

    return AutomationRuleResponse(
        id=rule.id,
        organization_id=rule.organization_id,
        name=rule.name,
        description=rule.description,
        event_trigger=rule.event_trigger,
        conditions=conds,
        actions=acts,
        is_active=rule.is_active,
        execution_count=rule.execution_count or 0,
        last_executed_at=rule.last_executed_at.isoformat() if rule.last_executed_at else None
    )

@router.delete("/rules/{rule_id}")
def delete_automation_rule(
    rule_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(RequireRole([UserRole.ADMIN, UserRole.MANAGER]))
):
    """Deletes an automation rule."""
    rule = db.query(AutomationRule).filter(
        AutomationRule.id == rule_id,
        AutomationRule.organization_id == current_user.organization_id
    ).first()
    if not rule:
        raise HTTPException(status_code=404, detail="Rule not found")

    rule.is_deleted = True
    db.commit()
    return {"message": f"Rule #{rule_id} deleted successfully"}

@router.post("/evaluate-sla")
def trigger_sla_evaluation(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Evaluates response SLAs for the organization and dispatches manager escalations."""
    res = SLAService.evaluate_sla_and_escalate(db, organization_id=current_user.organization_id)
    return res
