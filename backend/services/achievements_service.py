"""Сервис: пересчёт серии активных дней и разблокировка достижений."""
from __future__ import annotations

from datetime import date, timedelta
from typing import Iterable

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.models.achievement import Achievement, UserAchievement, UserStreak
from backend.models.content import Lesson, Module
from backend.models.progress import (
    Enrollment,
    PracticeResult,
    QuizResult,
    UserProgress,
)


# ── Streak ────────────────────────────────────────────────────────────────

async def update_streak(db: AsyncSession, user_id: int, *, today: date | None = None) -> UserStreak:
    """Пересчитывает серию активных дней. Вызывается при complete-lesson.

    Логика: «активный день» — день, в который пользователь завершил хотя бы один урок.
    - Если последний активный день == сегодня → ничего не меняется.
    - Если последний активный день == вчера → current_streak += 1.
    - Иначе → current_streak = 1.
    longest_streak обновляется как max(current, longest).
    """
    today = today or date.today()
    streak = await db.get(UserStreak, user_id)
    if streak is None:
        streak = UserStreak(
            user_id=user_id,
            current_streak=1,
            longest_streak=1,
            last_active_date=today,
        )
        db.add(streak)
        await db.flush()
        return streak

    last = streak.last_active_date
    if last == today:
        return streak  # уже отметились сегодня
    if last is not None and (today - last) == timedelta(days=1):
        streak.current_streak += 1
    else:
        streak.current_streak = 1
    streak.longest_streak = max(streak.longest_streak, streak.current_streak)
    streak.last_active_date = today
    return streak


# ── Метрики ────────────────────────────────────────────────────────────────

async def compute_metrics(db: AsyncSession, user_id: int) -> dict[str, int]:
    """Возвращает словарь актуальных значений метрик для пользователя."""
    lessons_completed = (await db.execute(
        select(func.count()).select_from(UserProgress).where(UserProgress.user_id == user_id)
    )).scalar_one()

    perfect_quizzes = (await db.execute(
        select(func.count()).select_from(QuizResult)
        .where(QuizResult.user_id == user_id)
        .where(QuizResult.max_score > 0)
        .where(QuizResult.best_score == QuizResult.max_score)
    )).scalar_one()

    practice_count = (await db.execute(
        select(func.count()).select_from(PracticeResult).where(PracticeResult.user_id == user_id)
    )).scalar_one()

    streak = await db.get(UserStreak, user_id)
    streak_days = streak.current_streak if streak else 0

    courses_completed = await _count_completed_courses(db, user_id)

    return {
        "lessons_completed": int(lessons_completed),
        "courses_completed": int(courses_completed),
        "streak_days": int(streak_days),
        "perfect_quizzes": int(perfect_quizzes),
        "practice_count": int(practice_count),
    }


async def _count_completed_courses(db: AsyncSession, user_id: int) -> int:
    """Курс считается пройденным, если для каждого опубликованного урока
    в опубликованных модулях есть UserProgress."""
    enrollments = (await db.execute(
        select(Enrollment.course_id).where(Enrollment.user_id == user_id)
    )).scalars().all()
    if not enrollments:
        return 0

    completed_lesson_ids = set((await db.execute(
        select(UserProgress.lesson_id).where(UserProgress.user_id == user_id)
    )).scalars().all())

    completed = 0
    for course_id in enrollments:
        lesson_ids = (await db.execute(
            select(Lesson.id)
            .join(Module, Module.id == Lesson.module_id)
            .where(Module.course_id == course_id)
            .where(Lesson.is_published == True)  # noqa: E712
        )).scalars().all()
        if lesson_ids and all(lid in completed_lesson_ids for lid in lesson_ids):
            completed += 1
    return completed


# ── Оценка достижений ──────────────────────────────────────────────────────

OP_MAP = {
    ">=": lambda a, b: a >= b,
    ">": lambda a, b: a > b,
    "==": lambda a, b: a == b,
}


def _check(metric_value: int, op: str, threshold: int) -> bool:
    fn = OP_MAP.get(op, OP_MAP[">="])
    return fn(metric_value, threshold)


async def evaluate_achievements(
    db: AsyncSession,
    user_id: int,
) -> list[Achievement]:
    """Проверяет все опубликованные достижения и разблокирует подходящие.
    Возвращает только что разблокированные."""
    metrics = await compute_metrics(db, user_id)

    achievements = (await db.execute(
        select(Achievement).where(Achievement.is_published == True)  # noqa: E712
    )).scalars().all()

    already_unlocked = set((await db.execute(
        select(UserAchievement.achievement_id).where(UserAchievement.user_id == user_id)
    )).scalars().all())

    newly_unlocked: list[Achievement] = []
    for ach in achievements:
        if ach.id in already_unlocked:
            continue
        value = metrics.get(ach.metric, 0)
        if _check(value, ach.op, ach.threshold):
            db.add(UserAchievement(user_id=user_id, achievement_id=ach.id))
            newly_unlocked.append(ach)

    return newly_unlocked


async def with_status(
    db: AsyncSession,
    user_id: int,
    achievements: Iterable[Achievement],
) -> list[dict]:
    """Возвращает достижения вместе с признаком разблокировано ли + текущим значением метрики."""
    metrics = await compute_metrics(db, user_id)
    unlocked_records = (await db.execute(
        select(UserAchievement).where(UserAchievement.user_id == user_id)
    )).scalars().all()
    unlocked_map = {r.achievement_id: r.unlocked_at for r in unlocked_records}

    out = []
    for ach in achievements:
        out.append({
            "id": ach.id,
            "title": ach.title,
            "description": ach.description,
            "icon": ach.icon,
            "color": ach.color,
            "tier": ach.tier,
            "metric": ach.metric,
            "op": ach.op,
            "threshold": ach.threshold,
            "xp": ach.xp,
            "is_published": ach.is_published,
            "sort_order": ach.sort_order,
            "unlocked": ach.id in unlocked_map,
            "unlocked_at": unlocked_map.get(ach.id),
            "current_value": metrics.get(ach.metric, 0),
        })
    return out
