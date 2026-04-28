from datetime import date, datetime

from pydantic import BaseModel, Field


# ── Achievement (admin CRUD) ──────────────────────────────────────────────

class AchievementBase(BaseModel):
    title: str
    description: str = ""
    icon: str = "trophy"
    color: str | None = None
    tier: str = "bronze"
    metric: str
    op: str = ">="
    threshold: int = Field(default=1, ge=0)
    xp: int = Field(default=0, ge=0)


class AchievementCreate(AchievementBase):
    pass


class AchievementUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    icon: str | None = None
    color: str | None = None
    tier: str | None = None
    metric: str | None = None
    op: str | None = None
    threshold: int | None = None
    xp: int | None = None


class AchievementOut(AchievementBase):
    id: int
    is_published: bool
    sort_order: int

    model_config = {"from_attributes": True}


# ── User-side ─────────────────────────────────────────────────────────────

class UserAchievementOut(BaseModel):
    """Отдельная запись «достижение разблокировано»."""

    id: int
    achievement_id: int
    unlocked_at: datetime

    model_config = {"from_attributes": True}


class AchievementWithStatus(AchievementOut):
    """Достижение + признак разблокировано ли + текущее значение метрики."""

    unlocked: bool = False
    unlocked_at: datetime | None = None
    current_value: int = 0


class StreakOut(BaseModel):
    current_streak: int
    longest_streak: int
    last_active_date: date | None

    model_config = {"from_attributes": True}
