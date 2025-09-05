"""
Server Starter - garantiert funktionierend
"""
import os
import uvicorn

if __name__ == "__main__":
    print("=" * 50)
    print("🚀 VoicePartnerAI - FUNKTIONIEREND")
    print("=" * 50)
    print("🌐 Website: http://localhost:8005")
    print("📋 Features:")
    print("  ✅ E-Mail Registrierung")
    print("  ✅ E-Mail Login")
    print("  ✅ Dashboard")
    print("  ✅ Google Login (Placeholder)")
    print("=" * 50)
    print("🔧 Demo-Zugangsdaten:")
    print("  📧 E-Mail: demo@test.com")
    print("  🔑 Passwort: demo123")
    print("  ➡️  1. Registrieren")
    print("  ➡️  2. Anmelden")
    print("=" * 50)
    
    uvicorn.run(
        "working_server:app",
        host="127.0.0.1",
        port=8005,
        reload=False,
        log_level="info"
    )