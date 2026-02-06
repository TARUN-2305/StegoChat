@echo off
TITLE StegoChat Launcher
CLS

ECHO ========================================================
ECHO                 STEGOCHAT LAUNCHER
ECHO ========================================================
ECHO.

:: 1. Launch Backend
ECHO [1/2] Starting Backend Server (0.0.0.0)...
start "StegoChat Backend" cmd /k "python backend/server.py"

:: Wait for backend to warm up
ECHO        Waiting for backend to initialize...
timeout /t 5 /nobreak >nul

:: 2. Launch Frontend
ECHO [2/2] Starting Frontend (Hosted)...
cd frontend
start "StegoChat Frontend" cmd /k "npm run dev -- --host"

ECHO.
ECHO ========================================================
ECHO             ALL SERVICES STARTED
ECHO ========================================================
ECHO.
ECHO  * Local Access:        http://localhost:5173
ECHO  * Network Access:      http://YOUR_IP_ADDRESS:5173
ECHO.
ECHO  (Close the opened terminal windows to stop the servers)
ECHO.
PAUSE
