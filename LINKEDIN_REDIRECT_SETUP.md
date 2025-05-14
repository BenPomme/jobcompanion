# Setting Up LinkedIn API Redirect URLs

This guide provides step-by-step instructions for configuring the redirect URLs in your LinkedIn application.

## Accessing the LinkedIn Developer Portal

1. Go to [LinkedIn Developer Portal](https://developer.linkedin.com/)
2. Sign in with your LinkedIn account
3. Navigate to "My Apps" and select your JobCompanion application

## Setting Up Redirect URLs

### Step 1: Navigate to Auth Settings

1. In your app dashboard, click on the "Auth" tab in the left sidebar
2. Scroll down to the "OAuth 2.0 settings" section

### Step 2: Add Redirect URLs

1. Look for the "Authorized redirect URLs for your app" section
2. Click the "Add redirect URL" button
3. Enter the following URL for the public application:
   ```
   https://cvjob-3a4ed.web.app/api/linkedin/callback
   ```
4. Click "Add"

5. For local development, you can also add:
   ```
   http://localhost:3000/api/linkedin/callback
   ```

### Step 3: Save Changes

Make sure to save your changes by clicking the "Update" or "Save" button at the bottom of the page.

## Verifying the Redirect Settings

1. To verify your settings, go to the "Auth" tab again
2. Make sure your redirect URLs are listed in the "Authorized redirect URLs for your app" section
3. If not, add them again and save

## Testing the Redirect

1. Run your application locally:
   ```
   npm run dev
   ```
2. Navigate to the LinkedIn connection component
3. Click the "Connect with LinkedIn" button
4. You should be redirected to LinkedIn's authorization page
5. After granting permission, LinkedIn should redirect back to your app

## Troubleshooting

If you encounter a redirect error after authorizing:

1. Double-check that the exact URL in your `.env.local` file matches what's configured in the LinkedIn developer portal
2. Make sure there are no trailing slashes or other differences
3. Check for any error parameters in the redirect URL
4. Review your browser console for any CORS or other errors

## Production Considerations

When going to production:

1. Update your Firebase environment variables:
   ```bash
   firebase functions:config:set linkedin.redirect_uri="https://YOUR_DOMAIN.com/api/linkedin/callback"
   ```
2. Make sure you're using HTTPS for all production URLs
3. Deploy your updated functions:
   ```bash
   firebase deploy --only functions
   ```

## Important Notes

- LinkedIn might take some time to recognize newly added redirect URLs
- If you change your application name or other settings, you might need to re-authorize the app
- For security reasons, LinkedIn will only redirect to URLs that exactly match the authorized URLs