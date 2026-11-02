@echo off
setlocal enabledelayedexpansion
title PideCerca - Restaurar copia de seguridad

set "RAIZ=%~dp0"
set "SECRETOS=%RAIZ%backend\secrets.properties"
set "CARPETA=%RAIZ%respaldos"
set "DB_HOST=localhost"
set "DB_PORT=3306"
set "DB_NAME=pide_cerca_db"
set "DB_USERNAME=root"
set "DB_PASSWORD="

if not exist "%SECRETOS%" (
  echo No encuentro backend\secrets.properties
  pause
  exit /b 1
)

for /f "usebackq tokens=1,* delims==" %%A in (`findstr /b /c:"DB_" "%SECRETOS%"`) do set "%%A=%%B"

set "MYSQL="
for /d %%D in ("C:\Program Files\MySQL\MySQL Server *") do if exist "%%D\bin\mysql.exe" set "MYSQL=%%D\bin\mysql.exe"
if not defined MYSQL (
  for /f "delims=" %%P in ('where mysql 2^>nul') do set "MYSQL=%%P"
)
if not defined MYSQL (
  echo No encuentro mysql. Instala MySQL Server o agrega su carpeta bin al PATH.
  pause
  exit /b 1
)

if not exist "%CARPETA%\pidecerca_*.sql" (
  echo No hay copias en la carpeta respaldos.
  pause
  exit /b 1
)

echo Copias disponibles:
echo.
set "N=0"
for /f "delims=" %%F in ('dir /b /o-d "%CARPETA%\pidecerca_*.sql"') do (
  set /a N+=1
  set "COPIA!N!=%%F"
  echo   !N!. %%F
)
echo.
set /p "ELEGIDA=Escribe el numero de la copia que quieres restaurar: "
set "ARCHIVO=!COPIA%ELEGIDA%!"
if not defined ARCHIVO (
  echo Numero no valido.
  pause
  exit /b 1
)

echo.
echo ATENCION: esto reemplaza todos los datos actuales por los de %ARCHIVO%.
echo Cierra la ventana del backend antes de seguir.
set /p "SEGURO=Escribe SI para continuar: "
if /i not "%SEGURO%"=="SI" (
  echo Cancelado.
  pause
  exit /b 0
)

set "MYSQL_PWD=%DB_PASSWORD%"
"%MYSQL%" --host=%DB_HOST% --port=%DB_PORT% --user=%DB_USERNAME% --default-character-set=utf8mb4 -e "DROP DATABASE IF EXISTS %DB_NAME%; CREATE DATABASE %DB_NAME% CHARACTER SET utf8mb4;"
"%MYSQL%" --host=%DB_HOST% --port=%DB_PORT% --user=%DB_USERNAME% --default-character-set=utf8mb4 %DB_NAME% < "%CARPETA%\%ARCHIVO%"
set "RESULTADO=%ERRORLEVEL%"
set "MYSQL_PWD="

if not "%RESULTADO%"=="0" (
  echo.
  echo La restauracion fallo.
  pause
  exit /b 1
)

echo.
echo Listo. Ya puedes encender el backend otra vez.
pause
