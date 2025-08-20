@echo off
echo Starting Beacon Location Server...
echo.

cd server\location_server

echo Installing dependencies...
call npm install

echo.
echo Starting location server on port 3001...
echo.
call npm start

pause
