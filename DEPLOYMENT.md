# 🚀 Deployment Guide - PomoWatch

This guide covers deploying PomoWatch to GitHub Container Registry (GHCR) and running the application in production.

## 📦 GitHub Container Registry (GHCR)

### Automated Deployment

Images are automatically built and published to GHCR via GitHub Actions.

**Trigger Events:**
- ✅ Push to `main` branch → builds `latest` tag
- ✅ Push version tag (e.g., `v1.0.0`) → builds versioned tags
- ✅ Pull Request → builds but doesn't push (testing only)
- ✅ Manual workflow dispatch → on-demand builds

**Image URLs:**
```
ghcr.io/arjunem/pomowatch/backend:latest
ghcr.io/arjunem/pomowatch/frontend:latest
```

### Features

- ✅ **Multi-platform builds**: Supports `linux/amd64` and `linux/arm64`
- ✅ **Security scanning**: Trivy vulnerability scanning on every build
- ✅ **Build caching**: GitHub Actions cache for faster builds
- ✅ **Semantic versioning**: Automatic tag generation from git tags
- ✅ **Health checks**: Container health monitoring

---

## 🏗️ Building and Publishing

### Automatic (Recommended)

**Option 1: Push to main**
```bash
git add .
git commit -m "Your changes"
git push origin main
```
This triggers automatic build and publishes `latest` tag.

**Option 2: Create a release**
```bash
git tag v1.0.0
git push origin v1.0.0
```
This creates versioned tags: `v1.0.0`, `v1.0`, `v1`, and `latest`.

**Option 3: Manual workflow**
1. Go to GitHub repository
2. Click "Actions" tab
3. Select "Docker Build and Publish to GHCR"
4. Click "Run workflow"

### Manual (If needed)

**Build locally and push:**
```bash
# Login to GHCR
echo $GITHUB_TOKEN | docker login ghcr.io -u arjunem --password-stdin

# Build and push backend
docker build -t ghcr.io/arjunem/pomowatch/backend:latest ./backend
docker push ghcr.io/arjunem/pomowatch/backend:latest

# Build and push frontend
docker build -t ghcr.io/arjunem/pomowatch/frontend:latest ./frontend
docker push ghcr.io/arjunem/pomowatch/frontend:latest
```

---

## 🌐 Deploying to Production

### Prerequisites

1. **Docker** and **Docker Compose** installed
2. **GitHub Container Registry access** (images are public if repo is public)
3. **Server/VM** with ports 5001 and 4201 available

### Deployment Steps

**1. Pull the images:**
```bash
docker pull ghcr.io/arjunem/pomowatch/backend:latest
docker pull ghcr.io/arjunem/pomowatch/frontend:latest
```

**2. Create data directory:**
```bash
mkdir -p data
```

**3. Run with docker-compose:**
```bash
docker-compose -f docker-compose.prod.yml up -d
```

**4. Verify deployment:**
```bash
# Check container status
docker-compose -f docker-compose.prod.yml ps

# Check logs
docker-compose -f docker-compose.prod.yml logs -f

# Test endpoints
curl http://localhost:5001/api/health
curl http://localhost:4201
```

**5. Access the application:**
- **Frontend:** http://your-server:4201
- **Backend API:** http://your-server:5001/api/health
- **Swagger:** http://your-server:5001/swagger

### Update to Latest Version

```bash
# Pull latest images
docker-compose -f docker-compose.prod.yml pull

# Restart services
docker-compose -f docker-compose.prod.yml up -d

# Clean up old images
docker image prune -f
```

---

## 🔄 Rollback to Previous Version

If you need to rollback to a specific version:

```bash
# Update docker-compose.prod.yml to use specific tag
# Example: ghcr.io/arjunem/pomowatch/backend:v1.0.0

# Pull specific version
docker pull ghcr.io/arjunem/pomowatch/backend:v1.0.0
docker pull ghcr.io/arjunem/pomowatch/frontend:v1.0.0

# Restart with specific version
docker-compose -f docker-compose.prod.yml up -d
```

**Available tags:**
- `latest` - Latest main branch build
- `v1.0.0` - Specific version
- `v1.0` - Minor version
- `v1` - Major version
- `main-abc123` - Specific commit SHA

---

## 🔐 Private Repository Setup

If your repository is private, you need authentication to pull images:

**1. Create Personal Access Token (PAT):**
- Go to GitHub Settings → Developer settings → Personal access tokens
- Create token with `read:packages` scope

**2. Login to GHCR on your server:**
```bash
echo YOUR_GITHUB_TOKEN | docker login ghcr.io -u arjunem --password-stdin
```

**3. Pull and run as normal:**
```bash
docker-compose -f docker-compose.prod.yml up -d
```

---

## 📊 Monitoring

### Check Container Health

```bash
# Health status
docker inspect --format='{{json .State.Health}}' pomodoro-backend-prod | jq
docker inspect --format='{{json .State.Health}}' pomodoro-frontend-prod | jq

# Resource usage
docker stats pomodoro-backend-prod pomodoro-frontend-prod

# Logs (last 100 lines)
docker logs --tail 100 pomodoro-backend-prod
docker logs --tail 100 pomodoro-frontend-prod

# Follow logs in real-time
docker-compose -f docker-compose.prod.yml logs -f
```

### Health Check Endpoints

- **Backend:** `http://localhost:5001/api/health`
- **Frontend:** `http://localhost:4201` (nginx responds to any request)

---

## 🛑 Stopping the Application

```bash
# Stop containers (keeps data)
docker-compose -f docker-compose.prod.yml stop

# Stop and remove containers (keeps data)
docker-compose -f docker-compose.prod.yml down

# Stop and remove everything including volumes (⚠️ DELETES DATABASE)
docker-compose -f docker-compose.prod.yml down -v
```

---

## 🐛 Troubleshooting

### Issue: Cannot pull images

**Solution:**
```bash
# Make repository/packages public, or login with PAT
echo YOUR_TOKEN | docker login ghcr.io -u arjunem --password-stdin
```

### Issue: Port already in use

**Solution:**
```bash
# Check what's using the port
netstat -ano | findstr :5001
netstat -ano | findstr :4201

# Change ports in docker-compose.prod.yml
ports:
  - "8001:5000"  # Use different host port
```

### Issue: Database permission errors

**Solution:**
```bash
# Ensure data directory has correct permissions
chmod -R 755 data/
```

### Issue: Container keeps restarting

**Solution:**
```bash
# Check logs
docker logs pomodoro-backend-prod

# Check health
docker inspect pomodoro-backend-prod

# Run container without restart policy for debugging
docker run --rm -it -p 5001:5000 ghcr.io/arjunem/pomowatch/backend:latest
```

---

## 📈 Performance Optimization

### Use Specific Versions in Production

Instead of `latest`, use specific version tags for stability:

```yaml
services:
  backend:
    image: ghcr.io/arjunem/pomowatch/backend:v1.2.0  # ← Specific version
```

### Enable Resource Limits

Add resource limits to prevent container overuse:

```yaml
services:
  backend:
    image: ghcr.io/arjunem/pomowatch/backend:latest
    deploy:
      resources:
        limits:
          cpus: '1.0'
          memory: 512M
        reservations:
          cpus: '0.5'
          memory: 256M
```

---

## 🔒 Security Best Practices

1. ✅ **Use specific version tags** in production (not `latest`)
2. ✅ **Review Trivy security reports** in GitHub Actions
3. ✅ **Keep images updated** regularly
4. ✅ **Use environment variables** for sensitive data
5. ✅ **Enable HTTPS** with reverse proxy (nginx/traefik)
6. ✅ **Implement rate limiting** for API endpoints
7. ✅ **Regular database backups** of SQLite file

---

## 📝 CI/CD Pipeline

The GitHub Actions workflow (`.github/workflows/docker-publish.yml`) includes:

1. **Build Stage**
   - Multi-platform builds (amd64, arm64)
   - Docker layer caching
   - Metadata extraction

2. **Security Stage**
   - Trivy vulnerability scanning
   - Upload results to GitHub Security tab

3. **Publish Stage**
   - Push to GHCR
   - Tag with multiple formats

4. **Summary Stage**
   - Deployment summary in GitHub Actions UI

**View builds:**
- Go to GitHub repository → Actions tab

---

## 📞 Support

For issues or questions:
- Check GitHub Actions logs for build errors
- Review container logs: `docker logs <container-name>`
- Check health endpoints
- Review Trivy security reports in GitHub Security tab

---

## 🎯 Quick Reference

**Pull latest:**
```bash
docker-compose -f docker-compose.prod.yml pull
```

**Start:**
```bash
docker-compose -f docker-compose.prod.yml up -d
```

**Stop:**
```bash
docker-compose -f docker-compose.prod.yml down
```

**Logs:**
```bash
docker-compose -f docker-compose.prod.yml logs -f
```

**Update:**
```bash
docker-compose -f docker-compose.prod.yml pull && \
docker-compose -f docker-compose.prod.yml up -d
```

---

**Ready to deploy! 🚀**

