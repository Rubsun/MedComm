from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from backend.dependencies import get_db, require_admin, get_optional_admin
from backend.models.content import Program
from backend.models.user import User
from backend.schemas.content import ProgramCreate, ProgramUpdate, ProgramOut, ReorderItem
from backend.services.slug import auto_slug

router = APIRouter(prefix="/api/programs", tags=["programs"])


@router.get("", response_model=list[ProgramOut])
async def list_programs(
    db: AsyncSession = Depends(get_db),
    is_admin: bool = Depends(get_optional_admin),
):
    query = select(Program).order_by(Program.sort_order)
    if not is_admin:
        query = query.where(Program.is_published == True)
    result = await db.execute(query)
    return result.scalars().all()


@router.post("", response_model=ProgramOut, status_code=201)
async def create_program(
    body: ProgramCreate,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin),
):
    payload = body.model_dump()
    if not payload.get("slug"):
        payload["slug"] = auto_slug("program")
    prog = Program(**payload)
    db.add(prog)
    await db.commit()
    await db.refresh(prog)
    return prog


@router.get("/{program_id}", response_model=ProgramOut)
async def get_program(
    program_id: int,
    db: AsyncSession = Depends(get_db),
    is_admin: bool = Depends(get_optional_admin),
):
    prog = await db.get(Program, program_id)
    if not prog or (not is_admin and not prog.is_published):
        raise HTTPException(status_code=404, detail="Program not found")
    return prog


@router.put("/{program_id}", response_model=ProgramOut)
async def update_program(
    program_id: int,
    body: ProgramUpdate,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin),
):
    prog = await db.get(Program, program_id)
    if not prog:
        raise HTTPException(status_code=404, detail="Program not found")
    for field, value in body.model_dump(exclude_unset=True).items():
        setattr(prog, field, value)
    await db.commit()
    await db.refresh(prog)
    return prog


# reorder MUST come before /{program_id}/publish to avoid "reorder" being parsed as an int
@router.patch("/reorder")
async def reorder_programs(
    items: list[ReorderItem],
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin),
):
    for item in items:
        prog = await db.get(Program, item.id)
        if prog:
            prog.sort_order = item.sort_order
    await db.commit()
    return {"ok": True}


@router.patch("/{program_id}/publish", response_model=ProgramOut)
async def toggle_publish(
    program_id: int,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin),
):
    prog = await db.get(Program, program_id)
    if not prog:
        raise HTTPException(status_code=404, detail="Program not found")
    prog.is_published = not prog.is_published
    await db.commit()
    await db.refresh(prog)
    return prog


@router.delete("/{program_id}", status_code=204)
async def delete_program(
    program_id: int,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin),
):
    prog = await db.get(Program, program_id)
    if not prog:
        raise HTTPException(status_code=404, detail="Program not found")
    await db.delete(prog)
    await db.commit()
