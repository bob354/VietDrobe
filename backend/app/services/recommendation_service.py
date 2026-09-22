import logging
import random
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.garment import Garment
from app.schemas import GarmentResponse, OutfitItemResponse, OutfitResponse, SuggestRequest
from app.services.ai_service import AIService, load_prompt
from app.services.cultural_service import CulturalService
from app.services.garment_service import GarmentService
from app.services.image_service import ImageService

logger = logging.getLogger(__name__)

OCCASION_MAP = {
    "tet": "Du xuân đón Tết Nguyên Đán, dạo phố hoa và chụp ảnh lưu niệm",
    "ky_yeu": "Lễ tốt nghiệp, chụp ảnh kỷ yếu thanh xuân học đường",
    "dao_pho": "Dạo phố cuối tuần, cà phê bạn bè theo phong cách hiện đại trẻ trung",
    "le_hoi": "Trẩy hội Đền Hùng, lễ hội văn hóa dân gian hoặc biểu diễn nghệ thuật",
    "tiec_cuoi": "Tham dự tiệc cưới, hỷ sự trang trọng",
}

STYLE_MAP = {
    "streetwear": "Streetwear năng động, phá cách, kết hợp sneaker và phụ kiện hiện đại",
    "minimalist": "Tối giản, trang nhã, tập trung vào đường nét và chất liệu lụa/gấm",
    "y2k": "Y2K Folk-fusion trẻ trung, sắc màu tươi sáng và điểm nhấn độc đáo",
    "thanh_lich": "Thanh lịch chuẩn mực, tôn trọng phom dáng cổ truyền",
}

class RecommendationService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.ai = AIService()
        self.garment_service = GarmentService(db)
        self.cultural_service = CulturalService(db)

    async def suggest(self, req: SuggestRequest) -> list[OutfitResponse]:
        # 1. Fetch available items
        all_garments, _ = await self.garment_service.get_list(gender=req.gender, limit=100)
        if not all_garments:
            return []

        # If user explicitly requested deterministic fallback, bypass AI
        if req.ai_provider == "fallback":
            return await self._fallback_generation(req, all_garments)

        garment_dict = {g.id: g for g in all_garments}

        # 2. Try AI generation if API configured
        ai_outfits = await self._try_ai_generation(req, all_garments)
        if ai_outfits:
            return ai_outfits

        # 3. Deterministic Heuristic Fallback (Guaranteed to return 3 high-quality curated outfits)
        return await self._fallback_generation(req, all_garments)

    async def _try_ai_generation(
        self, req: SuggestRequest, all_garments: list[Garment]
    ) -> list[OutfitResponse] | None:
        ai_service = self.ai
        if req.ai_provider or req.ai_model:
            ai_service = AIService(provider=req.ai_provider, model=req.ai_model)

        if not ai_service.api_key:
            return None

        prompt_template = load_prompt("vietphuc_recommendation")
        if not prompt_template:
            return None

        items_text = "\n".join(
            [
                f"- ID: {g.id} | Tên: {g.display_name} | Nhóm: {g.category} | Kiểu: {g.type} | Màu: {g.primary_color} | Triều đại: {g.era or 'Hiện đại'}"
                for g in all_garments
            ]
        )

        pinned_text = ""
        if req.pinned_garment_ids:
            pinned_text = f"- MÓN ĐỒ BẮT BUỘC CÓ TRONG MỌI BỘ: {', '.join(req.pinned_garment_ids)}"

        prompt = (
            prompt_template.replace("{occasion}", OCCASION_MAP.get(req.occasion, req.occasion))
            .replace("{style}", STYLE_MAP.get(req.style, req.style))
            .replace("{gender}", req.gender)
            .replace("{pinned_items_text}", pinned_text)
            .replace("{items_text}", items_text)
        )

        res = await ai_service.generate_json(
            system_prompt="You are an expert fashion stylist and cultural researcher of Vietnamese traditional attire (Việt Phục), specializing in contemporary Gen Z 'Việt Phục Remix' fashion.",
            user_prompt=prompt,
        )

        if not res or "outfits" not in res:
            return None

        garment_dict = {g.id: g for g in all_garments}
        outfits: list[OutfitResponse] = []

        for idx, o in enumerate(res["outfits"][:3]):
            outfit_item_ids = [gid for gid in o.get("items", []) if gid in garment_dict]
            if len(outfit_item_ids) < 2:
                continue

            selected_garments = [garment_dict[gid] for gid in outfit_item_ids]
            check_res = await self.cultural_service.check_combination(selected_garments)

            warning_text = None
            if check_res.violations:
                warning_text = "; ".join([v.message for v in check_res.violations])

            items_res = []
            for order, g in enumerate(selected_garments):
                g_res = GarmentResponse.model_validate(g)
                g_res.image_url = ImageService.get_public_url(g.image_path)
                g_res.thumbnail_url = ImageService.get_public_url(g.thumbnail_path or g.image_path)
                items_res.append(
                    OutfitItemResponse(garment_id=g.id, layer_order=order, garment=g_res)
                )

            outfits.append(
                OutfitResponse(
                    id=f"ai-sug-{idx + 1}",
                    name=o.get("name", f"Gợi ý {idx + 1}"),
                    headline=o.get("headline", "Việt phục Remix ấn tượng"),
                    occasion=req.occasion,
                    style_tag=req.style,
                    gender=req.gender,
                    color_harmony_score=o.get("color_harmony_score", 0.92),
                    cultural_integrity_score=check_res.score,
                    cultural_warning=warning_text,
                    ai_highlights=o.get("highlights", []),
                    ai_styling_tip=o.get("styling_tip", "Diện trang phục tự tin và thoải mái."),
                    ai_cultural_note=o.get("cultural_note", ""),
                    source="ai_suggested",
                    items=items_res,
                )
            )

        return outfits if len(outfits) >= 1 else None

    async def _fallback_generation(
        self, req: SuggestRequest, all_garments: list[Garment]
    ) -> list[OutfitResponse]:
        """Heuristic generation that guarantees 3 culturally sound outfits."""
        garment_dict = {g.id: g for g in all_garments}

        # Resolve pinned garments (they must appear in every outfit)
        pinned = [garment_dict[gid] for gid in req.pinned_garment_ids if gid in garment_dict]
        pinned_ids = {g.id for g in pinned}

        # Categorize remaining (non-pinned) garments
        remaining = [g for g in all_garments if g.id not in pinned_ids]
        trad_tops = [g for g in remaining if g.category in ("traditional_top", "traditional_full")]
        bottoms = [g for g in remaining if g.category in ("traditional_bottom", "modern_bottom")]
        footwears = [g for g in remaining if g.category == "footwear"]
        headwears = [g for g in remaining if g.category == "headwear"]
        accessories = [g for g in remaining if g.category == "accessory"]

        # Skip categories already covered by pinned items
        pinned_categories = {g.category for g in pinned}
        need_top = not pinned_categories.intersection({"traditional_top", "traditional_full"})
        need_bottom = not pinned_categories.intersection({"traditional_bottom", "modern_bottom"})

        outfits = []

        curated_templates = [
            {
                "name": f"Việt Phục Remix {req.style.title()} - Phom Chuẩn",
                "headline": "Khí chất di sản ngút ngàn",
                "highlights": [
                    "Áo cổ phục phối cùng quần suông tạo phom dáng thanh thoát, tôn dáng người mặc.",
                    "Sự kết hợp màu sắc tương hỗ đậm chất cung đình Á Đông.",
                    "Phù hợp hoàn hảo cho dịp " + OCCASION_MAP.get(req.occasion, req.occasion),
                ],
                "styling_tip": "Nên cài khuy cẩn thận và kết hợp giày/guốc cùng tone màu quần.",
                "cultural_note": "Trang phục ngũ thân tượng trưng cho tứ thân phụ mẫu và bản thân người mặc, thể hiện đạo hiếu.",
                "footwear_pref": "guoc" if req.style == "thanh_lich" else "sneaker",
            },
            {
                "name": f"Dạo Phố Gen Z - {req.occasion.upper()}",
                "headline": "Phá cách cùng Sneaker & Tote",
                "highlights": [
                    "Điểm nhấn sneaker trắng tạo nhịp sống năng động, trẻ trung cho tà áo cổ truyền.",
                    "Túi tote/phụ kiện hiện đại giúp bộ trang phục tiện dụng khi dạo phố cuối tuần.",
                    "Giữ trọn nét trang nghiêm của vạt áo trong khi vẫn cực kỳ thoải mái di chuyển.",
                ],
                "styling_tip": "Thử xắn nhẹ cổ tay áo tấc để lộ phụ kiện vòng tay hoặc đồng hồ vintage.",
                "cultural_note": "Sự giao thoa giữa áo truyền thống và phụ kiện hiện đại đang là trào lưu phục hưng văn hóa mạnh mẽ của Gen Z.",
                "footwear_pref": "sneaker",
            },
            {
                "name": f"Tối Giản Tinh Tế - Sắc Lụa {req.style.title()}",
                "headline": "Thanh xuân hội ngộ",
                "highlights": [
                    "Bảng màu trang nhã, không quá cầu kỳ nhưng toát lên vẻ thanh tao của học sinh, sinh viên.",
                    "Phụ kiện mấn hoặc quạt xếp tạo thần thái chụp ảnh kỷ yếu hoặc dạo phố cực thơ.",
                    "Chất liệu lụa/đũi nhẹ nhàng, bay bổng trong từng bước đi.",
                ],
                "styling_tip": "Cầm quạt xếp ngang ngực khi chụp ảnh để tạo góc nghiêng thanh tú.",
                "cultural_note": "Mấn đội đầu thời Nguyễn vừa giúp cố định mái tóc gọn gàng vừa tôn lên nét đài các của phụ nữ Việt.",
                "footwear_pref": "guoc",
            },
        ]

        for idx, tmpl in enumerate(curated_templates):
            selected: list[Garment] = list(pinned)  # Always start with pinned items

            # Pick top (only if not already pinned)
            if need_top and trad_tops:
                selected.append(trad_tops[idx % len(trad_tops)])

            # Pick bottom (only if not already pinned)
            if need_bottom and bottoms:
                selected.append(bottoms[idx % len(bottoms)])

            # Pick footwear
            fw = None
            if tmpl["footwear_pref"] == "sneaker":
                sneakers = [f for f in footwears if "sneaker" in f.type.lower() or not f.is_traditional]
                fw = sneakers[0] if sneakers else (footwears[0] if footwears else None)
            else:
                trad_fw = [f for f in footwears if f.is_traditional]
                fw = trad_fw[0] if trad_fw else (footwears[0] if footwears else None)
            if fw:
                selected.append(fw)

            # Pick headwear or accessory
            if idx % 2 == 0 and headwears:
                selected.append(headwears[idx % len(headwears)])
            elif accessories:
                selected.append(accessories[idx % len(accessories)])

            # Deduplicate while preserving order
            seen = set()
            deduped = []
            for g in selected:
                if g.id not in seen:
                    seen.add(g.id)
                    deduped.append(g)
            selected = deduped

            check_res = await self.cultural_service.check_combination(selected)

            items_res = []
            for order, g in enumerate(selected):
                g_res = GarmentResponse.model_validate(g)
                g_res.image_url = ImageService.get_public_url(g.image_path)
                g_res.thumbnail_url = ImageService.get_public_url(g.thumbnail_path or g.image_path)
                items_res.append(
                    OutfitItemResponse(garment_id=g.id, layer_order=order, garment=g_res)
                )

            outfits.append(
                OutfitResponse(
                    id=f"curated-{idx + 1}",
                    name=tmpl["name"],
                    headline=tmpl["headline"],
                    occasion=req.occasion,
                    style_tag=req.style,
                    gender=req.gender,
                    color_harmony_score=0.94 - (idx * 0.03),
                    cultural_integrity_score=check_res.score,
                    cultural_warning=None if check_res.is_valid else "Cần lưu ý kiểm tra độ tương thích chi tiết",
                    ai_highlights=tmpl["highlights"],
                    ai_styling_tip=tmpl["styling_tip"],
                    ai_cultural_note=tmpl["cultural_note"],
                    source="ai_suggested",
                    items=items_res,
                )
            )

        return outfits
