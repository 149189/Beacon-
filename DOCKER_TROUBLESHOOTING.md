# Docker Troubleshooting Guide for Beacon Application

## Quick Start with Docker

1. **Start all services**: `docker-compose up -d`
2. **View logs**: `docker-compose logs -f`
3. **Stop services**: `docker-compose down`
4. **Rebuild and start**: `docker-compose up --build -d`

## Common Docker Issues and Solutions

### ❌ Port Already in Use
**Error**: `Bind for 0.0.0.0:8000 failed: port is already allocated`

**Solutions**:
1. **Find what's using the port**:
   ```cmd
   netstat -ano | findstr :8000
   netstat -ano | findstr :3001
   netstat -ano | findstr :5173
   netstat -ano | findstr :3307
   ```

2. **Kill the process**:
   ```cmd
   taskkill /PID <PID_NUMBER> /F
   ```

3. **Or change ports in docker-compose.yml**:
   ```yaml
   ports:
     - "8001:8000"  # Use port 8001 instead of 8000
   ```

### ❌ MySQL Connection Failed
**Error**: `Can't connect to MySQL server on 'db'`

**Solutions**:

#### Option 1: Check MySQL Container Status
```cmd
docker-compose ps db
docker-compose logs db
```

#### Option 2: Wait for MySQL to be Ready
The application automatically waits for MySQL. If it fails:
```cmd
docker-compose logs server
```

#### Option 3: Manual MySQL Check
```cmd
docker-compose exec db mysql -u root -p
# Enter password: Kaustubh@149
```

#### Option 4: Restart MySQL Container
```cmd
docker-compose restart db
```

### ❌ Build Failures
**Error**: `failed to build: error building at step X`

**Solutions**:

#### Option 1: Clean Build
```cmd
docker-compose down
docker system prune -f
docker-compose up --build
```

#### Option 2: Check Dockerfile Issues
- Verify all required files exist
- Check file permissions
- Ensure correct base images

#### Option 3: Check Requirements
```cmd
# For Python dependencies
docker-compose exec server pip list

# For Node.js dependencies
docker-compose exec admin_client npm list
```

### ❌ Container Won't Start
**Error**: `Container exited with code X`

**Solutions**:

#### Option 1: Check Container Logs
```cmd
docker-compose logs <service_name>
# Example: docker-compose logs server
```

#### Option 2: Check Dependencies
```cmd
docker-compose ps
# Ensure all required services are running
```

#### Option 3: Check Health Status
```cmd
docker-compose ps --format "table {{.Name}}\t{{.Status}}\t{{.Ports}}"
```

### ❌ Volume Mount Issues
**Error**: `Cannot create directory` or `Permission denied`

**Solutions**:

#### Option 1: Check File Permissions
```cmd
# On Windows, ensure Docker has access to the project folder
# Right-click folder → Properties → Security → Edit → Add Docker user
```

#### Option 2: Use Named Volumes
```yaml
volumes:
  - beacon_data:/app/data
```

#### Option 3: Check Docker Desktop Settings
- Ensure file sharing is enabled for your project directory
- Check antivirus exclusions

### ❌ Network Issues
**Error**: `Connection refused` or `Cannot resolve hostname`

**Solutions**:

#### Option 1: Check Docker Network
```cmd
docker network ls
docker network inspect beacon-_default
```

#### Option 2: Restart Docker Network
```cmd
docker-compose down
docker network prune -f
docker-compose up
```

#### Option 3: Check Service Names
Ensure service names in docker-compose.yml match what's referenced in code.

## Service-Specific Issues

### Django Backend (Server)
- **Port 8000 busy**: Change port in docker-compose.yml
- **Database migration errors**: Check MySQL connection and logs
- **Static files**: Ensure volume mounts are correct

### React Frontend (Admin Client)
- **Port 5173 busy**: Change port in docker-compose.yml
- **Build errors**: Check Node.js version and dependencies
- **Hot reload not working**: Verify volume mounts

### Location Server
- **Port 3001 busy**: Change port in docker-compose.yml
- **WebSocket errors**: Check if location server is running
- **Database connection**: Verify MySQL credentials

### MySQL Database
- **Connection refused**: Check if container is running
- **Authentication failed**: Verify password in docker-compose.yml
- **Port conflicts**: Change port 3307 if needed

## Debug Commands

### Container Management
```cmd
# List all containers
docker ps -a

# List running containers
docker ps

# Stop all containers
docker-compose down

# Start specific service
docker-compose up -d server

# View logs for specific service
docker-compose logs -f server
```

### Container Inspection
```cmd
# Enter running container
docker-compose exec server bash

# Check container resources
docker stats

# Inspect container configuration
docker inspect beacon_server
```

### Network Debugging
```cmd
# Check network connectivity
docker-compose exec server ping db

# Check DNS resolution
docker-compose exec server nslookup db

# View network configuration
docker network inspect beacon-_default
```

### Volume Debugging
```cmd
# Check volume mounts
docker-compose exec server ls -la /app

# Verify file changes
docker-compose exec server cat /app/config.env
```

## Performance Issues

### High Memory Usage
```cmd
# Check container memory usage
docker stats

# Limit memory in docker-compose.yml
services:
  server:
    deploy:
      resources:
        limits:
          memory: 1G
```

### Slow Build Times
```cmd
# Use build cache
docker-compose build --no-cache

# Optimize Dockerfile layers
# Use .dockerignore to exclude unnecessary files
```

### Slow Startup
```cmd
# Check startup logs
docker-compose logs -f

# Optimize health checks
# Use proper depends_on conditions
```

## Environment-Specific Issues

### Windows Issues
- **Path separators**: Use forward slashes in docker-compose.yml
- **File permissions**: Ensure Docker Desktop has access
- **Antivirus**: Add project folder to exclusions

### macOS Issues
- **File sharing**: Ensure project directory is shared in Docker Desktop
- **Performance**: Use Docker Desktop's performance settings

### Linux Issues
- **User permissions**: Run docker-compose with appropriate user
- **SELinux**: Check if SELinux is blocking operations

## Fallback Options

### Use SQLite Instead of MySQL
1. Edit `server/beacon_server/docker.env`
2. Change: `USE_SQLITE=True`
3. Rebuild: `docker-compose up --build`

### Run Services Individually
```cmd
# Start only database
docker-compose up -d db

# Start only backend
docker-compose up -d server

# Start only frontend
docker-compose up -d admin_client
```

### Use Local Development
If Docker continues to cause issues:
1. Use the `run_beacon.bat` launcher instead
2. Install dependencies locally
3. Run services directly on your machine

## Getting Help

### Before Asking for Help
1. ✅ Check this troubleshooting guide
2. ✅ Check container logs: `docker-compose logs`
3. ✅ Verify Docker is running: `docker --version`
4. ✅ Check Docker Compose: `docker-compose --version`
5. ✅ Try rebuilding: `docker-compose up --build`

### When Asking for Help
Include:
- **Error message** (copy exactly)
- **Docker version**: `docker --version`
- **Docker Compose version**: `docker-compose --version`
- **OS information**: Windows/macOS/Linux version
- **Container logs**: `docker-compose logs <service>`
- **Steps you've already tried**

### Useful Commands for Debugging
```cmd
# Full system status
docker-compose ps
docker system df
docker network ls
docker volume ls

# Service-specific debugging
docker-compose logs -f --tail=100 server
docker-compose exec server python manage.py check
docker-compose exec admin_client npm run build
```
