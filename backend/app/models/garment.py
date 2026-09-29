import enum
from datetime import datetime

from sqlalchemy import Boolean, DateTime, Float, ForeignKey, Integer, String, Text, func
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


class GarmentType(Base):
    """Cultural knowledge for one garment type; embed this record once for RAG."""

    __tablename__ = "garment_types"

    type_id: Mapped[str] = mapped_column(String(50), primary_key=True)
    name_vi: Mapped[str] = mapped_column(String(100), nullable=False)
    name_en: Mapped[str | None] = mapped_column(String(100))
    category: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    subtype: Mapped[str | None] = mapped_column(String(50))
    era: Mapped[str | None] = mapped_column(String(50), index=True)
    region: Mapped[str | None] = mapped_column(String(50))
    gender_fit: Mapped[str | None] = mapped_column(String(20))
    cultural_tier: Mapped[str | None] = mapped_column(String(50))
    formality: Mapped[str | None] = mapped_column(String(50))
    cultural_description: Mapped[str | None] = mapped_column(Text)
    historical_lore: Mapped[str | None] = mapped_column(Text)
    cultural_notes: Mapped[dict | None] = mapped_column(JSONType)
    rules: Mapped[list | None] = mapped_column(JSONType, default=list)
    is_traditional: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    remix_tags: Mapped[list | None] = mapped_column(JSONType, default=list)
    compatible_occasions: Mapped[list | None] = mapped_column(JSONType, default=list)

    inventory_items: Mapped[list["Garment"]] = relationship(
        "Garment", back_populates="garment_type"
    )


class Garment(Base):
    """Physical inventory SKU. `id` remains the public API identifier."""

    __tablename__ = "inventory_items"

    id: Mapped[str] = mapped_column("item_id", String(100), primary_key=True)
    parent_type_id: Mapped[str] = mapped_column(
        String(50), ForeignKey("garment_types.type_id"), nullable=False, index=True
    )
    display_name: Mapped[str] = mapped_column(String(100), nullable=False)
    display_name_en: Mapped[str | None] = mapped_column(String(100))
    image_path: Mapped[str] = mapped_column(String(500), nullable=False)
    thumbnail_path: Mapped[str | None] = mapped_column(String(500))
    primary_color: Mapped[str | None] = mapped_column(String(50))
    colors: Mapped[list | None] = mapped_column(JSONType, default=list)
    pattern: Mapped[str | None] = mapped_column(String(100))
    material: Mapped[str | None] = mapped_column(String(100))
    is_preset: Mapped[bool] = mapped_column(Boolean, default=True)
    rental_price_per_day: Mapped[float | None] = mapped_column(Float)
    deposit_per_item: Mapped[float | None] = mapped_column(Float)
    available_sizes: Mapped[list | None] = mapped_column(JSONType, default=list)
    stock_quantity: Mapped[int] = mapped_column(Integer, default=1, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    garment_type: Mapped[GarmentType] = relationship(
        "GarmentType", back_populates="inventory_items", lazy="joined"
    )
    outfit_items: Mapped[list["OutfitItem"]] = relationship(
        "OutfitItem", back_populates="garment", cascade="all, delete-orphan"
    )

    # Backward-compatible API attributes, sourced exclusively from the parent.
    @property
    def type(self) -> str:
        return self.parent_type_id

    @property
    def category(self) -> str:
        return self.garment_type.category

    @property
    def subtype(self) -> str | None:
        return self.garment_type.subtype

    @property
    def era(self) -> str | None:
        return self.garment_type.era

    @property
    def region(self) -> str | None:
        return self.garment_type.region

    @property
    def gender_fit(self) -> str | None:
        return self.garment_type.gender_fit

    @property
    def cultural_tier(self) -> str | None:
        return self.garment_type.cultural_tier

    @property
    def formality(self) -> str | None:
        return self.garment_type.formality

    @property
    def cultural_description(self) -> str | None:
        return self.garment_type.cultural_description

    @property
    def cultural_notes(self) -> dict | None:
        return self.garment_type.cultural_notes

    @property
    def is_traditional(self) -> bool:
        return self.garment_type.is_traditional

    @property
    def remix_tags(self) -> list:
        return self.garment_type.remix_tags or []

    @property
    def compatible_occasions(self) -> list:
        return self.garment_type.compatible_occasions or []


from app.models.outfit import OutfitItem  # noqa: E402, F811
