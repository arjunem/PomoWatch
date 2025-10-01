# Environment Configuration

This directory contains environment-specific configuration files for the Angular application.

## Files

- **`environment.ts`** - Local development (ng serve)
  - API Base URL: `http://localhost:5000/api`
  - Used for: Local development, debugging, hot reload

- **`environment.prod.ts`** - Production build
  - API Base URL: `/api` (relative, proxied by nginx)
  - Used for: Production deployment, Docker containers

- **`environment.docker.ts`** - Docker-specific build
  - API Base URL: `/api` (relative, proxied by nginx)
  - Used for: Docker container builds (alternative to prod)

## Usage

### Local Development
```bash
ng serve  # Uses environment.ts
```

### Production Build
```bash
ng build --configuration=production  # Uses environment.prod.ts
```

### Docker Build
```bash
ng build --configuration=production  # Uses environment.prod.ts
```

## How It Works

1. **Local Development**: Angular connects directly to `http://localhost:5000/api`
2. **Docker**: Angular uses relative URL `/api`, nginx proxies to backend container
3. **Automatic Switching**: Angular CLI automatically selects the right environment file
