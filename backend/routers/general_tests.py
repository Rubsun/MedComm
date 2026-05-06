from datetime import datetime, timezone
from typing import Any

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.dependencies import (
    get_current_user,
    get_db,
    get_optional_admin,
    require_admin,
)
from backend.models.general_test import GeneralTest, GeneralTestAttempt, GeneralTestQuestion
from backend.models.user import User
from backend.schemas.general_test import (
    AttemptOut,
    AttemptSaveAnswers,
    DistributionItem,
    GeneralTestCreate,
    GeneralTestListItem,
    GeneralTestOut,
    GeneralTestUpdate,
    QuestionOut,
    RecentAttemptItem,
    TestResultsOut,
)
from backend.services.general_test_scoring import find_interpretation, score_attempt
from backend.services.slug import auto_slug

router = APIRouter(prefix="/api/general-tests", tags=["general-tests"])


async def _load_questions(db: AsyncSession, test_id: int) -> list[GeneralTestQuestion]:
    res = await db.execute(
        select(GeneralTestQuestion)
        .where(GeneralTestQuestion.test_id == test_id)
        .order_by(GeneralTestQuestion.sort_order)
    )
    return list(res.scalars().all())


def _list_item(t: GeneralTest, qcount: int) -> GeneralTestListItem:
    return GeneralTestListItem(
        id=t.id,
        slug=t.slug,
        kind=t.kind,
        title=t.title,
        method=t.method,
        description=t.description,
        question_type=t.question_type,
        duration=t.duration,
        is_published=t.is_published,
        sort_order=t.sort_order,
        questions_count=qcount,
        scales_count=len(t.scales or []),
        interpretations_count=len(t.interpretations or []),
    )


def _full_out(t: GeneralTest, questions: list[GeneralTestQuestion]) -> GeneralTestOut:
    return GeneralTestOut(
        id=t.id,
        slug=t.slug,
        kind=t.kind,
        title=t.title,
        method=t.method,
        description=t.description,
        question_type=t.question_type,
        duration=t.duration,
        likert_labels=t.likert_labels,
        scales=t.scales or [],
        interpretations=t.interpretations or [],
        is_published=t.is_published,
        sort_order=t.sort_order,
        questions=[QuestionOut.model_validate(q) for q in questions],
    )


# ── List / Get ────────────────────────────────────────────────────────

@router.get("", response_model=list[GeneralTestListItem])
async def list_tests(
    kind: str | None = None,
    db: AsyncSession = Depends(get_db),
    is_admin: bool = Depends(get_optional_admin),
):
    query = select(GeneralTest).order_by(GeneralTest.sort_order, GeneralTest.id)
    if kind:
        query = query.where(GeneralTest.kind == kind)
    if not is_admin:
        query = query.where(GeneralTest.is_published.is_(True))
    tests = (await db.execute(query)).scalars().all()
    if not tests:
        return []

    counts_res = await db.execute(
        select(GeneralTestQuestion.test_id, func.count(GeneralTestQuestion.id))
        .where(GeneralTestQuestion.test_id.in_([t.id for t in tests]))
        .group_by(GeneralTestQuestion.test_id)
    )
    counts = {row[0]: row[1] for row in counts_res.all()}
    return [_list_item(t, counts.get(t.id, 0)) for t in tests]


@router.get("/{test_id}", response_model=GeneralTestOut)
async def get_test(
    test_id: int,
    db: AsyncSession = Depends(get_db),
    is_admin: bool = Depends(get_optional_admin),
):
    t = await db.get(GeneralTest, test_id)
    if not t or (not is_admin and not t.is_published):
        raise HTTPException(status_code=404, detail="Test not found")
    questions = await _load_questions(db, test_id)
    return _full_out(t, questions)


# ── Admin CRUD ────────────────────────────────────────────────────────

@router.post("", response_model=GeneralTestOut, status_code=201)
async def create_test(
    body: GeneralTestCreate,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin),
):
    payload = body.model_dump()
    questions_text = payload.pop("questions", []) or []
    if not payload.get("slug"):
        payload["slug"] = auto_slug("test")
    payload["scales"] = [s for s in payload.get("scales") or []]
    payload["interpretations"] = [i for i in payload.get("interpretations") or []]

    t = GeneralTest(**payload)
    db.add(t)
    await db.flush()
    for i, text in enumerate(questions_text):
        db.add(GeneralTestQuestion(test_id=t.id, sort_order=i, text=text))
    await db.commit()
    await db.refresh(t)
    questions = await _load_questions(db, t.id)
    return _full_out(t, questions)


@router.put("/{test_id}", response_model=GeneralTestOut)
async def update_test(
    test_id: int,
    body: GeneralTestUpdate,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin),
):
    t = await db.get(GeneralTest, test_id)
    if not t:
        raise HTTPException(status_code=404, detail="Test not found")

    data = body.model_dump(exclude_unset=True)
    new_questions = data.pop("questions", None)
    for field, value in data.items():
        setattr(t, field, value)

    if new_questions is not None:
        # полная перезапись вопросов; идемпотентно по sort_order
        existing = await _load_questions(db, test_id)
        existing_by_order = {q.sort_order: q for q in existing}
        seen: set[int] = set()
        for i, text in enumerate(new_questions):
            seen.add(i)
            q = existing_by_order.get(i)
            if q is None:
                db.add(GeneralTestQuestion(test_id=test_id, sort_order=i, text=text))
            else:
                q.text = text
        for order, q in existing_by_order.items():
            if order not in seen:
                await db.delete(q)

    await db.commit()
    await db.refresh(t)
    questions = await _load_questions(db, test_id)
    return _full_out(t, questions)


@router.patch("/{test_id}/publish", response_model=GeneralTestOut)
async def toggle_publish(
    test_id: int,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin),
):
    t = await db.get(GeneralTest, test_id)
    if not t:
        raise HTTPException(status_code=404, detail="Test not found")
    t.is_published = not t.is_published
    await db.commit()
    await db.refresh(t)
    questions = await _load_questions(db, test_id)
    return _full_out(t, questions)


@router.delete("/{test_id}", status_code=204)
async def delete_test(
    test_id: int,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin),
):
    t = await db.get(GeneralTest, test_id)
    if not t:
        raise HTTPException(status_code=404, detail="Test not found")
    await db.delete(t)
    await db.commit()


# ── Student attempts ──────────────────────────────────────────────────

async def _get_or_create_attempt(
    db: AsyncSession, user_id: int, test_id: int
) -> GeneralTestAttempt:
    res = await db.execute(
        select(GeneralTestAttempt).where(
            GeneralTestAttempt.user_id == user_id,
            GeneralTestAttempt.test_id == test_id,
        )
    )
    attempt = res.scalar_one_or_none()
    if attempt is None:
        attempt = GeneralTestAttempt(user_id=user_id, test_id=test_id, answers={})
        db.add(attempt)
        await db.flush()
    return attempt


@router.get("/{test_id}/attempt", response_model=AttemptOut)
async def get_or_start_attempt(
    test_id: int,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    t = await db.get(GeneralTest, test_id)
    if not t or not t.is_published:
        raise HTTPException(status_code=404, detail="Test not found")
    attempt = await _get_or_create_attempt(db, user.id, test_id)
    await db.commit()
    await db.refresh(attempt)
    return attempt


@router.put("/{test_id}/attempt", response_model=AttemptOut)
async def save_attempt_answers(
    test_id: int,
    body: AttemptSaveAnswers,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    t = await db.get(GeneralTest, test_id)
    if not t or not t.is_published:
        raise HTTPException(status_code=404, detail="Test not found")
    attempt = await _get_or_create_attempt(db, user.id, test_id)
    if attempt.is_completed:
        # перезапуск — обнуляем результат, начинаем заново
        attempt.is_completed = False
        attempt.score = None
        attempt.interpretation = None
        attempt.completed_at = None
    attempt.answers = dict(body.answers)
    await db.commit()
    await db.refresh(attempt)
    return attempt


@router.post("/{test_id}/attempt/complete", response_model=AttemptOut)
async def complete_attempt(
    test_id: int,
    body: AttemptSaveAnswers,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    t = await db.get(GeneralTest, test_id)
    if not t or not t.is_published:
        raise HTTPException(status_code=404, detail="Test not found")
    attempt = await _get_or_create_attempt(db, user.id, test_id)
    if body.answers:
        attempt.answers = dict(body.answers)

    questions = await _load_questions(db, test_id)
    qcount = len(questions)
    answered = sum(1 for k in (attempt.answers or {}).keys() if str(k).isdigit())
    if answered < qcount:
        raise HTTPException(
            status_code=400,
            detail=f"Тест не завершён: отвечено {answered} из {qcount}",
        )

    score = score_attempt(t, attempt.answers or {}, qcount)
    interp = find_interpretation(t, score["total"])
    attempt.score = score
    attempt.interpretation = interp
    attempt.is_completed = True
    attempt.completed_at = datetime.now(timezone.utc)
    await db.commit()
    await db.refresh(attempt)
    return attempt


@router.get("/me/attempts", response_model=list[AttemptOut])
async def my_attempts(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    res = await db.execute(
        select(GeneralTestAttempt).where(GeneralTestAttempt.user_id == user.id)
    )
    return list(res.scalars().all())


# ── Admin results ─────────────────────────────────────────────────────

@router.get("/{test_id}/results", response_model=TestResultsOut)
async def test_results(
    test_id: int,
    limit: int = 10,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin),
):
    t = await db.get(GeneralTest, test_id)
    if not t:
        raise HTTPException(status_code=404, detail="Test not found")

    res = await db.execute(
        select(GeneralTestAttempt).where(GeneralTestAttempt.test_id == test_id)
    )
    attempts = list(res.scalars().all())

    completed = [a for a in attempts if a.is_completed and a.score]
    avg_score = 0.0
    if completed:
        avg_score = sum(float((a.score or {}).get("total", 0)) for a in completed) / len(completed)

    distribution: list[DistributionItem] = []
    for interp in (t.interpretations or []):
        rmin = float(interp.get("min", 0))
        rmax = float(interp.get("max", 0))
        count = sum(
            1 for a in completed
            if rmin <= float((a.score or {}).get("total", 0)) <= rmax
        )
        distribution.append(DistributionItem(
            level=interp.get("level", ""),
            short=interp.get("short", ""),
            min=rmin,
            max=rmax,
            count=count,
        ))

    completed_sorted = sorted(
        completed,
        key=lambda a: a.completed_at or a.updated_at,
        reverse=True,
    )[:limit]

    user_ids = [a.user_id for a in completed_sorted]
    users_map: dict[int, User] = {}
    if user_ids:
        ures = await db.execute(select(User).where(User.id.in_(user_ids)))
        users_map = {u.id: u for u in ures.scalars().all()}

    recent: list[RecentAttemptItem] = []
    for a in completed_sorted:
        u = users_map.get(a.user_id)
        name = (
            f"{(u.first_name or '').strip()} {(u.last_name or '').strip()}".strip()
            if u
            else f"User #{a.user_id}"
        ) or (u.email if u else f"User #{a.user_id}")
        level = ((a.interpretation or {}).get("level") or "—") if a.interpretation else "—"
        recent.append(RecentAttemptItem(
            user_id=a.user_id,
            user_name=name,
            score_total=float((a.score or {}).get("total", 0)),
            level=level,
            completed_at=a.completed_at or a.updated_at,
        ))

    return TestResultsOut(
        responses=len(attempts),
        completed=len(completed),
        avg_score=round(avg_score, 2),
        distribution=distribution,
        recent=recent,
    )
