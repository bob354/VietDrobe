import logging
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.cultural_rule import CulturalRule
from app.models.garment import Garment
from app.schemas import CulturalCheckResponse, CulturalLoreResponse, CulturalViolation
from app.services.ai_service import AIService, load_prompt

logger = logging.getLogger(__name__)

class CulturalService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.ai = AIService()

    async def check_combination(self, garments: list[Garment]) -> CulturalCheckResponse:
        violations: list[CulturalViolation] = []
        score = 1.0

        garment_types = {g.type.lower() for g in garments}
        categories = {g.category for g in garments}
        gender_fits = {g.gender_fit for g in garments if g.gender_fit}
        is_traditional_present = any(g.is_traditional for g in garments)

        # Rule 1: Must have at least 1 traditional piece in a Việt phục Remix outfit
        if not is_traditional_present:
            violations.append(
                CulturalViolation(
                    severity="warning",
                    message="Outfit chưa có món Việt phục truyền thống chủ đạo để tạo điểm nhấn di sản.",
                )
            )
            score -= 0.2

        # Rule 2: Áo dài/Áo tấc/Áo ngũ thân/Áo Nhật bình phải có trang phục dưới
        tops_requiring_bottom = {"ao_tac", "ao_nhat_binh", "ao_ngu_than", "ao_giao_linh", "ao_dai"}
        has_top_requiring_bottom = bool(garment_types.intersection(tops_requiring_bottom))
        has_bottom = "traditional_bottom" in categories or "modern_bottom" in categories or "traditional_full" in categories

        if has_top_requiring_bottom and not has_bottom:
            violations.append(
                CulturalViolation(
                    severity="error",
                    message="Vi phạm nghiêm trọng: Áo dài, Áo tấc hoặc Áo ngũ thân bắt buộc phải mặc kèm quần dài hoặc váy kín đáo.",
                )
            )
            score -= 0.5

        # Rule 3: Database rules evaluation
        rules_res = await self.db.execute(select(CulturalRule))
        db_rules = rules_res.scalars().all()

        for rule in db_rules:
            cond = rule.condition or {}
            target_type = cond.get("garment_type")
            incompatible_cat = cond.get("with_category")
            incompatible_type = cond.get("with_type")
            required_gender = cond.get("gender_fit")

            # Check if target garment type is present in the outfit
            if target_type and target_type not in garment_types:
                continue

            # Check gender_fit condition
            if required_gender and required_gender not in gender_fits:
                continue

            triggered = False
            if rule.rule_type == "required_with":
                # "required_with" means the companion MUST be present; violation if MISSING
                if incompatible_cat and incompatible_cat not in categories:
                    triggered = True
                elif incompatible_type and incompatible_type not in garment_types:
                    triggered = True
            else:
                # "incompatible" / "warning" — violation if the companion IS present
                if incompatible_cat and incompatible_cat in categories:
                    triggered = True
                elif incompatible_type and incompatible_type in garment_types:
                    triggered = True

            if triggered:
                violations.append(
                    CulturalViolation(
                        severity=rule.severity,
                        message=rule.message_vi,
                        rule_id=str(rule.id),
                    )
                )
                score -= 0.25 if rule.severity == "error" else 0.1

        # Check with AI if key is available and no fatal errors yet
        if not any(v.severity == "error" for v in violations) and self.ai.api_key:
            items_desc = "\n".join(
                [f"- {g.display_name} ({g.type}, {g.category}, {g.era or 'Hiện đại'})" for g in garments]
            )
            prompt = load_prompt("cultural_check").replace("{items_text}", items_desc)
            ai_res = await self.ai.generate_json(
                system_prompt="You are an expert cultural advisor and researcher specializing in Vietnamese traditional attire.",
                user_prompt=prompt,
            )
            if ai_res and isinstance(ai_res, dict):
                for v in ai_res.get("violations", []):
                    if isinstance(v, dict):
                        violations.append(
                            CulturalViolation(
                                severity=v.get("severity", "info"),
                                message=v.get("message", ""),
                            )
                        )
                if "score" in ai_res:
                    try:
                        ai_score = float(str(ai_res["score"]).replace("%", ""))
                        if ai_score > 1:
                            ai_score = ai_score / 100.0
                        score = min(score, ai_score)
                    except (ValueError, TypeError):
                        pass

        final_score = max(0.0, min(1.0, score))
        is_valid = not any(v.severity == "error" for v in violations)

        return CulturalCheckResponse(
            is_valid=is_valid,
            score=final_score,
            violations=violations,
        )

    async def get_lore(self, garment_type: str) -> CulturalLoreResponse | None:
        result = await self.db.execute(
            select(Garment).where(Garment.type == garment_type).limit(1)
        )
        garment = result.scalar_one_or_none()
        if not garment:
            return None

        return CulturalLoreResponse(
            garment_type=garment.type,
            display_name=garment.display_name,
            era=garment.era,
            region=garment.region,
            cultural_description=garment.cultural_description,
            cultural_notes=garment.cultural_notes,
        )
