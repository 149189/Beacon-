Write-Host "Starting Beacon Servers with MySQL Configuration..." -ForegroundColor Green
Write-Host ""

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Starting Django Server (MySQL)..." -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Cyan
Set-Location "server\beacon_server"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "python manage.py runserver"

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Starting Location Server (MySQL)..." -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Cyan
Set-Location "..\location_server"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "npm start"

Write-Host ""
Write-Host "Both servers are starting..." -ForegroundColor Green
Write-Host "- Django Server: http://localhost:8000" -ForegroundColor White
Write-Host "- Location Server: http://localhost:3001" -ForegroundColor White
Write-Host ""
Write-Host "Press Enter to close this window..." -ForegroundColor Yellow
Read-Host
