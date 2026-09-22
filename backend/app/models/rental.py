import uuid
from datetime import date, datetime

from sqlalchemy import Float, Integer, String, Text, Date, DateTime, ForeignKey, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class RentalBooking(Base):
    __tablename__ = "rental_bookings"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    customer_name: Mapped[str] = mapped_column(String(100), nullable=False)
    phone: Mapped[str] = mapped_column(String(20), nullable=False)
    email: Mapped[str | None] = mapped_column(String(100))
    rental_date: Mapped[date] = mapped_column(Date, nullable=False)
    return_date: Mapped[date] = mapped_column(Date, nullable=False)
    total_price: Mapped[float] = mapped_column(Float, nullable=False)
    deposit_amount: Mapped[float] = mapped_column(Float, nullable=False)
    status: Mapped[str] = mapped_column(String(50), default="pending")
    notes: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    items: Mapped[list["RentalBookingItem"]] = relationship(
        "RentalBookingItem", back_populates="booking", cascade="all, delete-orphan"
    )


class RentalBookingItem(Base):
    __tablename__ = "rental_booking_items"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    booking_id: Mapped[str] = mapped_column(String(36), ForeignKey("rental_bookings.id"), nullable=False)
    garment_id: Mapped[str] = mapped_column(String(36), ForeignKey("garments.id"), nullable=False)
    size: Mapped[str] = mapped_column(String(10), nullable=False)
    quantity: Mapped[int] = mapped_column(Integer, default=1)

    booking: Mapped["RentalBooking"] = relationship("RentalBooking", back_populates="items")
    garment: Mapped["Garment"] = relationship("Garment")
