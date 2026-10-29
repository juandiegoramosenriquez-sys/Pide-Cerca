@echo off
title PideCerca - Web
set "CARPETA=%~dp0frontend"
pushd "%CARPETA%"
if not exist "%CARPETA%\node_modules" call npm install
echo Encendiendo la web de PideCerca... abre http://localhost:5173
call npm run dev
popd
pause
