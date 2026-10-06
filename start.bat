@echo off
setlocal enabledelayedexpansion

title Viet Phuc Remix Launcher
echo ========================================================
echo       VIET PHUC REMIX - ONE-CLICK LAUNCHER
echo ========================================================
echo.

set "ROOT_DIR=%~dp0"
set "BACKEND_DIR=%ROOT_DIR%backend"
set "FRONTEND_DIR=%ROOT_DIR%frontend"

:: TEMPORARY: backend port. Default is 8000; change back to 8000 when it is free again.
:: (stop.bat has the same line - keep the two in sync.)
set "BACKEND_PORT=8010"

:: 1. Detect Python
where py >nul 2>nul
if %errorlevel% equ 0 (
    set "PY_CMD=py"
) else (
    where python >nul 2>nul
    if %errorlevel% equ 0 (
        set "PY_CMD=python"
    ) else (
        echo [ERROR] Python not found. Please install Python 3.11+.
        pause
        exit /b 1
    )
)

:: 2. Detect Node.js
where npm >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] npm not found. Please install Node.js 18+.
    pause
    exit /b 1
)

:: 3. Backend Dependencies
echo [1/4] Checking Backend dependencies...
%PY_CMD% -c "import fastapi, uvicorn, sqlalchemy, aiosqlite, PIL, chromadb" >nul 2>nul
if %errorlevel% neq 0 (
    echo Installing backend dependencies...
    %PY_CMD% -m pip install -r "%BACKEND_DIR%\requirements.txt"
) else (
    echo [OK] Backend dependencies ready.
)

:: 4. Frontend Dependencies
echo [2/4] Checking Frontend dependencies...
if not exist "%FRONTEND_DIR%\node_modules" (
    echo Installing frontend dependencies...
    cd /d "%FRONTEND_DIR%"
    call npm install
    cd /d "%ROOT_DIR%"
) else (
    echo [OK] Frontend dependencies ready.
)

:: 5. Launch Backend
echo [3/4] Starting Backend on http://127.0.0.1:%BACKEND_PORT%...
start "Viet Phuc Remix - Backend (:%BACKEND_PORT%)" cmd /k "cd /d "%BACKEND_DIR%" && set PYTHONIOENCODING=utf-8 && %PY_CMD% -m uvicorn app.main:app --host 127.0.0.1 --port %BACKEND_PORT% --reload"

:: 6. Launch Frontend
echo [4/4] Starting Frontend on http://localhost:3000...
start "Viet Phuc Remix - Frontend (:3000)" cmd /k "cd /d "%FRONTEND_DIR%" && set BACKEND_URL=http://127.0.0.1:%BACKEND_PORT%&& npm run dev"

timeout /t 3 /nobreak >nul
start http://localhost:3000

echo.
echo ========================================================
echo    SYSTEM READY
echo    - Frontend: http://localhost:3000
echo    - Backend:  http://127.0.0.1:%BACKEND_PORT%/docs
echo    (Run stop.bat to terminate)
echo ========================================================
echo.
pause