# 📋 Deployment Plan: GitHub Container Registry (GHCR)

## **Overview**
Deploy both the backend (.NET 8 API) and frontend (Angular + Nginx) Docker images to GitHub Container Registry with automated CI/CD using GitHub Actions.

---

## **Step 1: Prerequisites & Setup**
1. **GitHub Repository**: Ensure your code is pushed to GitHub
2. **GitHub Personal Access Token (PAT)** with the following scopes:
   - `write:packages` - to publish packages
   - `read:packages` - to read packages
   - `delete:packages` - (optional) to manage packages
3. **Configure GitHub Secrets** (will add to your repo):
   - No secrets needed! GitHub Actions provides `GITHUB_TOKEN` automatically

---

## **Step 2: File Structure to Create**

```
.github/
└── workflows/
    ├── docker-publish.yml          # Main CI/CD workflow
    └── docker-publish-manual.yml   # Manual trigger option (optional)
.dockerignore                        # For backend (if not exists)
frontend/.dockerignore               # For frontend (if not exists)
```

---

## **Step 3: GitHub Actions Workflow**

**What it will do:**
- **Trigger on**: 
  - Push to `main` branch
  - Push of tags matching `v*` (e.g., v1.0.0)
  - Manual workflow dispatch
- **Build**: Both backend and frontend Docker images
- **Tag**: Images with:
  - `latest` - for main branch
  - `<git-tag>` - for version tags (e.g., v1.0.0)
  - `<commit-sha>` - for specific commits
- **Push**: To `ghcr.io/<your-github-username>/pomowatch-backend` and `ghcr.io/<your-github-username>/pomowatch-frontend`

---

## **Step 4: Image Naming Convention**

```
ghcr.io/<your-github-username>/pomowatch-backend:latest
ghcr.io/<your-github-username>/pomowatch-backend:v1.0.0
ghcr.io/<your-github-username>/pomowatch-backend:sha-abc123

ghcr.io/<your-github-username>/pomowatch-frontend:latest
ghcr.io/<your-github-username>/pomowatch-frontend:v1.0.0
ghcr.io/<your-github-username>/pomowatch-frontend:sha-abc123
```

---

## **Step 5: Updated docker-compose.yml**

Create a production version that uses pre-built images from GHCR instead of building locally:
- `docker-compose.prod.yml` - Uses images from GHCR
- Keep existing `docker-compose.yml` for local development

---

## **Step 6: Documentation Updates**

Update `README.md` with:
- Badge showing build status
- Instructions to pull and run from GHCR
- Deployment documentation

---

## **Step 7: Deployment Process**

**Initial Setup (one-time):**
1. Create GitHub Actions workflow files
2. Create/update `.dockerignore` files
3. Push changes to GitHub
4. Verify workflow runs successfully

**Regular Deployment:**
```bash
# Option 1: Automatic (on push to main)
git push origin main

# Option 2: Version release
git tag v1.0.0
git push origin v1.0.0

# Option 3: Manual trigger from GitHub Actions UI
```

**Pulling Images:**
```bash
# Pull latest images
docker pull ghcr.io/<username>/pomowatch-backend:latest
docker pull ghcr.io/<username>/pomowatch-frontend:latest

# Run with docker-compose
docker-compose -f docker-compose.prod.yml up -d
```

---

## **Step 8: Additional Features (Optional but Recommended)**

1. **Multi-platform builds**: Support both `linux/amd64` and `linux/arm64`
2. **Security scanning**: Add Trivy or similar for vulnerability scanning
3. **Image signing**: Use Cosign for image verification
4. **Pull Request builds**: Build (but don't push) on PRs for testing
5. **Notifications**: Slack/Discord notifications on successful deployments

---

## **Step 9: Testing Strategy**

1. **Local Testing**: Build and test images locally first
2. **PR Testing**: Verify builds work in CI before merging
3. **Staging**: Pull images and test in a staging environment
4. **Production**: Deploy tagged releases only

---

## **Step 10: Rollback Strategy**

Since all images are tagged with commit SHA and versions:
```bash
# Rollback to specific version
docker pull ghcr.io/<username>/pomowatch-backend:v0.9.0
docker pull ghcr.io/<username>/pomowatch-frontend:v0.9.0
```

---

## 📁 Files I'll Create

1. **`.github/workflows/docker-publish.yml`** - Main CI/CD pipeline
2. **`docker-compose.prod.yml`** - Production compose file using GHCR images
3. **`.dockerignore`** (backend) - Optimize build context
4. **`frontend/.dockerignore`** - Optimize build context
5. **`DEPLOYMENT.md`** - Detailed deployment documentation
6. **Update `README.md`** - Add deployment instructions and badges

---

## 🎯 What You'll Need to Provide

1. **Your GitHub username** (for image URLs)
2. **Confirm repository visibility**: 
   - Public repo → images can be public
   - Private repo → images will be private by default

---

## ⚙️ Configuration Options

**Question 1**: Do you want multi-platform builds (amd64 + arm64)?
- ✅ Recommended for better compatibility
- ⚠️ Takes longer to build

**Question 2**: Should I add security scanning (Trivy)?
- ✅ Recommended for production
- Scans for vulnerabilities in images

**Question 3**: Build on every push or only on tags?
- **Option A**: Build `latest` on every push to main + tagged versions
- **Option B**: Only build on version tags (v*.*.*)
- **Option C**: Manual trigger only

---

## 📊 Estimated Timeline

- **Setup**: 10-15 minutes (creating files, first push)
- **First Build**: 5-10 minutes (GitHub Actions running)
- **Testing**: 5 minutes (pull and verify images)

---

## ✅ Success Criteria

- [ ] Both images build successfully in GitHub Actions
- [ ] Images are visible in GitHub Packages
- [ ] Can pull images from GHCR
- [ ] docker-compose.prod.yml runs successfully
- [ ] Application works identically to local build

---

## 📝 Next Steps

**Please confirm:**
1. Your GitHub username
2. Repository name (assuming it's `PomoWatch`)
3. Answers to the 3 configuration questions above
4. Any other specific requirements or preferences

Once confirmed, proceed with creating all the necessary files! 🚀

