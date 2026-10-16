@echo off
title SmartTask Fullstack Web Launcher
echo ========================================================
echo Starting SmartTask Fullstack Productivity Web Platform
echo Backend:  FastAPI Python (Port 8000)
echo Frontend: Vite + React + Leaflet + 3D (Port 5173)
echo ========================================================
start "SmartTask Backend (FastAPI)" cmd /k "cd /d "%~dp0backend" && python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload"
timeout /t 3 /nobreak >nul
start "SmartTask Frontend (Vite)" cmd /k "cd /d "%~dp0frontend" && npm run dev"
echo Both servers launched in dedicated windows!
