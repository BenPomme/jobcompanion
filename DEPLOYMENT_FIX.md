# Fixing Deployment Issues with Next.js on Firebase

This document outlines the issues encountered when deploying the CV & Cover Letter Generator application to Firebase and the solutions implemented.

## Issues Identified

1. **Node.js Version Incompatibility**
   - Firebase Functions requires Node.js 18
   - Local development was using Node.js 23.10.0
   - Deployment script was failing due to version mismatch

2. **Next.js Static Export Configuration**
   - The application was configured for server-side rendering
   - Firebase Hosting works best with static exports for Next.js
   - API routes needed special handling

3. **Firebase Hosting Configuration**
   - Incorrect configuration for static site hosting
   - Needed proper rewrites for API functions
   - Missing optimization settings

4. **Firebase Functions Structure**
   - The `nextjsServer` function was not compatible with static export
   - API routes needed to be handled differently

## Solutions Implemented

### 1. Updated Node.js Version Handling

Modified the `deploy.sh` script to automatically use Node.js 18:

```bash
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
```

### 2. Configured Next.js for Static Export

Updated `next.config.js` to use static export:

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Use static export for easier deployment to Firebase hosting
  output: 'export',
  // Optimize for Firebase hosting
  images: {
    unoptimized: true,
  },
  // Static exports don't support API routes, they will be handled by Firebase Functions
};

module.exports = nextConfig;
```

### 3. Updated Firebase Hosting Configuration

Modified `firebase.json` for optimal static hosting:

```json
"hosting": {
  "public": "out",
  "ignore": [
    "firebase.json",
    "**/.*",
    "**/node_modules/**",
    "functions/**"
  ],
  "cleanUrls": true,
  "trailingSlash": false,
  "rewrites": [
    {
      "source": "/api/**",
      "function": "api"
    }
  ],
  "headers": [
    {
      "source": "**/*.@(jpg|jpeg|gif|png|svg|webp|js|css|eot|otf|ttf|ttc|woff|woff2|font.css)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "max-age=604800"
        }
      ]
    }
  ],
  "redirects": [
    {
      "source": "/index.html",
      "destination": "/",
      "type": 301
    }
  ]
}
```

### 4. Refactored Firebase Functions

Changed the Firebase Functions structure to create a dedicated API handler:

```javascript
/**
 * API handler function for all API routes
 * This replaces the nextjsServer function for our static export
 */
exports.api = functions.https.onRequest((req, res) => {
  cors(req, res, () => {
    // Route based on the path
    const path = req.path.replace(/^\/api/, ''); // Remove the /api prefix

    // Handle different API routes
    if (path === '/linkedin/auth' && req.method === 'GET') {
      // LinkedIn auth logic
    } else if (path === '/linkedin/callback' && req.method === 'POST') {
      // LinkedIn callback logic
    } else if (path === '/generate' && req.method === 'POST') {
      // Document generation logic
    } else if (path === '/parse-cv' && req.method === 'POST') {
      // CV parsing logic
    } else {
      // Not found
      return res.status(404).json({ error: 'API route not found' });
    }
  });
});
```

## Deployment Steps

1. **Switch to Node.js 18**:
   ```bash
   nvm use 18
   ```

2. **Build the Next.js application with static export**:
   ```bash
   npm run build
   ```
   This creates the `out` directory with static files.

3. **Delete old functions if necessary**:
   ```bash
   firebase functions:delete nextjsServer --region us-central1 --force
   ```

4. **Deploy to Firebase**:
   ```bash
   firebase deploy
   ```

## Remaining Issues

1. **Client-side Hydration**:
   - The application currently has hydration issues
   - Components render on the server but don't properly hydrate on the client
   - This causes functionality (buttons, forms, etc.) to not work

2. **API Communication**:
   - Static export means API routes need special handling
   - Client-side code needs updating to communicate with Firebase Functions

3. **Environment Variables**:
   - Some environment variables may not be properly accessible in the client build

## Next Steps

1. Fix client-side hydration issues
2. Update API communication methods
3. Implement UI improvements to match LinkedIn style
4. Ensure proper error handling and user feedback