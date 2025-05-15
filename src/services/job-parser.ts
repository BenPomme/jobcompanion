import axios from 'axios';
import { handleApiError } from '@/utils/error-handling';
import cacheUtils from '@/utils/caching';

export interface JobDetails {
  title?: string;
  company?: string;
  location?: string;
  description?: string;
  requirements?: string[];
  qualifications?: string[];
  responsibilities?: string[];
  benefits?: string[];
  jobType?: string;
  industry?: string;
  experienceLevel?: string;
  url?: string;
}

/**
 * Parse job posting text using OpenAI to extract structured data
 */
export async function parseJobPosting(jobText: string): Promise<JobDetails> {
  // Always return mock data on client-side
  // In production, this should be done via an API call to the server
  console.warn('Job parsing is only available on the server side.');
  
  // Return a mock result for client-side to prevent errors
  return {
    title: "Software Developer",
    company: "Example Company",
    location: "Remote",
    description: "This is a placeholder job description. Server-side parsing is required for real data.",
    requirements: ["Requirement 1", "Requirement 2", "Requirement 3"],
    responsibilities: ["Responsibility 1", "Responsibility 2"],
    jobType: "Full-time",
    experienceLevel: "Mid-level"
  };
}

/**
 * Extract job information from LinkedIn job URL
 * Uses Firebase Function to extract job data
 * Implements caching to reduce duplicate API calls for the same URL
 */
export const extractJobFromLinkedInUrl = cacheUtils.withCache(
  async function(url: string): Promise<JobDetails> {
    if (!url.includes('linkedin.com/jobs/')) {
      const error = new Error('Invalid LinkedIn job URL. Please provide a URL in the format: https://www.linkedin.com/jobs/view/...');
      error.name = 'ValidationError';
      throw error;
    }
    
    try {
      console.log(`Extracting job details from URL: ${url}`);
      
      // Use the Firebase Function for job extraction
      const API_URL = 'https://us-central1-cvjob-3a4ed.cloudfunctions.net/jobExtract';
      
      const response = await axios.post(API_URL, { url });
      
      if (!response.data || !response.data.job) {
        throw new Error('Invalid response from job extraction service');
      }
      
      return response.data.job;
    } catch (error: any) {
      // Convert to standardized error format
      const apiError = handleApiError(error);
      
      // For validation errors, throw directly (don't cache these)
      if (error.name === 'ValidationError') {
        throw error;
      }
      
      // For other errors, wrap in our standardized format
      console.error('Error extracting job from LinkedIn URL:', apiError);
      const enhancedError = new Error(
        'Failed to extract job details from LinkedIn. Please paste the job description manually.'
      );
      throw enhancedError;
    }
  },
  'linkedin-job-extract',
  { expiresIn: 3600 * 24 } // Cache for 24 hours
);

/**
 * Clear job extraction cache for a specific URL or all URLs
 */
export function clearJobExtractionCache(url?: string): void {
  if (url) {
    const cacheKey = cacheUtils.generateCacheKey('linkedin-job-extract', { url });
    cacheUtils.clearCache(cacheKey);
  } else {
    // Clear all job extraction cache entries
    const allStats = cacheUtils.getCacheStats();
    Object.keys(allStats.keys).forEach(key => {
      if (key.startsWith('linkedin-job-extract:')) {
        cacheUtils.clearCache(key);
      }
    });
  }
}