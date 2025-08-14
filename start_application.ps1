Write-Host "Starting Beacon Admin Panel..." -ForegroundColor Green
Write-Host ""

Write-Host "Starting Django Backend Server..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd 'server\beacon_server'; python manage.py runserver" -WindowStyle Normal

Write-Host "Waiting for Django server to start..." -ForegroundColor Cyan
Start-Sleep -Seconds 5

Write-Host "Starting React Frontend Server..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd 'admin_client\beacon_user'; npm run dev" -WindowStyle Normal

Write-Host ""
Write-Host "Both servers are starting..." -ForegroundColor Green
Write-Host ""
Write-Host "Django Backend: http://localhost:8000" -ForegroundColor Cyan
Write-Host "Django Admin: http://localhost:8000/admin" -ForegroundColor Cyan
Write-Host "React Frontend: http://localhost:5173" -ForegroundColor Cyan
Write-Host ""
Write-Host "Demo Credentials:" -ForegroundColor Yellow
Write-Host "Admin: username=admin, password=admin123" -ForegroundColor White
Write-Host "Demo Users: username=kaustubh, password=demo123" -ForegroundColor White
Write-Host ""
Write-Host "Press any key to exit this launcher..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
