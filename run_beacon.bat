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
echo Checking dependencies...
cd server\beacon_server

echo Checking Python and Django...
python --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Python is not installed or not in PATH
    echo Please install Python 3.8+ and try again
    echo.
    pause
    cd ..\..
    goto menu
)

echo Starting Django Backend Server...
start "Django Backend" cmd /k "cd server\beacon_server && python manage.py runserver"

echo Waiting for Django server to start...
timeout /t 5 /nobreak > nul

echo Starting React Frontend Server...
cd ..\..\admin_client\beacon_user

echo Checking Node.js and npm...
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js is not installed or not in PATH
    echo Please install Node.js 16+ and try again
    echo.
    pause
    cd ..\..\server\beacon_server
    cd ..\..
    goto menu
)

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
cd ..\..\server\beacon_server
cd ..\..
goto menu

:admin_mysql
cls
echo.
echo ========================================
echo Starting Beacon Admin Panel (MySQL)...
echo ========================================
echo.
echo Checking dependencies...
cd server\beacon_server

echo Checking Python and Django...
python --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Python is not installed or not in PATH
    echo Please install Python 3.8+ and try again
    echo.
    pause
    cd ..\..
    goto menu
)

echo Checking MySQL connection...
python setup_mysql.py

echo.
echo If MySQL connection failed, please check:
echo 1. MySQL server is running (check Windows Services)
echo 2. Credentials in config.env file
echo 3. MySQL user has proper permissions
echo 4. Port 3306 is not blocked by firewall
echo.
echo Starting Django Backend Server with MySQL...
start "Django Backend (MySQL)" cmd /k "cd server\beacon_server && python manage.py runserver"

echo Waiting for Django server to start...
timeout /t 5 /nobreak > nul

echo Starting React Frontend Server...
cd ..\..\admin_client\beacon_user
echo Checking Node.js and npm...
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js is not installed or not in PATH
    echo Please install Node.js 16+ and try again
    echo.
    pause
    cd ..\..\server\beacon_server
    cd ..\..
    goto menu
)

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
cd ..\..\server\beacon_server
cd ..\..
goto menu

:location_only
cls
echo.
echo ========================================
echo Starting Beacon Location Server...
echo ========================================
echo.
echo Checking dependencies...
cd server\location_server

echo Checking Node.js and npm...
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js is not installed or not in PATH
    echo Please install Node.js 16+ and try again
    echo.
    pause
    cd ..\..
    goto menu
)

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
echo Checking dependencies...
cd server\beacon_server

echo Checking Python and Django...
python --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Python is not installed or not in PATH
    echo Please install Python 3.8+ and try again
    echo.
    pause
    cd ..\..
    goto menu
)

echo Starting Django Server (MySQL)...
start "Django Server" cmd /k "cd server\beacon_server && python manage.py runserver"

echo.
echo ========================================
echo Starting Location Server (MySQL)...
echo ========================================
cd ..\location_server

echo Checking Node.js and npm...
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js is not installed or not in PATH
    echo Please install Node.js 16+ and try again
    echo.
    pause
    cd ..\..\server\beacon_server
    cd ..\..
    goto menu
)

start "Location Server" cmd /k "cd server\location_server && npm start"

echo.
echo Both servers are starting...
echo - Django Server: http://localhost:8000
echo - Location Server: http://localhost:3001
echo.
echo Press any key to return to menu...
pause > nul
cd ..\..\server\beacon_server
cd ..\..
goto menu

:all_services
cls
echo.
echo ========================================
echo Starting All Beacon Services...
echo ========================================
echo.
echo Checking dependencies...
cd server\beacon_server

echo Checking Python and Django...
python --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Python is not installed or not in PATH
    echo Please install Python 3.8+ and try again
    echo.
    pause
    cd ..\..
    goto menu
)

echo Checking MySQL connection...
python setup_mysql.py

echo.
echo If MySQL connection failed, please check:
echo 1. MySQL server is running (check Windows Services)
echo 2. Credentials in config.env file
echo 3. MySQL user has proper permissions
echo 4. Port 3306 is not blocked by firewall
echo.
echo Starting Django Backend Server with MySQL...
start "Django Backend Server (MySQL)" cmd /k "cd server\beacon_server && python manage.py runserver"

echo Waiting for Django server to start...
timeout /t 5 /nobreak > nul

echo Starting React Frontend Server...
cd ..\..\admin_client\beacon_user
echo Checking Node.js and npm...
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js is not installed or not in PATH
    echo Please install Node.js 16+ and try again
    echo.
    pause
    cd ..\..\server\beacon_server
    cd ..\..
    goto menu
)

start "React Frontend" cmd /k "cd admin_client\beacon_user && npm run dev"

echo.
echo Starting Location Server...
cd ..\..\server\location_server
echo Checking Node.js for location server...
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js is not installed or not in PATH
    echo Please install Node.js 16+ and try again
    echo.
    pause
    cd ..\..\server\beacon_server
    cd ..\..
    goto menu
)

start "Location Server" cmd /k "cd server\location_server && npm start"

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
cd ..\..\server\beacon_server
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
