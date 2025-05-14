import React, { useState, useEffect } from 'react';
import { getLinkedInAuthUrl } from '@/services/linkedin-service';

interface LinkedInConnectProps {
  onProfileDataChange: (profileData: any) => void;
}

const LinkedInConnect: React.FC<LinkedInConnectProps> = ({ onProfileDataChange }) => {
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [linkedInData, setLinkedInData] = useState<any>(null);
  
  // Check if there's a code parameter in the URL (LinkedIn OAuth callback)
  useEffect(() => {
    const handleOAuthCallback = async () => {
      if (typeof window !== 'undefined') {
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');
        const error = urlParams.get('error');
        
        if (error) {
          setError('LinkedIn authentication failed: ' + error);
          return;
        }
        
        if (code) {
          setIsConnecting(true);
          
          try {
            // Exchange code for access token and get profile data
            const response = await fetch('/api/linkedin/callback', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ code }),
            });
            
            if (!response.ok) {
              const errorData = await response.json();
              throw new Error(errorData.error || 'Failed to authenticate with LinkedIn');
            }
            
            const data = await response.json();
            
            // Update state
            setLinkedInData(data.profile);
            setIsConnected(true);
            
            // Update parent component
            onProfileDataChange(data.profile);
            
            // Clean up URL
            window.history.replaceState({}, document.title, window.location.pathname);
          } catch (error) {
            console.error('LinkedIn callback error:', error);
            setError(error instanceof Error ? error.message : 'An unknown error occurred');
          } finally {
            setIsConnecting(false);
          }
        }
      }
    };
    
    handleOAuthCallback();
  }, [onProfileDataChange]);
  
  const handleConnect = async () => {
    setIsConnecting(true);
    setError('');
    
    try {
      // Get LinkedIn auth URL
      const response = await fetch('/api/linkedin/auth', {
        method: 'GET',
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to get LinkedIn auth URL');
      }
      
      const data = await response.json();
      
      // Redirect to LinkedIn auth page
      window.location.href = data.authUrl;
    } catch (error) {
      console.error('LinkedIn connect error:', error);
      setError(error instanceof Error ? error.message : 'An unknown error occurred');
      setIsConnecting(false);
    }
  };
  
  const handleDisconnect = () => {
    setLinkedInData(null);
    setIsConnected(false);
    onProfileDataChange(null);
  };
  
  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-xl font-semibold mb-4">Connect LinkedIn</h2>
      
      {isConnected ? (
        <div>
          <div className="mb-4 p-4 bg-blue-50 border border-blue-100 rounded-md">
            <div className="flex items-center">
              {linkedInData.profilePicture ? (
                <img 
                  src={linkedInData.profilePicture} 
                  alt={`${linkedInData.firstName} ${linkedInData.lastName}`}
                  className="w-12 h-12 rounded-full mr-4"
                />
              ) : (
                <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mr-4">
                  <span className="text-blue-600 font-bold text-lg">
                    {linkedInData.firstName?.charAt(0)}{linkedInData.lastName?.charAt(0)}
                  </span>
                </div>
              )}
              <div>
                <h3 className="font-medium text-gray-800">
                  {linkedInData.firstName} {linkedInData.lastName}
                </h3>
                <p className="text-sm text-gray-600">{linkedInData.headline || 'LinkedIn Member'}</p>
              </div>
            </div>
            
            <div className="mt-4">
              <h4 className="text-sm font-medium text-gray-700">Profile information imported:</h4>
              <ul className="mt-2 text-xs text-gray-600 space-y-1">
                <li>✓ Professional experience ({linkedInData.positions?.length || 0} entries)</li>
                <li>✓ Education ({linkedInData.educations?.length || 0} entries)</li>
                <li>✓ Skills ({linkedInData.skills?.length || 0} skills)</li>
                <li>✓ Contact information</li>
              </ul>
            </div>
          </div>
          
          <button
            onClick={handleDisconnect}
            className="w-full border border-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
          >
            Disconnect LinkedIn
          </button>
        </div>
      ) : (
        <div>
          <p className="mb-4 text-gray-600 text-sm">
            Connect your LinkedIn profile to import your professional experience, education, skills, and other information to create a tailored CV.
          </p>
          
          <button
            onClick={handleConnect}
            disabled={isConnecting}
            className="w-full bg-[#0A66C2] text-white py-2 px-4 rounded-md hover:bg-[#004182] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-blue-300 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {isConnecting ? (
              'Connecting...'
            ) : (
              <>
                <svg 
                  className="w-5 h-5 mr-2" 
                  fill="currentColor" 
                  viewBox="0 0 24 24" 
                  aria-hidden="true"
                >
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                </svg>
                Connect with LinkedIn
              </>
            )}
          </button>
          
          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}
          
          <div className="mt-4 border-t border-gray-200 pt-4">
            <p className="text-xs text-gray-500">
              By connecting your LinkedIn account, you authorize this application to access your profile data. 
              We will only use this data to generate your CV and cover letter. Your data will not be shared 
              with any third parties.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default LinkedInConnect;