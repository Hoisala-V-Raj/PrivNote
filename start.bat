@echo off
REM PrivNote Local Startup Script for Windows

echo Starting PrivNote...

REM Check if SSL certificates exist
if not exist "ssl\cert.pem" (
    echo Generating SSL certificates...
    if not exist "ssl" mkdir ssl
    openssl genrsa -out ssl\key.pem 2048 2>nul
    openssl req -new -x509 -key ssl\key.pem -out ssl\cert.pem -days 365 -subj "/C=US/ST=State/L=City/O=Org/CN=localhost" 2>nul
    echo [OK] SSL certificates generated
) else (
    echo [OK] SSL certificates found
)

REM Start containers
echo Starting Docker containers...
docker-compose up -d

echo.
echo [OK] PrivNote is running!
echo   Access at: http://localhost:3000
echo.
echo To stop: docker-compose down
