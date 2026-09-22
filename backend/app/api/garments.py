from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.schemas import CategoryCount, GarmentListResponse, GarmentResponse
from app.services.garment_service import GarmentService
from app.services.image_service import ImageService

router = APIRouter(prefix="/garments", tags=["Garments"])

def _enrich_garment_response(item) -> GarmentResponse:
    res = GarmentResponse.model_validate(item)
    if res.image_path:
        res.image_url = ImageService.get_public_url(res.image_path)
    if res.thumbnail_path:
        res.thumbnail_url = ImageService.get_public_url(res.thumbnail_path)
    else:
        res.thumbnail_url = res.image_url
    return res

@router.get("", response_model=GarmentListResponse)
async def list_garments(
    db: AsyncSession = Depends(get_db),
    category: str | None = Query(None, description="Category filter"),
    era: str | None = Query(None, description="Era filter: nguyen, le, folk, modern"),
    is_traditional: bool | None = Query(None, description="True for traditional, False for modern"),
    gender: str | None = Query(None, description="nam, nu, unisex"),
    search: str | None = Query(None, description="Keyword search"),
    limit: int = Query(100, ge=1, le=200),
    offset: int = Query(0, ge=0),
):
    service = GarmentService(db)
    items, total = await service.get_list(
        category=category,
        era=era,
        is_traditional=is_traditional,
        gender=gender,
        search=search,
        limit=limit,
        offset=offset,
    )
    return GarmentListResponse(
        items=[_enrich_garment_response(item) for item in items],
        total=total,
    )

@router.get("/categories", response_model=list[CategoryCount])
async def list_categories(db: AsyncSession = Depends(get_db)):
    service = GarmentService(db)
    counts = await service.get_categories_count()
    return [CategoryCount(**c) for c in counts]

@router.get("/{garment_id}", response_model=GarmentResponse)
async def get_garment(garment_id: str, db: AsyncSession = Depends(get_db)):
    service = GarmentService(db)
    item = await service.get_by_id(garment_id)
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Garment not found")
    return _enrich_garment_response(item)
