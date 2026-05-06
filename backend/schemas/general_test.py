from datetime import datetime
from typing import Any, Literal

from pydantic import BaseModel, Field


QuestionType = Literal["yesno", "likert4", "scale10"]
TestKind = Literal["entry", "final"]


class ScaleSpec(BaseModel):
    """Описание одной шкалы. Поля yes/no для yesno, direct/reverse для likert4, inverse/avg для scale10."""

    key: str
    name: str
    yes: list[int] | None = None
    no: list[int] | None = None
    direct: list[int] | None = None
    reverse: list[int] | None = None
    inverse: list[int] | None = None
    avg: bool | None = None


class InterpretationSpec(BaseModel):
    min: float
    max: float
    level: str
    short: str
    text: str


class QuestionOut(BaseModel):
    id: int
    sort_order: int
    text: str

    model_config = {"from_attributes": True}


# ── List item (без вопросов) ─────────────────────────────────────────

class GeneralTestListItem(BaseModel):
    id: int
    slug: str
    kind: TestKind
    title: str
    method: str
    description: str
    question_type: QuestionType
    duration: str
    is_published: bool
    sort_order: int
    questions_count: int = 0
    scales_count: int = 0
    interpretations_count: int = 0

    model_config = {"from_attributes": True}


# ── Full test (с вопросами + шкалами + интерпретациями) ───────────────

class GeneralTestOut(BaseModel):
    id: int
    slug: str
    kind: TestKind
    title: str
    method: str
    description: str
    question_type: QuestionType
    duration: str
    likert_labels: list[str] | None = None
    scales: list[ScaleSpec]
    interpretations: list[InterpretationSpec]
    is_published: bool
    sort_order: int
    questions: list[QuestionOut]

    model_config = {"from_attributes": True}


# ── Admin create / update ─────────────────────────────────────────────

class GeneralTestCreate(BaseModel):
    slug: str | None = None
    kind: TestKind
    title: str
    method: str = ""
    description: str = ""
    question_type: QuestionType
    duration: str = ""
    likert_labels: list[str] | None = None
    scales: list[ScaleSpec] = Field(default_factory=list)
    interpretations: list[InterpretationSpec] = Field(default_factory=list)
    questions: list[str] = Field(default_factory=list)


class GeneralTestUpdate(BaseModel):
    kind: TestKind | None = None
    title: str | None = None
    method: str | None = None
    description: str | None = None
    duration: str | None = None
    likert_labels: list[str] | None = None
    scales: list[ScaleSpec] | None = None
    interpretations: list[InterpretationSpec] | None = None
    questions: list[str] | None = None  # полная замена списка вопросов


# ── Attempts ──────────────────────────────────────────────────────────

class ScoreBreakdownItem(BaseModel):
    key: str
    name: str
    value: float
    max: float


class ScoreOut(BaseModel):
    total: float
    max: float
    breakdown: list[ScoreBreakdownItem] = Field(default_factory=list)


class InterpretationOut(BaseModel):
    level: str
    short: str
    text: str
    min: float
    max: float


class AttemptOut(BaseModel):
    id: int
    test_id: int
    answers: dict[str, Any] = Field(default_factory=dict)
    score: ScoreOut | None = None
    interpretation: InterpretationOut | None = None
    is_completed: bool
    started_at: datetime
    completed_at: datetime | None = None

    model_config = {"from_attributes": True}


class AttemptSaveAnswers(BaseModel):
    answers: dict[str, Any]


# ── Admin results dashboard ───────────────────────────────────────────

class DistributionItem(BaseModel):
    level: str
    short: str
    min: float
    max: float
    count: int


class RecentAttemptItem(BaseModel):
    user_id: int
    user_name: str
    score_total: float
    level: str
    completed_at: datetime


class TestResultsOut(BaseModel):
    responses: int
    completed: int
    avg_score: float
    distribution: list[DistributionItem]
    recent: list[RecentAttemptItem]
