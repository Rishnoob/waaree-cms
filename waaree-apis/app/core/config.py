"""App settings, read from environment variables / `.env`. The only place config is read."""

from functools import lru_cache
from typing import Literal

from pydantic import SecretStr
from pydantic_settings import BaseSettings, SettingsConfigDict
from sqlalchemy import URL


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    app_name: str = "Waaree CMS API"
    app_version: str = "0.1.0"
    environment: Literal["local", "staging", "production"] = "local"

    # Comma-separated list of allowed browser origins. Never "*".
    cors_origins: str = "http://localhost:3000"

    db_server: str
    db_name: str = "Waaree"
    db_driver: str = "ODBC Driver 18 for SQL Server"
    db_trust_server_certificate: bool = True
    db_app_user: str
    db_app_password: SecretStr
    db_migrator_user: str
    db_migrator_password: SecretStr

    # Auth
    auth_provider: Literal["local"] = "local"  # later: "entra" (Waaree's Microsoft login)
    jwt_secret: SecretStr
    access_token_minutes: int = 15
    refresh_token_days: int = 7
    max_failed_logins: int = 5
    lockout_minutes: int = 15
    # Cross-site deployments (web and API on different domains) need "none" + secure.
    cookie_samesite: Literal["lax", "strict", "none"] = "lax"

    # Media library storage. "local" keeps files on this server (dev / until the S3 bucket exists);
    # "s3" will use media_s3_bucket. Files are served at {public_api_url}/media/files/<name>.
    media_storage: Literal["local", "s3"] = "local"
    media_dir: str = "uploads"
    media_s3_bucket: str | None = None
    media_max_mb: int = 25
    public_api_url: str = "http://localhost:8002"

    # Local only: password for `python -m app.cli seed-dev` test accounts
    dev_seed_password: SecretStr | None = None

    @property
    def cookie_secure(self) -> bool:
        return self.environment != "local"

    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]

    def db_url(self, *, migrator: bool = False) -> URL:
        """Connection URL for the app login, or the migrator login (Alembic only)."""
        user, password = (
            (self.db_migrator_user, self.db_migrator_password)
            if migrator
            else (self.db_app_user, self.db_app_password)
        )
        return URL.create(
            "mssql+pyodbc",
            username=user,
            password=password.get_secret_value(),
            host=self.db_server,
            database=self.db_name,
            query={
                "driver": self.db_driver,
                "Encrypt": "yes",
                "TrustServerCertificate": "yes" if self.db_trust_server_certificate else "no",
            },
        )


@lru_cache
def get_settings() -> Settings:
    return Settings()  # type: ignore[call-arg]  # values come from the environment
