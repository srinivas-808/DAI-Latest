"""
Diagnos AI — Platform Launcher
================================
Cross-platform launcher that starts both the backend (FastAPI)
and frontend (Vite) development servers.
"""

import subprocess
import time
import webbrowser
import os
import sys
import platform

BACKEND_DIR = "backend"
FRONTEND_DIR = "frontend"
BACKEND_PORT = 8000
FRONTEND_PORT = 5173

def is_windows():
    return platform.system() == "Windows"

def kill_port(port):
    """Kill any process on the given port."""
    try:
        if is_windows():
            # Windows: find and kill process on port
            result = subprocess.run(
                f'netstat -ano | findstr :{port}',
                shell=True, capture_output=True, text=True
            )
            if result.stdout.strip():
                for line in result.stdout.strip().split('\n'):
                    parts = line.split()
                    if len(parts) >= 5:
                        pid = parts[-1]
                        try:
                            subprocess.run(f'taskkill /PID {pid} /F', shell=True, 
                                         capture_output=True, check=False)
                        except Exception:
                            pass
        else:
            # Linux/Mac
            subprocess.Popen(["bash", "-c", f"fuser -k {port}/tcp"],
                           stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    except Exception as e:
        print(f"⚠ Could not clear port {port}: {e}")

def start_backend():
    """Start the FastAPI backend server."""
    print(f"🔧 Starting backend on port {BACKEND_PORT}...")
    
    if is_windows():
        venv_python_win = os.path.join(BACKEND_DIR, "venvw", "Scripts", "python.exe")
        venv_python_bin = os.path.join(BACKEND_DIR, "venv", "bin", "python")
        
        if os.path.exists(venv_python_win):
            venv_python = venv_python_win
        elif os.path.exists(venv_python_bin):
            venv_python = venv_python_bin
        else:
            venv_python = sys.executable  # Fallback to current Python
        
        return subprocess.Popen(
            [venv_python, "-m", "uvicorn", "app.main:app", "--reload", "--host", "127.0.0.1", f"--port={BACKEND_PORT}"],
            cwd=BACKEND_DIR
        )
    else:
        return subprocess.Popen([
            "bash", "-c",
            f"cd {BACKEND_DIR} && source venv/bin/activate && uvicorn app.main:app --reload --host 127.0.0.1 --port {BACKEND_PORT}"
        ])

def start_frontend():
    """Start the Vite frontend development server."""
    print(f"🎨 Starting frontend on port {FRONTEND_PORT}...")
    
    if is_windows():
        return subprocess.Popen(
            ["npm", "run", "dev"],
            cwd=FRONTEND_DIR,
            shell=True
        )
    else:
        return subprocess.Popen([
            "bash", "-c",
            f"cd {FRONTEND_DIR} && npm run dev"
        ])

def open_browser():
    """Open the frontend in the default browser."""
    url = f"http://localhost:{FRONTEND_PORT}"
    
    # Skip opening browser if in WSL to avoid 'gio' errors
    if os.environ.get("WSL_DISTRO_NAME") or os.environ.get("WSL_INTEROP"):
        print(f"\n🌐 Running in WSL. Access the frontend at: {url}")
        return

    print(f"\n🌐 Opening {url} in browser...")
    
    if is_windows():
        try:
            subprocess.run(["cmd.exe", "/c", "start", url], check=False)
        except Exception:
            webbrowser.open(url)
    else:
        try:
            webbrowser.open(url)
        except Exception:
            pass

def main():
    print("=" * 50)
    print("    DIAGNOS AI — Platform Launcher v2.0")
    print("=" * 50)
    print(f"  Platform: {platform.system()}")
    print(f"  Python:   {sys.version.split()[0]}")
    print("=" * 50)
    
    # Clear ports
    print("\n📡 Clearing ports...")
    kill_port(BACKEND_PORT)
    kill_port(FRONTEND_PORT)
    time.sleep(1)
    
    # Start services
    backend = start_backend()
    time.sleep(4)
    
    frontend = start_frontend()
    time.sleep(5)
    
    open_browser()
    
    print("\n✅ Diagnos AI is running!")
    print(f"   Backend:  http://localhost:{BACKEND_PORT}")
    print(f"   Frontend: http://localhost:{FRONTEND_PORT}")
    print("\n   Press Ctrl+C to stop all services.\n")
    
    try:
        backend.wait()
    except KeyboardInterrupt:
        print("\n\n🛑 Shutting down...")
        backend.terminate()
        frontend.terminate()
        print("   Goodbye!")

if __name__ == "__main__":
    main()
