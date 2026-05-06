from datetime import datetime
from typing import Any

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, String, UniqueConstraint, func
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column

from backend.database import Base


class GeneralTest(Base):
    """Диагностический тест: входной (entry) или итоговый (final).

    scales и interpretations хранятся как JSONB — структура соответствует index.html:
    scales: [{key, name, yes?: int[], no?: int[], direct?: int[], reverse?: int[], inverse?: int[], avg?: bool}]
    interpretations: [{min, max, level, short, text}]
    likert_labels: ["Почти никогда", ...] — только для likert4
    """

    __tablename__ = "general_tests"

    id: Mapped[int] = mapped_column(primary_key=True)
    slug: Mapped[str] = mapped_column(String(64), unique=True, index=True)
    kind: Mapped[str] = mapped_column(String(16))  # 'entry' | 'final'
    title: Mapped[str] = mapped_column(String(255))
    method: Mapped[str] = mapped_column(String(255), default="")
    description: Mapped[str] = mapped_column(String(2000), default="")
    question_type: Mapped[str] = mapped_column(String(16))  # 'yesno' | 'likert4' | 'scale10'
    duration: Mapped[str] = mapped_column(String(64), default="")

    likert_labels: Mapped[list[str] | None] = mapped_column(JSONB, nullable=True)
    scales: Mapped[list[dict[str, Any]]] = mapped_column(JSONB, default=list)
    interpretations: Mapped[list[dict[str, Any]]] = mapped_column(JSONB, default=list)

    is_published: Mapped[bool] = mapped_column(Boolean, default=False)
    sort_order: Mapped[int] = mapped_column(Integer, default=0)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )


class GeneralTestQuestion(Base):
    __tablename__ = "general_test_questions"
    __table_args__ = (UniqueConstraint("test_id", "sort_order"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    test_id: Mapped[int] = mapped_column(ForeignKey("general_tests.id", ondelete="CASCADE"), index=True)
    sort_order: Mapped[int] = mapped_column(Integer)
    text: Mapped[str] = mapped_column(String(2000))


class GeneralTestAttempt(Base):
    """Попытка прохождения теста пользователем.

    answers: { qIndex (0-based, str): value }, value ∈ {'yes','no'} | int 1..4 | int 1..10
    score: { total: float, max: float, breakdown: [{key, name, value, max}] }
    interpretation: { level, short, text, min, max }
    """

    __tablename__ = "general_test_attempts"
    __table_args__ = (UniqueConstraint("user_id", "test_id"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    test_id: Mapped[int] = mapped_column(ForeignKey("general_tests.id", ondelete="CASCADE"), index=True)

    answers: Mapped[dict[str, Any]] = mapped_column(JSONB, default=dict)
    score: Mapped[dict[str, Any] | None] = mapped_column(JSONB, nullable=True)
    interpretation: Mapped[dict[str, Any] | None] = mapped_column(JSONB, nullable=True)

    is_completed: Mapped[bool] = mapped_column(Boolean, default=False)

    started_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
