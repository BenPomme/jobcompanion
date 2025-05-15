import React, { useState } from 'react';
import axios from 'axios';

interface ProfileInputProps {
  onProfileDataChange: (profileData: any) => void;
}

const ProfileInput: React.FC<ProfileInputProps> = ({ onProfileDataChange }) => {
  const [profileUrl, setProfileUrl] = useState('');
  const [profileUrlValid, setProfileUrlValid] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [profileData, setProfileData] = useState<any>(null);
  const [showManualInput, setShowManualInput] = useState(false);
  
  // Manual input form states
  const [name, setName] = useState('');
  const [headline, setHeadline] = useState('');
  const [summary, setSummary] = useState('');
  const [skills, setSkills] = useState('');
  const [experience, setExperience] = useState('');
  const [education, setEducation] = useState('');

  // Validate profile URL
  const handleProfileUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const url = e.target.value;
    setProfileUrl(url);
    // Accept both LinkedIn and other profile URLs
    setProfileUrlValid(url.includes('linkedin.com/in/') || url.includes('github.com/') || url.startsWith('https://'));
  };

  // Handle profile extraction
  const handleExtractProfile = async () => {
    if (!profileUrlValid) {
      setError('Please enter a valid profile URL');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Use the Firebase Function for profile extraction
      const API_URL = 'https://us-central1-cvjob-3a4ed.cloudfunctions.net/linkedinProfile';
      
      const response = await axios.post(API_URL, { url: profileUrl });
      
      if (!response.data || !response.data.profile) {
        throw new Error('Invalid response from profile extraction service');
      }
      
      const extractedProfileData = response.data.profile;
      setProfileData(extractedProfileData);
      
      // Fill manual form fields with extracted data
      setName(extractedProfileData.name || '');
      setHeadline(extractedProfileData.headline || '');
      setSummary(extractedProfileData.summary || '');
      setSkills(Array.isArray(extractedProfileData.skills) ? extractedProfileData.skills.join(', ') : '');
      
      // Update parent component
      onProfileDataChange(extractedProfileData);
      
    } catch (err) {
      console.error('Error extracting profile:', err);
      setError('Failed to extract profile data. You can enter your information manually.');
      setShowManualInput(true);
    } finally {
      setLoading(false);
    }
  };

  // Handle manual form submission
  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Create profile data object from form
    const manualProfileData = {
      name,
      headline,
      summary,
      skills: skills.split(',').map(skill => skill.trim()).filter(skill => skill),
      experience: experience,
      education: education,
      url: profileUrl || 'Manual entry'
    };
    
    setProfileData(manualProfileData);
    onProfileDataChange(manualProfileData);
  };

  // Reset all form data
  const handleReset = () => {
    setProfileUrl('');
    setProfileUrlValid(false);
    setProfileData(null);
    setShowManualInput(false);
    setName('');
    setHeadline('');
    setSummary('');
    setSkills('');
    setExperience('');
    setEducation('');
    onProfileDataChange(null);
  };

  // Format profile data for display
  const renderProfilePreview = () => {
    if (!profileData) return null;

    return (
      <div className="mt-3 p-3 bg-white rounded-lg border border-gray-300">
        <h3 className="text-md font-semibold text-gray-800">{name || 'Unknown Name'}</h3>
        {headline && <p className="text-sm text-gray-600">{headline}</p>}
        {summary && 
          <div className="mt-2 text-sm text-gray-700">
            <p>{summary}</p>
          </div>
        }
      </div>
    );
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow mb-6">
      <h2 className="text-xl font-semibold mb-3">Professional Profile</h2>
      
      {profileData && !showManualInput ? (
        <div className="mb-3 bg-green-50 p-3 border border-green-200 rounded-md">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-green-700" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span className="ml-2 text-green-700 font-medium">Profile Data Ready</span>
          </div>
          {renderProfilePreview()}
          <button 
            onClick={handleReset}
            className="mt-3 bg-transparent hover:bg-gray-100 text-gray-700 py-2 px-4 border border-gray-300 rounded-full w-full"
          >
            Change Profile
          </button>
        </div>
      ) : (
        <>
          {!showManualInput ? (
            <div>
              <p className="text-sm text-gray-600 mb-3">
                Enter your LinkedIn profile URL to extract your professional information, or enter details manually.
              </p>
              
              <div className="mb-3">
                <label htmlFor="profileUrl" className="block text-sm font-medium text-gray-700 mb-1">
                  Profile URL
                </label>
                <div className="flex">
                  <input
                    id="profileUrl"
                    type="text"
                    value={profileUrl}
                    onChange={handleProfileUrlChange}
                    className={`flex-1 rounded-l-full border p-2 ${!profileUrlValid && profileUrl ? 'border-red-500' : 'border-gray-300'}`}
                    placeholder="https://www.linkedin.com/in/yourname"
                  />
                  <button
                    onClick={handleExtractProfile}
                    disabled={!profileUrlValid || loading}
                    className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-r-full whitespace-nowrap disabled:opacity-50"
                  >
                    {loading ? 'Extracting...' : 'Extract'}
                  </button>
                </div>
                
                {!profileUrlValid && profileUrl && (
                  <p className="mt-1 text-xs text-red-500">
                    Please enter a valid profile URL (e.g., https://www.linkedin.com/in/username)
                  </p>
                )}
                
                <div className="mt-3 flex justify-center">
                  <span className="text-sm text-gray-500">or</span>
                </div>
                
                <button
                  onClick={() => setShowManualInput(true)}
                  className="mt-3 w-full bg-gray-100 hover:bg-gray-200 text-gray-800 py-2 px-4 rounded-full"
                >
                  Enter Manually
                </button>
              </div>
              
              {error && (
                <div className="mt-3 bg-red-50 p-3 border border-red-200 rounded-md text-red-700">
                  <p>{error}</p>
                </div>
              )}
            </div>
          ) : (
            <form onSubmit={handleManualSubmit} className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name *
                </label>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full rounded-md border border-gray-300 p-2"
                />
              </div>
              
              <div>
                <label htmlFor="headline" className="block text-sm font-medium text-gray-700 mb-1">
                  Professional Title
                </label>
                <input
                  id="headline"
                  type="text"
                  value={headline}
                  onChange={(e) => setHeadline(e.target.value)}
                  className="w-full rounded-md border border-gray-300 p-2"
                  placeholder="e.g., Software Engineer at Company"
                />
              </div>
              
              <div>
                <label htmlFor="summary" className="block text-sm font-medium text-gray-700 mb-1">
                  Professional Summary
                </label>
                <textarea
                  id="summary"
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  rows={4}
                  className="w-full rounded-md border border-gray-300 p-2"
                  placeholder="Brief overview of your professional background and strengths"
                ></textarea>
              </div>
              
              <div>
                <label htmlFor="skills" className="block text-sm font-medium text-gray-700 mb-1">
                  Skills (comma separated)
                </label>
                <input
                  id="skills"
                  type="text"
                  value={skills}
                  onChange={(e) => setSkills(e.target.value)}
                  className="w-full rounded-md border border-gray-300 p-2"
                  placeholder="e.g., JavaScript, React, Project Management"
                />
              </div>
              
              <div>
                <label htmlFor="experience" className="block text-sm font-medium text-gray-700 mb-1">
                  Work Experience
                </label>
                <textarea
                  id="experience"
                  value={experience}
                  onChange={(e) => setExperience(e.target.value)}
                  rows={4}
                  className="w-full rounded-md border border-gray-300 p-2"
                  placeholder="List your relevant work history with job titles, companies, dates, and key responsibilities"
                ></textarea>
              </div>
              
              <div>
                <label htmlFor="education" className="block text-sm font-medium text-gray-700 mb-1">
                  Education
                </label>
                <textarea
                  id="education"
                  value={education}
                  onChange={(e) => setEducation(e.target.value)}
                  rows={3}
                  className="w-full rounded-md border border-gray-300 p-2"
                  placeholder="List your educational background with degrees, institutions, and dates"
                ></textarea>
              </div>
              
              <div className="flex space-x-3">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-full"
                >
                  Save Profile
                </button>
                <button
                  type="button"
                  onClick={() => setShowManualInput(false)}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-800 py-2 px-4 rounded-full"
                >
                  Back
                </button>
              </div>
            </form>
          )}
        </>
      )}
      
      <div className="mt-4">
        <h3 className="text-sm font-medium text-gray-700 mb-2">Tips for best results:</h3>
        <ul className="text-xs text-gray-600 list-disc pl-5 space-y-1">
          <li>Use your most up-to-date LinkedIn profile</li>
          <li>Ensure your profile has a detailed work history and skills section</li>
          <li>For manual entry, include specific accomplishments and metrics</li>
          <li>Add relevant skills that match your target jobs</li>
        </ul>
      </div>
    </div>
  );
};

export default ProfileInput; 