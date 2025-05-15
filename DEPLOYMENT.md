# Deployment Guide

This document consolidates deployment steps for the CV & Cover Letter Generator.

## Prerequisites
- Node.js >= 18 and npm installed
- Firebase CLI (v13+) configured (`npm install -g firebase-tools`)
- A Firebase project (e.g. `cvjob-3a4ed`)

## Local Setup
1. Install dependencies:

   ```bash
   npm install
   ```

2. Configure environment variables:

   ```bash
   cp env.local.example .env.local
   ```

3. Build the Next.js application:

   ```bash
   npm run build
   ```

## Firebase Functions
1. Navigate to the functions folder:

   ```bash
   cd functions
   npm install
   ```

2. Set the OpenAI API key in Firebase config:

   ```bash
   firebase functions:config:set openai.api_key="YOUR_API_KEY"
   ```

3. Deploy functions:

   ```bash
   firebase deploy --only functions
   ```

4. Return to the project root:

   ```bash
   cd ..
   ```

## Firebase Hosting
1. Deploy hosting:

   ```bash
   firebase deploy --only hosting
   ```

2. Verify the live site:

   https://cvjob-3a4ed.web.app

## Continuous Deployment
(Optional) Configure GitHub Actions in `.github/workflows/deploy.yml` to perform the above steps automatically on push to `main`.

## Troubleshooting
- View function logs: `firebase functions:log`
- Check hosting logs in Firebase Console
- Ensure CORS is properly configured in `functions/index.js` 