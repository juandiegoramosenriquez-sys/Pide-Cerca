@echo off
setlocal enabledelayedexpansion
title PideCerca - Copia de seguridad

set "RAIZ=%~dp0"
set "SECRETOS=%RAIZ%backend\secrets.properties"
set "CARPETA=%RAIZ%respaldos"
set "DB_HOST=localhost"
set "DB_PORT=3306"
set "DB_NAME=pide_cerca_db"
set "DB_USERNAME=root"
set "DB_PASSWORD="
set "GUARDAR=14"

if not exist "%SECRETOS%" (
  echo No encuentro backend\secrets.properties
  pause
  exit /b 1
)

for /f "usebackq tokens=1,* delims==" %%A in (`findstr /b /c:"DB_" "%SECRETOS%"`) do set "%%A=%%B"

set "MYSQLDUMP="
for /d %%D in ("C:\Program Files\MySQL\MySQL Server *") do if exist "%%D\bin\mysqldump.exe" set "MYSQLDUMP=%%D\bin\mysqldump.exe"
if not defined MYSQLDUMP (
  for /f "delims=" %%P in ('where mysqldump 2^>nul') do set "MYSQLDUMP=%%P"
)
if not defined MYSQLDUMP (
  echo No encuentro mysqldump. Instala MySQL Server o agrega su carpeta bin al PATH.
  pause
  exit /b 1
)

if not exist "%CARPETA%" mkdir "%CARPETA%"

for /f "delims=" %%F in ('powershell -NoProfile -Command "Get-Date -Format yyyy-MM-dd_HH-mm"') do set "FECHA=%%F"
set "ARCHIVO=%CARPETA%\pidecerca_%FECHA%.sql"

echo Guardando la base de datos %DB_NAME%...
set "MYSQL_PWD=%DB_PASSWORD%"
"%MYSQLDUMP%" --host=%DB_HOST% --port=%DB_PORT% --user=%DB_USERNAME% --single-transaction --no-tablespaces --routines --default-character-set=utf8mb4 --result-file="%ARCHIVO%" %DB_NAME%
set "RESULTADO=%ERRORLEVEL%"
set "MYSQL_PWD="

if not "%RESULTADO%"=="0" (
  echo.
  echo La copia fallo. Revisa que MySQL este encendido y que la clave en secrets.properties sea correcta.
  if exist "%ARCHIVO%" del "%ARCHIVO%"
  pause
  exit /b 1
)

echo.
echo Listo: %ARCHIVO%

powershell -NoProfile -Command "Get-ChildItem -Path '%CARPETA%' -Filter 'pidecerca_*.sql' | Sort-Object LastWriteTime -Descending | Select-Object -Skip %GUARDAR% | Remove-Item -Force"
echo Se guardan las ultimas %GUARDAR% copias.
echo.
pause
