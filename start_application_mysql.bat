@echo off
echo Starting Beacon Admin Panel with MySQL Database...
echo.

echo Checking MySQL connection...
cd server\beacon_server
python setup_mysql.py

echo.
echo Starting Django Backend Server with MySQL...
start "Django Backend (MySQL)" cmd /k "cd server\beacon_server && python manage.py runserver"

echo Waiting for Django server to start...
timeout /t 5 /nobreak > nul

echo Starting React Frontend Server...
start "React Frontend" cmd /k "cd admin_client\beacon_user && npm run dev"

echo.
echo Both servers are starting with MySQL database...
echo.
echo Django Backend: http://localhost:8000
echo Django Admin: http://localhost:8000/admin
echo React Frontend: http://localhost:5173
echo.
echo Database: MySQL (beacon_db)
echo Demo Credentials:
echo Admin: username=admin, password=admin123
echo Demo Users: username=kaustubh, password=demo123
echo.
echo Press any key to exit this launcher...
pause > nul
