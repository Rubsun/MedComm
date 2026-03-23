from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict

BASE_DIR = Path(__file__).resolve().parent

class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=str(BASE_DIR / ".env"))

    database_url: str
    test_database_url: str = ""
    secret_key: str
    access_token_expire_minutes: int = 15
    refresh_token_expire_days: int = 30
    media_dir: str = "media"
    cookie_secure: bool = False
    cors_origins: list[str] = ["http://localhost:5173"]

settings = Settings()
