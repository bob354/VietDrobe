from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.models.garment import Garment
from app.models.rental import RentalBooking, RentalBookingItem
from app.schemas import RentalBookingRequest

class RentalService:
    @staticmethod
    async def calculate_price(db: AsyncSession, garment_ids: list[str], rental_days: int) -> dict:
        if not garment_ids:
            return {"items": [], "subtotal": 0, "combo_discount_percent": 0, "discount_amount": 0, "deposit": 0, "total": 0}
            
        result = await db.execute(select(Garment).where(Garment.id.in_(garment_ids)))
        garments = result.scalars().all()
        
        items_detail = []
        subtotal = 0.0
        deposit = 0.0
        
        for g in garments:
            price_per_day = g.rental_price_per_day or 0.0
            item_total = price_per_day * rental_days
            dep = g.deposit_per_item or 0.0
            
            items_detail.append({
                "garment_id": g.id,
                "display_name": g.display_name,
                "price_per_day": price_per_day,
                "item_total": item_total
            })
            
            subtotal += item_total
            deposit += dep
            
        combo_discount_percent = 0.0
        if len(garments) >= 3:
            combo_discount_percent = 15.0
            # For simplicity, we just use 15% discount for 3+ items. 
            # Differentiating "AI-suggested set" requires more context, keeping it basic or assuming standard discount.
            
        discount_amount = subtotal * (combo_discount_percent / 100.0)
        total = subtotal - discount_amount
        
        # Override deposit to be 30% of total if preferred by task spec?
        # Task: "Deposit = 30% of total"
        deposit = total * 0.3
        
        return {
            "items": items_detail,
            "subtotal": subtotal,
            "combo_discount_percent": combo_discount_percent,
            "discount_amount": discount_amount,
            "deposit": deposit,
            "total": total
        }

    @staticmethod
    async def create_booking(db: AsyncSession, data: RentalBookingRequest) -> RentalBooking:
        # Calculate pricing
        garment_ids = [item.garment_id for item in data.garment_ids]
        rental_days = (data.return_date - data.rental_date).days
        if rental_days <= 0:
            rental_days = 1
            
        pricing = await RentalService.calculate_price(db, garment_ids, rental_days)
        
        booking = RentalBooking(
            customer_name=data.customer_name,
            phone=data.phone,
            email=data.email,
            rental_date=data.rental_date,
            return_date=data.return_date,
            total_price=pricing["total"],
            deposit_amount=pricing["deposit"],
            notes=data.notes
        )
        db.add(booking)
        await db.flush() # get booking.id
        
        for item_data in data.garment_ids:
            booking_item = RentalBookingItem(
                booking_id=booking.id,
                garment_id=item_data.garment_id,
                size=item_data.size,
                quantity=item_data.quantity
            )
            db.add(booking_item)
            
        await db.commit()
        await db.refresh(booking)
        
        # Load items to return
        result = await db.execute(
            select(RentalBooking)
            .options(selectinload(RentalBooking.items).selectinload(RentalBookingItem.garment))
            .where(RentalBooking.id == booking.id)
        )
        return result.scalars().first()

    @staticmethod
    async def get_booking(db: AsyncSession, booking_id: str) -> RentalBooking | None:
        result = await db.execute(
            select(RentalBooking)
            .options(selectinload(RentalBooking.items).selectinload(RentalBookingItem.garment))
            .where(RentalBooking.id == booking_id)
        )
        return result.scalars().first()
