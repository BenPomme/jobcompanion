import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAnalytics } from 'firebase/analytics';

// Use environment variables with fallbacks for Firebase Config
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyBCbiDsPDHWsNJZOoHxaAGGOLBR8-feKqc",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "cvjob-3a4ed.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "cvjob-3a4ed",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "cvjob-3a4ed.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "862516684618",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:862516684618:web:77c1968f0fc33d88e0c3b3",
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || "G-JC69DM0NX6"
};

// Initialize Firebase app
let app;
let auth;
let db;
let storage;
let analytics = null;

try {
  // Initialize Firebase
  app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
  auth = getAuth(app);
  db = getFirestore(app);
  storage = getStorage(app);
  // Initialize Analytics only on client side
  analytics = typeof window !== 'undefined' ? getAnalytics(app) : null;
} catch (error) {
  console.error("Firebase initialization error:", error);
  // Provide empty implementations if Firebase fails to initialize
  app = null;
  auth = null;
  db = null;
  storage = null;
  analytics = null;
}

export { app, auth, db, storage, analytics };