from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from backend.dependencies import get_db, require_admin
from backend.models.content import Module
from backend.models.user import User
from backend.schemas.content import ModuleCreate, ModuleUpdate, ModuleOut, ReorderItem

router = APIRouter(prefix="/api/modules", tags=["modules"])


@router.get("", response_model=list[ModuleOut])
async def list_modules(
    course_id: int | None = None,
    db: AsyncSession = Depends(get_db),
):
    query = select(Module).order_by(Module.sort_order)
    if course_id is not None:
        query = query.where(Module.course_id == course_id)
    result = await db.execute(query)
    return result.scalars().all()


@router.post("", response_model=ModuleOut, status_code=201)
async def create_module(
    body: ModuleCreate,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin),
):
    mod = Module(**body.model_dump())
    db.add(mod)
    await db.commit()
    await db.refresh(mod)
    return mod


@router.get("/{module_id}", response_model=ModuleOut)
async def get_module(module_id: int, db: AsyncSession = Depends(get_db)):
    mod = await db.get(Module, module_id)
    if not mod:
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
