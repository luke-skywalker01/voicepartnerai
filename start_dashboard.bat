@echo off
echo ================================
echo VoicePartnerAI Dashboard Starter
echo ================================
echo.
echo Starte VoicePartnerAI Server...
echo.
echo URL: http://localhost:8000
echo API: http://localhost:8000/api
echo Docs: http://localhost:8000/docs
echo.
echo ================================
echo.

REM Wechsel zum fastapi-auth Verzeichnis
cd /d "%~dp0fastapi-auth"

REM Starte Server und öffne Browser nach 3 Sekunden
start /B "VoicePartnerAI Server" "C:\Users\lbi\AppData\Local\Programs\Python\Python310\python.exe" final_working_server.py

REM Warte 3 Sekunden für Server-Start
timeout /t 3 /nobreak >nul

REM Öffne Dashboard im Browser
start http://localhost:8000

echo Server gestartet! Das Dashboard sollte sich automatisch öffnen.
echo.
echo Drücken Sie eine beliebige Taste zum Beenden...
pause >nul

REM Stoppe alle Python-Prozesse beim Beenden
taskkill /f /im python.exe >nul 2>&1