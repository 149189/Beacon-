@echo off
echo Starting Beacon Servers with MySQL Configuration...
echo.

echo ========================================
echo Starting Django Server (MySQL)...
echo ========================================
cd server\beacon_server
start "Django Server" cmd /k "python manage.py runserver"

echo.
echo ========================================
echo Starting Location Server (MySQL)...
echo ========================================
cd ..\location_server
start "Location Server" cmd /k "npm start"

echo.
echo Both servers are starting...
echo - Django Server: http://localhost:8000
echo - Location Server: http://localhost:3001
echo.
echo Press any key to close this window...
pause > nul
