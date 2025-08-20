@echo off
title Beacon Docker Launcher
color 0B

echo.
echo ========================================
echo BEACON DOCKER LAUNCHER
echo ========================================
echo.

echo Checking Docker installation...
docker --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Docker is not installed or not running!
    echo Please install Docker Desktop and ensure it's running.
    echo.
    pause
    exit /b 1
)

echo Checking Docker Compose...
docker-compose --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Docker Compose is not available!
    echo Please ensure Docker Compose is installed.
    echo.
    pause
    exit /b 1
)

echo ✅ Docker is ready!
echo.

echo Choose an option:
echo.
echo 1. Start all services (recommended)
echo 2. Start only database
echo 3. Start backend services (DB + Server + Location)
echo 4. Start frontend services (Admin Client + Companion)
echo 5. View logs
echo 6. Stop all services
echo 7. Rebuild and start
echo 8. Exit
echo.

set /p choice="Enter your choice (1-8): "

if "%choice%"=="1" goto start_all
if "%choice%"=="2" goto start_db
if "%choice%"=="3" goto start_backend
if "%choice%"=="4" goto start_frontend
if "%choice%"=="5" goto view_logs
if "%choice%"=="6" goto stop_all
if "%choice%"=="7" goto rebuild_start
if "%choice%"=="8" goto exit
goto invalid

:start_all
echo.
echo Starting all Beacon services...
echo.
docker-compose up -d
if errorlevel 1 (
    echo ❌ Failed to start services!
    echo Check the logs with: docker-compose logs
    echo.
    pause
    goto menu
)
echo.
echo ✅ All services started successfully!
echo.
echo Services running:
echo - Django Backend: http://localhost:8000
echo - React Frontend: http://localhost:5173
echo - Location Server: http://localhost:3001
echo - Companion App: http://localhost:8080
echo - MySQL Database: localhost:3307
echo.
echo To view logs: docker-compose logs -f
echo To stop services: docker-compose down
echo.
pause
goto menu

:start_db
echo.
echo Starting MySQL database...
echo.
docker-compose up -d db
if errorlevel 1 (
    echo ❌ Failed to start database!
    echo Check the logs with: docker-compose logs db
    echo.
    pause
    goto menu
)
echo.
echo ✅ Database started successfully!
echo MySQL is available at localhost:3307
echo.
pause
goto menu

:start_backend
echo.
echo Starting backend services...
echo.
docker-compose up -d db server location_server
if errorlevel 1 (
    echo ❌ Failed to start backend services!
    echo Check the logs with: docker-compose logs
    echo.
    pause
    goto menu
)
echo.
echo ✅ Backend services started successfully!
echo.
echo Services running:
echo - Django Backend: http://localhost:8000
echo - Location Server: http://localhost:3001
echo - MySQL Database: localhost:3307
echo.
pause
goto menu

:start_frontend
echo.
echo Starting frontend services...
echo.
docker-compose up -d admin_client companion
if errorlevel 1 (
    echo ❌ Failed to start frontend services!
    echo Check the logs with: docker-compose logs
    echo.
    pause
    goto menu
)
echo.
echo ✅ Frontend services started successfully!
echo.
echo Services running:
echo - React Frontend: http://localhost:5173
echo - Companion App: http://localhost:8080
echo.
pause
goto menu

:view_logs
echo.
echo Viewing Docker logs...
echo Press Ctrl+C to exit logs view
echo.
docker-compose logs -f
goto menu

:stop_all
echo.
echo Stopping all services...
echo.
docker-compose down
if errorlevel 1 (
    echo ❌ Failed to stop services!
    echo.
    pause
    goto menu
)
echo.
echo ✅ All services stopped successfully!
echo.
pause
goto menu

:rebuild_start
echo.
echo Rebuilding and starting all services...
echo This may take several minutes...
echo.
docker-compose down
docker-compose up --build -d
if errorlevel 1 (
    echo ❌ Failed to rebuild and start services!
    echo Check the logs with: docker-compose logs
    echo.
    pause
    goto menu
)
echo.
echo ✅ Services rebuilt and started successfully!
echo.
echo Services running:
echo - Django Backend: http://localhost:8000
echo - React Frontend: http://localhost:5173
echo - Location Server: http://localhost:3001
echo - Companion App: http://localhost:8080
echo - MySQL Database: localhost:3307
echo.
pause
goto menu

:invalid
echo.
echo Invalid choice! Please enter a number between 1 and 8.
echo.
timeout /t 2 /nobreak >nul
goto menu

:exit
echo.
echo Thank you for using Beacon Docker Launcher!
echo.
timeout /t 2 /nobreak >nul
exit

:menu
cls
echo.
echo ========================================
echo BEACON DOCKER LAUNCHER
echo ========================================
echo.

echo Choose an option:
echo.
echo 1. Start all services (recommended)
echo 2. Start only database
echo 3. Start backend services (DB + Server + Location)
echo 4. Start frontend services (Admin Client + Companion)
echo 5. View logs
echo 6. Stop all services
echo 7. Rebuild and start
echo 8. Exit
echo.

set /p choice="Enter your choice (1-8): "

if "%choice%"=="1" goto start_all
if "%choice%"=="2" goto start_db
if "%choice%"=="3" goto start_backend
if "%choice%"=="4" goto start_frontend
if "%choice%"=="5" goto view_logs
if "%choice%"=="6" goto stop_all
if "%choice%"=="7" goto rebuild_start
if "%choice%"=="8" goto exit
goto invalid
