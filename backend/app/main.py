import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware

from app.api.router import api_router
from app.config import get_settings
from app.database import Base, engine

settings = get_settings()
logging.basicConfig(level=logging.INFO if settings.debug else logging.WARNING)
logger = logging.getLogger("vietphuc-remix")

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting up Việt Phục Remix Backend...")
    # Auto create tables for PoC/prototype
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    logger.info("Database tables initialized.")

    # Check and run auto-seed if empty
    from app.seed.seed import seed_database
    await seed_database()

    yield

    logger.info("Shutting down...")
    await engine.dispose()

app = FastAPI(
    title=settings.app_name,
    description="Việt Phục Remix — Phối trang phục truyền thống phong cách Gen Z",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs" if settings.debug else None,
    redoc_url="/redoc" if settings.debug else None,
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.add_middleware(GZipMiddleware, minimum_size=500)

app.include_router(api_router, prefix="/api/v1")
