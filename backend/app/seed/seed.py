import json
import logging
import shutil
from pathlib import Path

from PIL import Image
from sqlalchemy import select

from app.config import get_settings
from app.database import async_session_maker
from app.models.cultural_rule import CulturalRule
from app.models.garment import Garment, GarmentType
from app.seed.catalog import load_catalog

logger = logging.getLogger('vietphuc-seed')
SEED_DIR = Path(__file__).parent
DATA_DIR = Path(get_settings().storage_path)


def install_catalog_images(inventory_data: list[dict]) -> None:
    """Install verified sprites before changing any inventory records."""
    for item in inventory_data:
        source = SEED_DIR / 'garments' / Path(item['image_path']).name
        with Image.open(source) as image:
            if image.width != image.height or image.mode != 'RGBA':
                raise ValueError(f'Catalog sprite must be square RGBA: {source}')
            if image.getchannel('A').getextrema() != (0, 255):
                raise ValueError(f'Catalog sprite must have real transparency: {source}')
        for relative_path in {item['image_path'], item['thumbnail_path']}:
            destination = DATA_DIR / relative_path
            destination.parent.mkdir(parents=True, exist_ok=True)
            if not destination.exists() or source.read_bytes() != destination.read_bytes():
                shutil.copyfile(source, destination)


async def seed_database():
    """Sync the supplied catalog; retain older records for saved outfits/rentals."""
    from app.database import Base, engine

    type_data, inventory_data = load_catalog()
    install_catalog_images(inventory_data)
    async with engine.begin() as connection:
        await connection.run_sync(Base.metadata.create_all)

    async with async_session_maker() as session:
        db_types = {
            row.type_id: row
            for row in (await session.execute(select(GarmentType))).scalars().all()
        }
        db_items = {
            row.id: row
            for row in (await session.execute(select(Garment))).scalars().all()
        }
        for record in type_data:
            garment_type = db_types.get(record['type_id'])
            if garment_type is None:
                garment_type = GarmentType(type_id=record['type_id'])
                session.add(garment_type)
            for column in GarmentType.__table__.columns:
                if column.key == 'type_id':
                    continue
                default = [] if column.key in {'rules', 'remix_tags', 'compatible_occasions'} else None
                if column.key == 'is_traditional':
                    default = True
                setattr(garment_type, column.key, record.get(column.key, default))

        await session.flush()
        for record in inventory_data:
            garment = db_items.get(record['item_id'])
            if garment is None:
                garment = Garment(id=record['item_id'])
                session.add(garment)
            for field in (
                'parent_type_id', 'display_name', 'display_name_en', 'image_path',
                'thumbnail_path', 'primary_color', 'colors', 'pattern', 'material',
                'rental_price_per_day', 'deposit_per_item', 'available_sizes', 'stock_quantity',
            ):
                setattr(garment, field, record.get(field))
            garment.is_preset = record.get('is_preset', True)

        existing_rule = (await session.execute(select(CulturalRule))).scalars().first()
        if existing_rule is None:
            rules_file = SEED_DIR / 'cultural_rules.json'
            if rules_file.exists():
                for record in json.loads(rules_file.read_text(encoding='utf-8')):
                    session.add(CulturalRule(
                        rule_type=record['rule_type'], condition=record['condition'],
                        message_vi=record['message_vi'], severity=record.get('severity', 'warning'),
                    ))
        await session.commit()
    logger.info('Synced %d garment types and %d catalog sprites', len(type_data), len(inventory_data))


if __name__ == '__main__':
    import asyncio
    asyncio.run(seed_database())
