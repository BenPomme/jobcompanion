#!/bin/bash

# Exit on any error
set -e

echo "🚀 Starting deployment process..."

# Force Node.js 18 via nvm
if [ -s "$HOME/.nvm/nvm.sh" ]; then
  source "$HOME/.nvm/nvm.sh"
  nvm use 18
  NODE_VERSION=$(node -v)
  if [[ ! $NODE_VERSION =~ ^v18 ]]; then
    echo "❌ Failed to switch to Node.js 18. Please manually run 'nvm use 18' and try again."
    exit 1
  fi
  echo "✅ Using Node.js $NODE_VERSION"
else
  NODE_VERSION=$(node -v)
  if [[ ! $NODE_VERSION =~ ^v18 ]]; then
    echo "❌ Node.js 18 is required but found $NODE_VERSION"
    echo "Please install Node.js 18 or use nvm to switch versions"
    exit 1
  fi
  echo "✅ Using Node.js $NODE_VERSION"
fi

# Check if Firebase CLI is installed
if ! command -v firebase &> /dev/null; then
    echo "❌ Firebase CLI not found. Please install it with: npm install -g firebase-tools"
    exit 1
fi

# Log in to Firebase if needed
firebase projects:list &> /dev/null
if [ $? -ne 0 ]; then
    echo "🔑 Please login to Firebase:"
    firebase login
fi

# Ensure using the right Firebase project
echo "📋 Setting Firebase project..."
firebase use cvjob-3a4ed

# Clean build directories
echo "🧹 Cleaning build directories..."
rm -rf .next out

# Install frontend dependencies
echo "📦 Installing frontend dependencies..."
npm ci

# Build Next.js
echo "🏗️ Building Next.js application..."
npm run build

# Install and build functions
echo "⚙️ Setting up Firebase Functions..."
cd functions
npm ci
cd ..

# Update environment configs
echo "🔧 Setting up environment configurations..."
firebase functions:config:set openai.apikey="$(grep OPENAI_API_KEY .env.local | cut -d '=' -f2-)"
firebase functions:config:set linkedin.client_id="$(grep LINKEDIN_CLIENT_ID .env.local | cut -d '=' -f2-)"
firebase functions:config:set linkedin.client_secret="$(grep LINKEDIN_CLIENT_SECRET .env.local | cut -d '=' -f2-)"
firebase functions:config:set linkedin.redirect_uri="https://cvjob-3a4ed.web.app/api/linkedin/callback"

# Deploy to Firebase
echo "🚀 Deploying to Firebase..."
firebase deploy --force

echo "✅ Deployment complete! Your application is now live at https://cvjob-3a4ed.web.app"
echo "📝 Note: If you're seeing deployment issues, check the Firebase console and logs for details."