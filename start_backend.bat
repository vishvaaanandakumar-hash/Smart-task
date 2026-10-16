@echo off
title SmartTask Backend (FastAPI)
echo ========================================================
echo Starting SmartTask Backend Server (FastAPI + SQLite)
echo URL: http://localhost:8000
echo API Docs: http://localhost:8000/docs
echo ========================================================
cd /d "%~dp0backend"
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
pause
