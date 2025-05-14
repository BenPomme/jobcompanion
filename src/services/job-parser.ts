import axios from 'axios';
import openai from '@/utils/openai';

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
  try {
    const prompt = `
      Extract structured information from this job posting. Return a JSON object with the following format:
      {
        "title": "Job title",
        "company": "Company name",
        "location": "Job location",
        "description": "General job description",
        "requirements": ["Requirement 1", "Requirement 2", ...],
        "qualifications": ["Qualification 1", "Qualification 2", ...],
        "responsibilities": ["Responsibility 1", "Responsibility 2", ...],
        "benefits": ["Benefit 1", "Benefit 2", ...],
        "jobType": "Full-time/Part-time/Contract/etc.",
        "industry": "Industry sector",
        "experienceLevel": "Entry/Mid/Senior level"
      }
      
      Only include fields if they are present in the job posting. Here is the job posting text:
      
      ${jobText}
    `;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are a helpful assistant that specializes in parsing job postings into structured data."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.3,
      response_format: { type: "json_object" },
    });

    const parsedContent = response.choices[0]?.message.content || '{}';
    return JSON.parse(parsedContent) as JobDetails;
  } catch (error) {
    console.error('Error parsing job posting:', error);
    throw new Error('Failed to parse job posting content');
  }
}

/**
 * Extract job information from LinkedIn job URL
 */
export async function extractJobFromLinkedInUrl(url: string): Promise<JobDetails> {
  if (!url.includes('linkedin.com/jobs/')) {
    throw new Error('Invalid LinkedIn job URL. Please provide a URL in the format: https://www.linkedin.com/jobs/view/...');
  }
  
  try {
    // Note: In a production environment, you would need to implement
    // proper web scraping that respects LinkedIn's terms of service
    // Here, we're using a simpler approach for demonstration purposes
    
    // Fetch the HTML content from the URL
    const response = await axios.get(url);
    const htmlContent = response.data;
    
    // Use OpenAI to extract job data from the HTML
    const extractionPrompt = `
      Extract job posting information from this LinkedIn job page HTML.
      This is HTML content from a LinkedIn job page: ${htmlContent.substring(0, 10000)}...
      
      Extract the job title, company name, location, job description, requirements, and any other relevant details.
      Format the response as a clear, readable text representation of the job posting.
    `;
    
    const extractionResponse = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are a helpful assistant that extracts job posting details from LinkedIn HTML content."
        },
        {
          role: "user",
          content: extractionPrompt
        }
      ],
      temperature: 0.3,
    });
    
    const extractedText = extractionResponse.choices[0]?.message.content || '';
    
    // Parse the extracted text into structured data
    const jobDetails = await parseJobPosting(extractedText);
    
    // Add the original URL
    jobDetails.url = url;
    
    return jobDetails;
  } catch (error) {
    console.error('Error extracting job from LinkedIn URL:', error);
    throw new Error('Failed to extract job details from LinkedIn URL');
  }
}