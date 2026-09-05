import logging
from sqlalchemy import text, inspect

logger = logging.getLogger("realvion.migrations")

def run_auto_migrations(engine):
    """
    Ensures newly introduced columns in SQLAlchemy models exist in SQLite or Postgres
    without requiring destructive schema recreations.
    """
    with engine.connect() as conn:
        inspector = inspect(engine)
        tables = inspector.get_table_names()
        
        # 1. Leads table health & leakage engine columns
        if "leads" in tables:
            lead_columns = {col["name"] for col in inspector.get_columns("leads")}
            
            new_lead_cols = [
                ("health_score", "INTEGER DEFAULT 100"),
                ("health_category", "VARCHAR(50) DEFAULT 'Healthy'"),
                ("health_reasons_json", "TEXT"),
                ("recommended_action", "VARCHAR(255)"),
                ("last_activity_at", "DATETIME"),
                ("stage_entered_at", "DATETIME"),
                ("postponement_count", "INTEGER DEFAULT 0"),
                ("lost_reason", "VARCHAR(255)"),
            ]
            
            for col_name, col_type in new_lead_cols:
                if col_name not in lead_columns:
                    try:
                        conn.execute(text(f"ALTER TABLE leads ADD COLUMN {col_name} {col_type};"))
                        conn.commit()
                        logger.info(f"Successfully migrated 'leads' table: added column '{col_name}'")
                    except Exception as e:
                        logger.warning(f"Column migration '{col_name}' on 'leads' skipped or error: {e}")

        # 2. Followups table postponement / reschedule tracking
        if "followups" in tables:
            followup_columns = {col["name"] for col in inspector.get_columns("followups")}
            new_followup_cols = [
                ("rescheduled_count", "INTEGER DEFAULT 0"),
            ]
            for col_name, col_type in new_followup_cols:
                if col_name not in followup_columns:
                    try:
                        conn.execute(text(f"ALTER TABLE followups ADD COLUMN {col_name} {col_type};"))
                        conn.commit()
                        logger.info(f"Successfully migrated 'followups' table: added column '{col_name}'")
                    except Exception as e:
                        logger.warning(f"Column migration '{col_name}' on 'followups' skipped or error: {e}")
