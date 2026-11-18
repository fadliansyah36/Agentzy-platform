from functools import lru_cache

from pydantic import field_validator, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")
    app_env: str = "development"
    api_v1_prefix: str = "/api/v1"
    supabase_url: str
    supabase_jwt_audience: str = "authenticated"
    supabase_jwt_secret: str | None = None
    supabase_service_role_key: str | None = None
    auth_provider_webhook_secret: str | None = None
    platform_bootstrap_token: str | None = None
    app_base_url: str = "http://localhost:3000"
    database_url: str
    cors_origins: list[str] = ["http://localhost:3000"]
    log_level: str = "INFO"

    @model_validator(mode="after")
    def validate_production_security(self):
        if self.app_env.lower() in {"production", "prod"}:
            required = {
                "SUPABASE_SERVICE_ROLE_KEY": self.supabase_service_role_key,
                "AUTH_PROVIDER_WEBHOOK_SECRET": self.auth_provider_webhook_secret,
                "PLATFORM_BOOTSTRAP_TOKEN": self.platform_bootstrap_token,
            }
            missing = [name for name, value in required.items() if not value]
            if missing:
                raise ValueError(
                    "Missing required production secrets: " + ", ".join(missing)
                )
            if len(self.auth_provider_webhook_secret or "") < 32:
                raise ValueError("AUTH_PROVIDER_WEBHOOK_SECRET must be at least 32 characters.")
            if len(self.platform_bootstrap_token or "") < 32:
                raise ValueError("PLATFORM_BOOTSTRAP_TOKEN must be at least 32 characters.")
        return self

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
