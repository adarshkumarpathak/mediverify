import os
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    SUPABASE_URL: str = ""
    SUPABASE_SERVICE_KEY: str = ""
    SENTRY_DSN: str = ""
    MODEL_PATH: str = os.path.join(os.path.dirname(__file__), "model", "best_model.h5")
    CONFIG_PATH: str = os.path.join(os.path.dirname(__file__), "model", "model_config.json")
    ALLOWED_ORIGINS: str = "http://localhost:3000,http://localhost:5173"

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

settings = Settings()
