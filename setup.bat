@echo off
REM Darkweb Bot Setup Script for Windows

echo.
echo ====================================
echo   Darkweb Bot Setup
echo ====================================
echo.

REM Check Node.js
node --version >nul 2>&1
if errorlevel 1 (
    echo Error: Node.js is not installed or not in PATH
    echo Please install Node.js 18+ from https://nodejs.org
    pause
    exit /b 1
)

echo [1/5] Checking environment...
if not exist .env (
    echo Creating .env from .env.example...
    copy .env.example .env
    echo WARNING: Please edit .env with your Discord token and database URL
)

echo [2/5] Installing dependencies...
call npm install
if errorlevel 1 (
    echo Error: npm install failed
    pause
    exit /b 1
)

echo [3/5] Compiling TypeScript...
call npm run build
if errorlevel 1 (
    echo Error: TypeScript compilation failed
    pause
    exit /b 1
)

echo [4/5] Setting up database...
call npm run db:generate
if errorlevel 1 (
    echo Error: Prisma generate failed
    pause
    exit /b 1
)

call npm run db:push
if errorlevel 1 (
    echo Warning: Database push failed. Make sure your DATABASE_URL is correct.
)

echo [5/5] Deploying slash commands...
call npm run deploy-commands
if errorlevel 1 (
    echo Warning: Command deployment failed. You may need to run this manually.
)

echo.
echo ====================================
echo   Setup Complete!
echo ====================================
echo.
echo Next steps:
echo 1. Edit .env with your Discord token
echo 2. Run: npm run dev
echo 3. Or run: npm start
echo.
pause
