import uuid
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.outfit import Outfit, OutfitItem
from app.models.garment import Garment

class OutfitService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_by_id(self, outfit_id: str) -> Outfit | None:
        result = await self.db.execute(
            select(Outfit)
            .where(Outfit.id == outfit_id)
            .options(
                selectinload(Outfit.items).selectinload(OutfitItem.garment)
            )
        )
        return result.scalar_one_or_none()

    async def create_outfit(
        self,
        name: str,
        garment_ids: list[str],
        occasion: str | None = None,
        style_tag: str | None = None,
        gender: str | None = None,
        source: str = "user_created",
        headline: str | None = None,
        color_harmony_score: float | None = None,
        cultural_integrity_score: float | None = None,
        cultural_warning: str | None = None,
        ai_highlights: list[str] | None = None,
        ai_styling_tip: str | None = None,
        ai_cultural_note: str | None = None,
    ) -> Outfit:
        outfit = Outfit(
            id=str(uuid.uuid4()),
            name=name,
            headline=headline,
            occasion=occasion,
            style_tag=style_tag,
            gender=gender,
            source=source,
            color_harmony_score=color_harmony_score,
            cultural_integrity_score=cultural_integrity_score,
            cultural_warning=cultural_warning,
            ai_highlights=ai_highlights or [],
            ai_styling_tip=ai_styling_tip,
            ai_cultural_note=ai_cultural_note,
        )
        self.db.add(outfit)
        await self.db.flush()

        for idx, gid in enumerate(garment_ids):
            item = OutfitItem(
                id=str(uuid.uuid4()),
                outfit_id=outfit.id,
                garment_id=gid,
                layer_order=idx,
            )
            self.db.add(item)

        await self.db.commit()
        return await self.get_by_id(outfit.id)  # type: ignore
