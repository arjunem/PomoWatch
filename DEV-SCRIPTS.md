# PomoWatch Development Scripts

This directory contains scripts to easily start both the backend API and frontend Angular app for local development.

## Available Scripts

### 🪟 Windows PowerShell (Recommended for Windows)
```powershell
.\start-dev.ps1
```

**Features:**
- ✅ Intelligent port management
- ✅ Process cleanup
- ✅ Service status monitoring
- ✅ Graceful shutdown with Ctrl+C
- ✅ Real-time status updates

### 🪟 Windows Batch File
```cmd
start-dev.bat
```

**Features:**
- ✅ Opens services in separate windows
- ✅ Automatic dependency installation
- ✅ Simple and straightforward

### 🐧 Linux/macOS Shell Script
```bash
./start-dev.sh
```

**Features:**
- ✅ Cross-platform compatibility
- ✅ Signal handling for clean shutdown
- ✅ Background process management
- ✅ Port conflict detection

## Prerequisites

Before running any script, ensure you have:

1. **Node.js** (v18 or higher)
   - Download from: https://nodejs.org/
   - Verify: `node --version`

2. **.NET SDK** (v8.0 or higher)
   - Download from: https://dotnet.microsoft.com/download
   - Verify: `dotnet --version`

3. **npm** (comes with Node.js)
   - Verify: `npm --version`

## What the Scripts Do

1. **Prerequisites Check**: Verifies Node.js and .NET are installed
2. **Dependency Installation**: Installs npm packages if needed
3. **Port Cleanup**: Kills any existing processes on ports 5000 and 4200
4. **Backend Startup**: Starts ASP.NET Core API on port 5000
5. **Frontend Startup**: Starts Angular development server on port 4200
6. **Service Monitoring**: Monitors service health and provides status updates

## Access Points

Once running, you can access:

- **Frontend Application**: http://localhost:4200
- **Backend API**: http://localhost:5000
- **Swagger Documentation**: http://localhost:5000/swagger

## Development Features

- **Hot Reload**: Both backend and frontend support automatic reloading on code changes
- **CORS Configuration**: Backend is configured to accept requests from localhost:4200
- **Environment Configuration**: Frontend uses local development environment settings

## Troubleshooting

### Port Already in Use
If you get port conflicts:
```bash
# Windows
netstat -ano | findstr :5000
netstat -ano | findstr :4200

# Linux/macOS
lsof -i :5000
lsof -i :4200
```

### Dependencies Issues
If you encounter dependency problems:
```bash
# Frontend
cd frontend
rm -rf node_modules package-lock.json
npm install

# Backend
cd backend
dotnet restore
```

### Database Issues
If you have database problems:
```bash
cd backend
dotnet ef database update
```

## Stopping Services

- **PowerShell Script**: Press Ctrl+C
- **Batch File**: Close the terminal windows
- **Shell Script**: Press Ctrl+C

## Environment Configuration

The scripts automatically use the correct environment configurations:

- **Frontend**: Uses `environment.ts` with `apiBaseUrl: 'http://localhost:5000/api'`
- **Backend**: Uses `appsettings.Development.json` with CORS for localhost:4200

## Tips for Development

1. **Keep Both Services Running**: Both backend and frontend need to be running for full functionality
2. **Check Console Logs**: Monitor both terminal windows for error messages
3. **API Testing**: Use the Swagger UI at http://localhost:5000/swagger to test API endpoints
4. **Frontend Debugging**: Use browser developer tools for frontend debugging
5. **Database Access**: The SQLite database is created automatically in `backend/data/pomodoro.db`

## Production vs Development

These scripts are for **development only**. For production deployment, use Docker:

```bash
docker-compose up --build
```

This will start the application in production mode with:
- Frontend on port 4201 (nginx)
- Backend on port 5001
- Production-optimized builds
