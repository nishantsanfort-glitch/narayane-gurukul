@echo off
title Narayan e-Gurukul - Node.js Auto-Installer & Server Starter
color 0B
echo =====================================================================
echo    🚀 Narayan e-Gurukul - Node.js Auto-Installer ^& Server Starter
echo =====================================================================
echo.
echo This file will download, install Node.js, install server dependencies,
echo and automatically start your database server with a single click.
echo.

:: Check if Node is already installed
where node >nul 2>nul
if %errorlevel%==0 (
    echo [OK] Node.js is already installed on your system!
    goto start_server
)

echo 📥 [1/3] Downloading official Node.js v20 LTS Installer...
echo.
powershell -Command "[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12; Invoke-WebRequest -Uri 'https://nodejs.org/dist/v20.13.1/node-v20.13.1-x64.msi' -OutFile '%TEMP%\node-install.msi'"

if not exist "%TEMP%\node-install.msi" (
    echo [ERROR] Failed to download the installer. Please check your internet connection.
    pause
    exit /b
)

echo 🚀 [2/3] Launching Node.js Setup Window...
echo.
echo Please follow the prompts in the installer window that just appeared,
echo click "Next", accept the defaults, and finish the installation.
echo.
echo Once the installer closes, return here and press any key to continue...
echo.
msiexec.exe /i "%TEMP%\node-install.msi"
pause

:: Clean up downloaded installer
del "%TEMP%\node-install.msi"

echo.
echo =====================================================================
echo ✅ Node.js has been installed successfully!
echo.
echo Windows requires a fresh console session to recognize the new command path.
echo.
echo PLEASE CLOSE THIS WINDOW AND DOUBLE-CLICK 'SetupNode.bat' AGAIN
echo to automatically run your database and launch the website server!
echo =====================================================================
echo.
pause
exit

:start_server
echo.
echo 📦 [1/2] Installing backend database server packages (npm install)...
echo.
call npm install
echo.
echo 📡 [2/2] Starting server (npm start)...
echo.
call npm start
pause
