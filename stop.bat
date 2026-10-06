@echo off
:: TEMPORARY: keep in sync with BACKEND_PORT in start.bat (default 8000).
set "BACKEND_PORT=8010"
echo Stopping services on ports %BACKEND_PORT% and 3000...

for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":%BACKEND_PORT% " ^| findstr "LISTENING"') do (
    taskkill /F /PID %%a >nul 2>nul
)

for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":3000" ^| findstr "LISTENING"') do (
    taskkill /F /PID %%a >nul 2>nul
)

echo [OK] Services stopped.
timeout /t 2 /nobreak >nul