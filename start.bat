@echo off
title Panruti Cashews - Full Stack App
color 0A

echo.
echo  ==========================================
echo   Panruti Premium Cashews - Starting App
echo  ==========================================
echo.

:: Check if Node is installed
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo  [ERROR] Node.js not found. Install from https://nodejs.org
    pause & exit
)

:: Check if Python is installed
where python >nul 2>&1
if %errorlevel% neq 0 (
    echo  [ERROR] Python not found. Install from https://python.org
    pause & exit
)

echo  [1/3] Starting AI Service on port 8000...
start "AI Service - FastAPI" cmd /k "cd /d k:\ccc\ai-service && uvicorn main:app --host 0.0.0.0 --port 8000"

timeout /t 3 /nobreak >nul

echo  [2/3] Starting Backend Server on port 5000...
start "Backend - Node.js" cmd /k "cd /d k:\ccc\backend && node server.js"

timeout /t 3 /nobreak >nul

echo  [3/3] Opening app in browser...
timeout /t 2 /nobreak >nul
start http://localhost:5000

echo.
echo  ==========================================
echo   App is running!
echo.
echo   Frontend  : http://localhost:5000
echo   Admin     : http://localhost:5000/admin/
echo   Farmer    : http://localhost:5000/farmer/
echo   Customer  : http://localhost:5000/customer/
echo   AI API    : http://localhost:8000
echo   API Docs  : http://localhost:8000/docs
echo.
echo   Admin Login:
echo   Email    : admin@panruti.com
echo   Password : admin123
echo  ==========================================
echo.
echo  Close this window to keep servers running.
echo  Close the other 2 windows to stop servers.
echo.
pause
