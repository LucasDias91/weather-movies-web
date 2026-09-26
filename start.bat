@echo off
setlocal
cd /d "%~dp0"

if not exist "node_modules" (
  echo Installing npm dependencies...
  npm install
  if errorlevel 1 (
    echo Failed to install dependencies.
    pause
    exit /b 1
  )
)

echo Starting CineClima at http://127.0.0.1:4200
start "" cmd /c "timeout /t 6 /nobreak >nul 2>&1 & start http://127.0.0.1:4200"
npx ng serve --host 127.0.0.1 --port 4200
pause
