from pathlib import Path
from fastapi import APIRouter, HTTPException, status
from fastapi.responses import FileResponse

from app.services.image_service import ImageService

router = APIRouter(prefix="/images", tags=["Images"])

CONTENT_TYPES = {
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".webp": "image/webp",
    ".svg": "image/svg+xml",
}

@router.get("/{path:path}")
@router.head("/{path:path}")
async def get_image(path: str) -> FileResponse:
    image_service = ImageService()
    full_path = image_service.get_image_path(path)

    # Security check: ensure path is within storage directory
    try:
        if not full_path.resolve().is_relative_to(image_service.storage_path.resolve()):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid path")
    except Exception:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid path")

    if not full_path.exists() or not full_path.is_file():
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Image not found")

    ext = full_path.suffix.lower()
    if ext not in CONTENT_TYPES:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Unsupported file type")
    media_type = CONTENT_TYPES[ext]

    return FileResponse(
        path=str(full_path),
        media_type=media_type,
        headers={"Cache-Control": "public, max-age=86400"},
    )
