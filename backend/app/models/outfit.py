import uuid
from datetime import datetime

from sqlalchemy import DateTime, Float, ForeignKey, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base
from app.models.types import JSONType


class Outfit(Base):
    __tablename__ = "outfits"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )

    name: Mapped[str] = mapped_column(String(200), nullable=False)
    headline: Mapped[str | None] = mapped_column(String(200))
    occasion: Mapped[str | None] = mapped_column(String(50))
    style_tag: Mapped[str | None] = mapped_column(String(50))
    gender: Mapped[str | None] = mapped_column(String(20))

    # Legacy optional analysis fields retained for existing database records.
    color_harmony_score: Mapped[float | None] = mapped_column(Float)
    cultural_integrity_score: Mapped[float | None] = mapped_column(Float)
    cultural_warning: Mapped[str | None] = mapped_column(Text)
    ai_highlights: Mapped[dict | None] = mapped_column(JSONType)
    ai_styling_tip: Mapped[str | None] = mapped_column(Text)
    ai_cultural_note: Mapped[str | None] = mapped_column(Text)

    source: Mapped[str] = mapped_column(
        String(20), default="user_created"
    )  # "suggested" | "user_created"

    created_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now()
    )

    # Relationships
    items: Mapped[list["OutfitItem"]] = relationship(
        "OutfitItem",
        back_populates="outfit",
        cascade="all, delete-orphan",
        order_by="OutfitItem.layer_order",
    )

    def __repr__(self) -> str:
        return f"<Outfit {self.name}>"


class OutfitItem(Base):
    __tablename__ = "outfit_items"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    outfit_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("outfits.id", ondelete="CASCADE"), nullable=False
    )
    garment_id: Mapped[str] = mapped_column(
        String(100), ForeignKey("inventory_items.item_id", ondelete="CASCADE"), nullable=False
    )
    layer_order: Mapped[int] = mapped_column(Integer, default=0)

    # Relationships
    outfit: Mapped["Outfit"] = relationship("Outfit", back_populates="items")
    garment: Mapped["Garment"] = relationship("Garment", back_populates="outfit_items")

    def __repr__(self) -> str:
        return f"<OutfitItem outfit={self.outfit_id} garment={self.garment_id}>"


# Avoid circular — Garment imported at module level in garment.py
from app.models.garment import Garment  # noqa: E402, F811
