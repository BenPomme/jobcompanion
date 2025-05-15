import React, { useState, useEffect } from 'react';
import axios from 'axios';

interface LinkedInConnectProps {
  onProfileDataChange: (data: any) => void;
}

const LinkedInConnect: React.FC<LinkedInConnectProps> = ({ onProfileDataChange }) => {
  const [error, setError] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [linkedInData, setLinkedInData] = useState<any>(null);
  const [profileUrl, setProfileUrl] = useState('');
  const [isExtractingProfile, setIsExtractingProfile] = useState(false);
  const [profileUrlValid, setProfileUrlValid] = useState(true);
  
  // Validate LinkedIn profile URL
  useEffect(() => {
    if (!profileUrl) {
      setProfileUrlValid(true);
      return;
    }
    
    setProfileUrlValid(profileUrl.includes('linkedin.com/in/'));
  }, [profileUrl]);
  
  // Removed LinkedIn OAuth login handler
  
  const extractProfileFromUrl = async () => {
    if (!profileUrl || !profileUrlValid) {
      setError('Please enter a valid LinkedIn profile URL');
      return;
    }
    
    setIsExtractingProfile(true);
    setError('');
    
    try {
      // Use Firebase Function to extract profile
      const API_URL = 'https://us-central1-cvjob-3a4ed.cloudfunctions.net/linkedinProfile';
      const response = await axios.post(API_URL, { url: profileUrl });
      
      if (!response.data || !response.data.profile) {
        throw new Error('Invalid response from profile extraction service');
      }
      
      const profileData = response.data.profile;
      console.log('Extracted profile data:', profileData);
      setLinkedInData(profileData);
      setIsConnected(true);
      onProfileDataChange(profileData);
    } catch (err: any) {
      console.error('Error extracting profile:', err);
      setError('Failed to extract profile data. Please try again or enter manually.');
    } finally {
      setIsExtractingProfile(false);
    }
  };
  
  const handleDisconnect = () => {
    setIsConnected(false);
    setLinkedInData(null);
    onProfileDataChange(null);
  };
  
  // Format LinkedIn data for display
  const formatProfileData = () => {
    if (!linkedInData) return null;
    
    const { name, headline, summary } = linkedInData;
    return (
      <div className="mt-3 p-3 bg-white rounded-lg border border-linkedin-gray-30">
        <h3 className="text-md font-semibold text-linkedin-gray-90">{name || 'Unknown Name'}</h3>
        {headline && <p className="text-sm text-linkedin-gray-70">{headline}</p>}
        {summary && (
          <div className="mt-2 text-sm text-linkedin-gray-80">
            <p className="line-clamp-3">{summary}</p>
          </div>
        )}
      </div>
    );
  };
  
  return (
    <div className="linkedin-card linkedin-card-compact">
      <h2 className="linkedin-heading-small mb-3">LinkedIn Profile</h2>
      
      {isConnected ? (
        <>
          <div className="linkedin-alert linkedin-alert-success mb-3">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-linkedin-success-text" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span className="ml-2 text-linkedin-success-text font-medium">Profile Connected</span>
            </div>
          </div>
          
          {formatProfileData()}
          
          <button 
            className="mt-3 linkedin-button linkedin-button-outline w-full"
            onClick={handleDisconnect}
          >
            Disconnect Profile
          </button>
        </>
      ) : (
        <>
          <p className="text-sm text-linkedin-gray-70 mb-3">
            Enter your LinkedIn profile URL to extract your professional information.
          </p>
          
          <div className="mb-3">
            <label htmlFor="profileUrl" className="linkedin-input-label">
              LinkedIn Profile URL
            </label>
            <div className="flex space-x-2">
              <input
                type="text"
                id="profileUrl"
                className={`linkedin-input flex-1 ${!profileUrlValid && profileUrl ? 'border-linkedin-error' : ''}`}
                placeholder="https://www.linkedin.com/in/yourname"
                value={profileUrl}
                onChange={(e) => setProfileUrl(e.target.value)}
              />
              <button
                className="linkedin-button linkedin-button-secondary whitespace-nowrap"
                onClick={extractProfileFromUrl}
                disabled={isExtractingProfile || !profileUrl}
              >
                {isExtractingProfile ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-1 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Extracting...
                  </span>
                ) : (
                  'Extract Profile'
                )}
              </button>
            </div>
            {!profileUrlValid && profileUrl && (
              <p className="mt-1 text-xs text-linkedin-error">
                Please enter a valid LinkedIn profile URL (e.g., https://www.linkedin.com/in/username)
              </p>
            )}
          </div>
          
          {error && (
            <div className="mt-3 linkedin-alert linkedin-alert-error">
              <p className="text-sm">{error}</p>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default LinkedInConnect;