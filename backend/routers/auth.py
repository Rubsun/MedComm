from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status, Response, Cookie
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from backend.dependencies import get_db, get_current_user
from backend.models.user import User, RevokedToken
from backend.schemas.auth import RegisterRequest, LoginRequest, TokenResponse, UserOut
from backend.services.auth_service import (
    hash_password, verify_password,
    create_access_token, create_refresh_token, decode_token
)
from backend.config import settings

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/register", response_model=UserOut, status_code=201)
async def register(body: RegisterRequest, db: AsyncSession = Depends(get_db)):
    existing = await db.execute(select(User).where(User.email == body.email))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=409, detail="Email already registered")
    user = User(
        email=body.email,
        password_hash=hash_password(body.password),
        first_name=body.first_name,
        last_name=body.last_name,
        role="student",
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user


@router.post("/login", response_model=TokenResponse)
async def login(body: LoginRequest, response: Response, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == body.email))
    user = result.scalar_one_or_none()
    if not user or not verify_password(body.password, user.password_hash) or not user.is_active:
        raise HTTPException(status_code=401, detail="Invalid credentials")

    access_token = create_access_token(user.id, user.role)
    refresh_token, jti = create_refresh_token(user.id)

    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,
        max_age=settings.refresh_token_expire_days * 86400,
        samesite="lax",
        secure=settings.cookie_secure,
    )
    return TokenResponse(access_token=access_token)


@router.post("/refresh", response_model=TokenResponse)
async def refresh(
    response: Response,
    refresh_token: str | None = Cookie(default=None),
    db: AsyncSession = Depends(get_db),
):
    if not refresh_token:
        raise HTTPException(status_code=401, detail="No refresh token")
    payload = decode_token(refresh_token)
    if not payload or payload.get("type") != "refresh":
        raise HTTPException(status_code=401, detail="Invalid refresh token")

    jti = payload.get("jti")
    result = await db.execute(select(RevokedToken).where(RevokedToken.jti == jti))
    if result.scalar_one_or_none():
        raise HTTPException(status_code=401, detail="Token revoked")

    user_id = int(payload["sub"])
    user = await db.get(User, user_id)
    if not user or not user.is_active:
        raise HTTPException(status_code=401, detail="User not found")

    expires_at = datetime.fromtimestamp(payload["exp"], tz=timezone.utc)
    db.add(RevokedToken(jti=jti, expires_at=expires_at))

    access_token = create_access_token(user.id, user.role)
    new_refresh_token, new_jti = create_refresh_token(user.id)
    await db.commit()

    response.set_cookie(
        key="refresh_token",
        value=new_refresh_token,
        httponly=True,
        max_age=settings.refresh_token_expire_days * 86400,
        samesite="lax",
        secure=settings.cookie_secure,
    )
    return TokenResponse(access_token=access_token)


@router.post("/logout")
async def logout(
    response: Response,
    user: User = Depends(get_current_user),
    refresh_token: str | None = Cookie(default=None),
    db: AsyncSession = Depends(get_db),
):
    if refresh_token:
        payload = decode_token(refresh_token)
        if payload and (jti := payload.get("jti")):
            expires_at = datetime.fromtimestamp(payload["exp"], tz=timezone.utc)
            db.add(RevokedToken(jti=jti, expires_at=expires_at))
            await db.commit()
    response.delete_cookie("refresh_token")
    return {"message": "Logged out"}


@router.get("/me", response_model=UserOut)
async def me(user: User = Depends(get_current_user)):
    return user
