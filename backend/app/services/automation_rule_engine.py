import json
from datetime import datetime, timezone, timedelta
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session

from app.models.automation import AutomationRule, AutomationEventTrigger
from app.models.lead import Lead, LeadPriority
from app.models.followup import Followup, FollowupType, FollowupStatus
from app.models.notification import Notification
from app.models.activity_log import ActivityLog
from app.models.user import User

class AutomationRuleEngine:

    @classmethod
    def evaluate_rules(
        cls,
        db: Session,
        organization_id: int,
        trigger: str,
        context: Dict[str, Any]
    ) -> List[Dict[str, Any]]:
        """
        Evaluates dynamic automation rules created by Admins in the Visual Rule Builder.
        Executes configured actions (reassignment, priority setting, follow-up scheduling, alerts).
        """
        now = datetime.now(timezone.utc)
        rules = db.query(AutomationRule).filter(
            AutomationRule.organization_id == organization_id,
            AutomationRule.event_trigger == trigger,
            AutomationRule.is_active == True
        ).all()

        executed_rules = []

        for rule in rules:
            try:
                conditions = json.loads(rule.conditions_json or "[]")
                actions = json.loads(rule.actions_json or "[]")

                # Evaluate all conditions
                all_match = True
                for cond in conditions:
                    field = cond.get("field")
                    op = cond.get("op", "==")
                    expected_val = cond.get("value")

                    actual_val = context.get(field)

                    if op == "==" and str(actual_val).lower() != str(expected_val).lower():
                        all_match = False; break
                    elif op == "!=" and str(actual_val).lower() == str(expected_val).lower():
                        all_match = False; break
                    elif op == ">=" and float(actual_val or 0) < float(expected_val or 0):
                        all_match = False; break
                    elif op == "<=" and float(actual_val or 0) > float(expected_val or 0):
                        all_match = False; break
                    elif op == "in" and actual_val not in expected_val:
                        all_match = False; break

                if not all_match:
                    continue

                # Execute actions
                lead_id = context.get("lead_id")
                lead = db.query(Lead).filter(Lead.id == lead_id).first() if lead_id else None

                executed_action_names = []
                for act in actions:
                    act_type = act.get("action")
                    
                    # 1. SET_PRIORITY
                    if act_type == "SET_PRIORITY" and lead:
                        new_prio = act.get("value", "High")
                        lead.priority = LeadPriority.URGENT if new_prio == "Urgent" else LeadPriority.HIGH
                        executed_action_names.append(f"Set Priority {new_prio}")

                    # 2. SET_SLA
                    elif act_type == "SET_SLA" and lead:
                        minutes = int(act.get("minutes", 10))
                        lead.sla_deadline = now + timedelta(minutes=minutes)
                        executed_action_names.append(f"Adjusted SLA to {minutes}m")

                    # 3. REASSIGN_USER
                    elif act_type == "REASSIGN_USER" and lead:
                        target_user_id = act.get("user_id")
                        if target_user_id:
                            lead.assigned_to_id = target_user_id
                            lead.assignment_rule = f"Rule: {rule.name}"
                            executed_action_names.append(f"Reassigned to User #{target_user_id}")

                    # 4. CREATE_FOLLOWUP
                    elif act_type == "CREATE_FOLLOWUP" and lead:
                        db.add(Followup(
                            organization_id=organization_id,
                            lead_id=lead.id,
                            assigned_to_id=lead.assigned_to_id or 1,
                            type=FollowupType.CALL,
                            status=FollowupStatus.PENDING,
                            title=act.get("title", f"Automated Task: {lead.name}"),
                            scheduled_at=now + timedelta(hours=int(act.get("after_hours", 2))),
                            notes=act.get("notes", f"Automated Task triggered by rule '{rule.name}'")
                        ))
                        executed_action_names.append("Created Follow-up Task")

                    # 5. SEND_NOTIFICATION
                    elif act_type == "SEND_NOTIFICATION":
                        target_role = act.get("role", "ADMIN")
                        users = db.query(User).filter(
                            User.organization_id == organization_id,
                            User.role == target_role,
                            User.is_active == True,
                            User.is_deleted == False
                        ).all()
                        for u in users:
                            db.add(Notification(
                                organization_id=organization_id,
                                user_id=u.id,
                                title=f"⚡ Automation Rule Alert: {rule.name}",
                                message=act.get("message", f"Rule '{rule.name}' fired for lead #{lead_id}."),
                                type="info",
                                severity="HIGH",
                                action_url=f"/leads?lead_id={lead_id}" if lead_id else "/leads",
                                entity_type="AUTOMATION_RULE",
                                entity_id=rule.id
                            ))
                        executed_action_names.append(f"Notified {target_role}")

                # Update rule metrics
                rule.execution_count = (rule.execution_count or 0) + 1
                rule.last_executed_at = now

                db.add(ActivityLog(
                    user_id=1,
                    user_name="Automation Engine",
                    action="EXECUTE_RULE",
                    module="Automation",
                    details=f"Rule '{rule.name}' triggered on {trigger}: {', '.join(executed_action_names)}"
                ))

                executed_rules.append({
                    "rule_id": rule.id,
                    "rule_name": rule.name,
                    "actions_executed": executed_action_names
                })

            except Exception as e:
                print(f"[AUTOMATION RULE ERROR] Failed executing rule #{rule.id}: {e}")

        if executed_rules:
            db.commit()

        return executed_rules
