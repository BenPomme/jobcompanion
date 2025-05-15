import React, { useState, useEffect } from 'react';
import { extractJobFromLinkedInUrl } from '@/services/job-parser';

interface JobInputProps {
  onJobDataChange: (jobData: any) => void;
}

interface ValidationState {
  isValid: boolean;
  message: string;
}

const JobInput: React.FC<JobInputProps> = ({ onJobDataChange }) => {
  const [url, setUrl] = useState('');
  const [description, setDescription] = useState('');
  const [inputMethod, setInputMethod] = useState<'url' | 'text'>('url');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [jobData, setJobData] = useState<any>(null);
  
  // Add validation states
  const [urlValidation, setUrlValidation] = useState<ValidationState>({ isValid: true, message: '' });
  const [descriptionValidation, setDescriptionValidation] = useState<ValidationState>({ isValid: true, message: '' });
  
  // Add loading progress state
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [estimatedTime, setEstimatedTime] = useState(0);
  
  // Progress bar simulation during loading
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isLoading) {
      // Set initial estimated time (in seconds)
      const initialEstimatedTime = 15;
      setEstimatedTime(initialEstimatedTime);
      setLoadingProgress(0);
      
      // Update progress every 300ms
      interval = setInterval(() => {
        setLoadingProgress(prev => {
          // Calculate new progress
          const increment = Math.random() * 5 + 1;
          const newProgress = Math.min(prev + increment, 95);
          
          // Update estimated time
          const progressPercentage = newProgress / 100;
          const remaining = Math.max(Math.round((1 - progressPercentage) * initialEstimatedTime), 1);
          setEstimatedTime(remaining);
          
          return newProgress;
        });
      }, 300);
    } else {
      setLoadingProgress(0);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isLoading]);
  
  // Validate URL field when it changes
  useEffect(() => {
    if (!url) {
      setUrlValidation({ isValid: true, message: '' });
      return;
    }
    
    // Basic URL pattern validation
    if (!url.match(/^https?:\/\/.+/i)) {
      setUrlValidation({ 
        isValid: false, 
        message: 'Please enter a valid URL starting with http:// or https://' 
      });
      return;
    }
    
    // Job URL validation (accept LinkedIn and other job sites)
    if (!url.includes('linkedin.com/jobs/') && 
        !url.includes('indeed.com/') && 
        !url.includes('glassdoor.com/') && 
        !url.includes('monster.com/') && 
        !url.includes('ziprecruiter.com/')) {
      setUrlValidation({ 
        isValid: false, 
        message: 'Please enter a valid job URL from LinkedIn, Indeed, Glassdoor, or other job sites' 
      });
      return;
    }
    
    setUrlValidation({ isValid: true, message: '' });
  }, [url]);
  
  // Validate description field when it changes
  useEffect(() => {
    if (!description) {
      setDescriptionValidation({ isValid: true, message: '' });
      return;
    }
    
    if (description.length < 100) {
      setDescriptionValidation({ 
        isValid: false, 
        message: `Job description should be detailed (${description.length}/100 characters)` 
      });
      return;
    }
    
    setDescriptionValidation({ isValid: true, message: '' });
  }, [description]);
  
  const handleUrlSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    // Validate form before submission
    if (!url.trim()) {
      setUrlValidation({ isValid: false, message: 'Please enter a job URL' });
      return;
    }
    
    if (!urlValidation.isValid) {
      // Validation message already displayed
      return;
    }
    
    setIsLoading(true);
    
    try {
      const extractedData = await extractJobFromLinkedInUrl(url);
      setJobData(extractedData);
      onJobDataChange(extractedData);
    } catch (error: any) {
      console.error('Error extracting job data:', error);
      setError('Failed to extract job data from URL. Please try again or enter the job details manually.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleDescriptionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    // Validate form before submission
    if (!description.trim()) {
      setDescriptionValidation({ isValid: false, message: 'Please enter a job description' });
      return;
    }
    
    if (!descriptionValidation.isValid) {
      // Validation message already displayed
      return;
    }
    
    // Process the title and company name if provided in the description
    let title = '';
    let company = '';
    
    // Try to extract job title and company from the description using simple patterns
    const titleMatch = description.match(/job title:?\s*([^\n]+)/i) || 
                      description.match(/position:?\s*([^\n]+)/i) ||
                      description.match(/^([^\n]+)/);
    
    if (titleMatch && titleMatch[1]) {
      title = titleMatch[1].trim();
    }
    
    const companyMatch = description.match(/company:?\s*([^\n]+)/i) || 
                         description.match(/organization:?\s*([^\n]+)/i) ||
                         description.match(/employer:?\s*([^\n]+)/i);
    
    if (companyMatch && companyMatch[1]) {
      company = companyMatch[1].trim();
    }
    
    const manualJobData = {
      description,
      title,
      company,
      url: 'Manual entry'
    };
    
    setJobData(manualJobData);
    onJobDataChange(manualJobData);
  };
  
  const handleReset = () => {
    setUrl('');
    setDescription('');
    setJobData(null);
    setError('');
    onJobDataChange(null);
  };
  
  // Format job data for display
  const renderJobPreview = () => {
    if (!jobData) return null;

    return (
      <div className="mt-3 p-3 bg-white rounded-lg border border-gray-300">
        <h3 className="text-md font-semibold text-gray-800">{jobData.title || 'Unknown Position'}</h3>
        {jobData.company && <p className="text-sm text-gray-600">{jobData.company}</p>}
        {jobData.location && <p className="text-xs text-gray-500">{jobData.location}</p>}
        {jobData.description && 
          <div className="mt-2 text-sm text-gray-700">
            <p className="line-clamp-3">{jobData.description.substring(0, 150)}...</p>
          </div>
        }
      </div>
    );
  };
  
  // Skeleton loading UI
  const SkeletonLoader = () => (
    <div className="animate-pulse">
      <div className="h-4 bg-gray-200 rounded-md w-2/3 mb-4"></div>
      <div className="h-10 bg-gray-200 rounded-md mb-6"></div>
      <div className="h-24 bg-gray-200 rounded-md mb-4"></div>
      <div className="h-4 bg-gray-200 rounded-md w-1/2 mb-6"></div>
      <div className="flex justify-center">
        <div className="h-10 bg-gray-200 rounded-full w-full"></div>
      </div>
    </div>
  );
  
  return (
    <div className="app-card mb-6">
      <h2 className="app-heading-xl mb-3">Job Details</h2>
      
      {jobData ? (
        <div className="mb-3 app-alert app-alert-success">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-success-text" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span className="ml-2 font-medium text-success-text">Job Data Ready</span>
          </div>
          {renderJobPreview()}
          <button 
            onClick={handleReset}
            className="app-button app-button-secondary w-full mt-3"
          >
            Change Job
          </button>
        </div>
      ) : (
        <>
          <div className="mb-3">
            <div className="app-tabs">
              <button
                className={`app-tab ${inputMethod === 'url' ? 'app-tab-active' : ''}`}
                onClick={() => setInputMethod('url')}
                type="button"
              >
                Job URL
              </button>
              <button
                className={`app-tab ${inputMethod === 'text' ? 'app-tab-active' : ''}`}
                onClick={() => setInputMethod('text')}
                type="button"
              >
                Manual Entry
              </button>
            </div>
          </div>
          
          {isLoading ? (
            <div>
              <SkeletonLoader />
              <div className="mt-6">
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div 
                    className="bg-primary h-2.5 rounded-full transition-all duration-300" 
                    style={{ width: `${loadingProgress}%` }}
                  ></div>
                </div>
                <p className="text-xs text-gray-500 mt-2 text-center">
                  Extracting job data... Estimated time: {estimatedTime} second{estimatedTime !== 1 ? 's' : ''}
                </p>
              </div>
            </div>
          ) : inputMethod === 'url' ? (
            <form onSubmit={handleUrlSubmit}>
              <div className="mb-3">
                <label htmlFor="jobUrl" className="app-input-label">
                  Job Posting URL
                </label>
                <input
                  type="url"
                  id="jobUrl"
                  placeholder="https://www.linkedin.com/jobs/view/..."
                  className={`app-input ${!urlValidation.isValid ? 'app-input-error' : ''}`}
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  required
                />
                {urlValidation.isValid ? (
                  <p className="app-input-hint">
                    Enter the full URL of a job posting (LinkedIn, Indeed, Glassdoor, etc.)
                  </p>
                ) : (
                  <p className="app-input-error-message">
                    {urlValidation.message}
                  </p>
                )}
              </div>
              
              <button
                type="submit"
                className="app-button app-button-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isLoading}
              >
                Extract Job Details
              </button>
              
              {error && (
                <div className="app-alert app-alert-error mt-3">
                  <p className="text-sm">{error}</p>
                </div>
              )}
            </form>
          ) : (
            <form onSubmit={handleDescriptionSubmit}>
              <div className="mb-3">
                <label htmlFor="jobTitle" className="app-input-label">
                  Job Title
                </label>
                <input
                  type="text"
                  id="jobTitle"
                  className="app-input mb-3"
                  placeholder="e.g., Senior Software Engineer"
                />
                
                <label htmlFor="company" className="app-input-label">
                  Company
                </label>
                <input
                  type="text"
                  id="company"
                  className="app-input mb-3"
                  placeholder="e.g., Acme Corporation"
                />
                
                <label htmlFor="jobDescription" className="app-input-label">
                  Job Description *
                </label>
                <textarea
                  id="jobDescription"
                  rows={8}
                  className={`app-input ${!descriptionValidation.isValid ? 'app-input-error' : ''}`}
                  placeholder="Paste the full job description here..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                ></textarea>
                {descriptionValidation.isValid ? (
                  <p className="app-input-hint">
                    Include job requirements, responsibilities, and qualifications
                  </p>
                ) : (
                  <p className="app-input-error-message">
                    {descriptionValidation.message}
                  </p>
                )}
              </div>
              
              <button
                type="submit"
                className="app-button app-button-primary w-full"
              >
                Use This Job
              </button>
              
              {error && (
                <div className="app-alert app-alert-error mt-3">
                  <p className="text-sm">{error}</p>
                </div>
              )}
            </form>
          )}
        </>
      )}
      
      <div className="mt-4">
        <h3 className="text-sm font-medium text-gray-700 mb-2">Tips for best results:</h3>
        <ul className="text-xs text-gray-600 list-disc pl-5 space-y-1">
          <li>Use official job descriptions from company websites</li>
          <li>Include all required skills and qualifications</li>
          <li>Make sure the company name and job title are included</li>
          <li>The more detailed the job description, the better the results</li>
        </ul>
      </div>
    </div>
  );
};

export default JobInput;