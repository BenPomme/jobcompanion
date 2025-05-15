import React, { ReactNode } from 'react';
import Head from 'next/head';
import Header from './Header';
import Footer from './Footer';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';

interface LayoutProps {
  children: ReactNode;
  title?: string;
  description?: string;
}

interface HeaderUser {
  email: string;
  name?: string;
}

const Layout: React.FC<LayoutProps> = ({
  children,
  title = 'JobCV - AI-Powered CV & Cover Letter Generator',
  description = 'Generate tailored CVs and cover letters for job applications using AI technology'
}) => {
  const router = useRouter();
  const { currentUser, logout } = useAuth();
  const [headerUser, setHeaderUser] = useState<HeaderUser | null>(null);
  const [isClient, setIsClient] = useState(false);

  // Set isClient to true after component mounts (client-side only)
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Update headerUser when currentUser changes, only on client side
  useEffect(() => {
    if (!isClient) return;

    if (currentUser && currentUser.email) {
      setHeaderUser({
        email: currentUser.email,
        name: currentUser.displayName || undefined
      });
    } else {
      setHeaderUser(null);
    }
  }, [currentUser, isClient]);

  const handleSignOut = async () => {
    try {
      await logout();
      router.push('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Head>
        <title>{title}</title>
        <meta name="description" content={description} />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <Header user={headerUser} onSignOut={handleSignOut} />
      
      <main className="flex-grow py-6">
        <div className="app-container">
          {children}
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default Layout;