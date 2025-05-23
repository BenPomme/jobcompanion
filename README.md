# CV & Cover Letter Generator


## Features

- AI-powered analysis to match your skills with job requirements
- Generate optimized CVs and cover letters tailored to specific jobs
- Download documents in PDF or DOCX formats
- Save your generation history (for authenticated users)

## Live Demo

- https://cvjob-3a4ed.web.app

## Tech Stack

- **Frontend**: Next.js, React, Tailwind CSS
- **Backend**: Next.js API routes, Firebase Cloud Functions
- **Authentication**: Firebase Authentication
- **Database**: Firebase Firestore
- **Storage**: Firebase Storage
- **AI**: OpenAI API (GPT-4o and GPT-4o-mini)
- **Document Processing**: pdf-lib, docx
- **Analytics**: Firebase Analytics

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Firebase account
- OpenAI API key

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/your-org/cv-cover-letter-generator.git
   cd cv-cover-letter-generator
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Set up environment variables:
   Create a `.env.local` file with the following variables (see `env.local.example`):
   ```
   # Firebase Config
   NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_firebase_project_id
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_firebase_storage_bucket
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_firebase_messaging_sender_id
   NEXT_PUBLIC_FIREBASE_APP_ID=your_firebase_app_id
   NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=your_firebase_measurement_id
   
   # OpenAI Config
   OPENAI_API_KEY=your_openai_api_key
   ```

4. Run the development server:
   ```
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
/
├── public/             # Static assets
├── src/
│   ├── components/     # React components
│   ├── contexts/       # Context providers
│   ├── pages/          # Next.js pages and API routes
│   ├── services/       # Service modules
│   ├── styles/         # CSS styles
│   └── utils/          # Utility functions
├── functions/          # Firebase Cloud Functions
├── ARCHITECTURE.md     # Architecture documentation
├── DESIGN.md           # Design documentation
├── FIREBASE_SETUP.md   # Firebase setup documentation
├── SECURE_API_KEYS.md  # API key security documentation
├── README.md           # Project documentation
└── firebase.json       # Firebase configuration
```

## Deployment

See [Deployment.md](Deployment.md) for detailed deployment instructions.

## Development Status

- [x] Project setup with Next.js and Tailwind CSS
- [x] Firebase integration (Authentication, Firestore, Storage)
- [x] Core components (CV upload, job input, document preview)
- [x] OpenAI integration for document generation
- [ ] End-to-end testing
- [ ] Production deployment

See [PROJECT_STATUS.md](PROJECT_STATUS.md) for detailed status.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.