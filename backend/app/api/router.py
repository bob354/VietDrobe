from fastapi import APIRouter

from app.api.cultural import router as cultural_router
from app.api.garments import router as garments_router
from app.api.garment_types import router as garment_types_router
from app.api.health import router as health_router
from app.api.images import router as images_router
from app.api.outfits import router as outfits_router
from app.api.chat import router as chat_router
from app.api.rentals import router as rentals_router

api_router = APIRouter()

api_router.include_router(health_router)
api_router.include_router(images_router)
api_router.include_router(garments_router)
api_router.include_router(garment_types_router)
api_router.include_router(outfits_router)
api_router.include_router(cultural_router)
api_router.include_router(chat_router)
api_router.include_router(rentals_router)
