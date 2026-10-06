from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import async_session_maker
from app.models.garment import Garment
from app.schemas import RentalCatalogItem, RentalCalculateRequest, RentalCalculateResponse, RentalBookingRequest, RentalBookingResponse
from app.services.rental_service import RentalService
from app.seed.catalog import catalog_item_ids

router = APIRouter(prefix="/rentals", tags=["Rentals"])

async def get_db():
    async with async_session_maker() as session:
        yield session

@router.get("/catalog", response_model=list[RentalCatalogItem])
async def get_rental_catalog(db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Garment).where(
            Garment.id.in_(catalog_item_ids()), Garment.rental_price_per_day.is_not(None)
        )
    )
    return result.scalars().all()

@router.post("/calculate", response_model=RentalCalculateResponse)
async def calculate_price(request: RentalCalculateRequest, db: AsyncSession = Depends(get_db)):
    result = await RentalService.calculate_price(db, request.garment_ids, request.rental_days, request.quantities)
    return result

@router.post("/book", response_model=RentalBookingResponse)
async def create_booking(request: RentalBookingRequest, db: AsyncSession = Depends(get_db)):
    booking = await RentalService.create_booking(db, request)
    return booking

@router.get("/booking/{booking_id}", response_model=RentalBookingResponse)
async def get_booking(booking_id: str, db: AsyncSession = Depends(get_db)):
    booking = await RentalService.get_booking(db, booking_id)
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    return booking
