#!/bin/bash

# Google Sheets to Display Cards - Development Server
# Usage: ./start.sh

echo "============================================"
echo "Google Sheets to Display Cards"
echo "============================================"
echo ""

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install
    echo ""
fi

echo ""
echo "Starting development server..."
echo "Open http://localhost:3001 in your browser"
echo ""
echo "Press Ctrl+C to stop the server"
echo "============================================"
echo ""

PORT=3001 npm run dev
