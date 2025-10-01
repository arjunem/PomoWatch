# PomoWatch - Pomodoro Timer Application

A full-stack Pomodoro timer application built with Angular and .NET 8, fully containerized with Docker.

## 🚀 Quick Start

### Prerequisites
- Docker Desktop installed
- Docker Compose installed

### Run the Application

```bash
# Start the entire application
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

- `pomodoro-backend` - .NET 8 Web API
- `pomodoro-frontend` - Angular + Nginx

## 📄 License

This is a learning project created as part of Phase 1 development.

## 🎯 Next Steps (Future Phases)

- **Phase 2:** Backend Core (Session management, repository pattern)
- **Phase 3:** Frontend Core (Timer UI, API integration, history)
- **Phase 4:** Polish & Extras (Settings, notifications, CI/CD)

