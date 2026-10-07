import os
from pathlib import Path
import sqlite3
import subprocess
import sys

import pytest


@pytest.mark.parametrize("absolute_path", [False, True])
def test_fresh_startup_creates_database_directory(tmp_path, absolute_path):
    database_path = tmp_path / "database" / "nested" / "vietphuc.db"
    url_path = database_path.as_posix() if absolute_path else "./database/nested/vietphuc.db"
    environment = os.environ.copy()
    environment.update(
        DATABASE_URL=f"sqlite+aiosqlite:///{url_path}",
        STORAGE_PATH=str(tmp_path / "separate-storage"),
        DEBUG="false",
        PYTHONDONTWRITEBYTECODE="1",
    )
    backend_path = str(Path(__file__).resolve().parents[1])
    environment["PYTHONPATH"] = os.pathsep.join(
        [backend_path, environment.get("PYTHONPATH", "")]
    )
    assert not database_path.parent.exists()
    result = subprocess.run(
        [sys.executable, "-c", """
import asyncio
from sqlalchemy import text
from app.database import engine

async def startup():
    try:
        async with engine.begin() as connection:
            await connection.execute(text("CREATE TABLE startup_check (id INTEGER)"))
    finally:
        await engine.dispose()

asyncio.run(startup())
"""],
        cwd=tmp_path,
        env=environment,
        capture_output=True,
        text=True,
        timeout=30,
    )
    assert result.returncode == 0, result.stderr
    assert database_path.is_file()
    with sqlite3.connect(database_path) as connection:
        assert connection.execute(
            "SELECT name FROM sqlite_master WHERE name = 'startup_check'"
        ).fetchone() == ("startup_check",)
