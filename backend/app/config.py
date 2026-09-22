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

    # AI Service (OpenAI-compatible API: OpenAI, Groq, Grok, OpenRouter, v.v.)
    ai_provider: str = Field(default="openai")  # openai | groq | grok | openrouter | custom
    ai_base_url: str = Field(default="https://api.openai.com/v1")
    ai_api_key: str | None = Field(default=None)
    groq_api_key: str | None = Field(default=None)
    grok_api_key: str | None = Field(default=None)
    openrouter_api_key: str | None = Field(default=None)
    ai_model: str = Field(default="gpt-4o-mini")
    ai_timeout: int = Field(default=60)
    ai_max_tokens: int = Field(default=800)

    @property
    def effective_ai_base_url(self) -> str:
        if self.ai_provider.lower() in ("groq", "grok") and self.ai_base_url == "https://api.openai.com/v1":
            return "https://api.groq.com/openai/v1"
        if self.ai_provider.lower() == "openrouter" and self.ai_base_url == "https://api.openai.com/v1":
            return "https://openrouter.ai/api/v1"
        return self.ai_base_url

    @property
    def effective_ai_model(self) -> str:
        if self.ai_provider.lower() in ("groq", "grok") and self.ai_model in ("gpt-4o-mini", ""):
            return "qwen/qwen3.8-27b"
        if self.ai_provider.lower() == "openrouter" and self.ai_model in ("gpt-4o-mini", ""):
            return "qwen/qwen-2.5-7b-instruct"
        return self.ai_model

    @property
    def effective_ai_api_key(self) -> str | None:
        if self.ai_provider.lower() in ("groq", "grok"):
            return self.groq_api_key or self.grok_api_key or self.ai_api_key
        if self.ai_provider.lower() == "openrouter":
            return self.openrouter_api_key or self.ai_api_key
        return self.ai_api_key or self.groq_api_key or self.grok_api_key or self.openrouter_api_key

    # Storage
    storage_path: str = Field(default="./data")

    # CORS
    cors_origins: list[str] = Field(
        default=["http://localhost:3000", "http://localhost:5173"]
    )


@lru_cache
def get_settings() -> Settings:
    return Settings()
