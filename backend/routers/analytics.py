from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from backend.dependencies import get_db, require_admin
from backend.models.user import User
from backend.services import analytics_service

router = APIRouter(prefix="/api/analytics", tags=["analytics"])


@router.get("/overview")
async def overview(db: AsyncSession = Depends(get_db), admin: User = Depends(require_admin)):
    return await analytics_service.get_overview(db)


@router.get("/completion")
async def completion(db: AsyncSession = Depends(get_db), admin: User = Depends(require_admin)):
    return await analytics_service.get_completion_rates(db)


@router.get("/quiz-results")
async def quiz_results(db: AsyncSession = Depends(get_db), admin: User = Depends(require_admin)):
    return await analytics_service.get_quiz_results(db)


@router.get("/dropoff")
async def dropoff(db: AsyncSession = Depends(get_db), admin: User = Depends(require_admin)):
    return await analytics_service.get_dropoff(db)
