#!/usr/bin/env python3
"""
Development server for VoicePartnerAI platform
Serves the frontend and provides basic backend functionality
"""

import os
import http.server
import socketserver
from pathlib import Path

PORT = 8080
FRONTEND_DIR = Path(__file__).parent.parent / "frontend"

class CustomHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=FRONTEND_DIR, **kwargs)

if __name__ == "__main__":
    os.chdir(FRONTEND_DIR)
    
    with socketserver.TCPServer(("", PORT), CustomHandler) as httpd:
        print(f"[OK] VoicePartnerAI Development Server")
        print(f"[WEB] Serving at: http://localhost:{PORT}")
        print(f"[DIR] Directory: {FRONTEND_DIR}")
        print(f"[APP] Main App: http://localhost:{PORT}/pages/")
        print("Press Ctrl+C to stop")
        
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\n⏹️  Server stopped")