# ===============================================================================
# Backend Dockerfile (Multi-Stage Build)
# ===============================================================================
# This Dockerfile builds a .NET 8 Web API application using a multi-stage build
# approach. Multi-stage builds help create smaller, more secure final images.
#
# What is a multi-stage build?
# - Uses multiple FROM statements in one Dockerfile
# - Each stage can serve a different purpose (build, test, runtime)
# - Only the final stage becomes the actual image
# - Earlier stages are discarded, keeping the final image small
#
# Why use multi-stage builds?
# - Smaller final image (only runtime files, no build tools)
# - More secure (fewer tools = smaller attack surface)
# - Faster deployment (smaller images download/start faster)
# - Cleaner separation of build vs runtime dependencies
# ===============================================================================

# ===============================================================================
# STAGE 1: BUILD STAGE
# ===============================================================================
# This stage compiles the .NET application and publishes it for deployment.
# It uses the full SDK image which includes all tools needed to build the app.

# FROM: Specifies the base image to start from
# - mcr.microsoft.com: Microsoft Container Registry (Microsoft's Docker Hub)
# - dotnet/sdk:8.0: Full .NET 8 SDK image (includes compiler, build tools, etc.)
# - AS build: Names this stage "build" so we can reference it later
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build

# WORKDIR: Sets the working directory inside the container
# - All subsequent commands will run from this directory
# - If the directory doesn't exist, Docker creates it automatically
# - Think of it like "cd /app" but permanent for the container
WORKDIR /app

# ---------------------------------------------------------------------------
# Step 1: Copy project file and restore dependencies
# ---------------------------------------------------------------------------
# We copy the .csproj file first (before copying all source code) to leverage
# Docker's layer caching. This is a performance optimization technique.
#
# Docker Layer Caching Explained:
# - Docker builds images in layers, each command creates a layer
# - Layers are cached and reused if inputs haven't changed
# - If dependencies (in .csproj) don't change, this layer is reused
# - Source code changes more frequently than dependencies
# - By separating these steps, we avoid re-downloading NuGet packages on every build
#
# COPY syntax: COPY <source_on_host> <destination_in_container>
# - *.csproj: Copies all .csproj files from the current directory
# - ./: Copies to current WORKDIR (/app)
COPY *.csproj ./

# RUN: Executes a command inside the container during build
# - dotnet restore: Downloads all NuGet package dependencies
# - Reads dependencies from .csproj file
# - Downloads packages to NuGet cache inside the container
# - Similar to "npm install" for Node.js or "pip install" for Python
RUN dotnet restore

# ---------------------------------------------------------------------------
# Step 2: Copy remaining source code and build the application
# ---------------------------------------------------------------------------
# Now that dependencies are restored, copy the rest of the application code

# COPY . ./
# - First dot (.): Copies everything from build context (./backend directory)
# - Second dot (./): Destination is current WORKDIR (/app)
# - This includes all .cs files, appsettings.json, etc.
COPY . ./

# Build and publish the application
# dotnet publish command options explained:
# - -c Release: Build in Release configuration (optimized, no debug symbols)
# - -o out: Output the published files to the "out" directory
#
# What does "publish" mean?
# - Compiles the code into DLL files
# - Copies all runtime dependencies
# - Creates a self-contained deployment package
# - Result is ready to run on any server with .NET runtime
RUN dotnet publish -c Release -o out

# ===============================================================================
# STAGE 2: RUNTIME STAGE
# ===============================================================================
# This stage creates the final, lightweight image that will actually run in 
# production. It only includes the runtime (not build tools) and the compiled app.

# FROM: Start a new stage with a different base image
# - mcr.microsoft.com/dotnet/aspnet:8.0: Contains only .NET runtime (no SDK)
# - Much smaller than SDK image (aspnet ~220MB vs sdk ~750MB)
# - aspnet includes ASP.NET Core runtime for web applications
# - AS runtime: Names this stage "runtime" (this becomes the final image)
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS runtime

# Set working directory for the runtime container
WORKDIR /app

# ---------------------------------------------------------------------------
# Copy compiled application from build stage
# ---------------------------------------------------------------------------
# COPY --from=<stage_name>: Copy files from a previous build stage
# - --from=build: Get files from the "build" stage we defined earlier
# - /app/out: Source path in the build stage (where we published to)
# - . : Destination is current WORKDIR (/app)
#
# Why copy from build stage?
# - Build stage has compiled/published files but also SDK tools (750MB)
# - We only need the published output (~50MB), not the build tools
# - This dramatically reduces final image size and improves security
COPY --from=build /app/out .

# ---------------------------------------------------------------------------
# Create data directory for SQLite database
# ---------------------------------------------------------------------------
# RUN mkdir -p: Creates directory with parent directories if needed
# - -p flag: Create parent directories if they don't exist (no error if exists)
# - /app/data: Directory where SQLite database file will be stored
# - This directory will be mapped to a volume at runtime for data persistence
RUN mkdir -p /app/data

# ---------------------------------------------------------------------------
# Expose port for the application
# ---------------------------------------------------------------------------
# EXPOSE: Documents which port the container will listen on at runtime
# - This is documentation only (doesn't actually publish the port)
# - Actual port publishing happens when running the container with -p flag
# - Port 5000: Default port for ASP.NET Core applications in this project
#
# Example: docker run -p 8080:5000 ...
# - Maps host port 8080 to container port 5000
# - EXPOSE tells developers/tools which port to map
EXPOSE 5000

# ---------------------------------------------------------------------------
# Set environment variables
# ---------------------------------------------------------------------------
# ENV: Sets environment variables that will be available when container runs
#
# Environment Variable 1: ASPNETCORE_URLS
# - Tells ASP.NET Core which URLs to listen on
# - http://0.0.0.0:5000: Listen on all network interfaces on port 5000
# - 0.0.0.0 means "all available IPs" (required for Docker networking)
# - If we used 127.0.0.1, container would only accept internal connections
# - This allows the container to accept external connections
ENV ASPNETCORE_URLS=http://0.0.0.0:5000

# Environment Variable 2: ASPNETCORE_ENVIRONMENT
# - Controls .NET's runtime behavior (logging level, error pages, etc.)
# - Development: Detailed errors, Swagger UI enabled, verbose logging
# - Production: Minimal logging, generic error pages, better performance
# - Can be overridden when running container with -e flag
ENV ASPNETCORE_ENVIRONMENT=Development

# ---------------------------------------------------------------------------
# Define container startup command
# ---------------------------------------------------------------------------
# ENTRYPOINT: Specifies the command that runs when container starts
# - Uses JSON array format (exec form) - recommended for production
# - Alternative: shell form would be ENTRYPOINT dotnet PomodoroAPI.dll
#
# Why use exec form (JSON array)?
# - Process runs as PID 1, receives signals properly (SIGTERM for shutdown)
# - No shell wrapping, more efficient
# - Allows proper graceful shutdown when stopping container
#
# Command breakdown:
# - "dotnet": .NET CLI command to run applications
# - "PomodoroAPI.dll": The compiled application to run
#   (This was created during "dotnet publish" in the build stage)
#
# When container starts, this command executes and runs the web server
ENTRYPOINT ["dotnet", "PomodoroAPI.dll"]

# ===============================================================================
# HOW TO BUILD THIS IMAGE
# ===============================================================================
# From the backend directory, run:
#   docker build -t pomowatch-backend .
#
# Command explained:
# - docker build: Docker command to build an image
# - -t pomowatch-backend: Tag (name) the image "pomowatch-backend"
# - . : Build context is current directory (contains Dockerfile and source)
#
# ===============================================================================
# HOW TO RUN A CONTAINER FROM THIS IMAGE
# ===============================================================================
# docker run -d \
#   -p 5001:5000 \
#   -v $(pwd)/data:/app/data \
#   -e ASPNETCORE_ENVIRONMENT=Production \
#   pomowatch-backend
#
# Command explained:
# - docker run: Create and start a container from an image
# - -d: Run in detached mode (background)
# - -p 5001:5000: Map host port 5001 to container port 5000
# - -v $(pwd)/data:/app/data: Mount local data directory for persistence
# - -e: Override environment variable
# - pomowatch-backend: Name of the image to run
# ===============================================================================
