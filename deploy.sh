#!/bin/bash

# FamTree Backend Vercel Deployment Script

echo "🚀 Starting FamTree Backend Deployment to Vercel..."

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI is not installed. Installing..."
    npm install -g vercel
fi

# Check if user is logged in to Vercel
if ! vercel whoami &> /dev/null; then
    echo "❌ Not logged in to Vercel. Please login first:"
    echo "   vercel login"
    exit 1
fi

# Check if .env file exists
if [ ! -f .env ]; then
    echo "⚠️  Warning: .env file not found. Make sure to set environment variables in Vercel dashboard."
fi

# Deploy to Vercel
echo "📦 Deploying to Vercel..."
vercel --prod

echo "✅ Deployment completed!"
echo "🔗 Your API will be available at: https://your-project-name.vercel.app"
echo "📋 Don't forget to:"
echo "   1. Set environment variables in Vercel dashboard"
echo "   2. Configure MongoDB Atlas connection"
echo "   3. Test your API endpoints" 