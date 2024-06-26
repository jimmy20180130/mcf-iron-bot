@echo off
cls
echo bot will restart when it crashes
title Jimmy Bot

:: 檢查是否以系統管理員執行
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo Administrator permissions required. Please run as administrator.
    pause
    exit /b
)

:: 檢查是否安装了 Node.js
where node >nul 2>&1
if %errorLevel% neq 0 (
    echo Node.js is not installed. Installing Node.js...
    powershell -Command Invoke-WebRequest -Uri "https://nodejs.org/dist/v20.12.0/node-v20.12.0-x64.msi" -OutFile "$env:TEMP\node-v20.12.0-x64.msi"
    start /wait "%TEMP%\node-v20.12.0-x64.msi" /qn
    del "%TEMP%\node-v20.12.0-x64.msi"
) else (
    echo installed Node.js successfully
)

:: 如果 update.txt 不存在，就下載整個檔案
if not exist "%~dp0\update.txt" (
    echo file does not exist
    powershell -Command Invoke-WebRequest -Uri "https://github.com/jimmy20180130/mcf-iron-bot/archive/refs/heads/main.zip" -OutFile "$env:TEMP\bot.zip"
    move "%TEMP%\bot.zip" "%~dp0\bot.zip"
) else (
    echo file exists
)

:: 把下載下來的 zip 解壓縮
if exist "%~dp0\bot.zip" (
    echo Decompressing zip file...
    powershell -Command "Expand-Archive -Path '%~dp0\bot.zip' -DestinationPath '%~dp0'"
    del "%~dp0\bot.zip"
    echo file decompressed
) else (
    echo file decompressed
)

:: 安裝套件
echo Installing packages...
call npm i minecraft-data minecraft-protocol mineflayer prismarine-entity readline readline-sync silly-datetime moment-timezone
echo packages installed

:: exit
exit /b
