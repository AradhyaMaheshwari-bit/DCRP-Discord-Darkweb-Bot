#!/bin/bash

# Darkweb Bot Setup Script for macOS/Linux

echo ""
echo "===================================="
echo "  Darkweb Bot Setup"
echo "===================================="
echo ""

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "Error: Node.js is not installed"
    echo "Please install Node.js 18+ from https://nodejs.org"
    exit 1
fi

echo "Node.js version: $(node --version)"
echo ""

# Create .env if it doesn't exist
if [ ! -f .env ]; then
    echo "[1/5] Creating .env from .env.example..."
    cp .env.example .env
    echo "WARNING: Please edit .env with your Discord token and database URL"
else
    echo "[1/5] .env already exists"
fi

echo "[2/5] Installing dependencies..."
npm install || exit 1

echo "[3/5] Compiling TypeScript..."
npm run build || exit 1

echo "[4/5] Setting up database..."
npm run db:generate || exit 1
npm run db:push || echo "Warning: Database push failed. Check your DATABASE_URL."

echo "[5/5] Deploying slash commands..."
npm run deploy-commands || echo "Warning: Command deployment failed. Run manually if needed."

echo ""
echo "===================================="
echo "  Setup Complete!"
echo "===================================="
echo ""
echo "Next steps:"
echo "1. Edit .env with your Discord token"
echo "2. Run: npm run dev"
echo "3. Or run: npm start"
echo ""
