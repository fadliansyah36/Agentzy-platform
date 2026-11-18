from functools import lru_cache

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")
    app_env: str = "development"
    api_v1_prefix: str = "/api/v1"
    supabase_url: str
    supabase_jwt_audience: str = "authenticated"
    supabase_jwt_secret: str | None = None
    supabase_service_role_key: str | None = None
    platform_bootstrap_token: str | None = None
    app_base_url: str = "http://localhost:3000"
    database_url: str
    cors_origins: list[str] = ["http://localhost:3000"]
    log_level: str = "INFO"

    @field_validator("database_url")
    @classmethod
    def normalize_database_url(cls, value: str) -> str:
        return (
            value.replace("postgresql://", "postgresql+asyncpg://", 1)
            if value.startswith("postgresql://")
            else value
        )


@lru_cache
def get_settings() -> Settings:
    return Settings()
