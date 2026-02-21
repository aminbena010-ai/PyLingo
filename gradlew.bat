@echo off
setlocal

REM Fallback wrapper for Appflow/Windows when root gradlew is requested.
call "%~dp0android\gradlew.bat" %*
exit /b %ERRORLEVEL%
