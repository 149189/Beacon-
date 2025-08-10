@echo off
REM Beacon Startup Script for Windows
REM This script helps you get the Beacon system up and running

echo 🚨 Starting Beacon - Your Signal for Safety
echo ==============================================

REM Check if Docker is running
docker info >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Docker is not running. Please start Docker Desktop and try again.
    pause
    exit /b 1
)

REM Check if Docker Compose is available
docker-compose --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Docker Compose is not available. Please install Docker Desktop and try again.
    pause
    exit /b 1
)

echo ✅ Docker and Docker Compose are available

REM Check if .env file exists
if not exist .env (
    echo ⚠️  No .env file found. Creating from template...
    (
        echo # Beacon Environment Configuration
        echo MYSQL_DB=beacon_db
        echo MYSQL_USER=root
        echo MYSQL_PASSWORD=Kaustubh@149
        echo MYSQL_HOST=localhost
        echo MYSQL_PORT=3306
        echo.
        echo # Frontend Configuration
        echo REACT_APP_MAPBOX_TOKEN=your_mapbox_token_here
        echo REACT_APP_BACKEND_URL=http://localhost:8001
        echo REACT_APP_WS_URL=ws://localhost:8001/ws/
        echo.
        echo # Redis Configuration
        echo REDIS_HOST=localhost
        echo REDIS_PORT=6379
        echo.
        echo # Django Configuration
        echo SECRET_KEY=your-secret-key-here-change-in-production
        echo DEBUG=True
        echo ALLOWED_HOSTS=localhost,127.0.0.1
    ) > .env
    echo ✅ Created .env file. Please update REACT_APP_MAPBOX_TOKEN with your Mapbox token.
)

REM Check if MySQL is running
echo 🔍 Checking MySQL connection...
docker run --rm mysql:8.0 mysql -h host.docker.internal -u root -pKaustubh@149 -e "SELECT 1" >nul 2>&1
if %errorlevel% neq 0 (
    echo ⚠️  MySQL is not accessible. Starting MySQL container...
    docker run -d --name beacon-mysql -e MYSQL_ROOT_PASSWORD=Kaustubh@149 -e MYSQL_DATABASE=beacon_db -p 3306:3306 mysql:8.0
    
    echo ⏳ Waiting for MySQL to be ready...
    timeout /t 30 /nobreak >nul
) else (
    echo ✅ MySQL is accessible
)

REM Build and start services
echo 🔨 Building Docker images...
docker-compose build

echo 🚀 Starting Beacon services...
docker-compose up -d

echo ⏳ Waiting for services to be ready...
timeout /t 15 /nobreak >nul

REM Check service status
echo 📊 Service Status:
docker-compose ps

REM Check if backend is responding
echo 🔍 Checking backend health...
curl -s http://localhost:8001/api/health/ >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Backend is healthy
) else (
    echo ⚠️  Backend is not responding yet. Please wait a moment and check again.
)

echo.
echo 🎉 Beacon is starting up!
echo.
echo 📱 Access your application:
echo    • Operator Console: http://localhost:3000
echo    • Backend API: http://localhost:8001
echo    • Admin Panel: http://localhost:8001/admin
echo.
echo 📋 Useful commands:
echo    • View logs: docker-compose logs -f
echo    • Stop services: docker-compose down
echo    • Restart services: docker-compose restart
echo.
echo 🔧 Next steps:
echo    1. Get a Mapbox token from https://www.mapbox.com/
echo    2. Update REACT_APP_MAPBOX_TOKEN in your .env file
echo    3. Create test incidents: cd backend ^&^& python create_test_incident.py
echo.
echo Happy coding! 🚀
pause
