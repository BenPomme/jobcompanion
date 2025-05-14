// This is a simplified CV parser service
// In a real-world scenario, you might use a dedicated parsing service or library

import openai from '@/utils/openai';

export interface ParsedCV {
  name?: string;
  email?: string;
  phone?: string;
  location?: string;
  summary?: string;
  experience?: Array<{
    title?: string;
    company?: string;
    location?: string;
    startDate?: string;
    endDate?: string;
    description?: string;
  }>;
  education?: Array<{
    institution?: string;
    degree?: string;
    field?: string;
    startDate?: string;
    endDate?: string;
  }>;
  skills?: string[];
  languages?: string[];
  certifications?: Array<{
    name?: string;
    issuer?: string;
    date?: string;
  }>;
}

/**
 * Parse CV content using OpenAI to extract structured data
 * @param cvText Raw text extracted from a CV document
 */
export async function parseCV(cvText: string): Promise<ParsedCV> {
  try {
    const prompt = `
      Extract structured information from this CV text. Return a JSON object with the following format:
      {
        "name": "Full name",
        "email": "Email address",
        "phone": "Phone number",
        "location": "City, Country",
        "summary": "Professional summary",
        "experience": [
          {
            "title": "Job title",
            "company": "Company name",
            "location": "Work location",
            "startDate": "Start date (MM/YYYY)",
            "endDate": "End date (MM/YYYY) or 'Present'",
            "description": "Job description"
          }
        ],
        "education": [
          {
            "institution": "School/University name",
            "degree": "Degree type",
            "field": "Field of study",
            "startDate": "Start date (YYYY)",
            "endDate": "End date (YYYY)"
          }
        ],
        "skills": ["Skill 1", "Skill 2", ...],
        "languages": ["Language 1", "Language 2", ...],
        "certifications": [
          {
            "name": "Certification name",
            "issuer": "Issuing organization",
            "date": "Issue date (MM/YYYY)"
          }
        ]
      }
      
      Only include fields if they are present in the CV. Here is the CV text:
      
      ${cvText}
    `;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are a helpful assistant that specializes in parsing CV/resume information into structured data."
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
    return JSON.parse(parsedContent) as ParsedCV;
  } catch (error) {
    console.error('Error parsing CV:', error);
    throw new Error('Failed to parse CV content');
  }
}

/**
 * Extract text from a PDF or DOCX file 
 * Note: In a real implementation, you would use libraries like pdf.js, mammoth, etc.
 * This is a placeholder for the actual implementation
 */
export async function extractTextFromFile(fileBuffer: Buffer, fileType: string): Promise<string> {
  // This is a placeholder for actual text extraction implementation
  // In a real application, you would use libraries to extract text from PDF or DOCX files
  
  try {
    // Use OpenAI's extraction for simplicity in this demo
    // In production, you'd use dedicated libraries
    
    // Convert buffer to base64
    const base64File = fileBuffer.toString('base64');
    
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are a helpful assistant that extracts text content from documents."
        },
        {
          role: "user",
          content: `Extract all text content from this ${fileType} file, maintaining the original structure as much as possible. File content in base64: ${base64File.substring(0, 1000)}...`
        }
      ],
      temperature: 0.3,
    });
    
    return response.choices[0]?.message.content || '';
  } catch (error) {
    console.error('Error extracting text from file:', error);
    throw new Error('Failed to extract text from file');
  }
}