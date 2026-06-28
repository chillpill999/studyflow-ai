import os

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    PROJECT_NAME: str = "The Study Flow"
    API_V1_STR: str = "/api/v1"

    # Supabase Configuration
    SUPABASE_URL: str = ""
    SUPABASE_ANON_KEY: str = ""
    SUPABASE_JWT_SECRET: str = ""

    # Gemini Configuration
    GEMINI_API_KEY: str = ""
    PRIMARY_MODEL: str = "gemini-2.5-pro"
    SECONDARY_MODEL: str = "gemini-2.5-flash"

    # Security Configuration
    CORS_ORIGINS: list[str] = [
        "http://localhost:3000",
        "https://thestudyflow.vercel.app",
    ]

    # Environment
    ENV: str = "development"
    TESTING: bool = False

    # Pydantic Settings configuration to load from .env file
    model_config = SettingsConfigDict(
        env_file=os.path.join(
            os.path.dirname(os.path.dirname(os.path.dirname(__file__))), ".env"
        ),
        env_file_encoding="utf-8",
        extra="ignore",
    )


settings = Settings()
