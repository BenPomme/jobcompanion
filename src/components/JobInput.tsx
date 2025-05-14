import React, { useState } from 'react';
import { extractJobFromLinkedInUrl } from '@/services/job-parser';

interface JobInputProps {
  onJobDataChange: (jobData: any) => void;
}

const JobInput: React.FC<JobInputProps> = ({ onJobDataChange }) => {
  const [url, setUrl] = useState('');
  const [description, setDescription] = useState('');
  const [inputMethod, setInputMethod] = useState<'url' | 'text'>('url');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  const handleUrlSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!url.trim()) {
      setError('Please enter a LinkedIn job URL');
      return;
    }
    
    if (!url.includes('linkedin.com/jobs/')) {
      setError('Please enter a valid LinkedIn job URL');
      return;
    }
    
    setIsLoading(true);
    
    try {
      const jobData = await extractJobFromLinkedInUrl(url);
      onJobDataChange(jobData);
    } catch (error) {
      console.error('Error extracting job data:', error);
      setError('Failed to extract job data from URL. Please try again or use the text input method.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleDescriptionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!description.trim()) {
      setError('Please enter a job description');
      return;
    }
    
    if (description.length < 100) {
      setError('Please enter a more detailed job description');
      return;
    }
    
    onJobDataChange({
      description,
      // Other fields will be extracted by the parsing service
    });
  };
  
  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-xl font-semibold mb-4">Enter Job Details</h2>
      
      <div className="mb-4">
        <div className="flex border-b border-gray-200">
          <button
            className={`py-2 px-4 ${
              inputMethod === 'url'
                ? 'text-blue-600 border-b-2 border-blue-600 font-medium'
                : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setInputMethod('url')}
          >
            LinkedIn URL
          </button>
          <button
            className={`py-2 px-4 ${
              inputMethod === 'text'
                ? 'text-blue-600 border-b-2 border-blue-600 font-medium'
                : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setInputMethod('text')}
          >
            Job Description
          </button>
        </div>
      </div>
      
      {inputMethod === 'url' ? (
        <form onSubmit={handleUrlSubmit}>
          <div className="mb-4">
            <label htmlFor="jobUrl" className="block text-sm font-medium text-gray-700 mb-1">
              LinkedIn Job URL
            </label>
            <input
              type="url"
              id="jobUrl"
              placeholder="https://www.linkedin.com/jobs/view/..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              required
            />
            <p className="mt-1 text-xs text-gray-500">
              Enter the full URL of the LinkedIn job posting
            </p>
          </div>
          
          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-blue-300 disabled:cursor-not-allowed"
            disabled={isLoading}
          >
            {isLoading ? 'Loading...' : 'Extract Job Details'}
          </button>
          
          {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
        </form>
      ) : (
        <form onSubmit={handleDescriptionSubmit}>
          <div className="mb-4">
            <label htmlFor="jobDescription" className="block text-sm font-medium text-gray-700 mb-1">
              Job Description
            </label>
            <textarea
              id="jobDescription"
              rows={10}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="Paste the full job description here..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
            ></textarea>
            <p className="mt-1 text-xs text-gray-500">
              Make sure to include the job title, requirements, and responsibilities
            </p>
          </div>
          
          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Use This Description
          </button>
          
          {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
        </form>
      )}
    </div>
  );
};

export default JobInput;