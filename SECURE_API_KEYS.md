# Secure API Key Management

This document outlines how we securely manage API keys, particularly the OpenAI API key, in the JobCompanion application.

## Security Approach

We follow these best practices for securing API keys:

1. **Never store API keys in client-side code**
2. **Never commit API keys to the repository**
3. **Use Firebase Functions as a secure backend**
4. **Use environment variables for configuration**

## OpenAI API Key Storage

The OpenAI API key is stored securely following these principles:

### 1. Development Environment

During local development, the OpenAI API key is stored in the `.env.local` file, which is:
- Excluded from Git via `.gitignore`
- Only accessible on the developer's local machine
- Used by Next.js API routes running on the server

### 2. Production Environment

In production, we store the OpenAI API key in Firebase:

#### Firebase Functions Environment Variables

```bash
# Set the API key as a Firebase Functions environment variable
firebase functions:config:set openai.apikey="your_openai_api_key"
```

These environment variables are:
- Encrypted at rest in Google's infrastructure
- Only accessible to the Firebase Functions runtime
- Never exposed to client-side code

### 3. API Request Flow

1. User makes a request from the client (browser)
2. Request is sent to a Firebase Function
3. Firebase Function retrieves the API key from environment variables
4. Firebase Function makes the API call to OpenAI
5. Results are returned to the client

This ensures the API key is never exposed to the client.

## Secure Access in Firebase Functions

In `functions/index.js`, we access the API key securely:

```javascript
// Initialize OpenAI with API key from environment variables
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || functions.config().openai.apikey,
});
```

This approach allows for:
- Local development with `.env.local`
- Production deployment with Firebase environment variables

## Setting Up the API Key

To set up the OpenAI API key:

1. **For local development:**
   - Add to `.env.local`: `OPENAI_API_KEY=your_openai_api_key`

2. **For production:**
   - Set Firebase Functions config:
     ```bash
     firebase functions:config:set openai.apikey="your_openai_api_key"
     ```
   - Deploy functions: `firebase deploy --only functions`

## Additional Security Measures

- **Authentication required:** All Firebase Functions require user authentication
- **Rate limiting:** Implemented in Firebase Functions to prevent abuse
- **Usage tracking:** Monitor API usage per user in Firestore
- **Minimal permissions:** Firebase security rules limit access to resources

## Updating API Keys

If you need to update the API key:

1. Update the local `.env.local` file
2. Update the Firebase Functions config:
   ```bash
   firebase functions:config:set openai.apikey="your_new_openai_api_key"
   ```
3. Redeploy functions: `firebase deploy --only functions`