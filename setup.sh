#!/bin/bash

# CV Generator Project Setup Script

echo "🚀 Setting up CV Generator project..."

# Install dependencies for the main project
echo "📦 Installing main project dependencies..."
npm install

# Install dependencies for Firebase Functions
echo "📦 Installing Firebase Functions dependencies..."
cd functions
npm install
cd ..

# Create .env.local file from example if it doesn't exist
if [ ! -f .env.local ]; then
  echo "🔑 Creating .env.local file from template..."
  cp env.local.example .env.local
  echo "⚠️ Please update .env.local with your actual API keys and Firebase configuration"
fi

# Install Firebase CLI if not installed
if ! command -v firebase &> /dev/null; then
  echo "🔥 Installing Firebase CLI..."
  npm install -g firebase-tools
fi

# Ask for Firebase login
echo "🔑 Please login to Firebase (if not already logged in)..."
firebase login

# Check if logged in
if [ $? -ne 0 ]; then
  echo "❌ Firebase login failed. Please try again."
  exit 1
fi

# Ask for Firebase project ID
echo "📋 Please enter your Firebase project ID:"
read firebase_project_id

# Update .firebaserc with the provided project ID
echo "📝 Updating Firebase configuration..."
sed -i '' "s/\${FIREBASE_PROJECT_ID}/$firebase_project_id/g" .firebaserc

# Ask for OpenAI API key
echo "📋 Please enter your OpenAI API key:"
read openai_api_key

# Update .env.local with the OpenAI API key
sed -i '' "s/your_openai_api_key/$openai_api_key/g" .env.local

echo "✅ Setup completed successfully!"
echo ""
echo "Next steps:"
echo "1. Update .env.local with your complete Firebase configuration"
echo "2. Run 'npm run dev' to start the development server"
echo "3. Run 'firebase deploy' to deploy the application to Firebase"
echo ""
echo "Happy coding! 🎉"