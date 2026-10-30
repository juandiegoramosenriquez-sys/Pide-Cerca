@echo off
title PideCerca - Web
set "CARPETA=%~dp0frontend"
pushd "%CARPETA%"
if not exist "%CARPETA%\node_modules" call npm install
echo Encendiendo la web de PideCerca... abre http://localhost:5173
echo En tu celular (mismo WiFi) abre la direccion "Network" que aparece abajo
call npm run dev -- --host
popd
pause
