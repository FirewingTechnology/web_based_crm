from datetime import datetime, timezone
from sqlalchemy import create_engine, Column, DateTime, Boolean
from sqlalchemy.orm import declarative_base, sessionmaker
from app.config import settings

engine = create_engine(
    settings.DATABASE_URL,
    connect_args={"check_same_thread": False} # SQLite requirement
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

class BaseModel(Base):
    __abstract__ = True
    
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)
    is_deleted = Column(Boolean, default=False, nullable=False, index=True)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
