import { initializeApp, getApps, getApp, FirebaseApp, FirebaseOptions } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getStorage, FirebaseStorage } from 'firebase/storage';
import { getAnalytics, Analytics, isSupported } from 'firebase/analytics';

// Hard-coded Firebase config for static export compatibility
const firebaseConfig: FirebaseOptions = {
  apiKey: "AIzaSyBCbiDsPDHWsNJZOoHxaAGGOLBR8-feKqc",
  authDomain: "cvjob-3a4ed.firebaseapp.com",
  projectId: "cvjob-3a4ed",
  storageBucket: "cvjob-3a4ed.firebasestorage.app", // Correct storage bucket URL
  messagingSenderId: "862516684618",
  appId: "1:862516684618:web:77c1968f0fc33d88e0c3b3",
  measurementId: "G-JC69DM0NX6"
};

// Create a module-level variable for analytics
let analyticsInstance: Analytics | null = null;

// Create module-level variables for Firebase services
let firebaseApp: FirebaseApp | null = null;
let authService: Auth | null = null;
let dbService: Firestore | null = null;
let storageService: FirebaseStorage | null = null;

/**
 * Initialize Firebase and return the initialized services
 * Ensures persistent references to services across the application
 */
export function initFirebase() {
  // Don't run on server side
  if (typeof window === 'undefined') {
    console.warn('Firebase initialization skipped on server side');
    return {
      initialized: false,
      app: null,
      auth: null,
      db: null,
      storage: null,
      analytics: null
    };
  }
  
  // If services are already initialized, return them
  if (firebaseApp && authService && dbService && storageService) {
    return {
      initialized: true,
      app: firebaseApp,
      auth: authService,
      db: dbService,
      storage: storageService,
      analytics: analyticsInstance
    };
  }
  
  try {
    // Check if Firebase is already initialized
    if (getApps().length > 0) {
      firebaseApp = getApp();
    } else {
      // Initialize with config
      firebaseApp = initializeApp(firebaseConfig);
      console.log("Firebase app initialized with config");
    }
    
    // Initialize services if they don't exist yet
    if (!authService) {
      authService = getAuth(firebaseApp);
      console.log("Firebase Auth service initialized");
    }
    
    if (!dbService) {
      dbService = getFirestore(firebaseApp);
      console.log("Firebase Firestore service initialized");
    }
    
    if (!storageService) {
      storageService = getStorage(firebaseApp);
      console.log("Firebase Storage service initialized");
    }
      
    // Only initialize analytics if not in an iframe and if supported
    if (!analyticsInstance && window.self === window.top) {
      isSupported().then(supported => {
        if (supported && firebaseApp) {
          analyticsInstance = getAnalytics(firebaseApp);
          console.log("Firebase Analytics initialized");
        }
      }).catch(e => {
        console.warn("Analytics support check failed", e);
      });
    }
      
    console.log("Firebase initialized successfully");
    
    return {
      initialized: true,
      app: firebaseApp,
      auth: authService,
      db: dbService,
      storage: storageService,
      analytics: analyticsInstance
    };
  } catch (error) {
    console.error("Firebase initialization error:", error);
    return {
      initialized: false,
      app: null,
      auth: null,
      db: null,
      storage: null,
      analytics: null
    };
  }
}

// Create a function to safely get Firebase services
function getFirebaseServices() {
  // On server side, return null services
  if (typeof window === 'undefined') {
    return {
      app: null,
      auth: null,
      db: null,
      storage: null,
      analytics: null
    };
  }
  
  // Initialize Firebase if not already done
  try {
    // If module-level services are already set, use them
    if (firebaseApp && authService && dbService && storageService) {
      return {
        app: firebaseApp,
        auth: authService,
        db: dbService,
        storage: storageService,
        analytics: analyticsInstance
      };
    }
    
    // Try to get existing app and services
    if (getApps().length > 0) {
      if (!firebaseApp) {
        firebaseApp = getApp();
      }
      
      if (!authService) {
        authService = getAuth(firebaseApp);
      }
      
      if (!dbService) {
        dbService = getFirestore(firebaseApp);
      }
      
      if (!storageService) {
        storageService = getStorage(firebaseApp);
      }
      
      return {
        app: firebaseApp,
        auth: authService,
        db: dbService,
        storage: storageService,
        analytics: analyticsInstance
      };
    } else {
      // Initialize Firebase 
      return initFirebase();
    }
  } catch (error) {
    console.warn("Failed to get Firebase services:", error);
  }
  
  // Return null services if initialization failed
  return {
    app: null,
    auth: null,
    db: null,
    storage: null,
    analytics: null
  };
}

// Get the services (will be properly initialized in _app.tsx)
const services = getFirebaseServices();

// Export the services
export const app = services.app;
export const auth = services.auth;
export const db = services.db;
export const storage = services.storage;
export const analytics = services.analytics;