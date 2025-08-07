@echo off
echo 🎮 Starting Pokemon TCG Bot for ALL accounts...
echo.

REM Check if Node.js is installed
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Error: Node.js is not installed or not in PATH
    echo Please install Node.js and try again.
    pause
    exit /b 1
)

REM Check if config file exists
if not exist "..\config\main.json" (
    echo ❌ Error: config\main.json not found
    echo Please copy config\main.json.example to config\main.json and configure your accounts.
    pause
    exit /b 1
)

echo 📋 Loading account configuration...
node ..\scripts\list-accounts.js

echo.
echo 🚀 Starting bot for all accounts...
echo ⚠️  Note: This will run all accounts simultaneously
echo.
echo Press Ctrl+C to stop all bots
echo.

REM Start the bot in multi-account mode
node ..\approve.js --all

pause
