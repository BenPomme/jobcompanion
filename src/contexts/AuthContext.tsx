import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { 
  Auth,
  User,
  UserCredential,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  GoogleAuthProvider,
  signInWithPopup,
  updateProfile,
  getAuth
} from 'firebase/auth';
import { auth as firebaseAuth } from '@/utils/firebase';

interface AuthContextProps {
  currentUser: User | null;
  loading: boolean;
  signup: (email: string, password: string) => Promise<UserCredential>;
  login: (email: string, password: string) => Promise<UserCredential>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  googleSignIn: () => Promise<UserCredential>;
  updateUserProfile: (displayName: string) => Promise<void>;
  linkedInSignIn: () => Promise<void>;
}

const AuthContext = createContext<AuthContextProps>({
  currentUser: null,
  loading: true,
  signup: async () => { throw new Error('Not implemented'); },
  login: async () => { throw new Error('Not implemented'); },
  logout: async () => { throw new Error('Not implemented'); },
  resetPassword: async () => { throw new Error('Not implemented'); },
  googleSignIn: async () => { throw new Error('Not implemented'); },
  updateUserProfile: async () => { throw new Error('Not implemented'); },
  linkedInSignIn: async () => { throw new Error('Not implemented'); }
});

export function useAuth() {
  return useContext(AuthContext);
}

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isClient, setIsClient] = useState(false);

  // Set isClient to true once component mounts (client-side only)
  useEffect(() => {
    setIsClient(true);
  }, []);

  function signup(email: string, password: string) {
    if (typeof window === 'undefined') {
      return Promise.reject(new Error('Cannot signup: Server-side execution is not supported'));
    }
    
    const auth = getAuthInstance();
    if (!auth) {
      return Promise.reject(new Error('Cannot signup: Firebase Auth not initialized'));
    }
    
    return createUserWithEmailAndPassword(auth, email, password);
  }

  function login(email: string, password: string) {
    if (typeof window === 'undefined') {
      return Promise.reject(new Error('Cannot login: Server-side execution is not supported'));
    }
    
    const auth = getAuthInstance();
    if (!auth) {
      return Promise.reject(new Error('Cannot login: Firebase Auth not initialized'));
    }
    
    return signInWithEmailAndPassword(auth, email, password);
  }

  function logout() {
    if (typeof window === 'undefined') {
      return Promise.reject(new Error('Cannot logout: Server-side execution is not supported'));
    }
    
    const auth = getAuthInstance();
    if (!auth) {
      return Promise.reject(new Error('Cannot logout: Firebase Auth not initialized'));
    }
    
    return signOut(auth);
  }

  function resetPassword(email: string) {
    if (typeof window === 'undefined') {
      return Promise.reject(new Error('Cannot reset password: Server-side execution is not supported'));
    }
    
    const auth = getAuthInstance();
    if (!auth) {
      return Promise.reject(new Error('Cannot reset password: Firebase Auth not initialized'));
    }
    
    return sendPasswordResetEmail(auth, email);
  }

  function googleSignIn() {
    if (typeof window === 'undefined') {
      return Promise.reject(new Error('Cannot sign in with Google: Server-side execution is not supported'));
    }
    
    const auth = getAuthInstance();
    if (!auth) {
      return Promise.reject(new Error('Cannot sign in with Google: Firebase Auth not initialized'));
    }
    
    const provider = new GoogleAuthProvider();
    return signInWithPopup(auth, provider);
  }

  async function linkedInSignIn() {
    if (typeof window === 'undefined') {
      return Promise.reject(new Error('Cannot sign in with LinkedIn: Server-side execution is not supported'));
    }
    
    const auth = getAuthInstance();
    if (!auth) {
      return Promise.reject(new Error('Cannot sign in with LinkedIn: Firebase Auth not initialized'));
    }
    
    try {
      // Get LinkedIn auth URL from our API
      const response = await fetch('/api/linkedin/auth');
      const data = await response.json();
      
      if (data.authUrl) {
        // Redirect to LinkedIn for authentication
        window.location.href = data.authUrl;
      } else {
        throw new Error('Failed to get LinkedIn auth URL');
      }
    } catch (error) {
      console.error('LinkedIn sign in error:', error);
      throw error;
    }
  }

  async function updateUserProfile(displayName: string) {
    if (typeof window === 'undefined') {
      return Promise.reject(new Error('Cannot update profile: Server-side execution is not supported'));
    }
    
    if (!currentUser) {
      return Promise.reject(new Error('Cannot update profile: No user logged in'));
    }
    
    const auth = getAuthInstance();
    if (!auth) {
      return Promise.reject(new Error('Cannot update profile: Firebase Auth not initialized'));
    }
    
    return updateProfile(currentUser, { displayName });
  }

  // Get the auth instance safely
  const getAuthInstance = (): Auth | null => {
    if (typeof window === 'undefined') {
      return null;
    }
    
    try {
      // Use the exported auth or get a new instance
      return firebaseAuth || getAuth();
    } catch (error) {
      console.error("Failed to get Auth instance:", error);
      return null;
    }
  };

  // Only set up auth state listener on client side
  useEffect(() => {
    if (typeof window === 'undefined') {
      setLoading(false);
      return;
    }

    let unsubscribe: () => void = () => {};
    
    try {
      // Wrap in try/catch to handle initialization errors
      const auth = getAuthInstance();
      
      if (auth) {
        unsubscribe = onAuthStateChanged(auth, (user) => {
          setCurrentUser(user);
          setLoading(false);
        }, (error) => {
          console.error("Auth state change error:", error);
          setLoading(false);
        });
      } else {
        console.warn("Auth not initialized yet, will retry");
        // Retry after a short delay
        const retryTimer = setTimeout(() => {
          const retryAuth = getAuthInstance();
          if (retryAuth) {
            const retryUnsubscribe = onAuthStateChanged(retryAuth, (user) => {
              setCurrentUser(user);
              setLoading(false);
            }, (error) => {
              console.error("Auth state change error on retry:", error);
              setLoading(false);
            });
            unsubscribe = retryUnsubscribe;
          } else {
            console.error("Auth initialization failed after retry");
            setLoading(false);
          }
        }, 500);
        
        // Update unsubscribe to clear the timer
        const originalUnsubscribe = unsubscribe;
        unsubscribe = () => {
          clearTimeout(retryTimer);
          originalUnsubscribe();
        };
      }
    } catch (error) {
      console.error("Error setting up auth listener:", error);
      setLoading(false);
    }

    return () => {
      unsubscribe();
    };
  }, [isClient]); // Only run when isClient changes (client-side only)

  const value = {
    currentUser,
    loading,
    signup,
    login,
    logout,
    resetPassword,
    googleSignIn,
    updateUserProfile,
    linkedInSignIn
  };

  return (
    <AuthContext.Provider value={value}>
      {(!loading || !isClient) && children}
    </AuthContext.Provider>
  );
}