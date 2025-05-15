import type { NextApiRequest, NextApiResponse } from 'next';
import { OpenAI } from 'openai';
import puppeteer from 'puppeteer';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { url } = req.body;
  if (!url || typeof url !== 'string' || !url.includes('linkedin.com/jobs/')) {
    return res.status(400).json({ error: 'Invalid LinkedIn job URL' });
  }

  try {
    // Try OpenAI first to extract job details
    try {
      const jobData = await extractJobWithOpenAI(url);
      if (jobData && jobData.description && jobData.title) {
        return res.status(200).json({ job: jobData });
      }
    } catch (openaiError) {
      console.warn('OpenAI extraction failed, falling back to Puppeteer:', openaiError);
    }

    // Fallback to Puppeteer if OpenAI fails
    try {
      const jobData = await extractJobWithPuppeteer(url);
      return res.status(200).json({ job: jobData });
    } catch (puppeteerError) {
      console.error('Puppeteer extraction failed:', puppeteerError);
      throw new Error('Failed to extract job data with both methods');
    }
  } catch (error: any) {
    console.error('Error extracting LinkedIn job:', error);
    return res.status(500).json({ error: 'Failed to extract job details' });
  }
}

/**
 * Extract job details using OpenAI
 */
async function extractJobWithOpenAI(url: string) {
  const completion = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      {
        role: "system",
        content: "You are a job description parser. Extract structured information from a LinkedIn job URL. Return ONLY valid JSON with no additional text."
      },
      {
        role: "user",
        content: `Extract all information from this LinkedIn job posting: ${url}. Include title, company, location, description, requirements, qualifications, responsibilities, jobType, industry, experienceLevel, and benefits. Format as detailed JSON.`
      }
    ],
    response_format: { type: "json_object" },
    temperature: 0.2,
  });

  const content = completion.choices[0].message.content || '{}';
  try {
    const jobData = JSON.parse(content);
    return {
      ...jobData,
      url
    };
  } catch (parseError) {
    console.error('Failed to parse OpenAI response:', parseError);
    throw parseError;
  }
}

/**
 * Extract job details using Puppeteer as fallback
 */
async function extractJobWithPuppeteer(url: string) {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();
    
    // Set a common user agent to avoid detection
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
    
    // Navigate to the job posting
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });
    
    // Wait for the job details to load
    await page.waitForSelector('.job-details', { timeout: 30000 }).catch(() => {
      console.log('Could not find .job-details, trying alternative selectors...');
    });
    
    // Extract job details with error handling
    const jobData = await page.evaluate(() => {
      const title = document.querySelector('.job-title')?.textContent?.trim() || 
                    document.querySelector('h1')?.textContent?.trim() || 
                    'Unknown Title';
      
      const company = document.querySelector('.company-name')?.textContent?.trim() || 
                      document.querySelector('.company')?.textContent?.trim() || 
                      'Unknown Company';
      
      const location = document.querySelector('.job-location')?.textContent?.trim() || 
                       document.querySelector('.location')?.textContent?.trim() || 
                       'Unknown Location';
      
      const descriptionElement = document.querySelector('.job-description') || 
                                document.querySelector('.description');
      
      const description = descriptionElement ? descriptionElement.textContent?.trim() || '' : '';
      
      // Extract lists of requirements if they exist
      const requirementsList = Array.from(document.querySelectorAll('.requirements li, .qualifications li'))
        .map(item => item.textContent?.trim())
        .filter(text => text && text.length > 0) || [];
      
      return {
        title,
        company,
        location,
        description,
        requirements: requirementsList,
        url: window.location.href
      };
    });
    
    await browser.close();
    return jobData;
  } catch (error) {
    await browser.close();
    throw error;
  }
} 