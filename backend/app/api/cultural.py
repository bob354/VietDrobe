from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.schemas import CulturalCheckRequest, CulturalCheckResponse, CulturalLoreResponse
from app.services.cultural_service import CulturalService
from app.services.garment_service import GarmentService

router = APIRouter(prefix="/cultural", tags=["Cultural"])

@router.post("/check", response_model=CulturalCheckResponse)
async def check_cultural_integrity(
    req: CulturalCheckRequest,
    db: AsyncSession = Depends(get_db),
):
    garment_service = GarmentService(db)
    cultural_service = CulturalService(db)

    garments = await garment_service.get_by_ids(req.garment_ids)
    if not garments:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No valid garments found for provided IDs",
        )

    return await cultural_service.check_combination(garments)

@router.get("/lore/{garment_type}", response_model=CulturalLoreResponse)
async def get_cultural_lore(garment_type: str, db: AsyncSession = Depends(get_db)):
    cultural_service = CulturalService(db)
    lore = await cultural_service.get_lore(garment_type)
    if not lore:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Cultural lore for '{garment_type}' not found",
        )
    return lore
