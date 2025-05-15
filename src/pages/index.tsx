import Link from 'next/link';
import Layout from '@/components/Layout';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect, useState } from 'react';

export default function Home() {
  const { currentUser, loading } = useAuth();
  const [isClient, setIsClient] = useState(false);

  // Set isClient to true when component mounts (client-side only)
  useEffect(() => {
    setIsClient(true);
  }, []);

  return (
    <Layout 
      title="JobCV - CV & Cover Letter Generator" 
      description="Create professional CVs and cover letters using AI"
    >
      <div className="app-container py-10">
        <div className="mb-10 text-center">
          <h1 className="app-heading-3xl mb-4">
            CV & Cover Letter Generator
          </h1>
          <p className="app-text-lg text-gray-600 max-w-3xl mx-auto">
            Provide your profile or upload your CV to generate tailored job applications quickly and easily.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Manual profile entry option */}
          <div className="app-card p-6">
            <div className="flex items-start mb-4">
              <div className="app-bg-primary rounded-full p-3 mr-4 text-white">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                  <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                </svg>
              </div>
              <div>
                <h2 className="app-heading-lg">Enter Profile</h2>
                <p className="app-text-md text-gray-600">
                  Provide your professional profile information manually.
                </p>
              </div>
            </div>
            <Link href="/generate?method=profile" className="app-button app-button-primary w-full text-center">
              Enter Profile
            </Link>
          </div>
          {/* CV upload option */}
          <div className="app-card p-6">
            <div className="flex items-start mb-4">
              <div className="app-bg-success rounded-full p-3 mr-4 text-white">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                  <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6zm-1 2l5 5h-5V4zM6 20V4h5v7h7v9H6z" />
                  <path d="M10 14h4v2h-4zm0-4h2v2h-2z" />
                </svg>
              </div>
              <div>
                <h2 className="app-heading-lg">Upload CV</h2>
                <p className="app-text-md text-gray-600">
                  Upload your existing CV in PDF or DOCX format.
                </p>
              </div>
            </div>
            <Link href="/generate?method=upload" className="app-button app-button-primary w-full text-center">
              Upload CV
            </Link>
          </div>
        </div>
        
        {isClient && !loading && !currentUser && (
          <div className="mt-12 text-center">
            <p className="app-text-md mb-4">
              Don't have an account yet?
            </p>
            <Link href="/signup" className="app-button app-button-secondary inline-block">
              Sign Up Now
            </Link>
          </div>
        )}
        
        {isClient && !loading && currentUser && (
          <div className="mt-12 text-center">
            <p className="app-text-md mb-4">
              Ready to generate your documents?
            </p>
            <Link href="/generate" className="app-button app-button-secondary inline-block">
              Go to Generator
            </Link>
          </div>
        )}
      </div>
    </Layout>
  );
}