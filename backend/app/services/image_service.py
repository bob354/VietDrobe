from pathlib import Path
from app.config import get_settings

settings = get_settings()

class ImageService:
    def __init__(self, storage_path: str | None = None):
        self.storage_path = Path(storage_path or settings.storage_path)
        self.storage_path.mkdir(parents=True, exist_ok=True)

    def get_image_path(self, relative_path: str) -> Path:
        """Resolve full filesystem path for an image."""
        clean_path = relative_path.lstrip("/\\")
        source_path = self.storage_path / clean_path
        cleaned_artwork = self.storage_path / "clean" / clean_path
        return cleaned_artwork if cleaned_artwork.is_file() else source_path

    @staticmethod
    def get_public_url(relative_path: str) -> str:
        """Return the preferred public URL for supplied garment artwork."""
        clean_path = relative_path.lstrip("/\\").replace("\\", "/")
        cleaned_artwork = Path(settings.storage_path) / "clean" / clean_path
        served_path = f"clean/{clean_path}" if cleaned_artwork.is_file() else clean_path
        return f"/api/v1/images/{served_path}"
