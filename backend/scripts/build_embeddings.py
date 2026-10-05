"""Build backend/app/seed/embeddings.json (commit it to git).

Run from the backend/ folder whenever you change garment_types.json,
inventory_items.json, OCCASION_QUERY or STYLE_QUERY:

    py -m scripts.build_embeddings          # rebuild (downloads the model once)
    py -m scripts.build_embeddings --check  # exit 1 if the bundle is out of date
"""
import json
import sys

from app.services.rag_service import (
    EMBEDDINGS_BUNDLE_FILE,
    GARMENT_TYPES_FILE,
    INVENTORY_ITEMS_FILE,
    MODEL_NAME,
    RAGService,
)
from app.services.recommendation_service import build_fixed_query_map

DECIMALS = 5  # plenty for cosine similarity on normalised vectors


def _documents() -> dict[str, str]:
    types = {t["type_id"]: t for t in json.loads(GARMENT_TYPES_FILE.read_text(encoding="utf-8"))}
    items = json.loads(INVENTORY_ITEMS_FILE.read_text(encoding="utf-8"))
    return {
        i["item_id"]: RAGService.format_garment_document(i, types[i["parent_type_id"]])
        for i in items
    }


def _is_current() -> bool:
    if not EMBEDDINGS_BUNDLE_FILE.exists():
        return False
    bundle = json.loads(EMBEDDINGS_BUNDLE_FILE.read_text(encoding="utf-8"))
    if bundle.get("model") != MODEL_NAME:
        return False
    docs = _documents()
    items = bundle.get("items", {})
    if set(items) != set(docs):
        return False
    if any(items[k]["doc_hash"] != RAGService.compute_doc_hash(v) for k, v in docs.items()):
        return False
    return set(build_fixed_query_map()) <= set(bundle.get("queries", {}))


def main() -> int:
    if "--check" in sys.argv:
        ok = _is_current()
        print("embeddings.json is up to date." if ok else "embeddings.json is OUT OF DATE.")
        return 0 if ok else 1

    docs = _documents()
    queries = list(build_fixed_query_map())
    model = RAGService.get_model()

    def encode(texts):
        vectors = model.encode(texts, normalize_embeddings=True, show_progress_bar=False, batch_size=16)
        return [[round(float(x), DECIMALS) for x in v] for v in vectors]

    item_ids = list(docs)
    item_vectors = encode([docs[i] for i in item_ids])
    query_vectors = encode(queries)
    bundle = {
        "model": MODEL_NAME,
        "dim": len(item_vectors[0]),
        "items": {
            i: {"doc_hash": RAGService.compute_doc_hash(docs[i]), "vector": v}
            for i, v in zip(item_ids, item_vectors)
        },
        "queries": dict(zip(queries, query_vectors)),
    }
    EMBEDDINGS_BUNDLE_FILE.write_text(json.dumps(bundle, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    size_kb = EMBEDDINGS_BUNDLE_FILE.stat().st_size / 1024
    print(f"Wrote {EMBEDDINGS_BUNDLE_FILE} ({len(item_ids)} items, {len(queries)} queries, {size_kb:.0f} KB)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
