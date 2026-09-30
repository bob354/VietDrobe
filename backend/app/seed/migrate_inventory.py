"""Migrate existing outfit and rental references to the inventory SKU table."""

from app.database import engine


async def migrate_inventory_references() -> None:
    """Rebuild only SQLite foreign keys that still target the legacy garments table."""
    if engine.dialect.name != "sqlite":
        return

    async with engine.connect() as connection:
        foreign_keys = {}
        for table in ("outfit_items", "rental_booking_items"):
            rows = (await connection.exec_driver_sql(f"PRAGMA foreign_key_list({table})")).mappings().all()
            foreign_keys[table] = any(row["table"] == "garments" for row in rows)
        await connection.rollback()
        if not any(foreign_keys.values()):
            return

        await connection.exec_driver_sql("PRAGMA foreign_keys=OFF")
        try:
            await connection.exec_driver_sql("BEGIN IMMEDIATE")
            if foreign_keys["outfit_items"]:
                await connection.exec_driver_sql("""
                    CREATE TABLE outfit_items_new (
                        id VARCHAR(36) PRIMARY KEY,
                        outfit_id VARCHAR(36) NOT NULL REFERENCES outfits(id) ON DELETE CASCADE,
                        garment_id VARCHAR(100) NOT NULL REFERENCES inventory_items(item_id) ON DELETE CASCADE,
                        layer_order INTEGER NOT NULL
                    )
                """)
                await connection.exec_driver_sql(
                    "INSERT INTO outfit_items_new SELECT id, outfit_id, garment_id, layer_order FROM outfit_items"
                )
                await connection.exec_driver_sql("DROP TABLE outfit_items")
                await connection.exec_driver_sql("ALTER TABLE outfit_items_new RENAME TO outfit_items")

            if foreign_keys["rental_booking_items"]:
                await connection.exec_driver_sql("""
                    CREATE TABLE rental_booking_items_new (
                        id VARCHAR(36) PRIMARY KEY,
                        booking_id VARCHAR(36) NOT NULL REFERENCES rental_bookings(id),
                        garment_id VARCHAR(100) NOT NULL REFERENCES inventory_items(item_id),
                        size VARCHAR(10) NOT NULL,
                        quantity INTEGER NOT NULL
                    )
                """)
                await connection.exec_driver_sql(
                    "INSERT INTO rental_booking_items_new SELECT id, booking_id, garment_id, size, quantity FROM rental_booking_items"
                )
                await connection.exec_driver_sql("DROP TABLE rental_booking_items")
                await connection.exec_driver_sql("ALTER TABLE rental_booking_items_new RENAME TO rental_booking_items")

            violations = (await connection.exec_driver_sql("PRAGMA foreign_key_check")).all()
            if violations:
                raise RuntimeError(f"Inventory migration failed foreign-key validation: {violations}")
            await connection.commit()
        except Exception:
            await connection.rollback()
            raise
        finally:
            await connection.exec_driver_sql("PRAGMA foreign_keys=ON")
