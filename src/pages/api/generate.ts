import type { NextApiRequest, NextApiResponse } from 'next';

// Dynamically import Firebase modules only when needed for server-side
let firebaseFunctionsInitialized = false;
let getFunctions: any;
let httpsCallable: any;
let getApp: any;

// Initialize Firebase Functions
async function initFirebaseFunctions() {
  if (firebaseFunctionsInitialized) {
    return true;
  }
  
  try {
    // Import Firebase modules
    const appModule = await import('firebase/app');
    const functionsModule = await import('firebase/functions');
    
    // Assign imported functions
    getApp = appModule.getApp;
    getFunctions = functionsModule.getFunctions;
    httpsCallable = functionsModule.httpsCallable;
    
    firebaseFunctionsInitialized = true;
    return true;
  } catch (error) {
    console.error('Error initializing Firebase Functions:', error);
    return false;
  }
}

type RequestData = {
  profileData: {
    name?: string;
    experience?: Array<{
      title: string;
      company: string;
      description: string;
      startDate?: string;
      endDate?: string;
    }>;
    education?: Array<{
      institution: string;
      degree: string;
      field: string;
      startDate?: string;
      endDate?: string;
    }>;
    skills?: string[];
    // Other CV data fields
  };
  jobData: {
    title?: string;
    company?: string;
    description?: string;
    requirements?: string[];
    // Other job data fields
  };
};

type ResponseData = {
  cv?: string;
  coverLetter?: string;
  error?: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { profileData, jobData } = req.body as RequestData;

    if (!profileData || !jobData) {
      return res.status(400).json({ error: 'Missing required data' });
    }

    // Get the user's ID token from the request headers
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized: Missing or invalid authorization header' });
    }

    try {
      // Initialize Firebase Functions
      const functionsInitialized = await initFirebaseFunctions();
      
      if (!functionsInitialized) {
        // If Firebase Functions can't be initialized or running on client-side,
        // return mock data for static build/preview
        return res.status(200).json({
          cv: generateMockCV(profileData, jobData),
          coverLetter: generateMockCoverLetter(profileData, jobData),
        });
      }
      
      // Try to get Firebase app and functions
      let app;
      try {
        app = getApp();
      } catch (error) {
        console.error('Error getting Firebase app:', error);
        // Return mock data as fallback
        return res.status(200).json({
          cv: generateMockCV(profileData, jobData),
          coverLetter: generateMockCoverLetter(profileData, jobData),
        });
      }

      // Get Firebase Functions instance
      const functions = getFunctions(app);

      if (!functions) {
        throw new Error('Firebase Functions not initialized');
      }

      // Create a callable function reference
      const generateDocuments = httpsCallable(functions, 'generateDocuments');
      
      // Call the Firebase Function
      const result = await generateDocuments({
        profileData,
        jobData
      });
      
      // Extract data from the result
      const data = result.data as { cv: string; coverLetter: string };
      
      // Return the generated CV and cover letter
      return res.status(200).json({
        cv: data.cv,
        coverLetter: data.coverLetter,
      });
    } catch (error: any) {
      console.error('Error calling Firebase function:', error);
      
      // For static build/preview, return mock data
      return res.status(200).json({
        cv: generateMockCV(profileData, jobData),
        coverLetter: generateMockCoverLetter(profileData, jobData),
      });
    }
  } catch (error) {
    console.error('Error processing request:', error);
    return res.status(500).json({
      error: 'Internal server error',
    });
  }
}

// Helper function to generate a mock CV for static builds
function generateMockCV(profileData: RequestData['profileData'], jobData: RequestData['jobData']): string {
  const name = profileData.name || 'Sample Candidate';
  const skills = profileData.skills?.join(', ') || 'Various skills relevant to the position';
  
  return `CURRICULUM VITAE

${name.toUpperCase()}
Email: sample@example.com
Phone: (123) 456-7890
Location: New York, NY

PROFESSIONAL SUMMARY:
Experienced professional with a track record of success in ${jobData.title || 'relevant roles'}. Skilled in ${skills}, with a passion for delivering high-quality results.

PROFESSIONAL EXPERIENCE:
${generateExperienceSection(profileData.experience)}

EDUCATION:
${generateEducationSection(profileData.education)}

SKILLS:
${profileData.skills?.join('\n') || '- Skill 1\n- Skill 2\n- Skill 3'}

This is a preview CV generated for demonstration purposes in the static build environment.
Complete CV generation is available when deployed with full Firebase Functions.`;
}

// Helper function to generate a mock cover letter for static builds
function generateMockCoverLetter(profileData: RequestData['profileData'], jobData: RequestData['jobData']): string {
  const name = profileData.name || 'Sample Candidate';
  const company = jobData.company || 'Your Company';
  const position = jobData.title || 'the advertised position';
  
  return `${new Date().toLocaleDateString()}

Dear Hiring Manager,

I am writing to express my interest in the ${position} position at ${company}. With my background and skills, I believe I am a strong candidate for this role.

${jobData.description ? `I was excited to see that you are looking for someone who can ${jobData.description.substring(0, 100)}...` : 'I was excited to see your job posting and believe my qualifications align well with your requirements.'}

${profileData.experience && profileData.experience.length > 0 ? `During my time at ${profileData.experience[0].company} as a ${profileData.experience[0].title}, I gained valuable experience that I believe would benefit your organization.` : 'Throughout my career, I have developed skills that would make me a valuable addition to your team.'}

I would welcome the opportunity to discuss how my background, skills, and accomplishments would be beneficial to your organization. Thank you for your consideration.

Sincerely,
${name}

This is a preview cover letter generated for demonstration purposes in the static build environment.
Complete cover letter generation is available when deployed with full Firebase Functions.`;
}

// Helper function to generate experience section
function generateExperienceSection(experience?: RequestData['profileData']['experience']): string {
  if (!experience || experience.length === 0) {
    return `JOB TITLE
Company Name | Location | MM/YYYY - Present
- Achieved key results for the organization
- Implemented important projects and initiatives
- Collaborated with cross-functional teams`;
  }
  
  return experience.map(job => {
    return `${job.title?.toUpperCase() || 'JOB TITLE'}
${job.company || 'Company Name'} | ${job.startDate || 'MM/YYYY'} - ${job.endDate || 'Present'}
${job.description || '- Responsibilities and achievements in this role'}`;
  }).join('\n\n');
}

// Helper function to generate education section
function generateEducationSection(education?: RequestData['profileData']['education']): string {
  if (!education || education.length === 0) {
    return `DEGREE NAME
Institution Name | Location | MM/YYYY - MM/YYYY`;
  }
  
  return education.map(edu => {
    return `${edu.degree?.toUpperCase() || 'DEGREE NAME'} in ${edu.field || 'Field of Study'}
${edu.institution || 'Institution Name'} | ${edu.startDate || 'YYYY'} - ${edu.endDate || 'YYYY'}`;
  }).join('\n\n');
}