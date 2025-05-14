# LinkedIn API Integration Setup

This document provides step-by-step instructions for setting up LinkedIn API integration for the JobCompanion application.

## 1. Create a LinkedIn Developer Account

1. Go to [LinkedIn Developer Portal](https://developer.linkedin.com/)
2. Sign in with your LinkedIn account
3. Click "Create app" to create a new app

## 2. Configure Your LinkedIn App

### Basic Information

1. Fill in the required app information:
   - **App name**: JobCompanion
   - **Company**: Your company name
   - **Privacy policy URL**: Your privacy policy URL
   - **Description**: An AI-powered web application for creating tailored CVs and cover letters

2. Upload an app logo (optional but recommended)

### Products

1. Request access to the following products:
   - **Sign In with LinkedIn**: This will give you the basic profile data access
   - **Marketing Developer Platform**: This gives access to the r_emailaddress scope
   - **LinkedIn Learning**: Not required for this app (leave unchecked)

### Auth Settings

1. Add authorized redirect URLs:
   - For local development: `http://localhost:3000/api/linkedin/callback`
   - For production: `https://your-production-domain.com/api/linkedin/callback`

2. Note down your **Client ID** and **Client Secret**

## 3. Update Environment Variables

Add your LinkedIn credentials to the `.env.local` file:

```
LINKEDIN_CLIENT_ID=your_client_id
LINKEDIN_CLIENT_SECRET=your_client_secret
LINKEDIN_REDIRECT_URI=http://localhost:3000/api/linkedin/callback
```

For production, add these to your Firebase environment:

```bash
firebase functions:config:set linkedin.client_id="your_client_id"
firebase functions:config:set linkedin.client_secret="your_client_secret"
firebase functions:config:set linkedin.redirect_uri="https://your-production-domain.com/api/linkedin/callback"
```

## 4. LinkedIn API Scopes

The application uses the following scopes:

- `r_liteprofile`: Access to basic profile information (name, photo, headline)
- `r_emailaddress`: Access to the member's email address

These are specified in the `getLinkedInAuthUrl` function in `src/services/linkedin-service.ts`.

## 5. Authentication Flow

The LinkedIn OAuth flow works as follows:

1. User clicks "Connect with LinkedIn" button 
2. Application redirects to LinkedIn authorization page
3. User grants permission to access their profile
4. LinkedIn redirects back to our callback URL with an authorization code
5. Our server exchanges the code for an access token
6. We use the access token to fetch the user's profile data

## 6. API Limits and Considerations

- **Rate Limits**: LinkedIn API has rate limits of approximately 100 requests per day per user
- **Token Expiry**: Access tokens typically expire in 60 days
- **Data Policies**: Ensure compliance with LinkedIn's data policies (do not store data longer than necessary)

## 7. Testing the Integration

1. Run the application locally:
   ```
   npm run dev
   ```

2. Navigate to the LinkedIn connect section
3. Click "Connect with LinkedIn"
4. Complete the authentication process
5. Verify the profile data is correctly imported

## 8. Troubleshooting

Common issues and their solutions:

- **Invalid redirect URI**: Ensure the redirect URI in your LinkedIn app settings exactly matches the one in your environment variables
- **Missing scopes**: If profile data is missing, verify you've requested the correct scopes
- **API errors**: Check the console logs for detailed error messages from the LinkedIn API

## 9. Production Considerations

- Use HTTPS for all redirects in production
- Implement token refresh logic for long-term access
- Consider caching profile data to reduce API calls
- Add error reporting for failed API calls

## 10. Resources

- [LinkedIn API Documentation](https://docs.microsoft.com/en-us/linkedin/)
- [LinkedIn OAuth 2.0 Guide](https://docs.microsoft.com/en-us/linkedin/shared/authentication/authorization-code-flow)
- [LinkedIn API Explorer](https://www.linkedin.com/developers/tools/explorer)