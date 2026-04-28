from datetime import date, datetime

from sqlalchemy import (
    Boolean,
    Date,
    DateTime,
    ForeignKey,
    Integer,
    String,
    UniqueConstraint,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column

from backend.database import Base


class Achievement(Base):
    """Шаблон достижения, настраивается администратором."""

    __tablename__ = "achievements"

    id: Mapped[int] = mapped_column(primary_key=True)
    title: Mapped[str] = mapped_column(String(255))
    description: Mapped[str] = mapped_column(String(2000), default="")

    # Визуал
    icon: Mapped[str] = mapped_column(String(64), default="trophy")  # emoji или ключ Icon-словаря
    color: Mapped[str | None] = mapped_column(String(16), nullable=True)  # hex цвет
    tier: Mapped[str] = mapped_column(String(16), default="bronze")  # bronze | silver | gold

    # Условие разблокировки
    metric: Mapped[str] = mapped_column(String(32))
    # допустимые значения metric:
    #   lessons_completed, courses_completed, streak_days,
    #   perfect_quizzes, practice_count
    op: Mapped[str] = mapped_column(String(4), default=">=")  # >= | > | ==
    threshold: Mapped[int] = mapped_column(Integer, default=1)

    xp: Mapped[int] = mapped_column(Integer, default=0)

    is_published: Mapped[bool] = mapped_column(Boolean, default=False)
    sort_order: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )


class UserAchievement(Base):
    """Запись о разблокированном пользователем достижении."""

    __tablename__ = "user_achievements"
    __table_args__ = (UniqueConstraint("user_id", "achievement_id"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"))
    achievement_id: Mapped[int] = mapped_column(
        ForeignKey("achievements.id", ondelete="CASCADE")
    )
    unlocked_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )


class UserStreak(Base):
    """Серия активных дней (один день — день, в который пользователь завершил урок)."""

    __tablename__ = "user_streaks"

    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), primary_key=True
    )
    current_streak: Mapped[int] = mapped_column(Integer, default=0)
    longest_streak: Mapped[int] = mapped_column(Integer, default=0)
    last_active_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )
