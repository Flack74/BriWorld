#!/bin/bash

echo "🔨 Building React frontend..."

cd frontend

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Build the React app
echo "🏗️ Building React app..."
npm run build

echo "✅ Frontend build complete!"
echo "📁 Built files are in ../web-dist/"

cd ..