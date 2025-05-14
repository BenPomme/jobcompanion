# Deployment Guide for CV & Cover Letter Generator

This document outlines the steps needed to fully deploy the CV & Cover Letter Generator application to production.

## Prerequisites

Before deployment, ensure you have:

1. A Firebase account
2. An OpenAI API key
3. A LinkedIn Developer account (for LinkedIn integration)
4. A GitHub account (optional, for CI/CD)
5. Node.js (version 18+) and npm installed

## Step 1: Project Setup

1. Clone the repository (if using GitHub):
   ```bash
   git clone <repository-url>
   cd cv-project
   ```

2. Run the setup script:
   ```bash
   ./setup.sh
   ```
   
   This script will:
   - Install dependencies for the main project and Firebase Functions
   - Guide you through Firebase login
   - Create a `.env.local` file from the template
   - Update configuration with your Firebase project ID and OpenAI API key

3. Manually update the remaining environment variables in `.env.local`:
   - Firebase configuration details
   - LinkedIn API credentials

## Step 2: Create Firebase Project

1. Go to the [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project" and follow the setup wizard
3. Enable the required services:
   - Authentication (Email/Password and Google providers)
   - Firestore Database
   - Storage
   - Functions
   - Hosting

4. Obtain Firebase configuration from Project Settings > Your Apps > Web app

## Step 3: Configure OpenAI API

1. Ensure your OpenAI API key is set in the Firebase Functions environment:
   ```bash
   firebase functions:config:set openai.api_key="your_openai_api_key"
   ```

2. Deploy the environment variables:
   ```bash
   firebase deploy --only functions
   ```

## Step 4: Set Up LinkedIn API (Optional)

1. Create a LinkedIn Developer application
2. Configure the OAuth redirect URLs:
   - For local development: `http://localhost:3000/api/linkedin/callback`
   - For production: `https://<your-firebase-app>.web.app/api/linkedin/callback`
3. Add the LinkedIn Client ID and Secret to your `.env.local` file
4. Update the Firebase Functions configuration:
   ```bash
   firebase functions:config:set linkedin.client_id="your_linkedin_client_id" linkedin.client_secret="your_linkedin_client_secret" linkedin.redirect_uri="https://<your-firebase-app>.web.app/api/linkedin/callback"
   ```

## Step 5: Full Deployment

1. Build the Next.js application:
   ```bash
   npm run build
   ```

2. Deploy to Firebase:
   ```bash
   firebase deploy
   ```

   This will deploy:
   - Hosting: The Next.js application
   - Functions: The OpenAI API integration and other server functions
   - Firestore Rules: Security rules for database
   - Storage Rules: Security rules for file storage

3. Access your deployed application at:
   ```
   https://<your-firebase-app>.web.app
   ```

## Step 6: Set Up CI/CD with GitHub (Optional)

1. Push your code to a GitHub repository
2. Set up GitHub secrets in your repository settings:
   - `FIREBASE_SERVICE_ACCOUNT`: Your Firebase service account JSON (generate in Firebase Console > Project Settings > Service Accounts)
   - `FIREBASE_PROJECT_ID`: Your Firebase project ID

3. The GitHub workflow will automatically deploy your application whenever changes are pushed to the main branch

## Step 7: Domain Configuration (Optional)

1. Purchase a domain name
2. Configure custom domain in Firebase Hosting:
   ```
   Firebase Console > Hosting > Add custom domain
   ```
3. Follow the DNS configuration instructions

## Step 8: Usage Monitoring

1. Set up Firebase budget alerts to monitor OpenAI API costs:
   ```
   Firebase Console > Project Settings > Usage and Billing > Budgets & alerts
   ```

2. Monitor application usage through:
   - Firebase Analytics
   - Firestore usage collection
   - Firebase Functions logs

## Troubleshooting

If you encounter deployment issues:

1. Check Firebase Functions logs for errors:
   ```bash
   firebase functions:log
   ```

2. Verify environment variables are correctly set:
   ```bash
   firebase functions:config:get
   ```

3. For local testing, use Firebase emulators:
   ```bash
   firebase emulators:start
   ```

## Security Checklist

Before going live, ensure:

1. Firestore security rules are properly configured
2. Storage security rules are properly configured
3. API keys are stored securely in environment variables
4. Authentication is required for all sensitive operations
5. Rate limiting is implemented to prevent abuse