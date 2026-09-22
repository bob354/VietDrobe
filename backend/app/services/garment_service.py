from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.garment import Garment


class GarmentService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_by_id(self, garment_id: str) -> Garment | None:
        result = await self.db.execute(
            select(Garment).where(Garment.id == garment_id)
        )
        return result.scalar_one_or_none()

    async def get_by_ids(self, garment_ids: list[str]) -> list[Garment]:
        if not garment_ids:
            return []
        result = await self.db.execute(
            select(Garment).where(Garment.id.in_(garment_ids))
        )
        return list(result.scalars().all())

    async def get_list(
        self,
        category: str | None = None,
        era: str | None = None,
        is_traditional: bool | None = None,
        occasion: str | None = None,
        gender: str | None = None,
        search: str | None = None,
        limit: int = 100,
        offset: int = 0,
    ) -> tuple[list[Garment], int]:
        query = select(Garment)

        if category:
            query = query.where(Garment.category == category)
        if era:
            query = query.where(Garment.era == era)
        if is_traditional is not None:
            query = query.where(Garment.is_traditional == is_traditional)
        if gender and gender != "unisex":
            query = query.where(
                (Garment.gender_fit == gender) | (Garment.gender_fit == "unisex")
            )
        if search:
            search_fmt = f"%{search.lower()}%"
            query = query.where(
                func.lower(Garment.display_name).like(search_fmt)
                | func.lower(Garment.type).like(search_fmt)
            )

        # Count total
        count_query = select(func.count()).select_from(query.subquery())
        total = (await self.db.execute(count_query)).scalar_one()

        # Fetch page
        query = query.order_by(Garment.category, Garment.display_name).limit(limit).offset(offset)
        items = (await self.db.execute(query)).scalars().all()

        return list(items), total

    async def get_categories_count(self) -> list[dict]:
        query = (
            select(Garment.category, func.count(Garment.id))
            .group_by(Garment.category)
            .order_by(func.count(Garment.id).desc())
        )
        result = await self.db.execute(query)
        return [{"category": cat, "count": count} for cat, count in result.all()]
