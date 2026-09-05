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

        # 3. WhatsApp messages table verification
        if "whatsapp_messages" in tables:
            wa_columns = {col["name"] for col in inspector.get_columns("whatsapp_messages")}
            new_wa_cols = [
                ("metadata_json", "TEXT"),
                ("delivered_at", "DATETIME"),
                ("read_at", "DATETIME"),
                ("replied_at", "DATETIME"),
            ]
            for col_name, col_type in new_wa_cols:
                if col_name not in wa_columns:
                    try:
                        conn.execute(text(f"ALTER TABLE whatsapp_messages ADD COLUMN {col_name} {col_type};"))
                        conn.commit()
                        logger.info(f"Successfully migrated 'whatsapp_messages' table: added column '{col_name}'")
                    except Exception as e:
                        logger.warning(f"Column migration '{col_name}' on 'whatsapp_messages' skipped or error: {e}")

        # 4. Broker profiles CP tiers & hierarchy
        if "broker_profiles" in tables:
            broker_columns = {col["name"] for col in inspector.get_columns("broker_profiles")}
            new_broker_cols = [
                ("tier", "VARCHAR(50) DEFAULT 'Silver'"),
                ("parent_broker_id", "INTEGER"),
                ("rera_number", "VARCHAR(100)"),
            ]
            for col_name, col_type in new_broker_cols:
                if col_name not in broker_columns:
                    try:
                        conn.execute(text(f"ALTER TABLE broker_profiles ADD COLUMN {col_name} {col_type};"))
                        conn.commit()
                        logger.info(f"Successfully migrated 'broker_profiles' table: added column '{col_name}'")
                    except Exception as e:
                        logger.warning(f"Column migration '{col_name}' on 'broker_profiles' skipped or error: {e}")

        # 5. Commissions lifecycle, aging & GST/TDS ledger
        if "commissions" in tables:
            comm_columns = {col["name"] for col in inspector.get_columns("commissions")}
            new_comm_cols = [
                ("stage", "VARCHAR(50) DEFAULT 'EXPECTED'"),
                ("invoice_number", "VARCHAR(100)"),
                ("invoice_date", "DATETIME"),
                ("due_date", "DATETIME"),
                ("paid_date", "DATETIME"),
                ("payment_reference", "VARCHAR(100)"),
                ("gst_rate", "FLOAT DEFAULT 18.0"),
                ("gst_amount", "FLOAT DEFAULT 0.0"),
                ("tds_rate", "FLOAT DEFAULT 5.0"),
                ("tds_amount", "FLOAT DEFAULT 0.0"),
                ("net_receivable", "FLOAT"),
                ("aging_bucket", "VARCHAR(50) DEFAULT '0-30 Days'"),
                ("days_overdue", "INTEGER DEFAULT 0"),
            ]
            for col_name, col_type in new_comm_cols:
                if col_name not in comm_columns:
                    try:
                        conn.execute(text(f"ALTER TABLE commissions ADD COLUMN {col_name} {col_type};"))
                        conn.commit()
                        logger.info(f"Successfully migrated 'commissions' table: added column '{col_name}'")
                    except Exception as e:
                        logger.warning(f"Column migration '{col_name}' on 'commissions' skipped or error: {e}")

            # Normalize any existing rows in commissions table
            try:
                conn.execute(text("UPDATE commissions SET stage = UPPER(stage) WHERE stage IS NOT NULL;"))
                conn.execute(text("UPDATE commissions SET stage = 'EXPECTED' WHERE stage IS NULL;"))
                conn.commit()
            except Exception as e:
                logger.warning(f"Failed to normalize commissions.stage column: {e}")


