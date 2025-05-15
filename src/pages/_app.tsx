import '@/styles/globals.css';
import '@/styles/linkedin-design-system.css';
import type { AppProps } from 'next/app';
import { AuthProvider } from '@/contexts/AuthContext';
import Head from 'next/head';
import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';

// Create a client-side only version of the Firebase initializer
const FirebaseInitializer = dynamic(
  () => import('@/utils/firebase').then((module) => {
    const FirebaseComponent = () => {
      const [initialized, setInitialized] = useState(false);

      useEffect(() => {
        if (typeof window !== 'undefined') {
          try {
            // Initialize Firebase
            const result = module.initFirebase();
            
            if (result.initialized) {
              console.log('Firebase initialized successfully');
              setInitialized(true);
            } else {
              console.warn('Firebase initialization failed, retrying in 1 second...');
              
              // Retry after a delay if initialization failed
              const retryTimer = setTimeout(() => {
                const retryResult = module.initFirebase();
                console.log('Firebase retry result:', retryResult.initialized ? 'success' : 'failed');
                setInitialized(retryResult.initialized);
              }, 1000);
              
              return () => clearTimeout(retryTimer);
            }
          } catch (error) {
            console.error('Error initializing Firebase:', error);
          }
        }
      }, []);
      
      // Component must render something
      return <></>;
    };
    return FirebaseComponent;
  }),
  { ssr: false }
);

export default function App({ Component, pageProps }: AppProps) {
  const [showContent, setShowContent] = useState(false);
  
  // Delay showing content to ensure Firebase has time to initialize
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Show content after a longer delay - gives Firebase time to initialize
      const timer = setTimeout(() => {
        setShowContent(true);
      }, 500); // Increased from 100ms to 500ms for better initialization
      
      return () => clearTimeout(timer);
    } else {
      // On server, show content immediately
      setShowContent(true);
    }
  }, []);

  return (
    <>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>JobCV - LinkedIn AI Resume Generator</title>
      </Head>
      
      {/* Initialize Firebase on client-side only */}
      <FirebaseInitializer />
      
      {/* Show content after initialization */}
      {showContent && (
        <AuthProvider>
          <Component {...pageProps} />
        </AuthProvider>
      )}
    </>
  );
}