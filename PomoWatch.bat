@echo off
setlocal enabledelayedexpansion
title PomoWatch Launcher
cd /d "%~dp0"

echo.
echo ============================================
echo   PomoWatch - Starting up...
echo ============================================
echo.

REM --- Prerequisite checks ---
where dotnet >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] .NET SDK not found on PATH. Install it from https://dotnet.microsoft.com/download
    pause
    exit /b 1
)
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Node.js not found on PATH. Install it from https://nodejs.org/
    pause
    exit /b 1
)

REM --- Install frontend deps on first run ---
if not exist "frontend\node_modules" (
    echo Installing frontend dependencies, first run only...
    pushd frontend
    call npm install
    popd
)

REM --- Free up ports left over from a previous run ---
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :5000 2^>nul') do taskkill /PID %%a /F >nul 2>nul
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :4200 2^>nul') do taskkill /PID %%a /F >nul 2>nul

REM --- Logs for troubleshooting, since services now run fully hidden ---
if not exist "logs" mkdir logs
if exist "logs\backend.log" del /q "logs\backend.log"
if exist "logs\backend.err.log" del /q "logs\backend.err.log"
if exist "logs\frontend.log" del /q "logs\frontend.log"
if exist "logs\frontend.err.log" del /q "logs\frontend.err.log"

REM --- Start backend (ASP.NET Core API) - fully hidden, no window ---
echo Starting backend API...
powershell -NoProfile -WindowStyle Hidden -Command "Start-Process -FilePath 'dotnet' -ArgumentList 'run' -WorkingDirectory '%~dp0backend' -WindowStyle Hidden -RedirectStandardOutput '%~dp0logs\backend.log' -RedirectStandardError '%~dp0logs\backend.err.log'"

echo Waiting for backend on http://localhost:5000 ...
set BACKEND_UP=0
for /l %%i in (1,1,30) do (
    powershell -NoProfile -Command "try { (New-Object Net.Sockets.TcpClient).Connect('localhost',5000); exit 0 } catch { exit 1 }" >nul 2>nul
    if !ERRORLEVEL! EQU 0 (
        set BACKEND_UP=1
        goto backend_ready
    )
    timeout /t 1 /nobreak >nul
)
:backend_ready
if !BACKEND_UP! EQU 1 (
    echo Backend is up.
) else (
    echo [WARN] Backend did not respond within 30s - check logs\backend.err.log for errors.
)

REM --- Start frontend (Angular dev server) - fully hidden, no window ---
echo Starting frontend app...
powershell -NoProfile -WindowStyle Hidden -Command "Start-Process -FilePath 'cmd.exe' -ArgumentList '/c npm start' -WorkingDirectory '%~dp0frontend' -WindowStyle Hidden -RedirectStandardOutput '%~dp0logs\frontend.log' -RedirectStandardError '%~dp0logs\frontend.err.log'"

echo Waiting for frontend on http://localhost:4200 ...
echo (first-time Angular builds can take a couple of minutes, please be patient)
set FRONTEND_UP=0
for /l %%i in (1,1,180) do (
    powershell -NoProfile -Command "try { (New-Object Net.Sockets.TcpClient).Connect('localhost',4200); exit 0 } catch { exit 1 }" >nul 2>nul
    if !ERRORLEVEL! EQU 0 (
        set FRONTEND_UP=1
        goto frontend_ready
    )
    <nul set /p "=."
    timeout /t 1 /nobreak >nul
)
echo.
:frontend_ready
if !FRONTEND_UP! EQU 1 (
    echo Frontend is up.
) else (
    echo [WARN] Frontend did not respond within 3 minutes - check logs\frontend.log / logs\frontend.err.log for errors.
)

echo.
echo ============================================
echo   PomoWatch is running!
echo   Frontend: http://localhost:4200
echo   Backend:  http://localhost:5000/swagger
echo   Logs:     %~dp0logs
echo ============================================
echo.

if !FRONTEND_UP! EQU 1 (
    start "" "http://localhost:4200"
) else (
    echo Not opening the browser automatically since the frontend isn't responding yet.
    echo Once logs\frontend.log shows it compiled successfully, open http://localhost:4200 manually.
)

echo Press any key in this window to stop PomoWatch (backend + frontend).
pause >nul

echo.
echo Stopping PomoWatch...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :5000 2^>nul') do taskkill /PID %%a /F >nul 2>nul
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :4200 2^>nul') do taskkill /PID %%a /F >nul 2>nul
echo Stopped. Goodbye!
timeout /t 2 /nobreak >nul
exit /b 0
