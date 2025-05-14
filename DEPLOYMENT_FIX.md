# Firebase Deployment Fix Guide

This document outlines the step-by-step process to fix deployment issues with our Next.js application on Firebase.

## Issue Analysis

The deployment is failing due to several issues:

1. **Node.js Version Incompatibility**: Firebase Next.js integration requires Node.js 16-20, but we're using Node.js 23
2. **Next.js Framework Integration Issues**: Firebase's Next.js integration is in early preview
3. **Function Deployment Timeouts**: The cloud functions deployment is timing out
4. **Configuration Issues**: Several configuration issues with the Next.js and Firebase integration

## Step 1: Set Up Node Version Manager (NVM)

To switch between Node.js versions easily:

```bash
# Install NVM if not already installed
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash

# Reload shell configuration
source ~/.bashrc  # or source ~/.zshrc if using zsh

# Install Node.js 18 (LTS version compatible with Firebase)
nvm install 18

# Switch to Node.js 18
nvm use 18

# Verify the version
node -v  # Should show v18.x.x
```

## Step 2: Fix Next.js Configuration

Update the Next.js configuration to be compatible with Firebase:

1. Edit the `next.config.js` file:

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Add specific configuration for Firebase
  // Disable image optimization as it can cause issues with Firebase
  images: {
    unoptimized: true,
  },
  // Set output to export for static site generation
  output: 'export',
  // Disable server-side rendering for API routes
  // We'll use Firebase Functions for those
  experimental: {
    serverComponentsExternalPackages: [],
  }
};

module.exports = nextConfig;
```

2. Create a separate API functions setup in `/functions/index.js`:

```javascript
// Add all API functionality to Firebase Functions directly
// This separates the API from the Next.js frontend
```

## Step 3: Update Firebase Configuration

1. Update `firebase.json` to separate hosting and functions:

```json
{
  "hosting": {
    "public": "out",
    "ignore": [
      "firebase.json",
      "**/.*",
      "**/node_modules/**"
    ],
    "rewrites": [
      {
        "source": "/api/**",
        "function": "api"
      }
    ]
  },
  "functions": {
    "source": "functions",
    "runtime": "nodejs18"
  },
  "firestore": {
    "rules": "firestore.rules",
    "indexes": "firestore.indexes.json"
  },
  "storage": {
    "rules": "storage.rules"
  }
}
```

2. Create `.nvmrc` file to specify Node.js version:

```
18
```

## Step 4: Separate Frontend and API Functions

1. Move API functionality to Firebase Functions
2. Update client code to call Firebase Functions instead of Next.js API routes
3. Implement a streamlined build process

## Step 5: Create a Proper Deployment Script

Create a deployment script that handles the build and deployment process:

```bash
#!/bin/bash

# Ensure we're using the correct Node.js version
if command -v nvm &> /dev/null; then
    nvm use 18
fi

# Check if Node.js version is compatible
NODE_VERSION=$(node -v)
if [[ ! $NODE_VERSION =~ ^v18 ]]; then
    echo "Error: Node.js 18 is required for deployment. Current version: $NODE_VERSION"
    echo "Please install Node.js 18 using nvm: nvm install 18 && nvm use 18"
    exit 1
fi

# Clean build directories
rm -rf .next out

# Install dependencies
npm ci

# Build Next.js
npm run build

# Build and deploy functions first
cd functions
npm ci
cd ..

# Deploy to Firebase
firebase deploy --force
```

## Step 6: Update Environment Configuration

1. Set up environment variables for:
   - Production deployment
   - Functions
   - Next.js

2. Make sure sensitive variables are properly secured

## Step 7: Update LinkedIn Integration

1. Set the correct redirect URL for the production environment
2. Make sure all APIs use the correct hostnames

## Step 8: Testing the Deployment

1. Test locally:
   ```bash
   firebase emulators:start
   ```

2. Test deployment to a preview channel:
   ```bash
   firebase hosting:channel:deploy preview
   ```

3. Test full deployment:
   ```bash
   ./deploy.sh
   ```

## Step 9: Monitoring and Debugging

1. Set up Firebase Logging to catch errors
2. Set up monitoring for:
   - Functions execution
   - Authentication flows
   - API requests

## Step 10: Production Deployment

1. Final production deployment checklist
2. Verify all components are working
3. Set up a CI/CD pipeline for future deployments

## Common Issues and Solutions

- **Too many concurrent connections**: Adjust Firebase function limits
- **Memory limits**: Optimize API calls and memory usage
- **Cold start issues**: Set up appropriate warmup requests
- **CORS errors**: Configure CORS properly in Firebase Functions