import type { NextApiRequest, NextApiResponse } from 'next';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

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
      // Get Firebase Functions instance
      const functions = getFunctions(getApp());
      
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
      
      // Extract error message from Firebase Functions error
      const errorMessage = error.message || 'Failed to generate documents';
      return res.status(500).json({
        error: errorMessage,
      });
    }
  } catch (error) {
    console.error('Error processing request:', error);
    return res.status(500).json({
      error: 'Internal server error',
    });
  }
}