from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.dependencies import (
    get_current_user,
    get_db,
    get_optional_admin,
    require_admin,
)
from backend.models.achievement import Achievement, UserStreak
from backend.models.user import User
from backend.schemas.achievement import (
    AchievementCreate,
    AchievementOut,
    AchievementUpdate,
    AchievementWithStatus,
    StreakOut,
)
from backend.schemas.content import ReorderItem
from backend.services.achievements_service import with_status

router = APIRouter(prefix="/api", tags=["achievements"])


# ── Admin/student listing ─────────────────────────────────────────────────

@router.get("/achievements", response_model=list[AchievementOut])
async def list_achievements(
    db: AsyncSession = Depends(get_db),
    is_admin: bool = Depends(get_optional_admin),
):
    query = select(Achievement).order_by(Achievement.sort_order, Achievement.id)
    if not is_admin:
        query = query.where(Achievement.is_published == True)  # noqa: E712
    result = await db.execute(query)
    return result.scalars().all()


@router.post("/achievements", response_model=AchievementOut, status_code=201)
async def create_achievement(
    body: AchievementCreate,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin),
):
    ach = Achievement(**body.model_dump())
    db.add(ach)
    await db.commit()
    await db.refresh(ach)
    return ach


@router.get("/achievements/{achievement_id}", response_model=AchievementOut)
async def get_achievement(
    achievement_id: int,
    db: AsyncSession = Depends(get_db),
    is_admin: bool = Depends(get_optional_admin),
):
    ach = await db.get(Achievement, achievement_id)
    if not ach or (not is_admin and not ach.is_published):
        raise HTTPException(status_code=404, detail="Achievement not found")
    return ach


@router.put("/achievements/{achievement_id}", response_model=AchievementOut)
async def update_achievement(
    achievement_id: int,
    body: AchievementUpdate,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin),
):
    ach = await db.get(Achievement, achievement_id)
    if not ach:
        raise HTTPException(status_code=404, detail="Achievement not found")
    for field, value in body.model_dump(exclude_unset=True).items():
        setattr(ach, field, value)
    await db.commit()
    await db.refresh(ach)
    return ach


# reorder MUST идти перед /{id}/...
@router.patch("/achievements/reorder")
async def reorder_achievements(
    items: list[ReorderItem],
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin),
):
    for item in items:
        ach = await db.get(Achievement, item.id)
        if ach:
            ach.sort_order = item.sort_order
    await db.commit()
    return {"ok": True}


@router.patch("/achievements/{achievement_id}/publish", response_model=AchievementOut)
async def toggle_publish(
    achievement_id: int,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin),
):
    ach = await db.get(Achievement, achievement_id)
    if not ach:
        raise HTTPException(status_code=404, detail="Achievement not found")
    ach.is_published = not ach.is_published
    await db.commit()
    await db.refresh(ach)
    return ach


@router.delete("/achievements/{achievement_id}", status_code=204)
async def delete_achievement(
    achievement_id: int,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin),
):
    ach = await db.get(Achievement, achievement_id)
    if not ach:
        raise HTTPException(status_code=404, detail="Achievement not found")
    await db.delete(ach)
    await db.commit()


# ── /me endpoints ──────────────────────────────────────────────────────────

@router.get("/me/achievements", response_model=list[AchievementWithStatus])
async def my_achievements(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Список опубликованных достижений с пометкой, разблокировано ли каждое
    для текущего пользователя, и текущим значением соответствующей метрики."""
    achievements = (await db.execute(
        select(Achievement)
        .where(Achievement.is_published == True)  # noqa: E712
        .order_by(Achievement.sort_order, Achievement.id)
    )).scalars().all()
    return await with_status(db, user.id, achievements)


@router.get("/me/streak", response_model=StreakOut)
async def my_streak(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    streak = await db.get(UserStreak, user.id)
    if not streak:
        return StreakOut(current_streak=0, longest_streak=0, last_active_date=None)
    return streak
