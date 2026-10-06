"""The seed manifests define the current catalog, including on existing databases."""
import json
from pathlib import Path

SEED_DIR = Path(__file__).parent


def load_catalog() -> tuple[list[dict], list[dict]]:
    types = json.loads((SEED_DIR / "garment_types.json").read_text(encoding="utf-8"))
    items = json.loads((SEED_DIR / "inventory_items.json").read_text(encoding="utf-8"))
    type_ids = {record["type_id"] for record in types}
    item_ids = {record["item_id"] for record in items}
    if len(type_ids) != len(types) or len(item_ids) != len(items):
        raise ValueError("Catalog IDs must be unique")
    for record in items:
        if record["parent_type_id"] not in type_ids:
            raise ValueError(f"Unknown garment type: {record['parent_type_id']}")
        for field in ("image_path", "thumbnail_path"):
            path = Path(record[field])
            if path.is_absolute() or ".." in path.parts or path.parts[:2] != ("garments", "catalog-v2"):
                raise ValueError(f"Invalid catalog sprite path: {path}")
    return types, items


def catalog_item_ids() -> list[str]:
    return [record["item_id"] for record in load_catalog()[1]]


def catalog_type_ids() -> list[str]:
    return [record["type_id"] for record in load_catalog()[0]]
