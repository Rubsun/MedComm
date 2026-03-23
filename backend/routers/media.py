from fastapi import APIRouter, Depends, UploadFile, File

from backend.dependencies import require_admin
from backend.models.user import User
from backend.services.storage_service import save_file

router = APIRouter(prefix="/api/media", tags=["media"])


@router.post("/upload")
async def upload_file(
    file: UploadFile = File(...),
    admin: User = Depends(require_admin),
):
    return await save_file(file)
