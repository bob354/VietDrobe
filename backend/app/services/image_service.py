from pathlib import Path
from app.config import get_settings

settings = get_settings()

class ImageService:
    def __init__(self, storage_path: str | None = None):
        self.storage_path = Path(storage_path or settings.storage_path)
        self.storage_path.mkdir(parents=True, exist_ok=True)

    def get_image_path(self, relative_path: str) -> Path:
        """Resolve full filesystem path for an image."""
        # Sanitize relative path
        clean_path = relative_path.lstrip("/\\")
        return self.storage_path / clean_path

    @staticmethod
    def get_public_url(relative_path: str) -> str:
        """Return relative URL to serve image from API."""
        clean_path = relative_path.lstrip("/\\").replace("\\", "/")
        return f"/api/v1/images/{clean_path}"
