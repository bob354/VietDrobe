import asyncio
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


def _warm_up_rag_blocking() -> None:
    from app.services.recommendation_service import build_fixed_query_map
    from app.services.rag_service import RAGService

    RAGService.pre_encode_queries(build_fixed_query_map())
    result = RAGService().sync_garments()
    logger.info("RAG ready: %s", result)


async def _warm_up_rag() -> None:
    """Load pre-computed vectors into Chroma (model-free when embeddings.json is current).

    Runs in the background so startup is never blocked. The model is only touched
    for items/queries missing from the bundle, and failures are logged, not fatal.
    """
    try:
        await asyncio.to_thread(_warm_up_rag_blocking)
    except Exception:
        logger.exception("RAG warm-up failed; /outfits/suggest will return 503 until fixed.")


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting up Việt Phục Remix Backend...")
    # Auto create tables for PoC/prototype
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    logger.info("Database tables initialized.")

    # Sync the current supplied catalog and install its transparent sprites.
    from app.seed.seed import seed_database
    await seed_database()
    from app.seed.migrate_inventory import migrate_inventory_references
    await migrate_inventory_references()

    # Kick off RAG warm-up in the background - server is ready immediately.
    # With a current embeddings.json this takes about a second and never loads the model.
    asyncio.create_task(_warm_up_rag())

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
