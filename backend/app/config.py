import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "BrokerOS Lite"
    API_V1_STR: str = "/api/v1"
    SECRET_KEY: str = "brokeros_super_secret_jwt_key_2026_production_ready"
    REFRESH_SECRET_KEY: str = "brokeros_super_secret_refresh_jwt_key_2026"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 # 24 hours
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7 # 7 days
    
    DATABASE_URL: str = "sqlite:///./brokeros.db"
    
    class Config:
        case_sensitive = True

settings = Settings()
