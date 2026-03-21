from pathlib import Path
from pydantic_settings import BaseSettings

BASE_DIR = Path(__file__).resolve().parent

class Settings(BaseSettings):
    database_url: str
    test_database_url: str = ""
    secret_key: str
    access_token_expire_minutes: int = 15
    refresh_token_expire_days: int = 30
    media_dir: str = "media"

    class Config:
        env_file = str(BASE_DIR / ".env")

settings = Settings()
