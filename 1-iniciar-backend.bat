@echo off
title PideCerca - Backend
set "CARPETA=%~dp0backend"
if not defined JAVA_HOME if exist "%USERPROFILE%\.jdks\ms-21.0.12.1" set "JAVA_HOME=%USERPROFILE%\.jdks\ms-21.0.12.1"
pushd "%CARPETA%"
if not exist "%CARPETA%\target\tmp" mkdir "%CARPETA%\target\tmp"
echo Encendiendo el backend de PideCerca... espera a ver "Started BackendApplication"
call "%CARPETA%\mvnw.cmd" -f "%CARPETA%\pom.xml" spring-boot:run "-Dspring-boot.run.jvmArguments=-Djdk.net.unixdomain.tmpdir=%CARPETA%\target\tmp"
popd
pause
