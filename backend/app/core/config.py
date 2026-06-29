import os

from pydantic import field_validator, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    PROJECT_NAME: str = "The Study Flow"
    API_V1_STR: str = "/api/v1"

    # Supabase Configuration
    SUPABASE_URL: str = ""
    SUPABASE_ANON_KEY: str = ""
    SUPABASE_SERVICE_ROLE_KEY: str = ""
    SUPABASE_JWT_SECRET: str = ""

    # Gemini Configuration
    GEMINI_API_KEY: str = ""
    PRIMARY_MODEL: str = "gemini-2.5-pro"
    SECONDARY_MODEL: str = "gemini-2.5-flash"

    # URLs
    BACKEND_URL: str = ""
    FRONTEND_URL: str = ""

    # Security Configuration
    CORS_ORIGINS: list[str] = [
        "http://localhost:3000",
        "https://thestudyflow.vercel.app",
    ]
    ALLOWED_HOSTS: list[str] = [
        "localhost",
        "127.0.0.1",
        "testserver",
    ]

    # Environment
    ENV: str = "development"
    TESTING: bool = False

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v: str | list[str]) -> list[str]:
        if isinstance(v, str):
            v_str = v.strip()
            if v_str.startswith("[") and v_str.endswith("]"):
                import json
                return json.loads(v_str)
            return [i.strip() for i in v_str.split(",") if i.strip()]
        return v

    @field_validator("ALLOWED_HOSTS", mode="before")
    @classmethod
    def assemble_allowed_hosts(cls, v: str | list[str]) -> list[str]:
        if isinstance(v, str):
            v_str = v.strip()
            if v_str.startswith("[") and v_str.endswith("]"):
                import json
                return json.loads(v_str)
            return [i.strip() for i in v_str.split(",") if i.strip()]
        return v

    @model_validator(mode="after")
    def validate_production_envs(self) -> "Settings":
        if self.ENV == "production" and not self.TESTING:
            required = [
                "SUPABASE_URL",
                "SUPABASE_ANON_KEY",
                "SUPABASE_SERVICE_ROLE_KEY",
                "SUPABASE_JWT_SECRET",
                "GEMINI_API_KEY",
                "BACKEND_URL",
                "FRONTEND_URL",
            ]
            missing = [var for var in required if not getattr(self, var)]
            if missing:
                raise ValueError(
                    f"Production environment configuration error: Missing required variables: {', '.join(missing)}"
                )
        return self

    # Pydantic Settings configuration to load from .env file
    model_config = SettingsConfigDict(
        env_file=os.path.join(
            os.path.dirname(os.path.dirname(os.path.dirname(__file__))), ".env"
        ),
        env_file_encoding="utf-8",
        extra="ignore",
    )


settings = Settings()

