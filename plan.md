# Pomodoro App - Project Plan

This plan splits the project into **phases** with **small, testable units**.
Each step should be runnable **locally** and **in Docker**.

---

## Phase 1 - Setup (with Full-Stack Docker Integration)

### Task 1: Initialize Backend (.NET Core API)

* Create new .NET 8 Web API project in `/backend`
* Add initial controller (`HealthController`) with `/api/health` endpoint returning `"ok"`
* Test locally using:

  ```bash
  dotnet run
  curl http://localhost:5000/api/health
  ```

### Task 2: Add SQLite + EF Core

* Add EF Core + EF Core SQLite provider
* Create `Session` model and `PomodoroDbContext`
* Configure connection string: `Data Source=/app/data/pomodoro.db`
* Apply first migration and verify DB file is created
* Test:

  * Run `dotnet ef database update`
  * Confirm `pomodoro.db` exists and is writable

### Task 3: Backend Dockerization

* Create `backend/Dockerfile` with multi-stage build
* Ensure app runs on `http://0.0.0.0:5000`
* Test:

  ```bash
  docker build -t pomodoro-backend ./backend
  docker run -p 5000:5000 pomodoro-backend
  ```

### Task 4: Initialize Frontend (Angular + Tailwind)

* Create Angular 17 app in `/frontend`
* Add TailwindCSS configuration
* Add simple Home component with "Pomodoro App" heading
* Test locally using:

  ```bash
  ng serve --open
  ```

### Task 5: Frontend Dockerization

* Create `frontend/Dockerfile` with multi-stage build (Node → Nginx)
* Add `nginx.conf` with `/api` proxy to backend
* Test:

  ```bash
  docker build -t pomodoro-frontend ./frontend
  docker run -p 4200:80 pomodoro-frontend
  ```

### Task 6: Full-Stack Docker Compose

* Create root `docker-compose.yml` with:

  * **backend** (exposes `5000`)
  * **frontend** (exposes `4200`, proxies `/api`)
  * Shared network `pomodoro-net`
  * Mounted volume `./data:/app/data` for SQLite persistence
* Test:

  ```bash
  docker-compose up --build
  ```
* Verify:

  * Visit `http://localhost:4200`
  * Check `/api/health` works through proxy
  * Confirm SQLite file `./data/pomodoro.db` persists after restart

---

## Phase 2 - Backend Core

### Task 1: Define Models

* Create `Session` entity:

  ```csharp
  public class Session {
    public int Id { get; set; }
    public string Type { get; set; } // "work" or "break"
    public DateTime StartTime { get; set; }
    public DateTime EndTime { get; set; }
    public string Status { get; set; } // "running", "completed", "cancelled"
  }
  ```
* Update EF Core migrations

### Task 2: Create Session Repository + Service

* Abstract database access into a repository layer
* Add service layer for business logic (start/stop session)

### Task 3: Add API Endpoints

* `GET /api/sessions` → list all sessions
* `POST /api/sessions` → create new session
* `PUT /api/sessions/{id}` → update session
* `DELETE /api/sessions/{id}` → delete session
* Test via Postman / curl

### Task 4: Unit Tests for Backend

* Add xUnit project
* Test session creation, retrieval, and status updates

---

## Phase 3 - Frontend Core

### Task 1: Setup Angular State Management

* Use Angular Services for timer state
* Keep track of:

  * Current session type (work/break)
  * Remaining time
  * Status (running/paused/stopped)

### Task 2: Build Timer UI

* Countdown timer with start/pause/reset buttons
* Visual indicator (progress bar or circle)
* Basic Tailwind styling

### Task 3: Integrate API

* On "Start Session", POST to backend
* On "Stop Session", PUT to backend
* Fetch history via GET `/api/sessions`
* Display session history table

### Task 4: Frontend Tests

* Add Jasmine/Karma unit tests for timer service
* Add integration test for API service

---

## Phase 4 - Polish & Extras

### Task 1: Settings Page

* Allow user to configure work/break duration
* Store settings in backend (SQLite)

### Task 2: Offline Mode Support

* Add logic to run the App in offline mode (whole features in browser itself)
* Add a setting to handle it / automatically switch this mode when API/internet not available
* The session history and today's progress block should be hidden for offline mode
* The mode should be mentioned near the settings in the title bar

### Task 3: History Page Improvements

* Filter sessions by date
* Display charts (e.g., work vs. break time distribution)

### Task 4: Notifications

* Add desktop notifications at end of session
* Optional sound alert

### Task 5: CI/CD Setup

* Add GitHub Actions workflow:

  * Build + test backend
  * Build + test frontend
  * Build Docker images
  * Run `docker-compose up -d` for integration tests

---

## Future Extensions

* **Authentication & Multi-User Support** (JWT, Identity)
* **Switch from SQLite to PostgreSQL** for production
* **Progressive Web App (PWA)** with offline mode
* **Gamification**: streak tracking, badges
* **Deployment to Kubernetes**
