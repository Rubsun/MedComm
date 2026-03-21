import uuid

import aiofiles
from pathlib import Path
from fastapi import UploadFile, HTTPException

from backend.config import settings, BASE_DIR

ALLOWED_TYPES = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "video/mp4": "mp4",
    "video/webm": "webm",
}
MAX_SIZE_BYTES = 50 * 1024 * 1024  # 50 MB


async def save_file(file: UploadFile) -> str:
    """Save uploaded file and return its URL path."""
    if file.content_type not in ALLOWED_TYPES:
        raise HTTPException(status_code=400, detail=f"File type '{file.content_type}' not allowed")

    content = await file.read()
    if len(content) > MAX_SIZE_BYTES:
        raise HTTPException(status_code=400, detail="File too large (max 50 MB)")

    ext = ALLOWED_TYPES[file.content_type]
    filename = f"{uuid.uuid4()}.{ext}"
    media_path = BASE_DIR / settings.media_dir
    media_path.mkdir(exist_ok=True)
    filepath = media_path / filename

    async with aiofiles.open(str(filepath), "wb") as f:
        await f.write(content)

    return f"/media/{filename}"
