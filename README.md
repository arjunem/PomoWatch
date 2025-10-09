# PomoWatch - Pomodoro Timer Application

[![Docker Build and Publish](https://github.com/arjunem/PomoWatch/actions/workflows/docker-publish.yml/badge.svg)](https://github.com/arjunem/PomoWatch/actions/workflows/docker-publish.yml)
[![Backend](https://img.shields.io/badge/backend-.NET%208-512BD4?logo=dotnet)](https://github.com/arjunem/PomoWatch/pkgs/container/pomowatch%2Fbackend)
[![Frontend](https://img.shields.io/badge/frontend-Angular%2020-DD0031?logo=angular)](https://github.com/arjunem/PomoWatch/pkgs/container/pomowatch%2Ffrontend)

A full-stack Pomodoro timer application built with Angular and .NET 8, fully containerized with Docker and automatically deployed to GitHub Container Registry.

## 🚀 Quick Start

### Option 1: Use Pre-built Images (Recommended)

Pull and run the latest images from GitHub Container Registry:

```bash
# Pull latest images
docker pull ghcr.io/arjunem/pomowatch/backend:latest
docker pull ghcr.io/arjunem/pomowatch/frontend:latest

# Run with production compose file
docker-compose -f docker-compose.prod.yml up -d
```

### Option 2: Build Locally

Build from source code:

```bash
# Prerequisites: Docker Desktop and Docker Compose installed

# Build and start the entire application
docker-compose up --build

# Or run in detached mode
docker-compose up -d --build
```

### Access the Application

#### Docker (Production-like)
- **Frontend:** http://localhost:4201
- **Backend API:** http://localhost:5001/api/health
- **Swagger UI:** http://localhost:5001/swagger

#### Local Development
- **Frontend:** http://localhost:4200
- **Backend API:** http://localhost:5000/api/health
- **Swagger UI:** http://localhost:5000/swagger

### Stop the Application

```bash
# Stop all containers
docker-compose down

# Stop and remove volumes
docker-compose down -v
```

## 🛠️ Local Development

For local development, you can run the services individually:

### Backend
```bash
cd backend
dotnet run --launch-profile debug
```

### Frontend
```bash
cd frontend
ng serve
```

### Benefits of This Setup
- **No Port Conflicts**: Run Docker and local development simultaneously
- **Flexible Testing**: Test both environments side by side
- **Easy Switching**: Use Docker for production-like testing, local for development
- **Smart API URLs**: Automatic configuration for different environments

### Environment Configuration
The Angular app automatically uses the correct API base URL:

| Environment | API Base URL | How It Works |
|-------------|--------------|--------------|
| **Local Development** | `http://localhost:5000/api` | Direct connection to local backend (CORS enabled) |
| **Docker** | `/api` | Relative URL, nginx proxies to backend container |

## 🏗️ Architecture

### Backend (.NET 8 Web API)
- **Port:** 5000
- **Database:** SQLite (persisted in `./data` folder)
- **Features:**
  - Health check endpoint: `/api/health`
  - EF Core with SQLite
  - Swagger documentation

### Frontend (Angular 20 + Tailwind CSS)
- **Port:** 4200 (4200:80 mapping)
- **Features:**
  - Modern UI with Tailwind CSS
  - Nginx web server
  - API proxy to backend at `/api`

### Docker Setup
- **Multi-stage builds** for optimized images
- **Shared network:** `pomodoro-net`
- **Persistent volume:** SQLite database in `./data`
- **Automatic restart** unless stopped manually

## 📁 Project Structure

```
PomoWatch/
├── backend/
│   ├── Controllers/
│   ├── Data/
│   ├── Models/
│   ├── Migrations/
│   ├── Dockerfile
│   └── .dockerignore
├── frontend/
│   ├── src/
│   ├── Dockerfile
│   ├── nginx.conf
│   └── .dockerignore
├── data/
│   └── pomodoro.db (SQLite database)
├── docker-compose.yml
├── .gitignore
├── change.log
├── prompt.log
└── command.log
```

## 🛠️ Development

### Backend Development
```bash
cd backend
dotnet run --launch-profile http
```

### Frontend Development
```bash
cd frontend
ng serve --open
```

## 📝 Logs

All development activities are tracked in:
- `change.log` - All project changes
- `prompt.log` - All user prompts and assistant responses
- `command.log` - All terminal commands and outputs

## 🔧 Technology Stack

### Backend
- .NET 8.0
- ASP.NET Core Web API
- Entity Framework Core 9.0.9
- SQLite Database

### Frontend
- Angular 20.2.0
- Tailwind CSS 3.4.0
- TypeScript 5.9.2

### DevOps
- Docker
- Docker Compose
- Nginx

## 📦 Database

SQLite database is stored in `./data/pomodoro.db` and is mounted as a Docker volume for persistence across container restarts.

### Database Schema

**Sessions Table:**
- `Id` (int, Primary Key)
- `Type` (string) - "work" or "break"
- `StartTime` (DateTime)
- `EndTime` (DateTime)
- `Status` (string) - "running", "completed", "cancelled"

## 🐳 Docker Images

**Local Images:**
- `pomodoro-backend` - .NET 8 Web API
- `pomodoro-frontend` - Angular + Nginx

**GitHub Container Registry (Production):**
- `ghcr.io/arjunem/pomowatch/backend:latest` - Backend API
- `ghcr.io/arjunem/pomowatch/frontend:latest` - Frontend App

View packages: [Backend](https://github.com/arjunem/PomoWatch/pkgs/container/pomowatch%2Fbackend) | [Frontend](https://github.com/arjunem/PomoWatch/pkgs/container/pomowatch%2Ffrontend)

## 🚢 Deployment

This project uses GitHub Actions for automated CI/CD to GitHub Container Registry.

### Automated Deployment

Images are automatically built and published when:
- ✅ Code is pushed to `main` branch → `latest` tag
- ✅ Version tags are created (e.g., `v1.0.0`) → versioned tags
- ✅ Pull requests are opened → build only (testing)

### Deployment Features

- ✅ Multi-platform support (linux/amd64, linux/arm64)
- ✅ Automated security scanning with Trivy
- ✅ Docker layer caching for faster builds
- ✅ Health checks for containers
- ✅ Semantic versioning

### Quick Deploy

```bash
# Pull latest images
docker-compose -f docker-compose.prod.yml pull

# Start production deployment
docker-compose -f docker-compose.prod.yml up -d
```

For detailed deployment instructions, see [DEPLOYMENT.md](DEPLOYMENT.md).

## 📄 License

This is a learning project created as part of a full-stack development exercise.

## 🎯 Project Status

- ✅ **Phase 1:** Setup (Docker, Infrastructure) - COMPLETED
- ✅ **Phase 2:** Backend Core (Session management, repository pattern) - COMPLETED
- ✅ **Phase 3:** Frontend Core (Timer UI, API integration, history) - COMPLETED
- ✅ **Phase 4:** Polish & Extras (Settings, notifications, CI/CD) - COMPLETED

