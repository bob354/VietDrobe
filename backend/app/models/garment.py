import enum
import uuid
from datetime import datetime

from sqlalchemy import Boolean, DateTime, Float, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base
from app.models.types import JSONType


class GarmentCategory(enum.StrEnum):
    traditional_top = "traditional_top"
    traditional_bottom = "traditional_bottom"
    traditional_full = "traditional_full"
    modern_top = "modern_top"
    modern_bottom = "modern_bottom"
    headwear = "headwear"
    footwear = "footwear"
    accessory = "accessory"


class Garment(Base):
    __tablename__ = "garments"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )

    # --- Classification (inspired by wardrowbe type/subtype) ---
    category: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    type: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    subtype: Mapped[str | None] = mapped_column(String(50))
    display_name: Mapped[str] = mapped_column(String(100), nullable=False)
    display_name_en: Mapped[str | None] = mapped_column(String(100))

    # --- Images ---
    image_path: Mapped[str] = mapped_column(String(500), nullable=False)
    thumbnail_path: Mapped[str | None] = mapped_column(String(500))

    # --- Fashion attributes (from wardrowbe) ---
    primary_color: Mapped[str | None] = mapped_column(String(50))
    colors: Mapped[dict | None] = mapped_column(JSONType, default=list)
    pattern: Mapped[str | None] = mapped_column(String(50))
    material: Mapped[str | None] = mapped_column(String(50))

    # --- Vietnamese cultural attributes (NEW) ---
    era: Mapped[str | None] = mapped_column(String(50), index=True)
    region: Mapped[str | None] = mapped_column(String(50))
    gender_fit: Mapped[str | None] = mapped_column(String(20))
    cultural_tier: Mapped[str | None] = mapped_column(String(50))
    formality: Mapped[str | None] = mapped_column(String(50))

    # --- Cultural lore (NEW) ---
    cultural_description: Mapped[str | None] = mapped_column(Text)
    cultural_notes: Mapped[dict | None] = mapped_column(JSONType)

    # --- Remix metadata ---
    is_traditional: Mapped[bool] = mapped_column(Boolean, default=True, index=True)
    remix_tags: Mapped[dict | None] = mapped_column(JSONType, default=list)
    compatible_occasions: Mapped[dict | None] = mapped_column(JSONType, default=list)

    # --- Lifecycle ---
    is_preset: Mapped[bool] = mapped_column(Boolean, default=True)

    # --- Rental attributes ---
    rental_price_per_day: Mapped[float | None] = mapped_column(Float, default=None)
    deposit_per_item: Mapped[float | None] = mapped_column(Float, default=None)
    available_sizes: Mapped[dict | None] = mapped_column(JSONType, default=list)
    stock_quantity: Mapped[int] = mapped_column(Integer, default=1)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now()
    )

    # Relationships
    outfit_items: Mapped[list["OutfitItem"]] = relationship(
        "OutfitItem", back_populates="garment", cascade="all, delete-orphan"
    )

    def __repr__(self) -> str:
        return f"<Garment {self.display_name} ({self.type})>"


# Avoid circular import — OutfitItem imported at runtime via __init__.py
from app.models.outfit import OutfitItem  # noqa: E402, F811
