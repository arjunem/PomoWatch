# 📚 Complete Tutorial: GitHub Container Registry & CI/CD Deployment

## Table of Contents
- [Introduction](#introduction)
- [Part 1: Understanding the Basics](#part-1-understanding-the-basics)
- [Part 2: What We Built](#part-2-what-we-built)
- [Part 3: How GitHub Actions Works](#part-3-how-github-actions-works)
- [Part 4: How GitHub Container Registry Works](#part-4-how-github-container-registry-works)
- [Part 5: The CI/CD Pipeline Flow](#part-5-the-cicd-pipeline-flow)
- [Part 6: Monitoring Your Build](#part-6-monitoring-your-build)
- [Part 7: Using Your Deployed Images](#part-7-using-your-deployed-images)
- [Part 8: Managing Versions](#part-8-managing-versions)
- [Part 9: Troubleshooting](#part-9-troubleshooting)
- [Part 10: Best Practices](#part-10-best-practices)

---

## Introduction

This tutorial will guide you through everything we set up for automatic deployment of your PomoWatch application to GitHub Container Registry (GHCR). By the end, you'll understand:

✅ What GitHub Container Registry is and why we use it  
✅ How GitHub Actions automates the build and deployment  
✅ How to monitor and verify your deployments  
✅ How to pull and run your application from GHCR  
✅ How to manage versions and rollbacks  

**No prior experience needed!** We'll start from the basics.

---

## Part 1: Understanding the Basics

### 1.1 What is a Docker Image?

Think of a Docker image like a **snapshot of your application** with everything it needs to run:

```
Docker Image = Your Code + Dependencies + Runtime + Configuration
```

**Example:**
- Your backend image contains: .NET 8 runtime + your API code + SQLite + configuration
- Your frontend image contains: Nginx web server + Angular app (compiled) + configuration

**Why use images?**
- ✅ **Consistency**: Runs the same everywhere (your PC, server, cloud)
- ✅ **Portability**: Easy to share and deploy
- ✅ **Isolation**: Doesn't interfere with other applications

### 1.2 What is a Container Registry?

A **Container Registry** is like **GitHub for Docker images**. Instead of storing code, it stores built Docker images.

**Popular registries:**
- **Docker Hub**: Public registry (docker.io)
- **GitHub Container Registry (GHCR)**: Integrated with GitHub (ghcr.io)
- **AWS ECR, Google GCR**: Cloud-specific registries

**Why we chose GHCR:**
- ✅ Free for public repositories
- ✅ Integrated with GitHub (automatic authentication)
- ✅ Same place as your code
- ✅ Built-in security scanning

### 1.3 What is CI/CD?

**CI/CD** = Continuous Integration / Continuous Deployment

**In simple terms:**
- **CI (Continuous Integration)**: Automatically test code when changes are made
- **CD (Continuous Deployment)**: Automatically deploy code when tests pass

**Our CI/CD workflow:**
```
You push code → GitHub Actions builds images → Tests/scans images → Publishes to GHCR → Ready to deploy
```

### 1.4 What is GitHub Actions?

**GitHub Actions** is GitHub's automation platform. It runs tasks when certain events happen.

**Think of it as:**
- A robot 🤖 that watches your repository
- When you push code, the robot wakes up
- It follows instructions (workflow) you gave it
- It builds, tests, and publishes your app

**Why it's powerful:**
- ✅ Free for public repositories
- ✅ Runs on GitHub's servers (no setup needed)
- ✅ Integrated with GitHub (automatic access to code, packages, etc.)

---

## Part 2: What We Built

### 2.1 Files Created

Here's what we set up for you:

#### File 1: `.github/workflows/docker-publish.yml`
**Purpose:** Instructions for GitHub Actions robot  
**What it does:** Builds Docker images and publishes to GHCR  
**When it runs:** When you push code or create version tags  

#### File 2: `docker-compose.prod.yml`
**Purpose:** Production deployment configuration  
**What it does:** Tells Docker how to run your app using GHCR images  
**When you use it:** When deploying to production servers  

#### File 3: `DEPLOYMENT.md`
**Purpose:** Step-by-step deployment guide  
**What it contains:** Instructions for deploying and managing your app  

#### File 4: `DEPLOYMENT-PLAN.md`
**Purpose:** Overall deployment strategy  
**What it contains:** The plan we followed to set everything up  

#### File 5: Updated `README.md`
**Purpose:** Project documentation  
**What changed:** Added badges, deployment instructions, GHCR links  

### 2.2 Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     YOUR DEVELOPMENT                         │
│                                                              │
│  1. Write Code                                              │
│  2. git commit -m "Add feature"                             │
│  3. git push origin main                                    │
└────────────────────────┬────────────────────────────────────┘
                         │
                         │ Push triggers workflow
                         ↓
┌─────────────────────────────────────────────────────────────┐
│                    GITHUB ACTIONS                            │
│                  (Automated Building)                        │
│                                                              │
│  1. ✅ Checkout code                                        │
│  2. ✅ Set up Docker Buildx (multi-platform)                │
│  3. ✅ Login to GHCR                                        │
│  4. ✅ Build backend image (amd64 + arm64)                  │
│  5. ✅ Build frontend image (amd64 + arm64)                 │
│  6. ✅ Scan for vulnerabilities (Trivy)                     │
│  7. ✅ Push images to GHCR                                  │
│  8. ✅ Upload security reports                              │
└────────────────────────┬────────────────────────────────────┘
                         │
                         │ Images published
                         ↓
┌─────────────────────────────────────────────────────────────┐
│              GITHUB CONTAINER REGISTRY                       │
│                  (Image Storage)                             │
│                                                              │
│  📦 ghcr.io/arjunem/pomowatch/backend:latest                │
│  📦 ghcr.io/arjunem/pomowatch/frontend:latest               │
│                                                              │
│  Available to pull from anywhere!                           │
└────────────────────────┬────────────────────────────────────┘
                         │
                         │ Pull images
                         ↓
┌─────────────────────────────────────────────────────────────┐
│                   PRODUCTION DEPLOYMENT                      │
│                  (Your Server / Cloud)                       │
│                                                              │
│  docker-compose -f docker-compose.prod.yml up -d            │
│                                                              │
│  🚀 Application running!                                    │
└─────────────────────────────────────────────────────────────┘
```

---

## Part 3: How GitHub Actions Works

### 3.1 Workflow Triggers

Your workflow runs when:

**1. Push to main branch**
```bash
git push origin main
```
→ Builds and publishes with tag `latest`

**2. Push a version tag**
```bash
git tag v1.0.0
git push origin v1.0.0
```
→ Builds and publishes with tags: `v1.0.0`, `v1.0`, `v1`, `latest`

**3. Open a Pull Request**
```bash
# Create PR on GitHub
```
→ Builds for testing (doesn't publish)

**4. Manual trigger**
→ Click "Run workflow" button in GitHub Actions tab

### 3.2 Workflow Jobs

Your workflow has 3 jobs that run:

#### Job 1: Build Backend (10-12 minutes)
```yaml
Steps:
1. Checkout code from repository
2. Set up QEMU (for multi-platform builds)
3. Set up Docker Buildx (advanced build system)
4. Login to GHCR using GitHub token
5. Extract tags based on git event
6. Build Docker image for amd64 + arm64
7. Push image to GHCR
8. Run Trivy security scan
9. Upload security results to GitHub
```

#### Job 2: Build Frontend (8-10 minutes)
```yaml
Same steps as backend, but for frontend
```

#### Job 3: Summary (1 minute)
```yaml
Runs after both builds complete
Creates a summary with:
- Image URLs
- Pull commands
- Deployment status
```

### 3.3 Understanding the Workflow File

Let's break down key parts of `.github/workflows/docker-publish.yml`:

**Part A: When to Run**
```yaml
on:
  push:
    branches: [main]        # Run when pushing to main
    tags: ['v*.*.*']        # Run when creating version tags
  pull_request:
    branches: [main]        # Run when opening PR
  workflow_dispatch:        # Allow manual runs
```

**Part B: Environment Variables**
```yaml
env:
  REGISTRY: ghcr.io                                    # GitHub Container Registry
  BACKEND_IMAGE_NAME: ${{ github.repository }}/backend # Image name
```
- `github.repository` = your-username/repo-name
- Full image: `ghcr.io/your-username/repo-name/backend`

**Part C: Build Steps**
```yaml
- name: Build and push backend Docker image
  uses: docker/build-push-action@v5
  with:
    context: ./backend                          # Where Dockerfile is
    platforms: linux/amd64,linux/arm64         # Build for both architectures
    push: true                                 # Push to registry
    cache-from: type=gha                       # Use GitHub Actions cache
```

**Part D: Security Scanning**
```yaml
- name: Run Trivy vulnerability scanner
  uses: aquasecurity/trivy-action@master
  with:
    image-ref: ${{ env.REGISTRY }}/${{ env.BACKEND_IMAGE_NAME }}:latest
    format: 'sarif'                            # Security report format
```

---

## Part 4: How GitHub Container Registry Works

### 4.1 What is GHCR?

**GitHub Container Registry** is GitHub's service for storing Docker images.

**Your images are stored at:**
```
ghcr.io/{username}/{repository}/{image-name}:{tag}
```

**For your project:**
- Backend: `ghcr.io/arjunem/pomowatch/backend:latest`
- Frontend: `ghcr.io/arjunem/pomowatch/frontend:latest`

### 4.2 Image Visibility

**Public Repository** (your case):
- ✅ Images are **public by default**
- ✅ Anyone can pull without authentication
- ✅ Great for open source projects

**Private Repository**:
- 🔒 Images are **private by default**
- 🔒 Requires authentication to pull
- 🔒 Good for proprietary projects

### 4.3 Viewing Your Packages

**Method 1: GitHub UI**
1. Go to your repository: https://github.com/arjunem/PomoWatch
2. Click on **"Packages"** in the right sidebar
3. You'll see:
   - `pomowatch/backend`
   - `pomowatch/frontend`

**Method 2: Direct Links**
- Backend: https://github.com/arjunem/PomoWatch/pkgs/container/pomowatch%2Fbackend
- Frontend: https://github.com/arjunem/PomoWatch/pkgs/container/pomowatch%2Ffrontend

### 4.4 Package Information

Each package page shows:
- 📊 **Download stats**: How many times pulled
- 🏷️ **Available tags**: latest, v1.0.0, etc.
- 📦 **Image size**: How big the image is
- 🔍 **Security vulnerabilities**: From Trivy scans
- 📝 **Published date**: When it was uploaded

### 4.5 Authentication (When Needed)

**For public images** (no auth needed):
```bash
docker pull ghcr.io/arjunem/pomowatch/backend:latest
```

**For private images** (auth required):
```bash
# Create Personal Access Token (PAT) on GitHub
# Settings → Developer settings → Personal access tokens → Generate new token
# Select scope: read:packages

# Login
echo YOUR_TOKEN | docker login ghcr.io -u arjunem --password-stdin

# Now you can pull
docker pull ghcr.io/arjunem/pomowatch/backend:latest
```

---

## Part 5: The CI/CD Pipeline Flow

### 5.1 Complete Flow Diagram

```
┌──────────────────────────────────────────────────────────────┐
│ STEP 1: Developer Makes Changes                              │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│  $ git add .                                                  │
│  $ git commit -m "Add new feature"                            │
│  $ git push origin main                                       │
│                                                               │
│  ⏱️ Time: Seconds                                            │
└────────────────────────┬─────────────────────────────────────┘
                         │
                         ↓
┌──────────────────────────────────────────────────────────────┐
│ STEP 2: GitHub Receives Push                                 │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│  • GitHub detects push to main branch                        │
│  • Looks for workflows in .github/workflows/                 │
│  • Finds docker-publish.yml                                  │
│  • Triggers workflow execution                               │
│                                                               │
│  ⏱️ Time: Instant                                            │
└────────────────────────┬─────────────────────────────────────┘
                         │
                         ↓
┌──────────────────────────────────────────────────────────────┐
│ STEP 3: Workflow Starts (Parallel Jobs)                      │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌─────────────────────┐      ┌─────────────────────┐       │
│  │   Build Backend     │      │   Build Frontend    │       │
│  │                     │      │                     │       │
│  │ 1. Checkout code    │      │ 1. Checkout code    │       │
│  │ 2. Setup Buildx     │      │ 2. Setup Buildx     │       │
│  │ 3. Login to GHCR    │      │ 3. Login to GHCR    │       │
│  │ 4. Build image      │      │ 4. Build image      │       │
│  │    - amd64          │      │    - amd64          │       │
│  │    - arm64          │      │    - arm64          │       │
│  │ 5. Push to GHCR     │      │ 5. Push to GHCR     │       │
│  │ 6. Security scan    │      │ 6. Security scan    │       │
│  └─────────────────────┘      └─────────────────────┘       │
│                                                               │
│  ⏱️ Time: 10-15 minutes (parallel)                          │
└────────────────────────┬─────────────────────────────────────┘
                         │
                         ↓
┌──────────────────────────────────────────────────────────────┐
│ STEP 4: Images Published to GHCR                             │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│  ✅ ghcr.io/arjunem/pomowatch/backend:latest                 │
│  ✅ ghcr.io/arjunem/pomowatch/backend:main-abc123            │
│  ✅ ghcr.io/arjunem/pomowatch/frontend:latest                │
│  ✅ ghcr.io/arjunem/pomowatch/frontend:main-abc123           │
│                                                               │
│  Images are now publicly available!                          │
│                                                               │
│  ⏱️ Time: Instant                                            │
└────────────────────────┬─────────────────────────────────────┘
                         │
                         ↓
┌──────────────────────────────────────────────────────────────┐
│ STEP 5: Security Reports Generated                           │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│  • Trivy scans completed                                     │
│  • Results uploaded to GitHub Security tab                   │
│  • Vulnerabilities (if any) highlighted                      │
│  • Recommendations provided                                  │
│                                                               │
│  View at: Repository → Security → Code scanning              │
│                                                               │
│  ⏱️ Time: 2-3 minutes                                        │
└────────────────────────┬─────────────────────────────────────┘
                         │
                         ↓
┌──────────────────────────────────────────────────────────────┐
│ STEP 6: Deployment Summary Created                           │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│  🚀 Deployment Complete!                                     │
│                                                               │
│  Pull commands shown in workflow summary                     │
│  Status: ✅ Success                                          │
│                                                               │
│  ⏱️ Time: Seconds                                            │
└────────────────────────┬─────────────────────────────────────┘
                         │
                         ↓
┌──────────────────────────────────────────────────────────────┐
│ STEP 7: Ready for Deployment                                 │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│  Anyone can now pull and run your application:               │
│                                                               │
│  $ docker pull ghcr.io/arjunem/pomowatch/backend:latest      │
│  $ docker pull ghcr.io/arjunem/pomowatch/frontend:latest     │
│  $ docker-compose -f docker-compose.prod.yml up -d           │
│                                                               │
│  🎉 Application deployed!                                    │
│                                                               │
└──────────────────────────────────────────────────────────────┘
```

### 5.2 What Happens During Build?

**Phase 1: Environment Setup (2 minutes)**
- GitHub spins up Ubuntu virtual machine
- Installs Docker and required tools
- Sets up QEMU for ARM builds
- Configures Docker Buildx

**Phase 2: Code Preparation (1 minute)**
- Checks out your repository code
- Extracts metadata (tags, labels)
- Logs into GitHub Container Registry

**Phase 3: Image Building (6-8 minutes)**
- Reads Dockerfile
- Runs each instruction:
  - FROM: Pull base image
  - COPY: Copy files into image
  - RUN: Execute commands (install dependencies, build app)
  - EXPOSE: Mark ports
  - CMD/ENTRYPOINT: Set startup command
- Builds for amd64 (Intel/AMD)
- Builds for arm64 (ARM processors like Apple M1, Raspberry Pi)

**Phase 4: Image Publishing (2 minutes)**
- Compresses image layers
- Uploads to GHCR
- Tags image appropriately

**Phase 5: Security Scanning (2-3 minutes)**
- Trivy scans image for:
  - Known vulnerabilities in packages
  - Security misconfigurations
  - Exposed secrets
- Generates SARIF report
- Uploads to GitHub Security

**Phase 6: Cleanup**
- Workflow completes
- Virtual machine destroyed
- Cache saved for next run

---

## Part 6: Monitoring Your Build

### 6.1 Accessing GitHub Actions

**Method 1: From Repository**
1. Go to https://github.com/arjunem/PomoWatch
2. Click **"Actions"** tab (top menu)
3. You'll see list of workflow runs

**Method 2: Direct Link**
- https://github.com/arjunem/PomoWatch/actions

### 6.2 Understanding the Actions Page

**What you'll see:**

```
┌─────────────────────────────────────────────────────────────┐
│ All workflows                                                │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│ ✅ Add GitHub Container Registry deployment with CI/CD      │
│    main #123 • arjunem pushed 2 minutes ago • 2m 15s        │
│    ├─ build-backend ✅ Success                              │
│    ├─ build-frontend ✅ Success                             │
│    └─ summary ✅ Success                                    │
│                                                              │
│ 🟡 Previous workflow                                        │
│    main #122 • arjunem pushed 1 hour ago • 12m 30s          │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

**Status Icons:**
- 🟡 **Yellow (Running)**: Build in progress
- ✅ **Green (Success)**: Build completed successfully
- ❌ **Red (Failed)**: Build failed
- ⚪ **Gray (Queued)**: Waiting to start

### 6.3 Viewing Build Details

**Click on a workflow run to see:**

1. **Summary**
   - Overall status
   - Run duration
   - Triggered by whom
   - Commit message

2. **Jobs**
   - build-backend
   - build-frontend
   - summary

3. **Artifacts** (if any)
   - Security reports
   - Build logs

### 6.4 Viewing Job Logs

**Click on a job (e.g., "build-backend") to see:**

```
Set up job               ✅ 5s
Checkout repository      ✅ 2s
Set up QEMU             ✅ 8s
Set up Docker Buildx    ✅ 3s
Log in to GHCR          ✅ 1s
Extract metadata        ✅ 2s
Build and push image    ✅ 8m 45s
  ├─ Preparing build context
  ├─ Downloading base images
  ├─ Building for linux/amd64
  ├─ Building for linux/arm64
  ├─ Pushing layers to GHCR
  └─ Creating manifest
Run Trivy scanner       ✅ 2m 15s
Upload security results ✅ 5s
Complete job            ✅ 1s
```

**Click on each step to expand and see detailed logs**

### 6.5 Real-Time Monitoring

**Watch build in progress:**
1. Click on running workflow
2. Click on a job
3. Logs stream in real-time
4. You'll see exactly what's happening

**Example log output:**
```
Building for linux/amd64...
#1 [internal] load build definition from Dockerfile
#1 transferring dockerfile: 456B done
#2 [internal] load .dockerignore
#2 transferring context: 234B done
#3 [internal] load metadata for mcr.microsoft.com/dotnet/sdk:8.0
#3 DONE 2.3s
...
```

### 6.6 Email Notifications

**GitHub automatically sends emails when:**
- ❌ Workflow fails (you pushed bad code)
- ✅ Workflow succeeds after failure (you fixed it)

**To configure:**
1. GitHub Settings → Notifications
2. Customize notification preferences

---

## Part 7: Using Your Deployed Images

### 7.1 Pulling Images

**For public images (no login needed):**

```bash
# Pull backend image
docker pull ghcr.io/arjunem/pomowatch/backend:latest

# Pull frontend image
docker pull ghcr.io/arjunem/pomowatch/frontend:latest

# Pull both
docker pull ghcr.io/arjunem/pomowatch/backend:latest && \
docker pull ghcr.io/arjunem/pomowatch/frontend:latest
```

**Verify images:**
```bash
docker images | grep pomowatch
```

**Output:**
```
ghcr.io/arjunem/pomowatch/backend   latest   abc123def456   2 hours ago   250MB
ghcr.io/arjunem/pomowatch/frontend  latest   789ghi012jkl   2 hours ago   45MB
```

### 7.2 Running with Docker Compose

**Option 1: Using production compose file (recommended)**

```bash
# Navigate to project directory
cd /path/to/PomoWatch

# Pull latest images
docker-compose -f docker-compose.prod.yml pull

# Start services
docker-compose -f docker-compose.prod.yml up -d

# Check status
docker-compose -f docker-compose.prod.yml ps

# View logs
docker-compose -f docker-compose.prod.yml logs -f
```

**Option 2: Manual docker run**

```bash
# Create network
docker network create pomodoro-net

# Create data directory
mkdir -p data

# Run backend
docker run -d \
  --name pomodoro-backend \
  --network pomodoro-net \
  -p 5001:5000 \
  -v $(pwd)/data:/app/data \
  -e ASPNETCORE_ENVIRONMENT=Production \
  -e ASPNETCORE_URLS=http://0.0.0.0:5000 \
  -e ConnectionStrings__DefaultConnection="Data Source=/app/data/pomodoro.db" \
  ghcr.io/arjunem/pomowatch/backend:latest

# Run frontend
docker run -d \
  --name pomodoro-frontend \
  --network pomodoro-net \
  -p 4201:80 \
  ghcr.io/arjunem/pomowatch/frontend:latest
```

### 7.3 Accessing Your Application

**After starting containers:**

- **Frontend**: http://localhost:4201
- **Backend API**: http://localhost:5001/api/health
- **Swagger**: http://localhost:5001/swagger

**Test the endpoints:**
```bash
# Test backend health
curl http://localhost:5001/api/health

# Expected: "ok"

# Test frontend
curl http://localhost:4201

# Expected: HTML content
```

### 7.4 Viewing Logs

**Using docker-compose:**
```bash
# All services
docker-compose -f docker-compose.prod.yml logs -f

# Just backend
docker-compose -f docker-compose.prod.yml logs -f backend

# Just frontend
docker-compose -f docker-compose.prod.yml logs -f frontend

# Last 100 lines
docker-compose -f docker-compose.prod.yml logs --tail=100
```

**Using docker:**
```bash
# Backend logs
docker logs pomodoro-backend-prod -f

# Frontend logs
docker logs pomodoro-frontend-prod -f
```

### 7.5 Checking Container Health

**View health status:**
```bash
# Using docker-compose
docker-compose -f docker-compose.prod.yml ps

# Using docker
docker ps

# Detailed health info
docker inspect pomodoro-backend-prod | grep -A 10 Health
```

**Expected output:**
```
"Health": {
    "Status": "healthy",
    "FailingStreak": 0,
    "Log": [
        {
            "Start": "2025-10-09T16:57:30.123Z",
            "End": "2025-10-09T16:57:30.456Z",
            "ExitCode": 0,
            "Output": "ok"
        }
    ]
}
```

### 7.6 Stopping and Cleaning Up

**Stop containers:**
```bash
# Using docker-compose
docker-compose -f docker-compose.prod.yml stop

# Or stop and remove
docker-compose -f docker-compose.prod.yml down
```

**Remove images (to save space):**
```bash
# Remove specific images
docker rmi ghcr.io/arjunem/pomowatch/backend:latest
docker rmi ghcr.io/arjunem/pomowatch/frontend:latest

# Or remove all unused images
docker image prune -a
```

⚠️ **Warning:** `docker-compose down -v` will delete your database!

---

## Part 8: Managing Versions

### 8.1 Understanding Tags

Tags are labels for specific versions of your image.

**Your images have multiple tags:**

```
ghcr.io/arjunem/pomowatch/backend:latest          ← Always points to newest
ghcr.io/arjunem/pomowatch/backend:main-abc123     ← Specific commit
ghcr.io/arjunem/pomowatch/backend:v1.0.0          ← Specific version
ghcr.io/arjunem/pomowatch/backend:v1.0            ← Minor version
ghcr.io/arjunem/pomowatch/backend:v1              ← Major version
```

### 8.2 Creating a Version Release

**Step-by-step process:**

**1. Ensure code is tested and working**
```bash
# Run tests locally
docker-compose up --build
# Test the application
# Verify everything works
```

**2. Create a version tag**
```bash
# Using Semantic Versioning (MAJOR.MINOR.PATCH)
# - MAJOR: Breaking changes (1.0.0 → 2.0.0)
# - MINOR: New features, backwards compatible (1.0.0 → 1.1.0)
# - PATCH: Bug fixes (1.0.0 → 1.0.1)

git tag v1.0.0
```

**3. Push the tag**
```bash
git push origin v1.0.0
```

**4. GitHub Actions automatically:**
- Detects the tag
- Builds images
- Tags them with:
  - `v1.0.0` (full version)
  - `v1.0` (minor version)
  - `v1` (major version)
  - `latest` (if on main branch)

**5. Verify the build**
- Go to Actions tab
- Watch the build
- Check Packages for new tags

### 8.3 Using Specific Versions

**In production, use specific versions (not `latest`):**

**Edit docker-compose.prod.yml:**
```yaml
services:
  backend:
    image: ghcr.io/arjunem/pomowatch/backend:v1.0.0  # ← Specific version
    # instead of :latest
```

**Why?**
- ✅ **Predictable**: Always get same version
- ✅ **Stable**: Won't break if new version has bugs
- ✅ **Controlled updates**: Update when you're ready

### 8.4 Updating to New Version

**Scenario: You released v1.1.0 and want to update production**

**Step 1: Update docker-compose.prod.yml**
```yaml
services:
  backend:
    image: ghcr.io/arjunem/pomowatch/backend:v1.1.0  # ← Updated
```

**Step 2: Pull new images**
```bash
docker-compose -f docker-compose.prod.yml pull
```

**Step 3: Restart services**
```bash
docker-compose -f docker-compose.prod.yml up -d
```

**Docker will:**
- Download new image
- Stop old container
- Start new container
- Database persists (it's in a volume)

### 8.5 Rolling Back

**If new version has problems, rollback:**

**Option 1: Change tag and restart**
```yaml
# docker-compose.prod.yml
services:
  backend:
    image: ghcr.io/arjunem/pomowatch/backend:v1.0.0  # ← Previous version
```

```bash
docker-compose -f docker-compose.prod.yml pull
docker-compose -f docker-compose.prod.yml up -d
```

**Option 2: Use docker tag**
```bash
# Pull old version
docker pull ghcr.io/arjunem/pomowatch/backend:v1.0.0

# Tag it as latest locally
docker tag ghcr.io/arjunem/pomowatch/backend:v1.0.0 \
           ghcr.io/arjunem/pomowatch/backend:latest

# Restart
docker-compose -f docker-compose.prod.yml up -d
```

### 8.6 Viewing Available Versions

**Method 1: GitHub UI**
1. Go to Packages
2. Click on backend or frontend
3. See all tags with dates

**Method 2: Docker CLI**
```bash
# List all tags for backend
docker search ghcr.io/arjunem/pomowatch/backend --list-tags
```

**Method 3: GitHub API**
```bash
curl https://api.github.com/users/arjunem/packages/container/pomowatch%2Fbackend/versions
```

---

## Part 9: Troubleshooting

### 9.1 Build Failures

**Problem: Workflow fails**

**Steps to debug:**

1. **Go to Actions tab**
2. **Click on failed workflow**
3. **Click on failed job**
4. **Expand failed step**
5. **Read error message**

**Common errors:**

**Error 1: Dockerfile not found**
```
Error: Cannot find Dockerfile at ./backend/Dockerfile
```

**Solution:**
- Check Dockerfile exists in correct location
- Verify path in workflow matches actual location

**Error 2: Build failed - syntax error**
```
Error: Dockerfile parse error line 5
```

**Solution:**
- Fix syntax in Dockerfile
- Test locally: `docker build -t test ./backend`

**Error 3: Authentication failed**
```
Error: denied: permission_denied
```

**Solution:**
- This shouldn't happen with GITHUB_TOKEN
- Check workflow permissions (should have `packages: write`)

**Error 4: Multi-platform build failed**
```
Error: failed to solve: platform linux/arm64 not supported
```

**Solution:**
- Ensure base image supports arm64
- Check Docker Hub for multi-platform images

### 9.2 Image Pull Failures

**Problem: Cannot pull image**

**Error:**
```
Error response from daemon: unauthorized: authentication required
```

**Solutions:**

**For public images:**
- Wait a few minutes (image might still be publishing)
- Check image name is correct (lowercase only)

**For private images:**
```bash
# Create GitHub PAT (Personal Access Token)
# GitHub → Settings → Developer settings → PAT → Generate

# Login
echo YOUR_TOKEN | docker login ghcr.io -u arjunem --password-stdin

# Try again
docker pull ghcr.io/arjunem/pomowatch/backend:latest
```

### 9.3 Container Won't Start

**Problem: Container exits immediately**

**Debug steps:**

```bash
# View logs
docker logs pomodoro-backend-prod

# Run interactively to see errors
docker run -it --rm ghcr.io/arjunem/pomowatch/backend:latest /bin/bash

# Check if entry point works
docker run --rm ghcr.io/arjunem/pomowatch/backend:latest --version
```

**Common issues:**

**Issue 1: Port already in use**
```
Error: bind: address already in use
```

**Solution:**
```bash
# Find what's using the port
netstat -ano | findstr :5001

# Kill the process or use different port
docker run -p 5002:5000 ...  # Use 5002 instead
```

**Issue 2: Database permission error**
```
Error: unable to open database file
```

**Solution:**
```bash
# Fix data directory permissions
chmod -R 755 data/

# Or recreate it
rm -rf data/
mkdir data/
```

### 9.4 Health Check Failures

**Problem: Container marked as unhealthy**

```bash
# Check health
docker inspect pomodoro-backend-prod | grep -A 20 Health
```

**If health check fails:**

**1. Check if app is actually running**
```bash
# Exec into container
docker exec -it pomodoro-backend-prod /bin/bash

# Test endpoint from inside
curl http://localhost:5000/api/health
```

**2. Check health check command**
```yaml
healthcheck:
  test: ["CMD", "curl", "-f", "http://localhost:5000/api/health"]
  # ↑ Ensure curl is available in image
  # ↑ Ensure URL is correct
```

**3. Increase timeout/retries**
```yaml
healthcheck:
  interval: 30s
  timeout: 10s
  retries: 5          # ← Increase this
  start_period: 60s   # ← Or increase this
```

### 9.5 Security Scan Warnings

**Problem: Trivy finds vulnerabilities**

**View scan results:**
1. Go to repository
2. Click **Security** tab
3. Click **Code scanning alerts**
4. Review vulnerabilities

**Actions to take:**

**For Low/Medium severity:**
- Document the issue
- Plan to fix in next release

**For High/Critical severity:**
- Update dependencies immediately
- Rebuild and redeploy

**Example fix:**
```dockerfile
# Before
FROM mcr.microsoft.com/dotnet/aspnet:8.0

# After (if 8.0 has vulnerability, update to 8.0.1)
FROM mcr.microsoft.com/dotnet/aspnet:8.0.1
```

### 9.6 Performance Issues

**Problem: Build is very slow**

**Solutions:**

**1. Use build cache**
```yaml
# Already configured in your workflow
cache-from: type=gha
cache-to: type=gha,mode=max
```

**2. Optimize Dockerfile**
```dockerfile
# Bad: Copy everything first (invalidates cache often)
COPY . .
RUN npm install

# Good: Copy package files first (better caching)
COPY package*.json ./
RUN npm install
COPY . .
```

**3. Use smaller base images**
```dockerfile
# Large
FROM node:20

# Smaller (alpine variant)
FROM node:20-alpine
```

**4. Multi-stage builds** (already using)
```dockerfile
# Build stage (large, has all tools)
FROM node:20 AS build
RUN npm build

# Runtime stage (small, only runtime)
FROM nginx:alpine
COPY --from=build /app/dist ./
```

---

## Part 10: Best Practices

### 10.1 Version Management

✅ **DO:**
- Use semantic versioning (v1.2.3)
- Tag stable releases
- Use specific versions in production
- Document version changes

❌ **DON'T:**
- Use `latest` in production
- Skip versions (v1.0.0 → v1.3.0)
- Delete old tags
- Overwrite existing tags

### 10.2 Security

✅ **DO:**
- Review Trivy scan results
- Update dependencies regularly
- Use official base images
- Follow security alerts

❌ **DON'T:**
- Ignore security warnings
- Use outdated base images
- Store secrets in Dockerfile
- Run containers as root (if avoidable)

### 10.3 Docker Images

✅ **DO:**
- Use multi-stage builds
- Minimize image size
- Use `.dockerignore`
- Label images with metadata

❌ **DON'T:**
- Include unnecessary files
- Install dev dependencies in production
- Use large base images
- Skip layer optimization

### 10.4 CI/CD Workflow

✅ **DO:**
- Test before merging
- Use pull request builds
- Monitor build times
- Keep workflows simple

❌ **DON'T:**
- Push directly to main without testing
- Skip security scans
- Ignore failed builds
- Over-complicate workflows

### 10.5 Deployment

✅ **DO:**
- Use health checks
- Implement graceful shutdown
- Backup database before updates
- Test in staging first

❌ **DON'T:**
- Update production without testing
- Skip health checks
- Deploy late Friday
- Ignore monitoring

### 10.6 Documentation

✅ **DO:**
- Document deployment steps
- Keep README updated
- Add inline comments
- Version API changes

❌ **DON'T:**
- Assume everyone knows
- Skip change logs
- Forget about new developers
- Leave outdated docs

---

## Conclusion

### What You've Learned

You now understand:

✅ **GitHub Container Registry** - Where Docker images are stored  
✅ **GitHub Actions** - How automated builds work  
✅ **CI/CD Pipeline** - Complete deployment automation  
✅ **Version Management** - How to release and rollback versions  
✅ **Troubleshooting** - How to diagnose and fix issues  

### Your Complete Workflow

**Development:**
```bash
1. Write code
2. Test locally: docker-compose up --build
3. Commit: git commit -m "Add feature"
4. Push: git push origin main
```

**GitHub Actions (automatic):**
```bash
5. Builds Docker images
6. Scans for vulnerabilities
7. Publishes to GHCR
8. Reports status
```

**Production Deployment:**
```bash
9. Pull images: docker-compose -f docker-compose.prod.yml pull
10. Deploy: docker-compose -f docker-compose.prod.yml up -d
11. Monitor: docker-compose -f docker-compose.prod.yml logs -f
12. Verify: curl http://your-server:5001/api/health
```

### Next Steps

**1. Monitor Your First Build**
- Go to Actions tab
- Watch it complete
- Check Packages for images

**2. Try Production Deployment**
- Pull images
- Run with docker-compose.prod.yml
- Test the application

**3. Create Your First Release**
- Tag v1.0.0
- Push tag
- See versioned images

**4. Explore Advanced Features**
- Custom workflows
- Deployment environments
- Automated testing
- Multi-region deployment

### Additional Resources

**Official Documentation:**
- GitHub Actions: https://docs.github.com/en/actions
- GitHub Packages: https://docs.github.com/en/packages
- Docker: https://docs.docker.com

**Your Project Files:**
- `DEPLOYMENT.md` - Deployment procedures
- `DEPLOYMENT-PLAN.md` - Overall strategy
- `.github/workflows/docker-publish.yml` - Workflow details

**GitHub Pages:**
- Actions: https://github.com/arjunem/PomoWatch/actions
- Packages: https://github.com/arjunem/PomoWatch/packages
- Security: https://github.com/arjunem/PomoWatch/security

---

## Quick Reference Card

### Essential Commands

```bash
# Monitor builds
https://github.com/arjunem/PomoWatch/actions

# Pull images
docker pull ghcr.io/arjunem/pomowatch/backend:latest
docker pull ghcr.io/arjunem/pomowatch/frontend:latest

# Deploy
docker-compose -f docker-compose.prod.yml pull
docker-compose -f docker-compose.prod.yml up -d

# View logs
docker-compose -f docker-compose.prod.yml logs -f

# Check health
docker-compose -f docker-compose.prod.yml ps

# Stop
docker-compose -f docker-compose.prod.yml down

# Create release
git tag v1.0.0
git push origin v1.0.0
```

### Important URLs

- **Repository**: https://github.com/arjunem/PomoWatch
- **Actions**: https://github.com/arjunem/PomoWatch/actions
- **Backend Package**: https://github.com/arjunem/PomoWatch/pkgs/container/pomowatch%2Fbackend
- **Frontend Package**: https://github.com/arjunem/PomoWatch/pkgs/container/pomowatch%2Ffrontend

---

**Congratulations!** 🎉

You now have a professional-grade deployment pipeline with automated builds, security scanning, and container registry hosting. Your application can be deployed anywhere Docker runs, in just a few commands!

**Questions?** Check the troubleshooting section or review the inline comments in your workflow file.

**Happy Deploying!** 🚀

