#!/bin/bash

# CV & Cover Letter Generator Deployment Script

echo "🚀 Starting deployment process..."

# Check if Firebase CLI is installed
if ! command -v firebase &> /dev/null; then
    echo "❌ Firebase CLI not found. Please install it with: npm install -g firebase-tools"
    exit 1
fi

# Check if user is logged in to Firebase
firebase projects:list &> /dev/null
if [ $? -ne 0 ]; then
    echo "🔑 Please login to Firebase:"
    firebase login
fi

# Build Next.js application
echo "🏗️ Building Next.js application..."
npm run build
if [ $? -ne 0 ]; then
    echo "❌ Build failed. Please fix errors and try again."
    exit 1
fi

# Deploy Firebase functions
echo "⚙️ Deploying Firebase functions..."
firebase deploy --only functions
if [ $? -ne 0 ]; then
    echo "❌ Function deployment failed."
    exit 1
fi

# Deploy Firestore rules
echo "📝 Deploying Firestore rules..."
firebase deploy --only firestore:rules
if [ $? -ne 0 ]; then
    echo "❌ Firestore rules deployment failed."
    exit 1
fi

# Deploy Storage rules
echo "📦 Deploying Storage rules..."
firebase deploy --only storage:rules
if [ $? -ne 0 ]; then
    echo "❌ Storage rules deployment failed."
    exit 1
fi

# Deploy hosting
echo "🌐 Deploying hosting..."
firebase deploy --only hosting
if [ $? -ne 0 ]; then
    echo "❌ Hosting deployment failed."
    exit 1
fi

echo "✅ Deployment complete! Your application is now live."
echo "📊 Visit the Firebase console to monitor your application: https://console.firebase.google.com/project/cvjob-3a4ed"