from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, Integer

from backend.models.user import User
from backend.models.content import Course, Lesson, LessonBlock
from backend.models.progress import Enrollment, UserProgress, QuizResult


async def get_overview(db: AsyncSession) -> dict:
    total_students = (await db.execute(
        select(func.count()).select_from(User).where(User.role == "student")
    )).scalar_one()

    enrollments = (await db.execute(
        select(Course.id, Course.title, func.count(Enrollment.id).label("count"))
        .outerjoin(Enrollment, Enrollment.course_id == Course.id)
        .group_by(Course.id, Course.title)
        .order_by(Course.id)
    )).all()

    return {
        "total_students": total_students,
        "enrollments_per_course": [
            {"course_id": r.id, "course_title": r.title, "enrollment_count": r.count}
            for r in enrollments
        ],
    }


async def get_completion_rates(db: AsyncSession) -> list:
    result = await db.execute(
        select(
            Lesson.id,
            Lesson.title,
            func.count(UserProgress.id).label("completed_count"),
        )
        .outerjoin(UserProgress, UserProgress.lesson_id == Lesson.id)
        .where(Lesson.is_published == True)
        .group_by(Lesson.id, Lesson.title)
        .order_by(Lesson.id)
    )
    rows = result.all()
    return [
        {"lesson_id": r.id, "lesson_title": r.title, "completed_count": r.completed_count}
        for r in rows
    ]


async def get_quiz_results(db: AsyncSession) -> list:
    result = await db.execute(
        select(
            LessonBlock.id,
            func.avg(QuizResult.best_score * 100.0 / QuizResult.max_score).label("avg_score_pct"),
            func.count(QuizResult.id).label("attempt_count"),
            func.sum(func.cast(QuizResult.passed, Integer)).label("passed_count"),
        )
        .join(QuizResult, QuizResult.lesson_block_id == LessonBlock.id)
        .where(LessonBlock.type == "quiz")
        .group_by(LessonBlock.id)
    )
    rows = result.all()
    return [
        {
            "lesson_block_id": r.id,
            "avg_score_pct": round(float(r.avg_score_pct or 0), 1),
            "attempt_count": r.attempt_count,
            "passed_count": r.passed_count or 0,
        }
        for r in rows
    ]


async def get_dropoff(db: AsyncSession) -> list:
    """Lessons ranked by lowest completion count (potential drop-off points)."""
    result = await db.execute(
        select(
            Lesson.id,
            Lesson.title,
            func.count(UserProgress.id).label("completed_count"),
        )
        .outerjoin(UserProgress, UserProgress.lesson_id == Lesson.id)
        .where(Lesson.is_published == True)
        .group_by(Lesson.id, Lesson.title)
        .order_by(func.count(UserProgress.id).asc())
        .limit(20)
    )
    rows = result.all()
    return [
        {"lesson_id": r.id, "lesson_title": r.title, "completed_count": r.completed_count}
        for r in rows
    ]
