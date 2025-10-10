# ===============================================================================
# Frontend Dockerfile (Multi-Stage Build)
# ===============================================================================
# This Dockerfile builds an Angular application and serves it with Nginx.
# It uses a multi-stage build to separate the build process from the runtime.
#
# Multi-stage build benefits:
# - Build stage: Uses Node.js to compile Angular app (~1GB)
# - Runtime stage: Uses Nginx to serve static files (~25MB)
# - Final image is 97% smaller than if we kept Node.js in production
# - More secure (no build tools in production)
# - Faster deployment (smaller image size)
#
# Architecture:
# 1. Node.js builds TypeScript/Angular → static HTML/CSS/JS files
# 2. Nginx serves those static files (acts as web server)
# 3. Nginx proxy can also forward API calls to backend
# ===============================================================================

# ===============================================================================
# STAGE 1: BUILD STAGE
# ===============================================================================
# This stage compiles the Angular application into optimized static files.

# FROM: Specifies the base image to start from
# - node:20-alpine: Official Node.js version 20 image
# - alpine: Linux distribution that's extremely small (~5MB base)
#   * Alpine uses musl libc and busybox instead of glibc and GNU tools
#   * Results in much smaller images (node:20 is ~1GB, node:20-alpine is ~170MB)
# - AS build: Names this stage "build" for reference in later stages
FROM node:20-alpine AS build

# WORKDIR: Sets the working directory inside the container
# - All subsequent commands run from this directory
# - Similar to "cd /app" but persistent
# - Docker creates the directory if it doesn't exist
WORKDIR /app

# ---------------------------------------------------------------------------
# Step 1: Copy package files and install dependencies
# ---------------------------------------------------------------------------
# We copy package.json and package-lock.json first to leverage Docker's
# layer caching. This is a critical optimization for Node.js projects.
#
# Why copy package files separately?
# - Docker caches each layer/step in the build
# - package.json changes less frequently than source code
# - If dependencies haven't changed, Docker reuses cached layer
# - Avoids re-running "npm install" (which can take minutes) on every build
#
# COPY syntax: COPY <source_on_host> <destination_in_container>
# - package*.json: Copies both package.json and package-lock.json
# - ./: Destination is current WORKDIR (/app)
COPY package*.json ./

# RUN: Executes a command during the build process
# - npm ci: "Clean Install" - installs dependencies from package-lock.json
#
# npm ci vs npm install:
# - npm ci: Uses exact versions from package-lock.json (faster, reproducible)
# - npm install: May update versions, modifies package-lock.json
# - npm ci: Deletes node_modules first (ensures clean state)
# - npm ci: 2-3x faster, better for CI/CD and Docker builds
#
# What this does:
# - Downloads all dependencies listed in package.json
# - Installs them in node_modules folder
# - Uses exact versions from package-lock.json for consistency
RUN npm ci

# ---------------------------------------------------------------------------
# Step 2: Copy source code and build the application
# ---------------------------------------------------------------------------
# Now that dependencies are installed, copy the application source code

# COPY . .
# - First dot (.): Copy everything from build context (./frontend directory)
# - Second dot (.): Destination is current WORKDIR (/app)
# - Includes: src/, angular.json, tsconfig.json, all config files, etc.
# - Excludes: Files listed in .dockerignore (node_modules, .git, etc.)
COPY . .

# Build the Angular application for production
# - npm run build: Runs the "build" script from package.json
# - --configuration=production: Uses production configuration
#
# What happens during "npm run build"?
# 1. Angular CLI (ng build) compiles TypeScript to JavaScript
# 2. Optimizes and minifies code (removes whitespace, shortens variable names)
# 3. Bundles files together (combines many files into fewer files)
# 4. Tree-shaking (removes unused code)
# 5. Ahead-of-Time (AOT) compilation (pre-compiles templates)
# 6. Creates source maps for debugging (optional)
# 7. Outputs static files to dist/frontend/browser directory
#
# Production optimizations:
# - Code splitting (loads only what's needed)
# - Minification (smaller file sizes)
# - Compression ready
# - Optimized for performance
RUN npm run build --configuration=production

# ===============================================================================
# STAGE 2: RUNTIME STAGE (Nginx Web Server)
# ===============================================================================
# This stage creates the final lightweight image that serves the built files.
# It uses Nginx, a high-performance web server for static files.

# FROM: Start a new stage with Nginx
# - nginx:alpine: Official Nginx image with Alpine Linux
# - Nginx: Popular, high-performance web server and reverse proxy
# - alpine: Keeps image size minimal (~25MB vs ~140MB for nginx:latest)
# - AS runtime: Names this stage "runtime" (becomes the final image)
FROM nginx:alpine AS runtime

# Set working directory to Nginx's default HTML directory
# - /usr/share/nginx/html: Default location where Nginx serves files from
# - Any files placed here are automatically served by Nginx
# - This is Nginx's "document root" or "web root"
WORKDIR /usr/share/nginx/html

# ---------------------------------------------------------------------------
# Clean up default Nginx content
# ---------------------------------------------------------------------------
# RUN: Execute a command during build
# - rm -rf ./*: Remove all files/directories in current location
# - Deletes the default Nginx welcome page
# - Ensures our app is the only content served
RUN rm -rf ./*

# ---------------------------------------------------------------------------
# Copy built Angular application from build stage
# ---------------------------------------------------------------------------
# COPY --from=<stage>: Copy files from a previous build stage
# - --from=build: Get files from the "build" stage we defined earlier
# - /app/dist/frontend/browser: Where Angular CLI output the built files
#   * dist: Default output directory for Angular builds
#   * frontend: Project name from angular.json
#   * browser: Browser-targeted build output (vs server for SSR)
# - ./: Destination is current WORKDIR (/usr/share/nginx/html)
#
# Why copy from build stage?
# - Build stage contains Node.js, npm, source code, etc. (~1GB+)
# - We only need the compiled static files (~10MB)
# - This reduces final image from 1GB to 25MB (97% size reduction!)
# - More secure (no build tools or source code in production)
COPY --from=build /app/dist/frontend/browser ./

# ---------------------------------------------------------------------------
# Copy custom Nginx configuration
# ---------------------------------------------------------------------------
# COPY nginx.conf <destination>
# - Copies our custom Nginx configuration file
# - /etc/nginx/conf.d/default.conf: Nginx's default server config location
# - Overrides the default Nginx configuration
#
# Why custom Nginx config?
# - Handle Angular's routing (single page application)
# - Configure API proxy (forward /api calls to backend)
# - Set up proper cache headers
# - Enable compression
# - Handle 404s properly for client-side routing
COPY nginx.conf /etc/nginx/conf.d/default.conf

# ---------------------------------------------------------------------------
# Expose port for web traffic
# ---------------------------------------------------------------------------
# EXPOSE: Documents which port the container listens on
# - Port 80: Standard HTTP port (Nginx default)
# - This is documentation only (doesn't publish the port)
# - Actual publishing happens with -p flag when running container
#
# Example: docker run -p 8080:80 ...
# - Maps host port 8080 to container port 80
# - Users access the app at http://localhost:8080
EXPOSE 80

# ---------------------------------------------------------------------------
# Define container startup command
# ---------------------------------------------------------------------------
# CMD: Specifies the command to run when container starts
# - Uses JSON array format (exec form) for better signal handling
#
# Command breakdown:
# - "nginx": Start Nginx web server
# - "-g": Global directive (pass configuration option)
# - "daemon off;": Run Nginx in foreground (don't daemonize)
#
# Why "daemon off"?
# - Docker expects the main process to run in foreground
# - If Nginx runs as daemon (background), container would exit immediately
# - Container stays running as long as Nginx process is running
# - Allows Docker to properly manage the process lifecycle
# - Enables proper signal handling (SIGTERM for graceful shutdown)
#
# What happens when container starts?
# 1. Nginx reads configuration from /etc/nginx/conf.d/default.conf
# 2. Nginx starts listening on port 80
# 3. Nginx serves files from /usr/share/nginx/html
# 4. Users can access the Angular app through their browser
CMD ["nginx", "-g", "daemon off;"]

# ===============================================================================
# HOW TO BUILD THIS IMAGE
# ===============================================================================
# From the frontend directory, run:
#   docker build -t pomowatch-frontend .
#
# Command explained:
# - docker build: Docker command to build an image from Dockerfile
# - -t pomowatch-frontend: Tag (name) the resulting image
# - . : Build context is current directory (where Dockerfile is located)
#
# Build context explained:
# - Docker sends all files in build context to Docker daemon
# - COPY commands can only access files in build context
# - Use .dockerignore to exclude unnecessary files (node_modules, .git, etc.)
#
# ===============================================================================
# HOW TO RUN A CONTAINER FROM THIS IMAGE
# ===============================================================================
# docker run -d \
#   -p 4200:80 \
#   --name frontend \
#   pomowatch-frontend
#
# Command explained:
# - docker run: Create and start a container from an image
# - -d: Run in detached mode (background)
# - -p 4200:80: Map host port 4200 to container port 80
#   * Access app at http://localhost:4200
# - --name frontend: Give container a friendly name
# - pomowatch-frontend: Name of the image to run
#
# ===============================================================================
# NGINX AND ANGULAR ROUTING
# ===============================================================================
# Angular is a Single Page Application (SPA):
# - Only one HTML file (index.html)
# - JavaScript handles all routing on client side
# - URLs like /settings, /timer don't exist as real files on server
#
# Problem:
# - User navigates to /settings in browser
# - Browser requests /settings from server
# - Nginx looks for /settings file (doesn't exist)
# - Returns 404 error
#
# Solution (in nginx.conf):
# - Configure "try_files $uri $uri/ /index.html"
# - Nginx tries to find requested file
# - If not found, serves index.html instead
# - Angular's router takes over and shows correct page
#
# This allows:
# - Direct navigation to any route
# - Browser refresh works on any page
# - Bookmarking deep links
# ===============================================================================
