@echo off
title PideCerca - Web
cd /d "%~dp0frontend"
if not exist node_modules call npm install
echo Encendiendo la web de PideCerca... abre http://localhost:5173
call npm run dev
pause
