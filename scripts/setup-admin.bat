@echo off
echo ========================================
echo   Setup Admin Staff Document
echo ========================================
echo.

REM Check if .env.local exists
if not exist ".env.local" (
    echo ERROR: .env.local not found!
    echo Please create .env.local with Firebase config first.
    echo See .env.example for template.
    pause
    exit /b 1
)

echo Firebase config found!
echo.
echo Please provide your Admin User UID:
echo (Find it in Firebase Console - Authentication - Users tab)
echo.
set /p ADMIN_UID="Enter Admin UID: "

if "%ADMIN_UID%"=="" (
    echo ERROR: UID cannot be empty!
    pause
    exit /b 1
)

echo.
echo Creating staff document with UID: %ADMIN_UID%
echo.

node scripts/create-admin-staff.js %ADMIN_UID%

pause
