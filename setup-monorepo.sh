#!/bin/bash
# ==============================================================================
# MyProdigy Monorepo Initialization Script
# ==============================================================================
set -e

echo "🚀 Initializing MyProdigy Monorepo..."

# 1. Create Monorepo Layout
echo "📁 Creating directory layout..."
mkdir -p backend/cmd/server \
         backend/internal/repository \
         backend/internal/service \
         backend/internal/handlers \
         backend/internal/models \
         backend/migrations \
         frontend \
         shared

# 2. Copy environment configuration
echo "🔑 Preparing environment variables..."
if [ ! -f .env ]; then
    if [ -f .env.example ]; then
        cp .env.example .env
        echo "✅ Created .env from .env.example"
    else
        echo "⚠️ .env.example not found!"
    fi
else
    echo "ℹ️ .env already exists, skipping copy"
fi

echo "🎉 Monorepo initialization complete!"
echo "👉 To start the environment in development, run: docker-compose up --build"
