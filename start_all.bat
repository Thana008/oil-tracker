@echo off
echo =========================================
echo 🚀 Starting Oil Tracker Architecture
echo =========================================

echo [1/3] Starting FastAPI AI Microservice...
start "AI Microservice (Port 8000)" cmd /c "cd ai-service && uvicorn main:app --reload --port 8000"

echo [2/3] Starting Node.js Backend...
start "Backend (Port 5001)" cmd /c "cd backend && npm run dev"

echo [3/3] Starting React Frontend...
start "Frontend (Port 5173)" cmd /c "cd frontend && npm run dev"

echo.
echo ✅ All services are starting up in separate windows!
echo - AI Service: http://localhost:8000/docs
echo - Backend API: http://localhost:5001/api/prices
echo - Frontend: http://localhost:5173
echo.
pause
