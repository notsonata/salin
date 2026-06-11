@echo off
setlocal

set "SCRIPT_DIR=%~dp0"

docker compose -f "%SCRIPT_DIR%infra\docker-compose.yml" up --build %*
set "EXIT_CODE=%ERRORLEVEL%"

exit /b %EXIT_CODE%
