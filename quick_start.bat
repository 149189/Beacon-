@echo off
title Beacon Quick Start
color 0B

echo.
echo ========================================
echo BEACON QUICK START
echo ========================================
echo.
echo This script will start all services quickly
echo without going through the menu system.
echo.
echo Press any key to continue or Ctrl+C to cancel...
pause > nul

echo.
echo Starting all Beacon services...
echo.

cd server\beacon_server

echo [1/4] Checking Python...
python --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Python not found! Please install Python 3.8+
    pause
    exit /b 1
)
echo ✅ Python found

echo [2/4] Starting Django Backend...
start "Django Backend" cmd /k "cd server\beacon_server && python manage.py runserver"

echo [3/4] Starting React Frontend...
cd ..\..\admin_client\beacon_user
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js not found! Please install Node.js 16+
    pause
    exit /b 1
)
echo ✅ Node.js found
start "React Frontend" cmd /k "cd admin_client\beacon_user && npm run dev"

echo [4/4] Starting Location Server...
cd ..\..\server\location_server
start "Location Server" cmd /k "cd server\location_server && npm start"

echo.
echo ========================================
echo ALL SERVICES STARTED!
echo ========================================
echo.
echo Services running:
echo - Django Backend: http://localhost:8000
echo - React Frontend: http://localhost:5173
echo - Location Server: http://localhost:3001
echo.
echo Each service runs in its own window.
echo Close the windows to stop the services.
echo.
echo Press any key to exit this launcher...
pause > nul
