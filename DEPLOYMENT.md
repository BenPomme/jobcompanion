# Deployment Guide for CV & Cover Letter Generator

This document provides detailed instructions for deploying the CV & Cover Letter Generator application to Firebase.

## Prerequisites

- Node.js 18 (required by Firebase)
- Firebase CLI installed globally (`npm install -g firebase-tools`)
- Firebase account with a created project (`cvjob-3a4ed`)
- LinkedIn Developer account with configured application
- OpenAI API key

## Initial Setup

1. **Clone the repository**:
   ```bash
   git clone https://github.com/BenPomme/jobcompanion.git
   cd jobcompanion
   ```

2. **Set Node.js version**:
   ```bash
   # If using nvm (recommended)
   nvm use 18
   
   # Verify the version
   node -v  # Should show v18.x.x
   ```

3. **Install dependencies**:
   ```bash
   npm install
   
   # Also install functions dependencies
   cd functions
   npm install
   cd ..
   ```

4. **Configure environment variables**:
   Create a `.env.local` file with the following:
   ```
   # Firebase Config
   NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyBCbiDsPDHWsNJZOoHxaAGGOLBR8-feKqc
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=cvjob-3a4ed.firebaseapp.com
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=cvjob-3a4ed
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=cvjob-3a4ed.firebasestorage.app
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=862516684618
   NEXT_PUBLIC_FIREBASE_APP_ID=1:862516684618:web:77c1968f0fc33d88e0c3b3
   NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=G-JC69DM0NX6
   
   # OpenAI Config
   OPENAI_API_KEY=your_openai_api_key
   
   # LinkedIn Config
   LINKEDIN_CLIENT_ID=your_linkedin_client_id
   LINKEDIN_CLIENT_SECRET=your_linkedin_client_secret
   LINKEDIN_REDIRECT_URI=https://cvjob-3a4ed.web.app/api/linkedin/callback
   
   # Document Generation
   MAX_CV_LENGTH=3000
   MAX_COVER_LETTER_LENGTH=2000
   ```

5. **Login to Firebase**:
   ```bash
   firebase login
   ```

6. **Set Firebase project**:
   ```bash
   firebase use cvjob-3a4ed
   ```

## Deployment

### Automatic Deployment

Use the provided deployment script:

```bash
# Make sure you're using Node.js 18
nvm use 18

# Run the deployment script
./deploy.sh
```

### Manual Deployment

If the script doesn't work for you, follow these steps:

1. **Build the Next.js application**:
   ```bash
   npm run build
   ```

2. **Set up Firebase Function configuration**:
   ```bash
   # OpenAI API key
   firebase functions:config:set openai.apikey="your_openai_api_key"
   
   # LinkedIn configuration
   firebase functions:config:set linkedin.client_id="your_linkedin_client_id"
   firebase functions:config:set linkedin.client_secret="your_linkedin_client_secret"
   firebase functions:config:set linkedin.redirect_uri="https://cvjob-3a4ed.web.app/api/linkedin/callback"
   ```

3. **Deploy to Firebase**:
   ```bash
   firebase deploy
   ```

## LinkedIn Configuration

1. Go to [LinkedIn Developer Portal](https://developer.linkedin.com/)
2. Navigate to your app settings
3. In the Auth tab, add the redirect URL:
   ```
   https://cvjob-3a4ed.web.app/api/linkedin/callback
   ```
4. Make sure the app has the following OAuth 2.0 scopes:
   - r_liteprofile
   - r_emailaddress (if available)

## Troubleshooting

### Common Issues

1. **Node.js version conflicts**:
   - Make sure you're using Node.js 18
   - If you have NVM, use `nvm use 18`

2. **Deployment timeouts**:
   - Try deploying functions and hosting separately:
     ```bash
     firebase deploy --only functions
     firebase deploy --only hosting
     ```

3. **LinkedIn integration issues**:
   - Verify the redirect URL in LinkedIn Developer Portal
   - Check that the client ID and secret are correct
   - Ensure the scope matches what your app is allowed to access

4. **OpenAI API key issues**:
   - Verify the key in Firebase Functions config
   - Check for rate limit errors in logs

### Deployment Logs

To view logs for troubleshooting:

```bash
# Cloud Functions logs
firebase functions:log

# Hosting deployment logs
firebase hosting:clone
```

## Monitoring

Monitor your application after deployment:

1. **Firebase Console**:
   - https://console.firebase.google.com/project/cvjob-3a4ed

2. **Application URL**:
   - https://cvjob-3a4ed.web.app

3. **Firebase Analytics**:
   - Monitor user behavior in the Firebase console

## CI/CD Integration

For continuous deployment, set up a GitHub Actions workflow:

1. Add Firebase service account credentials to GitHub secrets
2. Configure the workflow to deploy on push to main
3. Use the same Node.js version (18) in the workflow

A sample workflow file is provided in `.github/workflows/firebase-deploy.yml`