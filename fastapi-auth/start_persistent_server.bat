@echo off
echo =============================================
echo Starting VoicePartnerAI with PERSISTENT DB
echo =============================================
cd /d "C:\Users\lbi\OneDrive - Stiftung Myclimate\Dokumente\Privat\AI\WebDev\Voicepartnerai.com\fastapi-auth"

REM Try different Python locations
if exist "C:\Users\lbi\OneDrive - Stiftung Myclimate\Dokumente\Privat\AI\WebDev\Voicepartnerai.com\venv\Scripts\python.exe" (
    echo Using venv Python...
    "C:\Users\lbi\OneDrive - Stiftung Myclimate\Dokumente\Privat\AI\WebDev\Voicepartnerai.com\venv\Scripts\python.exe" perfect_server.py
) else if exist "C:\Users\lbi\AppData\Local\Programs\Python\Python310\python.exe" (
    echo Using Python 3.10...
    "C:\Users\lbi\AppData\Local\Programs\Python\Python310\python.exe" perfect_server.py
) else (
    echo Using system Python...
    python perfect_server.py
)
pause