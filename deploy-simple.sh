#!/bin/bash

echo "🚀 Deploying Simplified FamTree Backend to Vercel..."

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI is not installed. Installing..."
    npm install -g vercel
fi

# Check if logged in to Vercel
if ! vercel whoami &> /dev/null; then
    echo "❌ Not logged in to Vercel. Please login first:"
    echo "   vercel login"
    exit 1
fi

echo "📦 Deploying simplified serverless function..."
vercel --prod

echo "✅ Deployment completed!"
echo ""
echo "🧪 Test these endpoints:"
echo "   - Health: https://your-project.vercel.app/health"
echo "   - Test: https://your-project.vercel.app/test"
echo "   - API Info: https://your-project.vercel.app/api"
echo "   - Auth Register: https://your-project.vercel.app/api/auth/register"
echo "   - Auth Signin: https://your-project.vercel.app/api/auth/signin"
echo ""
echo "📋 This is a simplified version without database connection."
echo "   It will respond to all requests but won't store data."
echo "   Once this works, we can add database functionality back." 