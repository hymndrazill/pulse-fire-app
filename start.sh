#!/bin/bash

echo "Pulse Social Platform - Quick Start"
echo "======================================"
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "Node.js is not installed. Please install Node.js v18 or higher."
    exit 1
fi

echo "Node.js $(node --version) detected"
echo ""

# Check if MongoDB is running
if ! command -v mongosh &> /dev/null && ! command -v mongo &> /dev/null; then
    echo "MongoDB CLI not found. Make sure MongoDB is installed and running."
    echo "   You can also use MongoDB Atlas (cloud) instead."
    echo ""
fi

# Setup Backend
echo "Setting up Backend..."
cd server

if [ ! -f ".env" ]; then
    echo "Creating .env file from template..."
    cp .env.example .env
    echo "Please edit server/.env with your MongoDB URI and JWT secret"
fi

if [ ! -d "node_modules" ]; then
    echo "Installing backend dependencies..."
    npm install
else
    echo "Backend dependencies already installed"
fi

cd ..

# Setup Frontend
echo ""
echo "Setting up Frontend..."
cd client

if [ ! -d "node_modules" ]; then
    echo "Installing frontend dependencies..."
    npm install
else
    echo "Frontend dependencies already installed"
fi

cd ..

echo ""
echo "Setup complete!"
echo "To start the application:"
echo "1. Start the backend:"
echo "   cd server && npm run dev"
echo "2. In a new terminal, start the frontend:"
echo "   cd client && npm run dev"
echo "3. Open http://localhost:5173 in your browser"