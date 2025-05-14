import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';

interface HeaderProps {
  user?: {
    email: string;
    name?: string;
  } | null;
  onSignOut?: () => void;
}

const Header: React.FC<HeaderProps> = ({ user, onSignOut }) => {
  const router = useRouter();

  return (
    <header className="bg-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link href="/" className="text-2xl font-bold text-blue-600">
                CareerBoost
              </Link>
            </div>
            <nav className="ml-6 flex items-center space-x-4">
              <Link 
                href="/"
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  router.pathname === '/' 
                    ? 'text-blue-600 bg-blue-50' 
                    : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'
                }`}
              >
                Home
              </Link>
              <Link 
                href="/generate"
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  router.pathname === '/generate' 
                    ? 'text-blue-600 bg-blue-50' 
                    : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'
                }`}
              >
                Generate
              </Link>
              <Link 
                href="/history"
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  router.pathname === '/history' 
                    ? 'text-blue-600 bg-blue-50' 
                    : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'
                }`}
              >
                History
              </Link>
              <Link 
                href="/templates"
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  router.pathname === '/templates' 
                    ? 'text-blue-600 bg-blue-50' 
                    : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'
                }`}
              >
                Templates
              </Link>
            </nav>
          </div>
          <div className="flex items-center">
            {user ? (
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-700">{user.name || user.email}</span>
                <button
                  onClick={onSignOut}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Link 
                  href="/login"
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Log In
                </Link>
                <Link 
                  href="/signup"
                  className="px-3 py-2 rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                >
                  Sign Up
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