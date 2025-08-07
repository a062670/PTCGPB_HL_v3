@echo off
echo 🎮 Switching to Account 1...
node ..\scripts\switch-account.js 0
echo.
echo 🚀 Starting bot for Account 1...
node ..\approve.js
pause
