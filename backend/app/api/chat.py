from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import async_session_maker
from app.models.garment import Garment, GarmentType
from app.models.cultural_rule import CulturalRule
from app.schemas import ChatRequest, ChatResponse, GarmentSuggestion, CulturalCardInfo
from app.services.ai_service import AIService, load_prompt
from app.config import get_settings

router = APIRouter(prefix="/chat", tags=["Chat"])
settings = get_settings()
ai_service = AIService()

async def get_db():
    async with async_session_maker() as session:
        yield session

@router.post("", response_model=ChatResponse)
async def chat_with_assistant(request: ChatRequest, db: AsyncSession = Depends(get_db)):
    # 1. Load cultural knowledge once per type, then physical inventory.
    result = await db.execute(select(Garment))
    garments = result.scalars().all()
    type_result = await db.execute(select(GarmentType))
    garment_types = type_result.scalars().all()
    garment_map = {g.id: g for g in garments}
    
    catalog_lines = ["KIẾN THỨC LOẠI TRANG PHỤC:"]
    for garment_type in garment_types:
        catalog_lines.append(
            f"- {garment_type.type_id} | {garment_type.name_vi} | "
            f"Thời kỳ: {garment_type.era or 'Chưa rõ'} | "
            f"Mô tả văn hóa: {garment_type.cultural_description or 'Không có'}"
        )
    catalog_lines.append("KHO MẪU CÓ THỂ THUÊ:")
    for g in garments:
        price_str = f"{int(g.rental_price_per_day):,}đ/ngày" if g.rental_price_per_day else "150,000đ/ngày"
        deposit_str = f"{int(g.deposit_per_item):,}đ" if g.deposit_per_item else "45,000đ"
        sizes = ", ".join(g.available_sizes) if isinstance(g.available_sizes, list) else "S, M, L, XL"
        catalog_lines.append(
            f"- ID: {g.id} | Tên: {g.display_name} | Loại: {g.parent_type_id} | "
            f"Màu: {g.primary_color or 'Chưa rõ'} | Chất liệu: {g.material or 'Chưa rõ'} | "
            f"Giá thuê: {price_str} | Cọc: {deposit_str} | Size: {sizes}"
        )
    catalog_str = "\n".join(catalog_lines)

    # 2. Load Cultural Rules
    rules_result = await db.execute(select(CulturalRule))
    cultural_rules = rules_result.scalars().all()
    rules_lines = []
    for r in cultural_rules:
        rules_lines.append(f"- [{r.severity.upper()}] ({r.rule_type}): {r.message_vi}")
    rules_str = "\n".join(rules_lines) if rules_lines else "Tuân thủ tính trang nghiêm nơi thờ tự, không xốc xếch tà áo, phối quần kín đáo."

    # 3. Resolve Current Canvas Outfit
    canvas_lines = []
    if request.context and request.context.canvas_garment_ids:
        for gid in request.context.canvas_garment_ids:
            g = garment_map.get(gid)
            if g:
                canvas_lines.append(f"• {g.display_name} (ID: {g.id}, Loại: {g.category}, Thời kỳ: {g.era or 'N/A'})")
            else:
                canvas_lines.append(f"• ID: {gid}")
    
    canvas_str = "\n".join(canvas_lines) if canvas_lines else "Khung Canvas hiện tại đang trống (người dùng chưa chọn món nào)."

    # 4. Prepare Sliding Window Message History (Last 6 turns)
    # Filter out empty or old fallback messages to avoid prompt pollution
    fallback_substr = "sẵn sàng tư vấn về toàn bộ 17 trang phục di sản"
    recent_raw = [m for m in request.messages if fallback_substr not in m.content][-6:]

    formatted_messages = []
    for msg in recent_raw:
        role = "user" if msg.role.lower() in ("user", "human") else "assistant"
        formatted_messages.append({"role": role, "content": msg.content})

    # If context notes exist (occasion/location/style), append context hint to last message
    if request.context:
        ctx_details = []
        if request.context.occasion:
            ctx_details.append(f"Dịp: {request.context.occasion}")
        if request.context.location:
            ctx_details.append(f"Địa điểm: {request.context.location}")
        if request.context.style:
            ctx_details.append(f"Phong cách: {request.context.style}")
        if ctx_details and formatted_messages:
            last_msg = formatted_messages[-1]
            if last_msg["role"] == "user":
                last_msg["content"] += f"\n[Ghi chú bối cảnh: {', '.join(ctx_details)}]"

    # 5. Build Dynamic System Prompt
    system_prompt_template = load_prompt("chat_prompt")
    if not system_prompt_template:
        system_prompt_template = "Bạn là trợ lý Việt phục. Hãy trả lời bằng JSON.\n{GARMENT_CATALOG}\n{CURRENT_CANVAS}"

    system_prompt = (
        system_prompt_template
        .replace("{GARMENT_CATALOG}", catalog_str)
        .replace("{CULTURAL_RULES}", rules_str)
        .replace("{CURRENT_CANVAS}", canvas_str)
    )

    # 6. Call AI Service with multi-turn messages array
    ai_response = await ai_service.generate_chat_json(system_prompt, formatted_messages)
    if not ai_response:
        # Graceful fallback if API key or provider is unavailable
        return ChatResponse(
            reply="Chào bạn! Hiện tại mình đã sẵn sàng tư vấn về toàn bộ 17 trang phục di sản, quy tắc phối đồ và bảng giá thuê. Bạn có thể hỏi mình về nguồn gốc cổ phục, hoặc nhận xét bộ đồ đang phối trên Canvas nhé!",
            suggestions=[],
            cultural_cards=[],
            etiquette_tips=["Khi viếng đền chùa di tích, luôn ưu tiên lễ phục kín đáo như Áo Tấc, Ngũ Thân."]
        )

    # Parse suggestions with fallback validation against catalog
    valid_suggestions = []
    for s in ai_response.get("suggestions", []):
        gid = s.get("garment_id")
        dname = s.get("display_name")
        if not dname and gid in garment_map:
            dname = garment_map[gid].display_name
        if gid:
            valid_suggestions.append(GarmentSuggestion(
                garment_id=gid,
                display_name=dname or gid,
                reason=s.get("reason", "Phối hợp hài hòa"),
                etiquette_score=float(s.get("etiquette_score", 95))
            ))

    valid_cards = [
        CulturalCardInfo(
            title=c.get("title", "Di Sản Cổ Phục"),
            description=c.get("description", ""),
            era=c.get("era")
        ) for c in ai_response.get("cultural_cards", [])
    ]

    return ChatResponse(
        reply=ai_response.get("reply", "Chào bạn, mình có thể hỗ trợ gì cho bạn về cổ phục?"),
        suggestions=valid_suggestions,
        cultural_cards=valid_cards,
        etiquette_tips=ai_response.get("etiquette_tips", [])
    )
