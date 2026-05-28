from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List
from pydantic import AnyHttpUrl

class Settings(BaseSettings):
    PROJECT_NAME: str = "SignalDesk AI"
    VERSION: str = "1.0.0"
    ENVIRONMENT: str = "development"
    
    # CORS
    CORS_ORIGINS: List[str] = ["http://localhost:3000"]
    
    # Database
    DATABASE_URL: str
    
    # JWT Security
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    
    # OpenAI
    OPENAI_API_KEY: str

    model_config = SettingsConfigDict(env_file=".env", case_sensitive=True)

settings = Settings()
