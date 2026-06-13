# Hikari Launch Script for Windows PowerShell
Write-Host "Starting Hikari System..." -ForegroundColor Cyan

# Check for Python dependencies
Write-Host "Verifying Python dependencies..." -ForegroundColor Yellow
pip install -r .\hikari-api\requirements.txt --quiet

# Start backend FastAPI in a new window/job
Write-Host "Launching Backend API on http://localhost:8000..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd .\hikari-api; uvicorn main:app --reload --port 8000"

# Launch Frontend dev server
Write-Host "Launching Frontend dev server on http://localhost:3000..." -ForegroundColor Green
cd .\hikari-web
npm run dev
