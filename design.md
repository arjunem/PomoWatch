# Pomodoro App - Design Document

## 1. Overview
The Pomodoro App is a productivity tool that helps users manage work sessions and breaks using the Pomodoro Technique.  
It will be built with **Angular (frontend)** and **.NET 8 Web API (backend)**, with **SQLite for local persistence**.  
From the initial phase, the entire stack will run inside **Docker containers** using a single `docker-compose.yml`.

---

## 2. Architecture

### High-Level Components
- **Frontend (Angular + Tailwind + Nginx)**
  - Runs in browser
  - Communicates with backend via REST API
  - Bundled and served via Nginx
- **Backend (ASP.NET Core Web API)**
  - Provides REST endpoints for managing sessions
  - Uses EF Core with SQLite
- **Database (SQLite)**
  - Local persistence stored as `pomodoro.db`
  - Mounted via Docker volume (`./data:/app/data`)

---

## 3. Dockerized Full Stack

### Container Setup
- **Frontend container**
  - Built with Node
  - Runs inside Nginx
  - Proxies `/api/*` requests to backend
- **Backend container**
  - Runs ASP.NET Core Web API
  - Exposes port `5000`
- **Volume**
  - SQLite DB stored on host under `./data`
  - Ensures persistence across container restarts
- **docker-compose.yml**
  - Defines both services (`frontend`, `backend`)
  - Creates shared network `pomodoro-net`
  - Provides single command `docker-compose up` to run full stack

### Network Flow
