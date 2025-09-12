#!/usr/bin/env python3
"""
VoicePartnerAI Development Starter
Automatisches Setup und Start von Frontend + Backend
"""
import os
import sys
import subprocess
import time
import threading
from pathlib import Path

# Colors for console output
class Colors:
    HEADER = '\033[95m'
    BLUE = '\033[94m'
    GREEN = '\033[92m'
    YELLOW = '\033[93m'
    RED = '\033[91m'
    ENDC = '\033[0m'
    BOLD = '\033[1m'

def print_colored(text, color=Colors.ENDC):
    print(f"{color}{text}{Colors.ENDC}")

def check_requirements():
    """Check if Node.js and Python are installed"""
    print_colored("\n🔍 Checking requirements...", Colors.BLUE)
    
    # Check Node.js
    try:
        node_version = subprocess.check_output(['node', '--version'], text=True).strip()
        print_colored(f"✅ Node.js: {node_version}", Colors.GREEN)
    except FileNotFoundError:
        print_colored("❌ Node.js nicht gefunden! Bitte installieren: https://nodejs.org/", Colors.RED)
        return False
    
    # Check Python
    try:
        python_version = subprocess.check_output([sys.executable, '--version'], text=True).strip()
        print_colored(f"✅ Python: {python_version}", Colors.GREEN)
    except FileNotFoundError:
        print_colored("❌ Python nicht gefunden!", Colors.RED)
        return False
    
    return True

def install_dependencies():
    """Install dependencies for both frontend and backend"""
    project_root = Path(__file__).parent.parent
    
    # Install frontend dependencies
    print_colored("\n📦 Installing frontend dependencies...", Colors.BLUE)
    app_dir = project_root / "app"
    if app_dir.exists():
        try:
            subprocess.run(['npm', 'install'], cwd=app_dir, check=True)
            print_colored("✅ Frontend dependencies installed", Colors.GREEN)
        except subprocess.CalledProcessError:
            print_colored("❌ Failed to install frontend dependencies", Colors.RED)
            return False
    
    # Install backend dependencies  
    print_colored("\n🐍 Installing backend dependencies...", Colors.BLUE)
    backend_dir = project_root / "backend"
    if backend_dir.exists():
        try:
            subprocess.run([
                sys.executable, '-m', 'pip', 'install', '-r', 'requirements.txt'
            ], cwd=backend_dir, check=True)
            print_colored("✅ Backend dependencies installed", Colors.GREEN)
        except subprocess.CalledProcessError:
            print_colored("❌ Failed to install backend dependencies", Colors.RED)
            return False
    
    return True

def start_frontend():
    """Start frontend development server"""
    project_root = Path(__file__).parent.parent
    app_dir = project_root / "app"
    
    if app_dir.exists():
        print_colored("🚀 Starting frontend server...", Colors.BLUE)
        subprocess.run(['npm', 'run', 'dev'], cwd=app_dir)
    else:
        print_colored("❌ Frontend directory not found", Colors.RED)

def start_backend():
    """Start backend API server"""
    project_root = Path(__file__).parent.parent
    backend_dir = project_root / "backend"
    
    if backend_dir.exists():
        print_colored("🚀 Starting backend API server...", Colors.BLUE)
        try:
            # Try to start with uvicorn
            subprocess.run([
                'uvicorn', 'src.api.main:app', '--reload', '--host', '0.0.0.0', '--port', '8000'
            ], cwd=backend_dir)
        except FileNotFoundError:
            # Fallback: run with Python if uvicorn not in PATH
            subprocess.run([
                sys.executable, '-m', 'uvicorn', 'src.api.main:app', '--reload'
            ], cwd=backend_dir)
    else:
        print_colored("❌ Backend directory not found", Colors.RED)

def main():
    """Main function"""
    print_colored("\n" + "="*60, Colors.HEADER)
    print_colored("🎤 VoicePartnerAI Development Starter", Colors.HEADER + Colors.BOLD)
    print_colored("="*60, Colors.HEADER)
    
    # Check requirements
    if not check_requirements():
        sys.exit(1)
    
    # Ask user what to do
    print_colored("\n🔧 Was möchten Sie starten?", Colors.YELLOW)
    print("1. Nur Frontend (Port 3000)")
    print("2. Nur Backend (Port 8000)") 
    print("3. Beide (Empfohlen)")
    print("4. Dependencies installieren")
    print("5. Alles (Dependencies + Beide Server)")
    
    choice = input("\nWählen Sie (1-5): ").strip()
    
    if choice in ['4', '5']:
        if not install_dependencies():
            sys.exit(1)
    
    if choice == '1':
        start_frontend()
    elif choice == '2':
        start_backend()
    elif choice in ['3', '5']:
        print_colored("\n🚀 Starting both servers...", Colors.GREEN)
        print_colored("Frontend: http://localhost:3000/public/pages/", Colors.BLUE)
        print_colored("Backend:  http://localhost:8000", Colors.BLUE)
        print_colored("\nPress Ctrl+C to stop both servers\n", Colors.YELLOW)
        
        # Start backend in separate thread
        backend_thread = threading.Thread(target=start_backend, daemon=True)
        backend_thread.start()
        
        # Wait a bit then start frontend
        time.sleep(2)
        start_frontend()
    elif choice == '4':
        print_colored("\n✅ Dependencies installed successfully!", Colors.GREEN)
    else:
        print_colored("❌ Invalid choice", Colors.RED)

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print_colored("\n\n👋 Development servers stopped", Colors.YELLOW)
        sys.exit(0)