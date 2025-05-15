import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useAuth } from '@/contexts/AuthContext';

interface HeaderProps {
  user?: {
    email: string;
    name?: string;
  } | null;
  onSignOut?: () => Promise<void>;
}

const Header: React.FC<HeaderProps> = ({ user, onSignOut }) => {
  const router = useRouter();
  const { currentUser, logout } = useAuth();
  
  // Handle sign out - use provided function or fall back to internal
  const handleSignOut = async () => {
    try {
      if (onSignOut) {
        await onSignOut();
      } else {
        await logout();
        router.push('/');
      }
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <header className="bg-white shadow">
      <div className="app-container">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="app-text-xl app-text-primary font-bold">
              JobCV
            </Link>
            <nav className="hidden md:flex ml-8">
              <div className="flex space-x-6">
                <Link 
                  href="/"
                  className={`flex flex-col items-center text-sm ${
                    router.pathname === '/' 
                      ? 'text-gray-900 border-b-2 border-blue-600 font-medium' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 mb-1">
                    <path d="M11.47 3.84a.75.75 0 011.06 0l8.69 8.69a.75.75 0 101.06-1.06l-8.689-8.69a2.25 2.25 0 00-3.182 0l-8.69 8.69a.75.75 0 001.061 1.06l8.69-8.69z" />
                    <path d="M12 5.432l8.159 8.159c.03.03.06.058.091.086v6.198c0 1.035-.84 1.875-1.875 1.875H15a.75.75 0 01-.75-.75v-4.5a.75.75 0 00-.75-.75h-3a.75.75 0 00-.75.75V21a.75.75 0 01-.75.75H5.625a1.875 1.875 0 01-1.875-1.875v-6.198a2.29 2.29 0 00.091-.086L12 5.43z" />
                  </svg>
                  <span>Home</span>
                </Link>
                <Link 
                  href="/generate"
                  className={`flex flex-col items-center text-sm ${
                    router.pathname === '/generate' 
                      ? 'text-gray-900 border-b-2 border-blue-600 font-medium' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 mb-1">
                    <path d="M21.731 2.269a2.625 2.625 0 00-3.712 0l-1.157 1.157 3.712 3.712 1.157-1.157a2.625 2.625 0 000-3.712zM19.513 8.199l-3.712-3.712-12.15 12.15a5.25 5.25 0 00-1.32 2.214l-.8 2.685a.75.75 0 00.933.933l2.685-.8a5.25 5.25 0 002.214-1.32L19.513 8.2z" />
                  </svg>
                  <span>Generate</span>
                </Link>
                <Link 
                  href="/history"
                  className={`flex flex-col items-center text-sm ${
                    router.pathname === '/history' 
                      ? 'text-gray-900 border-b-2 border-blue-600 font-medium' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 mb-1">
                    <path fillRule="evenodd" d="M7.502 6h7.128A3.375 3.375 0 0118 9.375v9.375a3 3 0 003-3V6.108c0-1.505-1.125-2.811-2.664-2.94a48.972 48.972 0 00-.673-.05A3 3 0 0015 1.5h-1.5a3 3 0 00-2.663 1.618c-.225.015-.45.032-.673.05C8.662 3.295 7.554 4.542 7.502 6zM13.5 3A1.5 1.5 0 0012 4.5h4.5A1.5 1.5 0 0015 3h-1.5z" clipRule="evenodd" />
                    <path fillRule="evenodd" d="M3 9.375C3 8.339 3.84 7.5 4.875 7.5h9.75c1.036 0 1.875.84 1.875 1.875v11.25c0 1.035-.84 1.875-1.875 1.875h-9.75A1.875 1.875 0 013 20.625V9.375zM6 12a.75.75 0 01.75-.75h.008a.75.75 0 01.75.75v.008a.75.75 0 01-.75.75H6.75a.75.75 0 01-.75-.75V12zm2.25 0a.75.75 0 01.75-.75h3.75a.75.75 0 010 1.5H9a.75.75 0 01-.75-.75zM6 15a.75.75 0 01.75-.75h.008a.75.75 0 01.75.75v.008a.75.75 0 01-.75.75H6.75a.75.75 0 01-.75-.75V15zm2.25 0a.75.75 0 01.75-.75h3.75a.75.75 0 010 1.5H9a.75.75 0 01-.75-.75zM6 18a.75.75 0 01.75-.75h.008a.75.75 0 01.75.75v.008a.75.75 0 01-.75.75H6.75a.75.75 0 01-.75-.75V18zm2.25 0a.75.75 0 01.75-.75h3.75a.75.75 0 010 1.5H9a.75.75 0 01-.75-.75z" clipRule="evenodd" />
                  </svg>
                  <span>History</span>
                </Link>
              </div>
            </nav>
          </div>
          
          <div className="flex items-center">
            {user || currentUser ? (
              <div className="flex items-center space-x-4">
                <div className="hidden md:block">
                  <div className="flex flex-col items-center">
                    <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center overflow-hidden">
                      {(user?.name || currentUser?.displayName) ? (
                        <span className="text-xs font-semibold">{(user?.name || currentUser?.displayName)?.charAt(0)}</span>
                      ) : (
                        <span className="text-xs font-semibold">{(user?.email || currentUser?.email)?.charAt(0).toUpperCase() || 'U'}</span>
                      )}
                    </div>
                    <span className="text-xs mt-1 text-gray-700 max-w-[80px] truncate">
                      {user?.name || currentUser?.displayName || (user?.email || currentUser?.email)?.split('@')[0] || 'User'}
                    </span>
                  </div>
                </div>
                <button
                  onClick={handleSignOut}
                  className="app-button app-button-secondary"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                <Link 
                  href="/login"
                  className="app-button app-button-secondary"
                >
                  Sign in
                </Link>
                <Link 
                  href="/signup"
                  className="app-button app-button-primary"
                >
                  Join now
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;