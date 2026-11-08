@echo off
echo Building Titan for Windows with GUI flags...
echo.

REM Build the application with Windows GUI flags to prevent console window
wails build -ldflags="-w -s -H windowsgui"

if %ERRORLEVEL% EQU 0 (
    echo.
    echo Build completed successfully!
    echo Executable: build\bin\Titan.exe
) else (
    echo.
    echo Build failed with error code %ERRORLEVEL%
    exit /b %ERRORLEVEL%
)

pause