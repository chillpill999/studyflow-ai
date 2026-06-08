import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "StudyFlow AI"
    API_V1_STR: str = "/api"
    
    # Primary AI (Free — get key at console.groq.com, no credit card needed)
    GROQ_API_KEY: str = ""
    
    # Secondary AI fallback (optional)
    GEMINI_API_KEY: str = ""
    
    DB_FILE: str = "studyflow.db"
    
    # We allow all origins for local development
    CORS_ORIGINS: list[str] = ["*"]

    class Config:
        env_file = ".env"
        extra = "ignore"

settings = Settings()
