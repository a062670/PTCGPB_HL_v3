@echo off
echo 🎮 Switching to Account 2...
node ..\scripts\switch-account.js 1
echo.
echo 🚀 Starting bot for Account 2...
node ..\approve.js
pause
