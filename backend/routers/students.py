from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_

from backend.dependencies import get_db, require_admin
from backend.models.user import User
from backend.models.progress import Enrollment, UserProgress
from backend.schemas.auth import UserOut

router = APIRouter(prefix="/api/students", tags=["students"])


@router.get("", response_model=list[UserOut])
async def list_students(
    search: str | None = None,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin),
):
    query = select(User).where(User.role == "student").order_by(User.created_at.desc())
    if search:
        query = query.where(
            or_(
                User.email.ilike(f"%{search}%"),
                User.first_name.ilike(f"%{search}%"),
                User.last_name.ilike(f"%{search}%"),
            )
        )
    result = await db.execute(query)
    return result.scalars().all()


@router.get("/{student_id}/progress")
async def get_student_progress(
    student_id: int,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin),
):
    student = await db.get(User, student_id)
    if not student or student.role != "student":
        raise HTTPException(status_code=404, detail="Student not found")

    enrollments = (await db.execute(
        select(Enrollment).where(Enrollment.user_id == student_id)
    )).scalars().all()

    completed_lessons = (await db.execute(
        select(UserProgress).where(UserProgress.user_id == student_id)
    )).scalars().all()

    return {
        "student": {
            "id": student.id,
            "email": student.email,
            "first_name": student.first_name,
            "last_name": student.last_name,
        },
        "enrollments": [
            {"course_id": e.course_id, "enrolled_at": e.enrolled_at.isoformat()}
            for e in enrollments
        ],
        "completed_lessons": [
            {"lesson_id": p.lesson_id, "completed_at": p.completed_at.isoformat()}
            for p in completed_lessons
        ],
    }


@router.patch("/{student_id}/deactivate", response_model=UserOut)
async def deactivate_student(
    student_id: int,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin),
):
    student = await db.get(User, student_id)
    if not student or student.role != "student":
        raise HTTPException(status_code=404, detail="Student not found")
    student.is_active = not student.is_active
    await db.commit()
    await db.refresh(student)
    return student
