@echo off
echo ============================================
echo   Soon Family Christmas Lucky Draw
echo   Starting Local Server...
echo ============================================
echo.

REM Try Python 3 first
where python >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    echo Starting server with Python...
    echo.
    echo Server running at: http://localhost:8080
    echo.
    echo Press Ctrl+C to stop the server
    echo ============================================
    echo.
    start http://localhost:8080
    python -m http.server 8080
    goto :end
)

REM Try Python 2
where python2 >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    echo Starting server with Python 2...
    echo.
    echo Server running at: http://localhost:8080
    echo.
    echo Press Ctrl+C to stop the server
    echo ============================================
    echo.
    start http://localhost:8080
    python2 -m SimpleHTTPServer 8080
    goto :end
)

REM If no Python, just open the HTML file directly
echo Python not found. Opening HTML file directly...
echo.
start index.html

:end
