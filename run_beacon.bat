@echo off
title Beacon Application Launcher
color 0A

:menu
cls
echo.
echo  ========================================
echo  BEACON APPLICATION LAUNCHER
echo  ========================================
echo.
echo  Choose an option:
echo.
echo  1. Start Admin Panel (Default SQLite)
echo  2. Start Admin Panel (MySQL)
echo  3. Start Location Server Only
echo  4. Start MySQL Servers (Django + Location)
echo  5. Start All Services (Admin + Location + MySQL)
echo  6. Exit
echo.
echo  ========================================
set /p choice="Enter your choice (1-6): "

if "%choice%"=="1" goto admin_default
if "%choice%"=="2" goto admin_mysql
if "%choice%"=="3" goto location_only
if "%choice%"=="4" goto mysql_servers
if "%choice%"=="5" goto all_services
if "%choice%"=="6" goto exit
goto invalid

:admin_default
cls
echo.
echo ========================================
echo Starting Beacon Admin Panel (SQLite)...
echo ========================================
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
echo Press any key to return to menu...
pause > nul
goto menu

:admin_mysql
cls
echo.
echo ========================================
echo Starting Beacon Admin Panel (MySQL)...
echo ========================================
echo.
echo Checking MySQL connection...
cd server\beacon_server
python setup_mysql.py

echo.
echo If MySQL connection failed, please check:
echo 1. MySQL server is running
echo 2. Credentials in config.env file
echo 3. MySQL user has proper permissions
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
echo Press any key to return to menu...
pause > nul
cd ..\..
goto menu

:location_only
cls
echo.
echo ========================================
echo Starting Beacon Location Server...
echo ========================================
echo.
cd server\location_server

echo Installing dependencies...
call npm install

echo.
echo Starting location server on port 3001...
echo.
call npm start

cd ..\..
echo.
echo Press any key to return to menu...
pause > nul
goto menu

:mysql_servers
cls
echo.
echo ========================================
echo Starting Beacon Servers with MySQL...
echo ========================================
echo.
echo Starting Django Server (MySQL)...
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
echo Press any key to return to menu...
pause > nul
cd ..\..
goto menu

:all_services
cls
echo.
echo ========================================
echo Starting All Beacon Services...
echo ========================================
echo.
echo Checking MySQL connection...
cd server\beacon_server
python setup_mysql.py

echo.
echo If MySQL connection failed, please check:
echo 1. MySQL server is running
echo 2. Credentials in config.env file
echo 3. MySQL user has proper permissions
echo.
echo Starting Django Backend Server with MySQL...
start "Django Backend Server (MySQL)" cmd /k "cd server\beacon_server && python manage.py runserver"

echo Waiting for Django server to start...
timeout /t 5 /nobreak > nul

echo Starting React Frontend Server...
start "React Frontend" cmd /k "cd admin_client\beacon_user && npm run dev"

echo.
echo Starting Location Server...
cd ..\location_server
start "Location Server" cmd /k "npm start"

echo.
echo All services are starting...
echo.
echo Django Backend: http://localhost:8000
echo Django Admin: http://localhost:8000/admin
echo React Frontend: http://localhost:5173
echo Location Server: http://localhost:3001
echo.
echo Database: MySQL (beacon_db)
echo Demo Credentials:
echo Admin: username=admin, password=admin123
echo Demo Users: username=kaustubh, password=demo123
echo.
echo Press any key to return to menu...
pause > nul
cd ..\..
goto menu

:invalid
echo.
echo Invalid choice! Please enter a number between 1 and 6.
echo.
timeout /t 2 /nobreak > nul
goto menu

:exit
echo.
echo Thank you for using Beacon Application Launcher!
echo.
timeout /t 2 /nobreak > nul
exit
