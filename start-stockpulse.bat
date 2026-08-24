@echo off
echo Starting StockPulse Servers...

:: Start the Python Backend in a new window
echo Starting Backend (FastAPI)...
start cmd /k "cd backend && "C:\Users\vishn\AppData\Local\Programs\Python\Python312-arm64\python.exe" -m uvicorn main:app --reload --host 0.0.0.0 --port 8000"


:: Start the React Frontend in a new window
echo Starting Frontend (Vite)...
start cmd /k "cd frontend && npm run dev"

echo.
echo Both servers are starting up!
echo The Frontend will be available at: http://localhost:5173/
echo The Backend API is available at: http://localhost:8000/
echo.
pause
