from functools import lru_cache

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
        env_ignore_empty=True,
    )

    # Application
    app_name: str = "Việt Phục Remix"
    debug: bool = True

    # Database — SQLite for PoC, swap to PostgreSQL by changing this URL
    database_url: str = Field(default="sqlite+aiosqlite:///./data/vietphuc.db")

    # Storage
    storage_path: str = Field(default="./data")

    # CORS
    cors_origins: list[str] = Field(
        default=["http://localhost:3000", "http://localhost:5173"]
    )


@lru_cache
def get_settings() -> Settings:
    return Settings()
