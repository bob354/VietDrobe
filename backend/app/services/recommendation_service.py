import asyncio

from sqlalchemy.ext.asyncio import AsyncSession

from app.schemas import GarmentResponse, SuggestRequest, SuggestedOutfit
from app.services.cultural_service import CulturalService
from app.services.garment_service import GarmentService
from app.services.image_service import ImageService
from app.services.rag_service import RAGService

OCCASION_QUERY = {
    "tet": "Tết Nguyên Đán, du xuân, lễ hội đầu năm, dạo phố hoa",
    "ky_yeu": "chụp ảnh kỷ yếu, lễ tốt nghiệp, học đường",
    "dao_pho": "dạo phố cuối tuần, cà phê, gặp gỡ bạn bè",
    "le_hoi": "lễ hội dân gian, di tích, văn hóa truyền thống",
    "tiec_cuoi": "tiệc cưới, hỷ sự, dịp trang trọng",
}

STYLE_QUERY = {
    "streetwear": "streetwear năng động, sneaker, kính râm, phối hiện đại",
    "minimalist": "tối giản, trang nhã, màu sắc thanh thoát, chất liệu lụa",
    "y2k": "Y2K folk fusion, trẻ trung, màu sắc tươi sáng, phá cách",
    "thanh_lich": "cổ phong thanh lịch, nho nhã, giữ phom dáng truyền thống",
}

TOP_CATEGORIES = {"traditional_top", "modern_top"}
BOTTOM_CATEGORIES = {"traditional_bottom", "modern_bottom"}
ONE_PIECE_CATEGORIES = {"traditional_full"}
OPTIONAL_CATEGORIES = ("footwear", "headwear", "accessory")


class RecommendationService:
    def __init__(self, db: AsyncSession):
        self.garment_service = GarmentService(db)
        self.rag_service = RAGService()
        self.cultural_service = CulturalService(db)

    async def suggest(self, req: SuggestRequest) -> list[SuggestedOutfit]:
        garments, _ = await self.garment_service.get_list(
            gender=req.gender, limit=100
        )
        available = {
            garment.id: garment
            for garment in garments
            if garment.stock_quantity > 0
        }
        if not available:
            return []

        pinned = await self.garment_service.get_by_ids(req.pinned_garment_ids)
        pinned = [garment for garment in pinned if garment.id in available]
        query_parts = [
            OCCASION_QUERY.get(req.occasion, req.occasion),
            STYLE_QUERY.get(req.style, req.style),
            req.gender,
        ]
        for garment in pinned:
            query_parts.extend(
                [
                    garment.display_name,
                    garment.primary_color or "",
                    garment.material or "",
                    garment.pattern or "",
                    garment.garment_type.name_vi,
                ]
            )

        candidates = await asyncio.to_thread(
            self.rag_service.query_candidates,
            " ".join(part for part in query_parts if part),
            n_results=max(25, len(available)),
            gender=req.gender,
        )
        similarity = {
            candidate["id"]: candidate["similarity"]
            for candidate in candidates
            if candidate["id"] in available
        }
        for garment in pinned:
            similarity[garment.id] = max(similarity.get(garment.id, 0.0), 1.0)

        ranked = sorted(
            (available[item_id] for item_id in similarity),
            key=lambda garment: similarity[garment.id],
            reverse=True,
        )

        tops = [
            garment
            for garment in ranked
            if garment.category in TOP_CATEGORIES | ONE_PIECE_CATEGORIES
        ]
        bottoms = [
            garment for garment in ranked if garment.category in BOTTOM_CATEGORIES
        ]
        pinned_tops = [
            garment
            for garment in pinned
            if garment.category in TOP_CATEGORIES | ONE_PIECE_CATEGORIES
        ]
        pinned_bottoms = [
            garment for garment in pinned if garment.category in BOTTOM_CATEGORIES
        ]
        if pinned_tops:
            tops = pinned_tops
        if pinned_bottoms:
            bottoms = pinned_bottoms

        combinations = []
        for top in tops:
            bottom_choices = (
                [None]
                if top.category in ONE_PIECE_CATEGORIES and not pinned_bottoms
                else bottoms
            )
            for bottom in bottom_choices:
                core = [top]
                if bottom is not None:
                    core.append(bottom)
                core_ids = {garment.id for garment in core}
                core.extend(
                    garment
                    for garment in pinned
                    if garment.id not in core_ids
                )
                if len({garment.category for garment in core}) != len(core):
                    continue
                combinations.append(
                    (
                        sum(similarity.get(garment.id, 0.0) for garment in core),
                        top,
                        core,
                    )
                )

        combinations.sort(key=lambda combination: combination[0], reverse=True)
        outfits: list[SuggestedOutfit] = []
        seen_pairs: set[tuple[str, str | None]] = set()
        for _, top, core in combinations:
            bottom = next(
                (garment for garment in core if garment.category in BOTTOM_CATEGORIES),
                None,
            )
            pair_key = (top.id, bottom.id if bottom else None)
            if pair_key in seen_pairs:
                continue
            seen_pairs.add(pair_key)

            cultural_check = await self.cultural_service.check_combination(core)
            if not cultural_check.is_valid:
                continue

            outfit_items = list(core)
            occupied_categories = {garment.category for garment in outfit_items}
            for category in OPTIONAL_CATEGORIES:
                if category in occupied_categories:
                    continue
                for candidate in ranked:
                    if (
                        candidate.category != category
                        or candidate.id in {garment.id for garment in outfit_items}
                    ):
                        continue
                    proposed = [*outfit_items, candidate]
                    check = await self.cultural_service.check_combination(proposed)
                    if check.is_valid:
                        outfit_items.append(candidate)
                        occupied_categories.add(category)
                        cultural_check = check
                        break

            response_items = []
            for garment in outfit_items:
                item = GarmentResponse.model_validate(garment)
                item.image_url = ImageService.get_public_url(garment.image_path)
                item.thumbnail_url = ImageService.get_public_url(
                    garment.thumbnail_path or garment.image_path
                )
                response_items.append(item)

            outfits.append(
                SuggestedOutfit(
                    id=f"semantic-outfit-{len(outfits) + 1}",
                    name=f"Bộ phối {len(outfits) + 1}",
                    items=response_items,
                    cultural_integrity_score=cultural_check.score,
                    cultural_warning=(
                        "; ".join(
                            violation.message
                            for violation in cultural_check.violations
                            if violation.severity == "warning"
                        )
                        or None
                    ),
                )
            )
            if len(outfits) == 3:
                break

        return outfits
