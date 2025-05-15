# Firebase Setup Documentation

## Project Details

- **Project Name**: CV & Cover Letter Generator
- **Firebase Project ID**: cvjob-3a4ed
- **Firebase Project URL**: https://console.firebase.google.com/project/cvjob-3a4ed

## Services Enabled

- **Authentication**: Enabled
  - Methods: Email/Password (default)
  - Additional methods can be enabled in the Firebase console

- **Firestore Database**: Enabled
  - Mode: Production
  - Rules: Default (authenticated access only)

- **Storage**: Enabled
  - Rules: Default (authenticated access only)

- **Analytics**: Enabled
  - Measurement ID: G-JC69DM0NX6

- **Functions**: Enabled
  - Runtime: Node.js

## Security Rules

### Firestore Rules (firestore.rules)
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

### Storage Rules (storage.rules)
```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /{allPaths=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

## Environment Variables

The Firebase configuration is stored in the `.env.local` file with the following variables:

```
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyBCbiDsPDHWsNJZOoHxaAGGOLBR8-feKqc
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=cvjob-3a4ed.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=cvjob-3a4ed
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=cvjob-3a4ed.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=862516684618
NEXT_PUBLIC_FIREBASE_APP_ID=1:862516684618:web:77c1968f0fc33d88e0c3b3
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=G-JC69DM0NX6
```

## Data Schema

### Collections

1. **users**: User profile information
   - UID (document ID): Firebase Auth UID
   - Fields: name, email

2. **cvs**: Uploaded CV documents
   - Fields: userId, fileName, fileUrl, uploadDate, parsedData

3. **generated_documents**: Generated CVs and cover letters
   - Fields: userId, cv, coverLetter, profileData, jobData, timestamp

4. **usage**: Tracking API usage for users
   - Fields: totalRequests, dailyRequests, lastUpdated

## Firebase SDK Integration

The Firebase SDK is integrated in `src/utils/firebase.ts`, which initializes:
- Firebase App
- Authentication
- Firestore
- Storage
- Analytics (client-side only)

## Firebase Functions

Cloud Functions are deployed to handle:
- Document generation with OpenAI
- CV parsing
- Usage tracking

## Deployment

To deploy Firebase resources:
```bash
firebase deploy
```

To deploy only specific resources:
```bash
firebase deploy --only functions
firebase deploy --only firestore:rules
firebase deploy --only storage:rules
firebase deploy --only hosting
```

## Required Additional Setup

To prepare for production deployment, complete these steps:

1. Add your OpenAI API key to the Firebase Functions config:
   ```bash
   firebase functions:config:set openai.api_key="YOUR_API_KEY"
   ```
2. Deploy Firebase Functions:
   ```bash
   firebase deploy --only functions
   ```
3. Configure and deploy security rules:
   ```bash
   firebase deploy --only firestore:rules
   firebase deploy --only storage:rules
   ```

## Monitoring and Maintenance

- Monitor usage in the Firebase console
- Check logs for errors and performance issues
- Keep track of billing to avoid unexpected charges