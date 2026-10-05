from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.schemas import (
    CreateOutfitRequest,
    OutfitResponse,
    SuggestRequest,
    SuggestResponse,
)
from app.services.cultural_service import CulturalService
from app.services.garment_service import GarmentService
from app.services.image_service import ImageService
from app.services.outfit_service import OutfitService
from app.services.rag_service import EmbeddingUnavailable
from app.services.recommendation_service import RecommendationService

router = APIRouter(prefix="/outfits", tags=["Outfits"])

def _enrich_outfit(outfit) -> OutfitResponse:
    res = OutfitResponse.model_validate(outfit)
    for item_res in res.items:
        if item_res.garment:
            if item_res.garment.image_path:
                item_res.garment.image_url = ImageService.get_public_url(item_res.garment.image_path)
            if item_res.garment.thumbnail_path:
                item_res.garment.thumbnail_url = ImageService.get_public_url(item_res.garment.thumbnail_path)
            else:
                item_res.garment.thumbnail_url = item_res.garment.image_url
    return res

@router.post("/suggest", response_model=SuggestResponse)
async def suggest_outfits(
    req: SuggestRequest,
    db: AsyncSession = Depends(get_db),
):
    service = RecommendationService(db)
    try:
        outfits = await service.suggest(req)
    except EmbeddingUnavailable:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Hệ thống tìm kiếm đang khởi tạo, vui lòng thử lại sau ít phút.",
        )
    return SuggestResponse(outfits=outfits)

@router.post("", response_model=OutfitResponse, status_code=status.HTTP_201_CREATED)
async def create_outfit(
    req: CreateOutfitRequest,
    db: AsyncSession = Depends(get_db),
):
    garment_service = GarmentService(db)
    cultural_service = CulturalService(db)
    outfit_service = OutfitService(db)

    garments = await garment_service.get_by_ids(req.garment_ids)
    if len(garments) < 2:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="At least 2 valid garments required to create an outfit",
        )

    # Use only validated IDs that actually exist in DB
    valid_ids = [g.id for g in garments]

    check_res = await cultural_service.check_combination(garments)
    warning = "; ".join([v.message for v in check_res.violations]) if check_res.violations else None

    outfit = await outfit_service.create_outfit(
        name=req.name,
        garment_ids=valid_ids,
        occasion=req.occasion,
        style_tag=req.style_tag,
        gender=req.gender,
        source="user_created",
        cultural_integrity_score=check_res.score,
        cultural_warning=warning,
    )
    return _enrich_outfit(outfit)

@router.get("/{outfit_id}", response_model=OutfitResponse)
async def get_outfit(outfit_id: str, db: AsyncSession = Depends(get_db)):
    outfit_service = OutfitService(db)
    outfit = await outfit_service.get_by_id(outfit_id)
    if not outfit:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Outfit not found")
    return _enrich_outfit(outfit)
