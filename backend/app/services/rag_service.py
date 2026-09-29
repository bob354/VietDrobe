import hashlib
import json
import logging
from pathlib import Path
from typing import Any

from app.config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()

CHROMA_DIR = Path(settings.storage_path) / "chroma"
SEED_FILE = Path(__file__).parent.parent / "seed" / "garments.json"
MODEL_NAME = "bkai-foundation-models/vietnamese-bi-encoder"
COLLECTION_NAME = "vietphuc_garments"


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

    def format_garment_document(self, g: dict[str, Any]) -> str:
        """Construct a dense, culturally informative textual description for vector embedding."""
        parts = [
            f"Tên trang phục: {g.get('display_name', '')}",
            f"Tên tiếng Anh: {g.get('display_name_en', '')}",
            f"Phân loại: {g.get('category', '')}",
            f"Kiểu dáng: {g.get('type', '')} ({g.get('subtype') or ''})",
            f"Triều đại: {g.get('era') or 'Cổ truyền / Dân gian'}",
            f"Vùng miền: {g.get('region') or 'Toàn quốc'}",
            f"Màu sắc: {g.get('primary_color') or ''}, bảng màu: {', '.join(g.get('colors') or [])}",
            f"Họa tiết: {g.get('pattern') or 'Truyền thống'}",
            f"Chất liệu: {g.get('material') or 'Tơ tằm lụa gấm tự nhiên'}",
            f"Phẩm hàm văn hóa: {g.get('cultural_tier') or 'Dân gian'}",
            f"Tính trang trọng: {g.get('formality') or 'Linh hoạt'}",
            f"Thích hợp: {g.get('gender_fit') or 'unisex'}",
            f"Dịp diện phù hợp: {', '.join(g.get('compatible_occasions') or [])}",
            f"Phong cách phối đồ: {', '.join(g.get('remix_tags') or [])}",
            f"Ý nghĩa lịch sử văn hóa: {g.get('cultural_description') or ''}",
        ]
        notes = g.get("cultural_notes")
        if isinstance(notes, dict):
            for k, v in notes.items():
                if isinstance(v, list):
                    parts.append(f"{k}: {', '.join(str(x) for x in v)}")
                elif v:
                    parts.append(f"{k}: {v}")
        return " | ".join(p for p in parts if p)

    @staticmethod
    def compute_doc_hash(text: str) -> str:
        return hashlib.md5(text.encode("utf-8")).hexdigest()

    def sync_garments(self, force: bool = False) -> dict[str, int]:
        """Incrementally sync vector database with garments.json.

        - New item added to garments.json  → embeds and inserts it.
        - Existing item updated in garments.json → re-embeds and upserts it.
        - Item removed from garments.json → deletes it from the collection.
        - Unchanged item → skips re-embedding (no-op).
        """
        if not SEED_FILE.exists():
            logger.warning("Seed file %s does not exist, skipping RAG sync.", SEED_FILE)
            return {"added": 0, "updated": 0, "deleted": 0, "total": 0}

        with open(SEED_FILE, "r", encoding="utf-8") as f:
            garments_data = json.load(f)

        collection = self.get_collection()

        # Fetch existing items in Chroma
        existing = collection.get(include=["metadatas"])
        existing_ids = set(existing.get("ids", []))
        existing_hashes: dict[str, str] = {}
        for gid, meta in zip(existing.get("ids", []), existing.get("metadatas", [])):
            if meta and "doc_hash" in meta:
                existing_hashes[gid] = meta["doc_hash"]

        json_ids = {g["id"] for g in garments_data}

        # 1. Identify deletions (items removed from garments.json)
        ids_to_delete = list(existing_ids - json_ids)
        if ids_to_delete and not force:
            collection.delete(ids=ids_to_delete)
            logger.info("Deleted %d obsolete garments from Chroma collection.", len(ids_to_delete))

        # 2. Identify additions and updates via content hash
        to_encode: list[dict[str, Any]] = []
        added_count = 0
        updated_count = 0

        for g in garments_data:
            gid = g["id"]
            doc_text = self.format_garment_document(g)
            doc_hash = self.compute_doc_hash(doc_text)

            is_new = gid not in existing_ids
            is_changed = existing_hashes.get(gid) != doc_hash

            if force or is_new or is_changed:
                if is_new:
                    added_count += 1
                else:
                    updated_count += 1

                meta = {
                    "id": gid,
                    "display_name": g.get("display_name", ""),
                    "category": g.get("category", ""),
                    "type": g.get("type", ""),
                    "gender_fit": g.get("gender_fit", "unisex"),
                    "primary_color": g.get("primary_color", ""),
                    "era": g.get("era", ""),
                    "formality": g.get("formality", ""),
                    "is_traditional": bool(g.get("is_traditional", True)),
                    "occasions": ",".join(g.get("compatible_occasions") or []),
                    "remix_tags": ",".join(g.get("remix_tags") or []),
                    "doc_hash": doc_hash,
                }
                to_encode.append({"id": gid, "doc": doc_text, "meta": meta})

        if to_encode:
            logger.info(
                "Embedding %d garments (%d new, %d updated) using %s...",
                len(to_encode),
                added_count,
                updated_count,
                MODEL_NAME,
            )
            model = self.get_model()
            docs = [item["doc"] for item in to_encode]
            embeddings = model.encode(docs, normalize_embeddings=True, show_progress_bar=False).tolist()

            collection.upsert(
                ids=[item["id"] for item in to_encode],
                embeddings=embeddings,
                metadatas=[item["meta"] for item in to_encode],
                documents=docs,
            )
            logger.info("ChromaDB vector sync complete.")
        else:
            logger.info("All %d garments in Chroma are already up-to-date (skipped re-embedding).", len(garments_data))

        total_count = collection.count()
        return {
            "added": added_count,
            "updated": updated_count,
            "deleted": len(ids_to_delete),
            "total": total_count,
        }

    def init_vector_db(self, force: bool = False) -> int:
        """Alias for sync_garments — kept for backwards compatibility."""
        stats = self.sync_garments(force=force)
        return stats["total"]

    def query_candidates(
        self,
        query_text: str,
        n_results: int = 25,
        gender: str | None = None,
    ) -> list[dict[str, Any]]:
        """Query ChromaDB with semantic search and return candidate garments ranked by similarity."""
        collection = self.get_collection()
        total_items = collection.count()
        if total_items == 0:
            self.sync_garments()
            total_items = collection.count()

        if total_items == 0:
            return []

        model = self.get_model()
        query_vector = model.encode(query_text, normalize_embeddings=True).tolist()

        k = min(n_results, total_items)
        results = collection.query(
            query_embeddings=[query_vector],
            n_results=k,
            include=["metadatas", "distances", "documents"],
        )

        candidates = []
        if results and results.get("ids") and results["ids"][0]:
            ids = results["ids"][0]
            metadatas = results["metadatas"][0] if results.get("metadatas") else [{}] * len(ids)
            distances = results["distances"][0] if results.get("distances") else [0.0] * len(ids)
            documents = results["documents"][0] if results.get("documents") else [""] * len(ids)

            for gid, meta, dist, doc in zip(ids, metadatas, distances, documents):
                # Cosine distance in Chroma HNSW ranges 0 (identical) to 2 (opposite)
                # Cosine similarity = 1 - distance
                similarity = max(0.0, min(1.0, 1.0 - float(dist)))

                # Apply gender filter
                g_fit = (meta.get("gender_fit") or "unisex").lower()
                if gender in ("nu", "female"):
                    if g_fit not in ("nu", "female", "unisex", "all"):
                        continue
                elif gender in ("nam", "male"):
                    if g_fit not in ("nam", "male", "unisex", "all"):
                        continue

                candidates.append(
                    {
                        "id": gid,
                        "similarity": round(similarity, 4),
                        "metadata": meta,
                        "document": doc,
                    }
                )

        return candidates

