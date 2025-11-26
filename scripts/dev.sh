#!/bin/bash

# Development server starter for Dandori Portal
# This script ensures DATABASE_URL from .env.local is used
# by unsetting any OS-level DATABASE_URL before starting Next.js

# Unset OS-level DATABASE_URL to allow .env.local to take precedence
unset DATABASE_URL

# Clear any old database URL from environment
echo "🔧 Starting Dandori Portal development server..."
echo "   Using DATABASE_URL from .env.local"

# Start Next.js development server
exec npm run dev
