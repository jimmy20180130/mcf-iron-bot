@echo off
cls
echo bot will restart when it crashes
title Jimmy Bot
:StartServer
start /wait ./mcf-iron-bot
echo (%time%) bot is offline! restarting the bot...
goto StartServer