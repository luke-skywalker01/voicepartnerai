@echo off
echo.
echo ================================
echo 🎤 VoicePartnerAI Dev Starter
echo ================================
echo.

echo 🔍 Checking requirements...

:: Check Node.js
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Node.js nicht gefunden! Bitte installieren: https://nodejs.org/
    pause
    exit /b 1
) else (
    echo ✅ Node.js gefunden
)

:: Check Python
where python >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Python nicht gefunden! Bitte installieren: https://python.org/
    pause
    exit /b 1
) else (
    echo ✅ Python gefunden
)

echo.
echo 📦 Installing dependencies...

:: Install frontend dependencies
echo Installing frontend dependencies...
cd app
call npm install
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Frontend dependencies installation failed
    pause
    exit /b 1
)
cd ..

:: Install backend dependencies
echo Installing backend dependencies...
cd backend
pip install -r requirements.txt
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Backend dependencies installation failed
    pause
    exit /b 1
)
cd ..

echo.
echo ✅ All dependencies installed!
echo.
echo 🚀 Starting development servers...
echo Frontend: http://localhost:3000/public/pages/
echo Backend:  http://localhost:8000
echo.
echo Press Ctrl+C to stop servers
echo.

:: Start backend in background
start "VoicePartnerAI Backend" cmd /c "cd backend && uvicorn src.api.main:app --reload --host 0.0.0.0 --port 8000"

:: Wait a moment
timeout /t 3 /nobreak >nul

:: Start frontend (foreground)
cd app
npm run dev

pause