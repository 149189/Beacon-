Write-Host "Starting Beacon Location Server..." -ForegroundColor Green
Write-Host ""

Set-Location "server\location_server"

Write-Host "Installing dependencies..." -ForegroundColor Yellow
npm install

Write-Host ""
Write-Host "Starting location server on port 3001..." -ForegroundColor Yellow
Write-Host ""

npm start

Read-Host "Press Enter to continue"
