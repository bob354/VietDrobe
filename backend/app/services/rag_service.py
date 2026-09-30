import hashlib
import json
import logging
from pathlib import Path
from typing import Any

from app.config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()

CHROMA_DIR = Path(settings.storage_path) / "chroma"
SEED_DIR = Path(__file__).parent.parent / "seed"
GARMENT_TYPES_FILE = SEED_DIR / "garment_types.json"
INVENTORY_ITEMS_FILE = SEED_DIR / "inventory_items.json"
MODEL_NAME = "bkai-foundation-models/vietnamese-bi-encoder"
COLLECTION_NAME = "vietphuc_inventory_items"


class RAGService:
    _model = None

    def __init__(self, chroma_dir: Path | None = None):
        self.chroma_dir = chroma_dir or CHROMA_DIR
        self.chroma_dir.mkdir(parents=True, exist_ok=True)

    @classmethod
    def get_model(cls):
        if cls._model is None:
            logger.info("Initializing SentenceTransformer with %s...", MODEL_NAME)
            from sentence_transformers import SentenceTransformer

            cls._model = SentenceTransformer(MODEL_NAME)
            logger.info("SentenceTransformer model loaded successfully.")
        return cls._model

    def get_collection(self):
        import chromadb

        client = chromadb.PersistentClient(path=str(self.chroma_dir))
        return client.get_or_create_collection(
            name=COLLECTION_NAME,
            metadata={"hnsw:space": "cosine"},
        )

    @staticmethod
    def format_garment_document(
        item: dict[str, Any], garment_type: dict[str, Any]
    ) -> str:
        """Embed each physical item with its parent type's cultural knowledge."""
        item_parts = [
            f"Inventory item ID: {item.get('item_id', '')}",
            f"Item name: {item.get('display_name', '')}",
            f"English item name: {item.get('display_name_en') or ''}",
            f"Parent garment type ID: {item.get('parent_type_id', '')}",
            f"Item color: {item.get('primary_color') or ''}",
            f"Available colors: {', '.join(item.get('colors') or [])}",
            f"Item pattern: {item.get('pattern') or ''}",
            f"Item material: {item.get('material') or ''}",
        ]
        parent_parts = [
            f"Parent garment type: {garment_type.get('name_vi', '')}",
            f"English garment type: {garment_type.get('name_en') or ''}",
            f"Category: {garment_type.get('category') or ''}",
            f"Subtype: {garment_type.get('subtype') or ''}",
            f"Era: {garment_type.get('era') or ''}",
            f"Region: {garment_type.get('region') or ''}",
            f"Gender fit: {garment_type.get('gender_fit') or ''}",
            f"Cultural tier: {garment_type.get('cultural_tier') or ''}",
            f"Formality: {garment_type.get('formality') or ''}",
            f"Traditional: {garment_type.get('is_traditional', True)}",
            f"Cultural description: {garment_type.get('cultural_description') or ''}",
            f"Historical lore: {garment_type.get('historical_lore') or ''}",
            f"Cultural notes: {json.dumps(garment_type.get('cultural_notes') or {}, ensure_ascii=False)}",
            f"Rules: {json.dumps(garment_type.get('rules') or [], ensure_ascii=False)}",
            f"Compatible occasions: {', '.join(garment_type.get('compatible_occasions') or [])}",
            f"Remix tags: {', '.join(garment_type.get('remix_tags') or [])}",
        ]
        return "CHILD INVENTORY ITEM: " + " | ".join(item_parts) + (
            " | PARENT PRODUCT MASTER: " + " | ".join(parent_parts)
        )

    @staticmethod
    def compute_doc_hash(text: str) -> str:
        return hashlib.sha256(text.encode("utf-8")).hexdigest()

    def sync_garments(self, force: bool = False) -> dict[str, int]:
        """Sync inventory items while embedding their referenced parent records."""
        if not GARMENT_TYPES_FILE.exists() or not INVENTORY_ITEMS_FILE.exists():
            raise FileNotFoundError(
                f"RAG seed files are required: {GARMENT_TYPES_FILE} and {INVENTORY_ITEMS_FILE}"
            )

        with GARMENT_TYPES_FILE.open(encoding="utf-8") as file:
            garment_types = json.load(file)
        with INVENTORY_ITEMS_FILE.open(encoding="utf-8") as file:
            inventory_items = json.load(file)

        types_by_id = {record["type_id"]: record for record in garment_types}
        for item in inventory_items:
            parent_id = item.get("parent_type_id")
            if parent_id not in types_by_id:
                raise ValueError(
                    f"Inventory item {item.get('item_id')} references unknown garment type {parent_id}"
                )

        collection = self.get_collection()
        existing = collection.get(include=["metadatas"])
        existing_ids = set(existing.get("ids", []))
        existing_hashes = {
            item_id: metadata["doc_hash"]
            for item_id, metadata in zip(
                existing.get("ids", []), existing.get("metadatas", [])
            )
            if metadata and "doc_hash" in metadata
        }
        item_ids = {item["item_id"] for item in inventory_items}
        ids_to_delete = list(existing_ids - item_ids)
        if ids_to_delete:
            collection.delete(ids=ids_to_delete)

        to_encode = []
        added_count = 0
        updated_count = 0
        for item in inventory_items:
            item_id = item["item_id"]
            parent = types_by_id[item["parent_type_id"]]
            document = self.format_garment_document(item, parent)
            doc_hash = self.compute_doc_hash(document)
            is_new = item_id not in existing_ids
            if force or is_new or existing_hashes.get(item_id) != doc_hash:
                added_count += int(is_new)
                updated_count += int(not is_new)
                metadata = {
                    "parent_type_id": item["parent_type_id"],
                    "display_name": item.get("display_name", ""),
                    "display_name_en": item.get("display_name_en") or "",
                    "image_path": item.get("image_path", ""),
                    "thumbnail_path": item.get("thumbnail_path") or "",
                    "primary_color": item.get("primary_color") or "",
                    "category": parent.get("category") or "",
                    "gender_fit": parent.get("gender_fit") or "unisex",
                    "era": parent.get("era") or "",
                    "doc_hash": doc_hash,
                }
                to_encode.append(
                    {"id": item_id, "document": document, "metadata": metadata}
                )

        if to_encode:
            logger.info(
                "Embedding %d inventory items (%d new, %d updated) with %s...",
                len(to_encode),
                added_count,
                updated_count,
                MODEL_NAME,
            )
            embeddings = self.get_model().encode(
                [item["document"] for item in to_encode],
                normalize_embeddings=True,
                show_progress_bar=False,
            ).tolist()
            collection.upsert(
                ids=[item["id"] for item in to_encode],
                embeddings=embeddings,
                metadatas=[item["metadata"] for item in to_encode],
                documents=[item["document"] for item in to_encode],
            )

        return {
            "added": added_count,
            "updated": updated_count,
            "deleted": len(ids_to_delete),
            "total": collection.count(),
        }

    def query_candidates(
        self,
        query_text: str,
        n_results: int = 12,
        gender: str | None = None,
    ) -> list[dict[str, Any]]:
        if not query_text.strip():
            return []

        self.sync_garments()
        collection = self.get_collection()
        total_items = collection.count()
        if total_items == 0:
            return []

        query_vector = self.get_model().encode(
            query_text, normalize_embeddings=True
        ).tolist()
        results = collection.query(
            query_embeddings=[query_vector],
            n_results=min(n_results, total_items),
            include=["metadatas", "distances", "documents"],
        )

        candidates = []
        ids = results.get("ids", [[]])[0]
        metadatas = results.get("metadatas", [[]])[0]
        distances = results.get("distances", [[]])[0]
        documents = results.get("documents", [[]])[0]
        for item_id, metadata, distance, document in zip(
            ids, metadatas, distances, documents
        ):
            metadata = metadata or {}
            gender_fit = (metadata.get("gender_fit") or "unisex").lower()
            if gender in ("nu", "female") and gender_fit not in (
                "nu",
                "female",
                "unisex",
                "all",
            ):
                continue
            if gender in ("nam", "male") and gender_fit not in (
                "nam",
                "male",
                "unisex",
                "all",
            ):
                continue
            candidates.append(
                {
                    "id": item_id,
                    "similarity": round(max(0.0, min(1.0, 1.0 - float(distance))), 4),
                    "metadata": metadata,
                    "document": document,
                }
            )
        return candidates
