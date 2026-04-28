from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import JSONResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from backend.dependencies import get_db, get_current_user
from backend.models.user import User
from backend.models.content import LessonBlock
from backend.models.progress import Enrollment, UserProgress, QuizResult, PracticeResult
from backend.schemas.progress import (
    EnrollRequest, CompleteLessonRequest,
    SubmitPracticeRequest, SubmitQuizRequest,
    PracticeResultOut, QuizResultOut,
)
from backend.services import achievements_service

router = APIRouter(prefix="/api/progress", tags=["progress"])


@router.get("/me")
async def get_my_progress(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Сводка прогресса текущего пользователя: записи на курсы, завершённые уроки,
    результаты тестов и практик. Используется на студенческом dashboard'е."""
    enrollments = (await db.execute(
        select(Enrollment).where(Enrollment.user_id == user.id)
    )).scalars().all()

    completed = (await db.execute(
        select(UserProgress).where(UserProgress.user_id == user.id)
    )).scalars().all()

    quizzes = (await db.execute(
        select(QuizResult).where(QuizResult.user_id == user.id)
    )).scalars().all()

    practices = (await db.execute(
        select(PracticeResult).where(PracticeResult.user_id == user.id)
    )).scalars().all()

    return {
        "enrollments": [
            {"course_id": e.course_id, "enrolled_at": e.enrolled_at.isoformat()}
            for e in enrollments
        ],
        "completed_lessons": [
            {"lesson_id": p.lesson_id, "completed_at": p.completed_at.isoformat()}
            for p in completed
        ],
        "quiz_results": [
            {
                "lesson_block_id": q.lesson_block_id,
                "score": q.score,
                "best_score": q.best_score,
                "max_score": q.max_score,
                "passed": q.passed,
                "attempts": q.attempts,
                "completed_at": q.completed_at.isoformat(),
            }
            for q in quizzes
        ],
        "practice_results": [
            {
                "lesson_block_id": p.lesson_block_id,
                "selected_option_ids": p.selected_option_ids,
                "is_correct": p.is_correct,
                "completed_at": p.completed_at.isoformat(),
            }
            for p in practices
        ],
    }


@router.post("/enroll", status_code=201)
async def enroll(
    body: EnrollRequest,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(Enrollment).where(Enrollment.user_id == user.id, Enrollment.course_id == body.course_id)
    )
    if result.scalar_one_or_none():
        return JSONResponse(content={"message": "Already enrolled"}, status_code=200)
    enrollment = Enrollment(user_id=user.id, course_id=body.course_id)
    db.add(enrollment)
    await db.commit()
    return {"message": "Enrolled successfully"}


@router.post("/complete-lesson", status_code=201)
async def complete_lesson(
    body: CompleteLessonRequest,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(UserProgress).where(UserProgress.user_id == user.id, UserProgress.lesson_id == body.lesson_id)
    )
    if result.scalar_one_or_none():
        return JSONResponse(content={"message": "Already completed"}, status_code=200)
    progress = UserProgress(user_id=user.id, lesson_id=body.lesson_id)
    db.add(progress)

    # Стрик активных дней + проверка достижений
    await achievements_service.update_streak(db, user.id)
    unlocked = await achievements_service.evaluate_achievements(db, user.id)
    await db.commit()

    return {
        "message": "Lesson completed",
        "unlocked_achievements": [{"id": a.id, "title": a.title, "icon": a.icon} for a in unlocked],
    }


@router.post("/submit-practice", response_model=PracticeResultOut, status_code=201)
async def submit_practice(
    body: SubmitPracticeRequest,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    block = await db.get(LessonBlock, body.lesson_block_id)
    if not block or block.type != "practice":
        raise HTTPException(status_code=404, detail="Practice block not found")

    block_data = block.data
    options = block_data.get("options", [])
    correct_ids = {opt["id"] for opt in options if opt.get("is_correct")}
    selected = set(body.selected_option_ids)
    is_correct = selected == correct_ids

    result = await db.execute(
        select(PracticeResult).where(
            PracticeResult.user_id == user.id,
            PracticeResult.lesson_block_id == body.lesson_block_id,
        )
    )
    existing = result.scalar_one_or_none()
    if existing:
        existing.selected_option_ids = body.selected_option_ids
        existing.is_correct = is_correct
        await achievements_service.evaluate_achievements(db, user.id)
        await db.commit()
        await db.refresh(existing)
        out = PracticeResultOut.model_validate(existing)
        return JSONResponse(content=out.model_dump(mode="json"), status_code=200)

    practice_result = PracticeResult(
        user_id=user.id,
        lesson_block_id=body.lesson_block_id,
        selected_option_ids=body.selected_option_ids,
        is_correct=is_correct,
    )
    db.add(practice_result)
    await achievements_service.evaluate_achievements(db, user.id)
    await db.commit()
    await db.refresh(practice_result)
    return practice_result


@router.post("/submit-quiz", response_model=QuizResultOut, status_code=201)
async def submit_quiz(
    body: SubmitQuizRequest,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    block = await db.get(LessonBlock, body.lesson_block_id)
    if not block or block.type != "quiz":
        raise HTTPException(status_code=404, detail="Quiz block not found")

    passing_score_pct = block.data.get("passing_score", 70)
    passed = (body.score / body.max_score * 100) >= passing_score_pct if body.max_score > 0 else False

    result = await db.execute(
        select(QuizResult).where(
            QuizResult.user_id == user.id,
            QuizResult.lesson_block_id == body.lesson_block_id,
        )
    )
    existing = result.scalar_one_or_none()
    if existing:
        existing.score = body.score
        existing.best_score = max(existing.best_score, body.score)
        existing.max_score = body.max_score
        existing.passed = (existing.best_score / body.max_score * 100) >= passing_score_pct
        existing.attempts += 1
        await achievements_service.evaluate_achievements(db, user.id)
        await db.commit()
        await db.refresh(existing)
        return existing

    quiz_result = QuizResult(
        user_id=user.id,
        lesson_block_id=body.lesson_block_id,
        score=body.score,
        best_score=body.score,
        max_score=body.max_score,
        passed=passed,
        attempts=1,
    )
    db.add(quiz_result)
    await achievements_service.evaluate_achievements(db, user.id)
    await db.commit()
    await db.refresh(quiz_result)
    return quiz_result
