@echo off
title SmartTask Frontend (React + Vite + Leaflet)
echo ========================================================
echo Starting SmartTask Frontend Client (Vite Dev Server)
echo Web App URL: http://localhost:5173
echo ========================================================
cd /d "%~dp0frontend"
npm run dev
pause
