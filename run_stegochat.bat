@echo off
TITLE StegoChat Launcher
CLS

ECHO ========================================================
ECHO                 STEGOCHAT LAUNCHER
ECHO ========================================================
ECHO.

:: 1. Launch Backend
ECHO [1/2] Starting Backend Server...
start "StegoChat Backend" cmd /k "python backend/server.py"

:: Wait for backend to warm up
ECHO        Waiting for backend to initialize...
timeout /t 5 /nobreak >nul

:: 2. Launch Frontend
ECHO [2/2] Starting Frontend...
cd frontend
start "StegoChat Frontend" cmd /k "npm run dev"

ECHO.
ECHO ========================================================
ECHO             ALL SERVICES STARTED
ECHO ========================================================
ECHO.
ECHO  * Frontend Interface:  http://localhost:5173
ECHO  * Backend API:         http://localhost:5000
ECHO.
ECHO  (Close the opened terminal windows to stop the servers)
ECHO.
PAUSE
