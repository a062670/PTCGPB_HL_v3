#!/bin/bash

# PTCGPB_HL_v3 Bot Startup Script (Unix/Linux/macOS)
echo "Starting PTCGPB_HL_v3 Bot..."
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "ERROR: Node.js is not installed or not in PATH"
    echo "Please install Node.js 22.2.0 or later"
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "ERROR: npm is not installed or not in PATH"
    echo "Please install npm"
    exit 1
fi

# Display versions
echo "Node.js version: $(node --version)"
echo "npm version: $(npm --version)"
echo ""

# Check if package.json exists
if [ ! -f "package.json" ]; then
    echo "ERROR: package.json not found"
    echo "Please run this script from the project root directory"
    exit 1
fi

echo "Installing dependencies..."
npm install
if [ $? -ne 0 ]; then
    echo "ERROR: Failed to install dependencies"
    exit 1
fi

echo ""
echo "Starting server..."
echo "The web interface will open automatically at http://localhost:9487/"
echo "Press Ctrl+C to stop the server"
echo ""

# Start the server
npm run start-server

echo ""
echo "Server stopped."
