from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from backend.dependencies import get_db, require_admin, get_optional_admin
from backend.models.content import Course, Module, Program
from backend.models.user import User
from backend.schemas.content import ModuleCreate, ModuleUpdate, ModuleOut, ReorderItem
from backend.services.slug import auto_slug

router = APIRouter(prefix="/api/modules", tags=["modules"])


@router.get("", response_model=list[ModuleOut])
async def list_modules(
    course_id: int | None = None,
    db: AsyncSession = Depends(get_db),
    is_admin: bool = Depends(get_optional_admin),
):
    query = select(Module).order_by(Module.sort_order)
    if course_id is not None:
        query = query.where(Module.course_id == course_id)
    if not is_admin:
        # студенту видны только опубликованные модули, у которых опубликован курс и программа
        query = (
            query.join(Course, Course.id == Module.course_id)
            .join(Program, Program.id == Course.program_id)
            .where(
                Module.is_published.is_(True),
                Course.is_published.is_(True),
                Program.is_published.is_(True),
            )
        )
    result = await db.execute(query)
    return result.scalars().all()


@router.post("", response_model=ModuleOut, status_code=201)
async def create_module(
    body: ModuleCreate,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin),
):
    payload = body.model_dump()
    if not payload.get("slug"):
        payload["slug"] = auto_slug("module")
    mod = Module(**payload)
    db.add(mod)
    await db.commit()
    await db.refresh(mod)
    return mod


@router.get("/{module_id}", response_model=ModuleOut)
async def get_module(
    module_id: int,
    db: AsyncSession = Depends(get_db),
    is_admin: bool = Depends(get_optional_admin),
):
    mod = await db.get(Module, module_id)
    if not mod:
        raise HTTPException(status_code=404, detail="Module not found")
    if not is_admin:
        if not mod.is_published:
            raise HTTPException(status_code=404, detail="Module not found")
        course = await db.get(Course, mod.course_id)
        if not course or not course.is_published:
            raise HTTPException(status_code=404, detail="Module not found")
        program = await db.get(Program, course.program_id) if course else None
        if not program or not program.is_published:
            raise HTTPException(status_code=404, detail="Module not found")
    return mod


@router.put("/{module_id}", response_model=ModuleOut)
async def update_module(
    module_id: int,
    body: ModuleUpdate,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin),
):
    mod = await db.get(Module, module_id)
    if not mod:
        raise HTTPException(status_code=404, detail="Module not found")
    for field, value in body.model_dump(exclude_unset=True).items():
        setattr(mod, field, value)
    await db.commit()
    await db.refresh(mod)
    return mod


# reorder MUST come before /{module_id}/lock to avoid "reorder" being parsed as int
@router.patch("/reorder")
async def reorder_modules(
    items: list[ReorderItem],
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin),
):
    for item in items:
        m = await db.get(Module, item.id)
        if m:
            m.sort_order = item.sort_order
    await db.commit()
    return {"ok": True}


@router.patch("/{module_id}/lock", response_model=ModuleOut)
async def toggle_lock(
    module_id: int,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin),
):
    mod = await db.get(Module, module_id)
    if not mod:
        raise HTTPException(status_code=404, detail="Module not found")
    mod.is_locked = not mod.is_locked
    await db.commit()
    await db.refresh(mod)
    return mod


@router.patch("/{module_id}/publish", response_model=ModuleOut)
async def toggle_publish(
    module_id: int,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin),
):
    mod = await db.get(Module, module_id)
    if not mod:
        raise HTTPException(status_code=404, detail="Module not found")
    mod.is_published = not mod.is_published
    await db.commit()
    await db.refresh(mod)
    return mod


@router.delete("/{module_id}", status_code=204)
async def delete_module(
    module_id: int,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin),
):
    mod = await db.get(Module, module_id)
    if not mod:
        raise HTTPException(status_code=404, detail="Module not found")
    await db.delete(mod)
    await db.commit()
