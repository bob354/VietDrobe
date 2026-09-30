import asyncio

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import async_session_maker
from app.models.garment import Garment
from app.schemas import ChatRequest, ChatResponse, GarmentResponse
from app.services.image_service import ImageService
from app.services.rag_service import RAGService

router = APIRouter(prefix="/chat", tags=["Chat"])
rag_service = RAGService()


async def get_db():
    async with async_session_maker() as session:
        yield session


@router.post("", response_model=ChatResponse)
async def search_garments(request: ChatRequest, db: AsyncSession = Depends(get_db)):
    query_parts = [
        message.content
        for message in reversed(request.messages)
        if message.role.lower() in ("user", "human")
    ][:3]
    if request.context:
        query_parts.extend(
            value
            for value in (
                request.context.occasion,
                request.context.location,
                request.context.style,
            )
            if value
        )

    if request.context and request.context.canvas_garment_ids:
        result = await db.execute(
            select(Garment).where(
                Garment.id.in_(request.context.canvas_garment_ids)
            )
        )
        for garment in result.scalars().all():
            query_parts.extend(
                [
                    garment.display_name,
                    garment.primary_color or "",
                    garment.material or "",
                    garment.garment_type.name_vi,
                ]
            )

    candidates = await asyncio.to_thread(
        rag_service.query_candidates,
        " ".join(query_parts),
    )
    candidate_ids = [candidate["id"] for candidate in candidates]
    if not candidate_ids:
        return ChatResponse(items=[])

    result = await db.execute(
        select(Garment).where(
            Garment.id.in_(candidate_ids),
            Garment.stock_quantity > 0,
        )
    )
    garments_by_id = {garment.id: garment for garment in result.scalars().all()}
    items = []
    for item_id in candidate_ids:
        garment = garments_by_id.get(item_id)
        if garment is None:
            continue
        item = GarmentResponse.model_validate(garment)
        item.image_url = ImageService.get_public_url(garment.image_path)
        item.thumbnail_url = ImageService.get_public_url(
            garment.thumbnail_path or garment.image_path
        )
        items.append(item)
    return ChatResponse(items=items)
