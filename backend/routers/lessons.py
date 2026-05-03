from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from backend.dependencies import get_db, require_admin, get_optional_admin
from backend.models.content import Course, Lesson, LessonBlock, Module, Program
from backend.models.user import User
from backend.schemas.content import (
    LessonCreate, LessonUpdate, LessonOut,
    BlockCreate, BlockUpdate, BlockOut, ReorderItem,
)
from backend.services.slug import auto_slug

router = APIRouter(prefix="/api/lessons", tags=["lessons"])


@router.get("", response_model=list[LessonOut])
async def list_lessons(
    module_id: int | None = None,
    db: AsyncSession = Depends(get_db),
    is_admin: bool = Depends(get_optional_admin),
):
    query = select(Lesson).order_by(Lesson.sort_order)
    if module_id is not None:
        query = query.where(Lesson.module_id == module_id)
    if not is_admin:
        # каскадная видимость по всей иерархии
        query = (
            query.join(Module, Module.id == Lesson.module_id)
            .join(Course, Course.id == Module.course_id)
            .join(Program, Program.id == Course.program_id)
            .where(
                Lesson.is_published.is_(True),
                Module.is_published.is_(True),
                Course.is_published.is_(True),
                Program.is_published.is_(True),
            )
        )
    result = await db.execute(query)
    return result.scalars().all()


@router.post("", response_model=LessonOut, status_code=201)
async def create_lesson(
    body: LessonCreate,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin),
):
    payload = body.model_dump()
    if not payload.get("slug"):
        payload["slug"] = auto_slug("lesson")
    lesson = Lesson(**payload)
    db.add(lesson)
    await db.commit()
    await db.refresh(lesson)
    return lesson


@router.get("/{lesson_id}", response_model=LessonOut)
async def get_lesson(
    lesson_id: int,
    db: AsyncSession = Depends(get_db),
    is_admin: bool = Depends(get_optional_admin),
):
    lesson = await db.get(Lesson, lesson_id)
    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson not found")
    if not is_admin:
        if not lesson.is_published:
            raise HTTPException(status_code=404, detail="Lesson not found")
        module = await db.get(Module, lesson.module_id)
        if not module or not module.is_published:
            raise HTTPException(status_code=404, detail="Lesson not found")
        course = await db.get(Course, module.course_id)
        if not course or not course.is_published:
            raise HTTPException(status_code=404, detail="Lesson not found")
        program = await db.get(Program, course.program_id)
        if not program or not program.is_published:
            raise HTTPException(status_code=404, detail="Lesson not found")
    return lesson


@router.put("/{lesson_id}", response_model=LessonOut)
async def update_lesson(
    lesson_id: int,
    body: LessonUpdate,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin),
):
    lesson = await db.get(Lesson, lesson_id)
    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson not found")
    for field, value in body.model_dump(exclude_unset=True).items():
        setattr(lesson, field, value)
    await db.commit()
    await db.refresh(lesson)
    return lesson


# reorder MUST come before /{lesson_id}/publish
@router.patch("/reorder")
async def reorder_lessons(
    items: list[ReorderItem],
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin),
):
    for item in items:
        lesson_obj = await db.get(Lesson, item.id)
        if lesson_obj:
            lesson_obj.sort_order = item.sort_order
    await db.commit()
    return {"ok": True}


@router.patch("/{lesson_id}/publish", response_model=LessonOut)
async def toggle_publish(
    lesson_id: int,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin),
):
    lesson = await db.get(Lesson, lesson_id)
    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson not found")
    lesson.is_published = not lesson.is_published
    await db.commit()
    await db.refresh(lesson)
    return lesson


@router.delete("/{lesson_id}", status_code=204)
async def delete_lesson(
    lesson_id: int,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin),
):
    lesson = await db.get(Lesson, lesson_id)
    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson not found")
    await db.delete(lesson)
    await db.commit()


# --- BLOCKS ---

@router.get("/{lesson_id}/blocks", response_model=list[BlockOut])
async def list_blocks(lesson_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(LessonBlock)
        .where(LessonBlock.lesson_id == lesson_id)
        .order_by(LessonBlock.sort_order)
    )
    return result.scalars().all()


@router.post("/{lesson_id}/blocks", response_model=BlockOut, status_code=201)
async def create_block(
    lesson_id: int,
    body: BlockCreate,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin),
):
    lesson = await db.get(Lesson, lesson_id)
    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson not found")
    block = LessonBlock(lesson_id=lesson_id, **body.model_dump())
    db.add(block)
    await db.commit()
    await db.refresh(block)
    return block


@router.put("/{lesson_id}/blocks/{block_id}", response_model=BlockOut)
async def update_block(
    lesson_id: int,
    block_id: int,
    body: BlockUpdate,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin),
):
    block = await db.get(LessonBlock, block_id)
    if not block or block.lesson_id != lesson_id:
        raise HTTPException(status_code=404, detail="Block not found")
    for field, value in body.model_dump(exclude_unset=True).items():
        setattr(block, field, value)
    await db.commit()
    await db.refresh(block)
    return block


@router.delete("/{lesson_id}/blocks/{block_id}", status_code=204)
async def delete_block(
    lesson_id: int,
    block_id: int,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin),
):
    block = await db.get(LessonBlock, block_id)
    if not block or block.lesson_id != lesson_id:
        raise HTTPException(status_code=404, detail="Block not found")
    await db.delete(block)
    await db.commit()


@router.patch("/{lesson_id}/blocks/reorder")
async def reorder_blocks(
    lesson_id: int,
    items: list[ReorderItem],
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin),
):
    for item in items:
        block = await db.get(LessonBlock, item.id)
        if block and block.lesson_id == lesson_id:
            block.sort_order = item.sort_order
    await db.commit()
    return {"ok": True}
