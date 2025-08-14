@echo off
echo Starting Beacon Admin Panel...
echo.

echo Starting Django Backend Server...
start "Django Backend" cmd /k "cd server\beacon_server && python manage.py runserver"

echo Waiting for Django server to start...
timeout /t 5 /nobreak > nul

echo Starting React Frontend Server...
start "React Frontend" cmd /k "cd admin_client\beacon_user && npm run dev"

echo.
echo Both servers are starting...
echo.
echo Django Backend: http://localhost:8000
echo Django Admin: http://localhost:8000/admin
echo React Frontend: http://localhost:5173
echo.
echo Demo Credentials:
echo Admin: username=admin, password=admin123
echo Demo Users: username=kaustubh, password=demo123
echo.
echo Press any key to exit this launcher...
pause > nul
