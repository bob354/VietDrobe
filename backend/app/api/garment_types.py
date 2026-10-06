from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.garment import GarmentType
from app.schemas import GarmentTypeResponse
from app.seed.catalog import catalog_type_ids

router = APIRouter(prefix="/garment-types", tags=["Garment Types"])


@router.get("", response_model=list[GarmentTypeResponse])
async def list_garment_types(db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(GarmentType).where(GarmentType.type_id.in_(catalog_type_ids())).order_by(GarmentType.name_vi)
    )
    return result.scalars().all()


@router.get("/{type_id}", response_model=GarmentTypeResponse)
async def get_garment_type(type_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(GarmentType).where(GarmentType.type_id == type_id))
    garment_type = result.scalar_one_or_none()
    if garment_type is None:
        raise HTTPException(status_code=404, detail="Garment type not found")
    return garment_type
