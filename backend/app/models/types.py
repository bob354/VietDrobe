"""SQLite-compatible JSON column type."""
import json

from sqlalchemy import Text, TypeDecorator


class JSONType(TypeDecorator):
    """A JSON column that works with both SQLite and PostgreSQL.

    SQLite stores as TEXT, PostgreSQL can swap to native JSONB.
    """

    impl = Text
    cache_ok = True

    def process_bind_param(self, value, dialect):
        if value is not None:
            return json.dumps(value, ensure_ascii=False)
        return None

    def process_result_value(self, value, dialect):
        if value is not None:
            return json.loads(value)
        return None
