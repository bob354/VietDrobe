import asyncio
import io
from pathlib import Path

from fastapi import FastAPI
from fastapi.testclient import TestClient
from PIL import Image
from sqlalchemy import select
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine

from app.api.images import router as images_router
from app.database import Base
from app.models.garment import Garment, GarmentType
from app.models.outfit import Outfit, OutfitItem
from app.seed import seed
from app.seed.catalog import load_catalog
from app.services.garment_service import GarmentService
from app.services.image_service import ImageService


def test_catalog_sprites_are_square_with_transparent_borders():
    types, items = load_catalog()
    assert len(items) == 25
    assert len(types) == 25
    for record in items:
        path = seed.SEED_DIR / "garments" / Path(record["image_path"]).name
        with Image.open(path) as image:
            assert image.mode == "RGBA"
            assert image.size == (1254, 1254)
            alpha = image.getchannel("A")
            assert alpha.getextrema() == (0, 255)
            assert alpha.getbbox() is not None
            for box in ((0, 0, image.width, 1), (0, image.height - 1, image.width, image.height),
                        (0, 0, 1, image.height), (image.width - 1, 0, image.width, image.height)):
                # Allow only imperceptible 1/255 alpha from PNG edge antialiasing.
                assert alpha.crop(box).getextrema()[1] <= 1, path.name


def test_catalog_sync_replaces_browsing_and_preserves_saved_outfits(tmp_path, monkeypatch):
    async def scenario():
        import app.database as database

        engine = create_async_engine(f"sqlite+aiosqlite:///{tmp_path / 'catalog.db'}")
        sessions = async_sessionmaker(engine, expire_on_commit=False)
        monkeypatch.setattr(database, "engine", engine)
        monkeypatch.setattr(seed, "async_session_maker", sessions)
        monkeypatch.setattr(seed, "DATA_DIR", tmp_path / "data")
        try:
            async with engine.begin() as connection:
                await connection.run_sync(Base.metadata.create_all)
            async with sessions() as session:
                session.add(GarmentType(type_id="retired", name_vi="Old type", category="headwear"))
                await session.flush()
                session.add(Garment(id="retired-item", parent_type_id="retired", display_name="Old item", image_path="old.png"))
                session.add(Outfit(id="saved-outfit", name="Saved outfit"))
                await session.flush()
                session.add(OutfitItem(id="saved-item", outfit_id="saved-outfit", garment_id="retired-item", layer_order=0))
                await session.commit()

            await seed.seed_database()
            await seed.seed_database()
            _, catalog = load_catalog()
            async with sessions() as session:
                service = GarmentService(session)
                garments, total = await service.get_list()
                assert total == 25
                assert {g.id for g in garments} == {g["item_id"] for g in catalog}
                assert sum(row["count"] for row in await service.get_categories_count()) == 25
                assert await service.get_by_id("retired-item") is not None
                assert await session.get(OutfitItem, "saved-item") is not None
                first = garments[0]
                first.display_name = "Stale name"
                await session.commit()
            await seed.seed_database()
            async with sessions() as session:
                rows = (await session.execute(select(Garment))).scalars().all()
                assert len(rows) == 26
                expected = {r["item_id"]: r for r in catalog}
                for row in rows:
                    if row.id in expected:
                        assert row.display_name == expected[row.id]["display_name"]
                        assert row.image_path == expected[row.id]["image_path"]
                        assert row.rental_price_per_day == expected[row.id]["rental_price_per_day"]
            for record in catalog:
                assert (seed.DATA_DIR / record["image_path"]).is_file()
        finally:
            await engine.dispose()

    asyncio.run(scenario())


def test_image_endpoint_serves_transparent_sprite(tmp_path, monkeypatch):
    from app.services import image_service

    _, items = load_catalog()
    monkeypatch.setattr(seed, "DATA_DIR", tmp_path)
    monkeypatch.setattr(image_service.settings, "storage_path", str(tmp_path))
    seed.install_catalog_images(items)
    app = FastAPI()
    app.include_router(images_router, prefix="/api/v1")
    with TestClient(app) as client:
        for record in items:
            response = client.get(ImageService.get_public_url(record["image_path"]))
            assert response.status_code == 200
            assert response.headers["content-type"] == "image/png"
            with Image.open(io.BytesIO(response.content)) as image:
                assert image.getchannel("A").getextrema() == (0, 255)
