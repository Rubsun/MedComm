import uuid
from datetime import datetime, timedelta, timezone

import bcrypt
from jose import jwt, JWTError

from backend.config import settings

ALGORITHM = "HS256"


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(plain: str, hashed: str) -> bool:
    return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))


def create_access_token(user_id: int, role: str) -> str:
    expire = datetime.now(timezone.utc) + timedelta(minutes=settings.access_token_expire_minutes)
    return jwt.encode(
        {"sub": str(user_id), "role": role, "exp": expire, "type": "access"},
        settings.secret_key, algorithm=ALGORITHM,
    )


def create_refresh_token(user_id: int) -> tuple[str, str]:
    """Returns (encoded_token, jti)"""
    jti = str(uuid.uuid4())
    expire = datetime.now(timezone.utc) + timedelta(days=settings.refresh_token_expire_days)
    token = jwt.encode(
        {"sub": str(user_id), "jti": jti, "exp": expire, "type": "refresh"},
        settings.secret_key, algorithm=ALGORITHM,
    )
    return token, jti


def decode_token(token: str) -> dict:
    try:
        return jwt.decode(token, settings.secret_key, algorithms=[ALGORITHM])
    except JWTError:
        return {}
