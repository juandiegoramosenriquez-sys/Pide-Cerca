@echo off
title PideCerca - Ver en el celular por cable
set "ADB=%LOCALAPPDATA%\Android\Sdk\platform-tools\adb.exe"
if not exist "%ADB%" (
  echo No se encontro adb. Instala Android Studio o las "platform-tools" de Android.
  pause
  exit /b
)
"%ADB%" start-server >nul
echo Conecta tu celular por cable USB con la "Depuracion USB" activada.
echo Si en el celular aparece "Permitir depuracion USB", toca Permitir.
echo Esperando el celular...
"%ADB%" wait-for-device
"%ADB%" reverse tcp:5173 tcp:5173
"%ADB%" reverse tcp:8080 tcp:8080
echo.
echo Listo. En el Chrome de tu celular abre:  http://localhost:5173
echo (Deja abiertos tambien el backend y la web)
pause
