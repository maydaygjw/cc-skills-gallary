@echo off
setlocal enabledelayedexpansion

REM Marp Slide Maker - Package Skill Script
REM Creates a distributable .skill archive

set "SKILL_NAME=marp-slide-maker"
set "ARCHIVE_NAME=%SKILL_NAME%.skill"

echo Packaging Marp Slide Maker skill...

REM Check if PowerShell is available
powershell -Command "Get-Command Compress-Archive -errorAction SilentlyContinue" >nul 2>&1
if errorlevel 1 (
    echo Error: PowerShell is required to create the archive
    exit /b 1
)

REM Create archive excluding certain files
powershell -Command "Get-ChildItem -Path .\%SKILL_NAME%\* -Exclude 'node_modules', '*.skill', 'package-lock.json', '.git', '.github' | Compress-Archive -DestinationPath .\%ARCHIVE_NAME% -Force"

if errorlevel 1 (
    echo Error: Failed to create archive
    exit /b 1
)

echo.
echo Successfully created: %ARCHIVE_NAME%
echo Package size:
for %%A in (%ARCHIVE_NAME%) do echo %%~zA bytes

echo.
echo Package ready: %ARCHIVE_NAME%

endlocal