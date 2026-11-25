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
    turnstile_secret_key: str | None = None
    clamav_host: str | None = None
    clamav_port: int = 3310
    clamav_timeout_seconds: float = 30.0
    workforce_document_retention_days: int = 365
    smtp_host: str | None = None
    smtp_port: int = 587
    smtp_username: str | None = None
    smtp_password: str | None = None
    smtp_from: str | None = None
    smtp_starttls: bool = True
    google_oauth_client_id: str | None = None
    google_oauth_client_secret: str | None = None
    google_oauth_redirect_uri: str | None = None
    oauth_token_encryption_key: str | None = None
    platform_bootstrap_token: str | None = None
    app_base_url: str = "http://localhost:3000"
    database_url: str
    cors_origins: list[str] = ["http://localhost:3000"]
    contract_lifecycle_worker_enabled: bool = True
    contract_lifecycle_poll_seconds: int = 900
    log_level: str = "INFO"

    @model_validator(mode="after")
    def validate_production_security(self):
        if self.app_env.lower() in {"production", "prod"}:
            required = {
                "SUPABASE_SERVICE_ROLE_KEY": self.supabase_service_role_key,
                "AUTH_PROVIDER_WEBHOOK_SECRET": self.auth_provider_webhook_secret,
            }
            missing = [name for name, value in required.items() if not value]
            if missing:
                raise ValueError("Missing required production secrets: " + ", ".join(missing))
            if len(self.auth_provider_webhook_secret or "") < 32:
                raise ValueError("AUTH_PROVIDER_WEBHOOK_SECRET must be at least 32 characters.")
            if self.platform_bootstrap_token and len(self.platform_bootstrap_token) < 32:
                raise ValueError(
                    "PLATFORM_BOOTSTRAP_TOKEN must be at least 32 characters when configured."
                )
        return self

    @property
    def turnstile_required(self) -> bool:
        return self.app_env.lower() in {"production", "prod"}

    @property
    def smtp_configured(self) -> bool:
        return bool(self.smtp_host and self.smtp_from)

    @property
    def attachment_scanner_configured(self) -> bool:
        return bool(self.clamav_host and self.supabase_service_role_key)

    @property
    def google_oauth_configured(self) -> bool:
        return bool(
            self.google_oauth_client_id
            and self.google_oauth_client_secret
            and self.google_oauth_redirect_uri
            and self.oauth_token_encryption_key
        )

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
