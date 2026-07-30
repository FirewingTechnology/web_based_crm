from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.activity_log import ActivityLog
from app.models.user import User, UserRole
from app.schemas.report import ActivityLogResponse
from app.middleware.auth_middleware import RequireRole

router = APIRouter(prefix="/activity-logs", tags=["Activity Logs"])

@router.get("", response_model=list[ActivityLogResponse])
def get_activity_logs(
    module: str | None = None,
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user: User = Depends(RequireRole([UserRole.ADMIN, UserRole.MANAGER]))
):
    query = db.query(ActivityLog).filter(ActivityLog.is_deleted == False)
    if module:
        query = query.filter(ActivityLog.module == module)

    logs = query.order_by(ActivityLog.created_at.desc()).limit(limit).all()
    return logs
