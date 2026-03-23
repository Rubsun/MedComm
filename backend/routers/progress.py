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

router = APIRouter(prefix="/api/progress", tags=["progress"])


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
    await db.commit()
    return {"message": "Lesson completed"}


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
    await db.commit()
    await db.refresh(quiz_result)
    return quiz_result
