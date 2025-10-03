@echo off
REM PomoWatch Local Development Script
REM This script starts both the backend API and frontend Angular app for local development

echo.
echo 🚀 Starting PomoWatch Local Development Environment...
echo.

REM Check if Node.js is installed
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

REM Check if .NET is installed
where dotnet >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ❌ .NET SDK is not installed or not in PATH
    echo Please install .NET SDK from https://dotnet.microsoft.com/download
    pause
    exit /b 1
)

REM Check if npm dependencies are installed for frontend
if not exist "frontend\node_modules" (
    echo 📦 Installing frontend dependencies...
    cd frontend
    npm install
    if %ERRORLEVEL% NEQ 0 (
        echo ❌ Failed to install frontend dependencies
        pause
        exit /b 1
    )
    cd ..
)

echo ✅ Prerequisites check passed
echo.

REM Kill any existing processes on ports 5000 and 4200
echo 🧹 Cleaning up existing processes...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :5000 2^>nul') do (
    taskkill /PID %%a /F >nul 2>nul
)
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :4200 2^>nul') do (
    taskkill /PID %%a /F >nul 2>nul
)

echo ✅ Ports cleaned up
echo.

REM Start Backend API in a new window
echo 🔧 Starting Backend API (ASP.NET Core)...
echo    Backend will be available at: http://localhost:5000
echo    Swagger UI will be available at: http://localhost:5000/swagger

start "PomoWatch Backend" cmd /k "cd backend && dotnet run"

REM Wait a moment for backend to start
timeout /t 3 /nobreak >nul

REM Start Frontend Angular App in a new window
echo 🎨 Starting Frontend Angular App...
echo    Frontend will be available at: http://localhost:4200

start "PomoWatch Frontend" cmd /k "cd frontend && npm start"

REM Wait a moment for frontend to start
timeout /t 5 /nobreak >nul

echo.
echo 🎉 PomoWatch Development Environment is Starting!
echo.
echo 📱 Access your application:
echo    • Frontend: http://localhost:4200
echo    • Backend API: http://localhost:5000
echo    • Swagger Documentation: http://localhost:5000/swagger
echo.
echo 💡 Tips:
echo    • Both services are running in separate windows
echo    • Backend supports hot reload on code changes
echo    • Frontend supports hot reload on code changes
echo    • Close the terminal windows to stop the services
echo    • Check the service windows for any error messages
echo.
echo 🚀 Services are starting up... Please wait a moment for them to be fully ready.
echo.

:wait_loop
echo Services are running. Close this window to stop all services.
echo.
echo 📊 Service Status:
netstat -an | findstr ":5000" >nul
if %errorlevel% equ 0 (
    echo    ✅ Backend API (port 5000): Running
) else (
    echo    ❌ Backend API (port 5000): Not running
)

netstat -an | findstr ":4200" >nul
if %errorlevel% equ 0 (
    echo    ✅ Frontend App (port 4200): Running
) else (
    echo    ❌ Frontend App (port 4200): Not running
)

echo.
echo 💡 Press Ctrl+C or close this window to stop all services
echo.

REM Wait 30 seconds before checking again
timeout /t 30 /nobreak >nul

goto :wait_loop

:cleanup
echo.
echo 🛑 Stopping all services...

REM Kill processes on ports 5000 and 4200
echo Stopping backend and frontend processes...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :5000 2^>nul') do (
    taskkill /PID %%a /F >nul 2>nul
    echo ✅ Stopped process on port 5000 (PID: %%a)
)
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :4200 2^>nul') do (
    taskkill /PID %%a /F >nul 2>nul
    echo ✅ Stopped process on port 4200 (PID: %%a)
)

REM Kill any remaining dotnet and node processes that might be related
echo Stopping any remaining dotnet processes...
taskkill /IM "dotnet.exe" /F >nul 2>nul
echo Stopping any remaining node processes...
taskkill /IM "node.exe" /F >nul 2>nul

echo ✅ All services stopped
echo.
echo 👋 Goodbye!
pause
exit /b 0