@echo off
cd /d "%~dp0"

set /p MSG=Commit message: 
if "%MSG%"=="" (
  echo No message entered. Nothing was committed.
  pause
  exit /b 1
)

git add -A
git commit -m "%MSG%"
if errorlevel 1 (
  echo Nothing to commit, or the commit failed.
  pause
  exit /b 1
)

git push -u origin HEAD
pause