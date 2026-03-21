from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from backend.dependencies import get_db, require_admin, get_optional_admin
from backend.models.content import Course
from backend.models.user import User
from backend.schemas.content import CourseCreate, CourseUpdate, CourseOut, ReorderItem

router = APIRouter(prefix="/api/courses", tags=["courses"])


@router.get("", response_model=list[CourseOut])
async def list_courses(
    program_id: int | None = None,
    db: AsyncSession = Depends(get_db),
    is_admin: bool = Depends(get_optional_admin),
):
    query = select(Course).order_by(Course.sort_order)
    if program_id is not None:
        query = query.where(Course.program_id == program_id)
    if not is_admin:
        query = query.where(Course.is_published == True)
    result = await db.execute(query)
    return result.scalars().all()


@router.post("", response_model=CourseOut, status_code=201)
async def create_course(
    body: CourseCreate,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin),
):
    course = Course(**body.model_dump())
    db.add(course)
    await db.commit()
    await db.refresh(course)
    return course


@router.get("/{course_id}", response_model=CourseOut)
async def get_course(
    course_id: int,
    db: AsyncSession = Depends(get_db),
    is_admin: bool = Depends(get_optional_admin),
):
    course = await db.get(Course, course_id)
    if not course or (not is_admin and not course.is_published):
        raise HTTPException(status_code=404, detail="Course not found")
    return course


@router.put("/{course_id}", response_model=CourseOut)
async def update_course(
    course_id: int,
    body: CourseUpdate,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin),
):
    course = await db.get(Course, course_id)
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    for field, value in body.model_dump(exclude_unset=True).items():
        setattr(course, field, value)
    await db.commit()
    await db.refresh(course)
    return course


# reorder MUST come before /{course_id}/publish to avoid "reorder" being parsed as an int
@router.patch("/reorder")
async def reorder_courses(
    items: list[ReorderItem],
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin),
):
    for item in items:
        c = await db.get(Course, item.id)
        if c:
            c.sort_order = item.sort_order
    await db.commit()
    return {"ok": True}


@router.patch("/{course_id}/publish", response_model=CourseOut)
async def toggle_publish(
    course_id: int,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin),
):
    course = await db.get(Course, course_id)
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    course.is_published = not course.is_published
    await db.commit()
    await db.refresh(course)
    return course


@router.delete("/{course_id}", status_code=204)
async def delete_course(
    course_id: int,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin),
):
    course = await db.get(Course, course_id)
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    await db.delete(course)
    await db.commit()
