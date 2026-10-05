import hashlib
import json
import logging
import math
import threading
from pathlib import Path
from typing import Any

from app.config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()

CHROMA_DIR = Path(settings.storage_path) / "chroma"
SEED_DIR = Path(__file__).parent.parent / "seed"
GARMENT_TYPES_FILE = SEED_DIR / "garment_types.json"
INVENTORY_ITEMS_FILE = SEED_DIR / "inventory_items.json"
# Pre-computed vectors, committed to git. Built by `python -m scripts.build_embeddings`.
EMBEDDINGS_BUNDLE_FILE = SEED_DIR / "embeddings.json"
MODEL_NAME = "bkai-foundation-models/vietnamese-bi-encoder"
COLLECTION_NAME = "vietphuc_inventory_items"

# How strongly a pinned item pulls the query vector towards itself (0 = ignore).
PINNED_WEIGHT = 0.5


class EmbeddingUnavailable(RuntimeError):
    """A vector is needed but neither the bundle nor an already-loaded model can supply it."""


class RAGService:
    _model = None
    _model_lock = threading.Lock()
    _sync_lock = threading.Lock()
    _synced = False  # True once every inventory item has a vector in Chroma
    _query_cache: dict[str, list[float]] = {}  # fixed query text -> vector
    _bundle: dict[str, Any] = {}
    _bundle_loaded = False

    def __init__(self, chroma_dir: Path | None = None):
        self.chroma_dir = chroma_dir or CHROMA_DIR
        self.chroma_dir.mkdir(parents=True, exist_ok=True)

    # ------------------------------------------------------------------ model
    @classmethod
    def get_model(cls):
        """Load the SentenceTransformer lazily. Only needed to (re)build vectors."""
        with cls._model_lock:
            if cls._model is None:
                logger.info("Initializing SentenceTransformer with %s...", MODEL_NAME)
                from sentence_transformers import SentenceTransformer

                cls._model = SentenceTransformer(MODEL_NAME)
                logger.info("SentenceTransformer model loaded successfully.")
            return cls._model

    # ----------------------------------------------------------------- bundle
    @classmethod
    def load_bundle(cls) -> dict[str, Any]:
        """Read the committed embeddings bundle (item vectors + fixed query vectors)."""
        if cls._bundle_loaded:
            return cls._bundle
        bundle: dict[str, Any] = {}
        if not EMBEDDINGS_BUNDLE_FILE.exists():
            logger.warning(
                "%s not found - run `python -m scripts.build_embeddings` once and commit it.",
                EMBEDDINGS_BUNDLE_FILE.name,
            )
        else:
            try:
                data = json.loads(EMBEDDINGS_BUNDLE_FILE.read_text(encoding="utf-8"))
                if data.get("model") != MODEL_NAME:
                    logger.warning(
                        "Embeddings bundle was built with %s, expected %s - ignoring it.",
                        data.get("model"),
                        MODEL_NAME,
                    )
                else:
                    bundle = data
            except Exception as exc:
                logger.warning("Failed to read embeddings bundle: %s", exc)
        cls._bundle = bundle
        cls._bundle_loaded = True
        return bundle

    @classmethod
    def pre_encode_queries(cls, query_map: dict[str, str]) -> None:
        """Fill the in-memory query cache from the bundle; encode only what is missing."""
        for text, vector in (cls.load_bundle().get("queries") or {}).items():
            cls._query_cache.setdefault(text, vector)

        missing = [t for t in query_map.values() if t not in cls._query_cache]
        if not missing:
            logger.info(
                "All %d fixed query vectors loaded from bundle - model not needed.",
                len(query_map),
            )
            return
        logger.info("%d fixed queries not in bundle; encoding with the model...", len(missing))
        try:
            vectors = cls.get_model().encode(
                missing, normalize_embeddings=True, show_progress_bar=False, batch_size=32
            ).tolist()
        except Exception as exc:
            logger.warning("Could not encode missing queries (%s). Rebuild the bundle.", exc)
            return
        for text, vector in zip(missing, vectors):
            cls._query_cache[text] = vector

    # ----------------------------------------------------------------- chroma
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

    def sync_garments(self, force: bool = False, allow_model: bool = True) -> dict[str, int]:
        """Make Chroma match the seed files.

        Vectors come from the committed bundle whenever its doc_hash matches the
        current document text. The model is touched only for items missing from
        (or stale in) the bundle, and only when allow_model is True.
        """
        with RAGService._sync_lock:
            return self._sync_locked(force, allow_model)

    def _sync_locked(self, force: bool, allow_model: bool) -> dict[str, int]:
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

        bundle_items = {} if force else (self.load_bundle().get("items") or {})
        entries: list[dict[str, Any]] = []
        added_count = 0
        updated_count = 0
        for item in inventory_items:
            item_id = item["item_id"]
            parent = types_by_id[item["parent_type_id"]]
            document = self.format_garment_document(item, parent)
            doc_hash = self.compute_doc_hash(document)
            is_new = item_id not in existing_ids
            if not (force or is_new or existing_hashes.get(item_id) != doc_hash):
                continue
            added_count += int(is_new)
            updated_count += int(not is_new)
            entry: dict[str, Any] = {
                "id": item_id,
                "document": document,
                "metadata": {
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
                },
            }
            cached = bundle_items.get(item_id)
            if cached and cached.get("doc_hash") == doc_hash:
                entry["vector"] = cached["vector"]
            entries.append(entry)

        need_model = [e for e in entries if "vector" not in e]
        if need_model and allow_model:
            logger.info(
                "Encoding %d inventory items missing from the bundle with %s...",
                len(need_model),
                MODEL_NAME,
            )
            try:
                vectors = self.get_model().encode(
                    [e["document"] for e in need_model],
                    normalize_embeddings=True,
                    show_progress_bar=False,
                ).tolist()
                for entry, vector in zip(need_model, vectors):
                    entry["vector"] = vector
            except Exception as exc:
                logger.error("Could not encode inventory items: %s", exc)

        ready = [e for e in entries if "vector" in e]
        pending = len(entries) - len(ready)
        if ready:
            collection.upsert(
                ids=[e["id"] for e in ready],
                embeddings=[e["vector"] for e in ready],
                metadatas=[e["metadata"] for e in ready],
                documents=[e["document"] for e in ready],
            )
        if pending:
            logger.warning(
                "%d inventory items have no vector yet (bundle is stale). "
                "Run `python -m scripts.build_embeddings` and commit embeddings.json.",
                pending,
            )
        else:
            RAGService._synced = True
        return {
            "added": added_count,
            "updated": updated_count,
            "deleted": len(ids_to_delete),
            "pending": pending,
            "total": collection.count(),
        }

    # ------------------------------------------------------------------ query
    def _query_vector(self, query_text: str) -> list[float]:
        vector = RAGService._query_cache.get(query_text)
        if vector is not None:
            return vector
        # Free-text query that was not pre-computed. Use the model only if it is
        # already in memory - never block a request on a model download.
        if RAGService._model is None:
            raise EmbeddingUnavailable(
                "Query is not in the pre-computed bundle and the embedding model is not loaded."
            )
        vector = RAGService._model.encode(query_text, normalize_embeddings=True).tolist()
        RAGService._query_cache[query_text] = vector
        return vector

    @staticmethod
    def _blend_pinned(collection, base: list[float], pinned_ids: list[str]) -> list[float]:
        """Pull the query vector towards the pinned items' own stored vectors."""
        got = collection.get(ids=list(pinned_ids), include=["embeddings"])
        embeddings = got.get("embeddings")
        if embeddings is None or len(embeddings) == 0:
            return base
        count = len(embeddings)
        blended = [
            base[i] + PINNED_WEIGHT * sum(float(e[i]) for e in embeddings) / count
            for i in range(len(base))
        ]
        norm = math.sqrt(sum(x * x for x in blended)) or 1.0
        return [x / norm for x in blended]

    def query_candidates(
        self,
        query_text: str,
        n_results: int = 12,
        gender: str | None = None,
        pinned_item_ids: list[str] | None = None,
    ) -> list[dict[str, Any]]:
        if not query_text.strip():
            return []

        if not RAGService._synced:
            # Fast and model-free: copies bundle vectors into Chroma.
            self.sync_garments(allow_model=False)
        collection = self.get_collection()
        total_items = collection.count()
        if total_items == 0:
            if RAGService._synced:
                return []
            raise EmbeddingUnavailable("Vector index is still being built.")

        query_vector = self._query_vector(query_text)
        if pinned_item_ids:
            query_vector = self._blend_pinned(collection, query_vector, pinned_item_ids)
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
