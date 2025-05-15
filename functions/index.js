const functions = require('firebase-functions');
const admin = require('firebase-admin');
const express = require('express');
const cors = require('cors')({ origin: true, credentials: true });
const jwt = require('jsonwebtoken');
const puppeteer = require('puppeteer');
const { OpenAI } = require('openai');
const axios = require('axios');

// Initialize admin first so config is properly loaded
admin.initializeApp();

// Initialize OpenAI with Firebase config API key
let openai;
try {
  // Try both key formats since both exist in config
  const openaiApiKey = functions.config().openai?.api_key || functions.config().openai?.apikey;
  
  if (!openaiApiKey) {
    console.error('ERROR: OpenAI API key is not configured. Set it using: firebase functions:config:set openai.api_key=YOUR_KEY');
  } else {
    openai = new OpenAI({
      apiKey: openaiApiKey
    });
    console.log('OpenAI client initialized successfully');
  }
} catch (error) {
  console.error('Failed to initialize OpenAI client:', error);
}

// Get LinkedIn config from Firebase config
const linkedInConfig = {
  clientId: functions.config().linkedin?.client_id,
  clientSecret: functions.config().linkedin?.client_secret,
  redirectUri: 'https://cvjob-3a4ed.web.app/generate', // Updated to frontend page
};

/**
 * API handler function for all API routes
 * This replaces the nextjsServer function for our static export
 */
exports.api = functions.https.onRequest((req, res) => {
  // Set CORS headers manually to ensure they're applied
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.set('Access-Control-Allow-Credentials', 'true');
  
  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }
  
  cors(req, res, () => {
    // Log incoming requests for debugging
    console.log(`API Request path: ${req.path}`);
    console.log(`API Request method: ${req.method}`);

    // Route based on the path
    const path = req.path.replace(/^\/api/, ''); // Remove the /api prefix

    // Handle LinkedIn Auth
    if (path === '/linkedin/auth' && req.method === 'GET') {
      console.log('[Firebase Function] /linkedin/auth called');
      console.log('[Firebase Function] LinkedIn config:', linkedInConfig);
      const scope = encodeURIComponent('openid profile email');
      const state = Math.random().toString(36).substring(2);
      const authUrl = `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${linkedInConfig.clientId}&redirect_uri=${encodeURIComponent(linkedInConfig.redirectUri)}&state=${state}&scope=${scope}`;
      console.log('[Firebase Function] Generated authUrl:', authUrl);
      return res.json({ authUrl });
    }

    // Handle LinkedIn Callback
    if (path === '/linkedin/callback' && req.method === 'POST') {
      console.log('[Firebase Function] /linkedin/callback called');
      const { code } = req.body;
      console.log('[Firebase Function] Received code:', code);
      if (!code) {
        console.error('[Firebase Function] Missing authorization code');
        return res.status(400).json({ error: 'Missing authorization code' });
      }
      // Exchange code for access token and id_token
      return axios.post('https://www.linkedin.com/oauth/v2/accessToken', null, {
        params: {
          grant_type: 'authorization_code',
          code,
          redirect_uri: linkedInConfig.redirectUri,
          client_id: linkedInConfig.clientId,
          client_secret: linkedInConfig.clientSecret,
        },
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      })
      .then(tokenResponse => {
        const { id_token, access_token } = tokenResponse.data;
        console.log('[Firebase Function] Received id_token:', id_token);
        // Decode the id_token (JWT) to get user info
        const decoded = jwt.decode(id_token);
        console.log('[Firebase Function] Decoded id_token:', decoded);
        // Return the profile data
        const profile = {
          id: decoded.sub,
          firstName: decoded.given_name || decoded.name?.split(' ')[0] || '',
          lastName: decoded.family_name || decoded.name?.split(' ')[1] || '',
          email: decoded.email || decoded.email_address || decoded.emailAddress || '',
        };
        console.log('[Firebase Function] Returning profile:', profile);
        return res.json({ profile });
      })
      .catch(error => {
        console.error('[Firebase Function] Error in LinkedIn OAuth flow:', error);
        return res.status(500).json({
          error: 'Failed to authenticate with LinkedIn',
          details: error.message || error.toString(),
        });
      });
    }

    // Handle generate API (expose the cloud function as a REST endpoint)
    if (path === '/generate' && req.method === 'POST') {
      // Extract the auth token from the Authorization header
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
      
      const idToken = authHeader.split('Bearer ')[1];
      
      // Verify the ID token
      return admin.auth().verifyIdToken(idToken)
        .then(decodedToken => {
          const uid = decodedToken.uid;
          const { profileData, jobData } = req.body;
          
          // Now call the generateDocuments function logic directly
          return handleGenerateDocuments(uid, profileData, jobData);
        })
        .then(result => {
          return res.json(result);
        })
        .catch(error => {
          console.error('Error in /generate API:', error);
          return res.status(500).json({
            error: 'Failed to generate documents',
            message: error.message
          });
        });
    }

    // Handle parse-cv API
    if (path === '/parse-cv' && req.method === 'POST') {
      // Extract the auth token from the Authorization header
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
      
      const idToken = authHeader.split('Bearer ')[1];
      
      // Verify the ID token
      return admin.auth().verifyIdToken(idToken)
        .then(decodedToken => {
          const uid = decodedToken.uid;
          const { cvText } = req.body;
          
          // Now call the parseCV function logic directly
          return handleParseCV(uid, cvText);
        })
        .then(result => {
          return res.json(result);
        })
        .catch(error => {
          console.error('Error in /parse-cv API:', error);
          return res.status(500).json({
            error: 'Failed to parse CV',
            message: error.message
          });
        });
    }

    // If not a special route, return 404
    return res.status(404).json({ error: 'API route not found' });
  });
});

// Helper functions for API handlers
async function handleGenerateDocuments(uid, profileData, jobData) {
  // Validate input
  if (!profileData || !jobData) {
    throw new Error('Profile data and job data are required.');
  }

  // Check if OpenAI client is initialized
  if (!openai) {
    throw new Error('OpenAI client is not initialized. Please check server logs and ensure API key is configured.');
  }

  try {
    // Track usage for this user
    await trackUsage(uid);

    // First, analyze the job and profile to identify key matches
    const analysisPrompt = `
      Analyze the following candidate profile and job description to identify key matches and strengths to highlight:
      
      Candidate Profile:
      ${JSON.stringify(profileData, null, 2)}
      
      Job Description:
      ${JSON.stringify(jobData, null, 2)}
      
      Return a JSON object with the following structure:
      {
        "keySkills": ["list of candidate's skills that match job requirements"],
        "relevantExperience": ["list of relevant experience points to highlight"],
        "missingSkills": ["skills in the job description that the candidate might be missing"],
        "suggestedTone": "formal/conversational/etc based on company culture",
        "focusAreas": ["areas the CV and cover letter should emphasize"]
      }
    `;

    const analysisResponse = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are an expert at matching candidate profiles with job requirements. Extract key insights that will help create a tailored CV and cover letter."
        },
        {
          role: "user",
          content: analysisPrompt
        }
      ],
      temperature: 0.3,
      response_format: { type: "json_object" },
    });

    // Parse the analysis
    const analysis = JSON.parse(analysisResponse.choices[0]?.message.content || '{}');

    // Generate CV
    const cvPrompt = `
      Please output only the CV text. Do not include any JSON or extra commentary.

      Create a professional CV for a job application with the following details:
      
      Candidate Profile:
      ${JSON.stringify(profileData, null, 2)}
      
      Job Description:
      ${JSON.stringify(jobData, null, 2)}
      
      Based on analysis, focus on these key matches and strengths:
      ${JSON.stringify(analysis, null, 2)}
      
      Return a professional CV tailored to highlight the candidate's relevant experience and skills for this specific job.
      Format the CV with clear sections for contact information, professional summary, work experience, education, skills, and any other relevant sections.
      Focus on achievements and responsibilities that align with the job requirements.
      Emphasize the key skills identified in the analysis.
      Return the CV in a structured format that can be easily formatted into a document.
    `;

    const cvResponse = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are a professional CV writer who specializes in tailoring CVs to specific job descriptions. You create elegant, ATS-friendly CVs that highlight relevant experience and skills."
        },
        {
          role: "user",
          content: cvPrompt
        }
      ],
      temperature: 0.7,
      max_tokens: 1500,
    });

    // Generate cover letter
    const coverLetterPrompt = `
      Please output only the cover letter text. Do not include any JSON or extra commentary.

      Write a professional cover letter for a job application with the following details:
      
      Candidate Profile:
      ${JSON.stringify(profileData, null, 2)}
      
      Job Description:
      ${JSON.stringify(jobData, null, 2)}
      
      Based on analysis, focus on these key matches and strengths:
      ${JSON.stringify(analysis, null, 2)}
      
      Return a compelling cover letter that introduces the candidate, highlights their relevant experience and skills for this specific job,
      explains why they are interested in the position and company, and includes a call to action.
      The tone should be ${analysis.suggestedTone || 'professional but personable'}.
      Address any potential skill gaps identified in the analysis in a positive way.
      Return the cover letter in a structured format ready for document creation.
    `;

    const coverLetterResponse = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are a professional cover letter writer who crafts compelling letters tailored to specific job applications. Your cover letters are engaging, highlight relevant qualifications, and express genuine interest in the role."
        },
        {
          role: "user",
          content: coverLetterPrompt
        }
      ],
      temperature: 0.7,
      max_tokens: 1000,
    });

    const cv = cvResponse.choices[0]?.message.content || '';
    const coverLetter = coverLetterResponse.choices[0]?.message.content || '';

    // Store the generated documents in Firestore
    await storeGeneratedDocuments(uid, {
      cv,
      coverLetter,
      profileData,
      jobData,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
    });

    return {
      cv,
      coverLetter,
    };
  } catch (error) {
    console.error('Error generating documents:', error);
    throw error;
  }
}

async function handleParseCV(uid, cvText) {
  if (!cvText) {
    throw new Error('CV text is required.');
  }

  // Check if OpenAI client is initialized
  if (!openai) {
    throw new Error('OpenAI client is not initialized. Please check server logs and ensure API key is configured.');
  }

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
      model: "gpt-4o-mini",
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

    return {
      parsedData: JSON.parse(response.choices[0]?.message.content || '{}')
    };
  } catch (error) {
    console.error('Error parsing CV:', error);
    throw error;
  }
}

/**
 * Firebase function to generate CV and cover letter
 * This keeps the OpenAI API key secure on the server
 */
exports.generateDocuments = functions.https.onCall(async (data, context) => {
  // Check if user is authenticated
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'The function must be called while authenticated.'
    );
  }

  // Check if OpenAI client is initialized
  if (!openai) {
    throw new functions.https.HttpsError(
      'internal',
      'OpenAI client is not initialized. Please check server logs and ensure API key is configured.'
    );
  }

  const { profileData, jobData } = data;

  // Validate input
  if (!profileData || !jobData) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'Profile data and job data are required.'
    );
  }

  try {
    // Track usage for this user
    await trackUsage(context.auth.uid);

    // First, analyze the job and profile to identify key matches
    // This uses GPT-4o-mini to save costs while still getting good analysis
    const analysisPrompt = `
      Analyze the following candidate profile and job description to identify key matches and strengths to highlight:
      
      Candidate Profile:
      ${JSON.stringify(profileData, null, 2)}
      
      Job Description:
      ${JSON.stringify(jobData, null, 2)}
      
      Return a JSON object with the following structure:
      {
        "keySkills": ["list of candidate's skills that match job requirements"],
        "relevantExperience": ["list of relevant experience points to highlight"],
        "missingSkills": ["skills in the job description that the candidate might be missing"],
        "suggestedTone": "formal/conversational/etc based on company culture",
        "focusAreas": ["areas the CV and cover letter should emphasize"]
      }
    `;

    const analysisResponse = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are an expert at matching candidate profiles with job requirements. Extract key insights that will help create a tailored CV and cover letter."
        },
        {
          role: "user",
          content: analysisPrompt
        }
      ],
      temperature: 0.3,
      response_format: { type: "json_object" },
    });

    // Parse the analysis
    const analysis = JSON.parse(analysisResponse.choices[0]?.message.content || '{}');

    // Generate CV using GPT-4o for highest quality
    const cvPrompt = `
      Please output only the CV text. Do not include any JSON or extra commentary.

      Create a professional CV for a job application with the following details:
      
      Candidate Profile:
      ${JSON.stringify(profileData, null, 2)}
      
      Job Description:
      ${JSON.stringify(jobData, null, 2)}
      
      Based on analysis, focus on these key matches and strengths:
      ${JSON.stringify(analysis, null, 2)}
      
      Return a professional CV tailored to highlight the candidate's relevant experience and skills for this specific job.
      Format the CV with clear sections for contact information, professional summary, work experience, education, skills, and any other relevant sections.
      Focus on achievements and responsibilities that align with the job requirements.
      Emphasize the key skills identified in the analysis.
      Return the CV in a structured format that can be easily formatted into a document.
    `;

    const cvResponse = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are a professional CV writer who specializes in tailoring CVs to specific job descriptions. You create elegant, ATS-friendly CVs that highlight relevant experience and skills."
        },
        {
          role: "user",
          content: cvPrompt
        }
      ],
      temperature: 0.7,
      max_tokens: 1500,
    });

    // Generate cover letter using GPT-4o for highest quality
    const coverLetterPrompt = `
      Please output only the cover letter text. Do not include any JSON or extra commentary.

      Write a professional cover letter for a job application with the following details:
      
      Candidate Profile:
      ${JSON.stringify(profileData, null, 2)}
      
      Job Description:
      ${JSON.stringify(jobData, null, 2)}
      
      Based on analysis, focus on these key matches and strengths:
      ${JSON.stringify(analysis, null, 2)}
      
      Return a compelling cover letter that introduces the candidate, highlights their relevant experience and skills for this specific job,
      explains why they are interested in the position and company, and includes a call to action.
      The tone should be ${analysis.suggestedTone || 'professional but personable'}.
      Address any potential skill gaps identified in the analysis in a positive way.
      Return the cover letter in a structured format ready for document creation.
    `;

    const coverLetterResponse = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are a professional cover letter writer who crafts compelling letters tailored to specific job applications. Your cover letters are engaging, highlight relevant qualifications, and express genuine interest in the role."
        },
        {
          role: "user",
          content: coverLetterPrompt
        }
      ],
      temperature: 0.7,
      max_tokens: 1000,
    });

    const cv = cvResponse.choices[0]?.message.content || '';
    const coverLetter = coverLetterResponse.choices[0]?.message.content || '';

    // Store the generated documents in Firestore
    await storeGeneratedDocuments(context.auth.uid, {
      cv,
      coverLetter,
      profileData,
      jobData,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
    });

    return {
      cv,
      coverLetter,
    };
  } catch (error) {
    console.error('Error generating documents:', error);
    throw new functions.https.HttpsError(
      'internal',
      'An error occurred while generating documents.',
      error.message
    );
  }
});

/**
 * Function to parse job details from LinkedIn URL
 */
exports.parseLinkedInJob = functions.https.onCall(async (data, context) => {
  // Check if user is authenticated
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'The function must be called while authenticated.'
    );
  }

  // Check if OpenAI client is initialized
  if (!openai) {
    throw new functions.https.HttpsError(
      'internal',
      'OpenAI client is not initialized. Please check server logs and ensure API key is configured.'
    );
  }

  const { url } = data;

  if (!url || !url.includes('linkedin.com/jobs/')) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'A valid LinkedIn job URL is required.'
    );
  }

  try {
    // Use OpenAI to extract job details from the URL
    // In a real implementation, you would use proper web scraping techniques
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are a helpful assistant that extracts job details from LinkedIn URLs."
        },
        {
          role: "user",
          content: `Extract the job title, company name, and other relevant details from this LinkedIn job URL: ${url}`
        }
      ],
      temperature: 0.3,
    });

    return {
      jobDetails: response.choices[0]?.message.content || '',
      url
    };
  } catch (error) {
    console.error('Error parsing LinkedIn job:', error);
    throw new functions.https.HttpsError(
      'internal',
      'An error occurred while parsing the LinkedIn job.',
      error.message
    );
  }
});

/**
 * Function to parse CV text
 */
exports.parseCV = functions.https.onCall(async (data, context) => {
  // Check if user is authenticated
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'The function must be called while authenticated.'
    );
  }

  // Check if OpenAI client is initialized
  if (!openai) {
    throw new functions.https.HttpsError(
      'internal',
      'OpenAI client is not initialized. Please check server logs and ensure API key is configured.'
    );
  }

  const { cvText } = data;

  if (!cvText) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'CV text is required.'
    );
  }

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
      model: "gpt-4o-mini",
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

    return {
      parsedData: JSON.parse(response.choices[0]?.message.content || '{}')
    };
  } catch (error) {
    console.error('Error parsing CV:', error);
    throw new functions.https.HttpsError(
      'internal',
      'An error occurred while parsing the CV.',
      error.message
    );
  }
});

/**
 * Helper function to track API usage for billing/limits
 */
async function trackUsage(userId) {
  const usageRef = admin.firestore().collection('usage').doc(userId);
  
  // Get current date as string YYYY-MM-DD
  const today = new Date().toISOString().split('T')[0];
  
  // Update usage counter using transactions
  return admin.firestore().runTransaction(async (transaction) => {
    const doc = await transaction.get(usageRef);
    
    if (!doc.exists) {
      // New user, create usage document
      transaction.set(usageRef, {
        totalRequests: 1,
        dailyRequests: {
          [today]: 1
        },
        lastUpdated: admin.firestore.FieldValue.serverTimestamp()
      });
    } else {
      // Existing user, update counters
      const data = doc.data();
      const dailyRequests = data.dailyRequests || {};
      const todayCount = dailyRequests[today] || 0;
      
      transaction.update(usageRef, {
        totalRequests: admin.firestore.FieldValue.increment(1),
        [`dailyRequests.${today}`]: todayCount + 1,
        lastUpdated: admin.firestore.FieldValue.serverTimestamp()
      });
    }
  });
}

/**
 * Helper function to store generated documents
 */
async function storeGeneratedDocuments(userId, data) {
  return admin.firestore()
    .collection('generated_documents')
    .add({
      userId,
      ...data
    });
}

// Add to your existing app.post section, alongside other endpoints
exports.linkedinProfile = functions.https.onRequest(async (req, res) => {
  cors(req, res, async () => {
    try {
      const { url } = req.body;
      if (!url || typeof url !== 'string' || !url.includes('linkedin.com/in/')) {
        return res.status(400).json({ error: 'Invalid LinkedIn profile URL' });
      }

      // Check if OpenAI client is initialized
      if (!openai) {
        return res.status(500).json({ 
          error: 'OpenAI client not initialized. Please check server configuration.' 
        });
      }

      console.log(`[Firebase Function] Extracting LinkedIn profile from URL: ${url}`);
      
      // Use OpenAI to extract profile information
      try {
        const completion = await openai.chat.completions.create({
          model: "gpt-4o",
          messages: [
            {
              role: "system",
              content: "You are a LinkedIn profile parser. Extract structured information from a LinkedIn profile URL. Return ONLY valid JSON with no additional text."
            },
            {
              role: "user",
              content: `Extract all professional information from this LinkedIn profile: ${url}. Include name, headline, about/summary, all experience entries (with company, title, dates, description), education, skills, certifications, and any other relevant professional information. Format as detailed JSON.`
            }
          ],
          response_format: { type: "json_object" },
          temperature: 0.2,
        });

        const content = completion.choices[0].message.content || '{}';
        try {
          const profileData = JSON.parse(content);
          console.log('[Firebase Function] Successfully extracted LinkedIn profile data');
          return res.status(200).json({ profile: { ...profileData, url } });
        } catch (parseError) {
          console.error('[Firebase Function] Failed to parse OpenAI response:', parseError);
          return res.status(200).json({ 
            profile: {
              name: "Failed to extract",
              headline: "Could not parse LinkedIn profile",
              summary: "Please enter your profile information manually.",
              url
            }
          });
        }
      } catch (openaiError) {
        console.error('[Firebase Function] OpenAI API error:', openaiError);
        return res.status(200).json({ 
          profile: {
            name: "Profile Extraction Error",
            headline: "Please enter your profile details manually",
            summary: "The system encountered an error while trying to extract your LinkedIn profile. Please enter your profile information manually.",
            url
          }
        });
      }
    } catch (error) {
      console.error('[Firebase Function] Error in /linkedin/profile:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  });
});

exports.jobExtract = functions.https.onRequest(async (req, res) => {
  cors(req, res, async () => {
    try {
      const { url } = req.body;
      if (!url || typeof url !== 'string' || !url.includes('linkedin.com/jobs/')) {
        return res.status(400).json({ error: 'Invalid LinkedIn job URL' });
      }

      console.log(`[Firebase Function] Extracting job from URL: ${url}`);
      
      // Check if OpenAI client is initialized
      if (!openai) {
        console.warn('[Firebase Function] OpenAI client not initialized, skipping OpenAI extraction');
        // Skip to Puppeteer fallback
      } else {
        // Try OpenAI first
        try {
          console.log('[Firebase Function] Attempting to extract job with OpenAI');
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
          const jobData = JSON.parse(content);
          jobData.url = url;
          
          // If OpenAI couldn't get meaningful data, throw an error to trigger Puppeteer fallback
          if (!jobData || !jobData.description || !jobData.title) {
            throw new Error('Insufficient job data from OpenAI');
          }
          
          console.log('[Firebase Function] Successfully extracted job data with OpenAI');
          // Return the result if we have good data from OpenAI
          return res.status(200).json({ job: jobData });
        } catch (openaiError) {
          console.warn('[Firebase Function] OpenAI extraction failed, trying Puppeteer:', openaiError);
          // Continue to Puppeteer fallback
        }
      }
      
      // Fallback to Puppeteer if OpenAI fails
      try {
        console.log('[Firebase Function] Starting Puppeteer for job extraction');
        const browser = await puppeteer.launch({
          headless: true,
          args: ['--no-sandbox', '--disable-setuid-sandbox']
        });

        try {
          const page = await browser.newPage();
          
          // Set a common user agent to avoid detection
          await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
          
          // Navigate to the job posting with increased timeout
          console.log('[Firebase Function] Navigating to job URL with Puppeteer');
          await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });
          
          // Wait for job details to load
          await page.waitForSelector('.job-details, .description, .job-view-layout, [data-job-id]', { timeout: 30000 })
            .catch(() => console.log('[Firebase Function] Could not find standard job selectors, continuing anyway'));
          
          // Extract job details
          console.log('[Firebase Function] Extracting job details with Puppeteer');
          const jobData = await page.evaluate(() => {
            // Try multiple selector patterns for each field - expanded with more modern LinkedIn selectors
            const title = document.querySelector('.job-title, [data-test-job-title], h1, .top-card-layout__title, .job-details-jobs-unified-top-card__job-title')?.textContent?.trim() || 'Unknown Title';
            
            const company = document.querySelector('.company-name, [data-test-company-name], .topcard__org-name, .job-details-jobs-unified-top-card__company-name')?.textContent?.trim() || 'Unknown Company';
            
            const location = document.querySelector('.job-location, [data-test-job-location], .topcard__flavor--bullet, .job-details-jobs-unified-top-card__bullet')?.textContent?.trim() || 'Unknown Location';
            
            // For description, try various selectors and containers with updated LinkedIn selectors
            const descriptionElement = document.querySelector('.job-description, .description__text, .show-more-less-html, .description, .jobs-description__content, .jobs-box__html-content, .jobs-description-content__text');
            const description = descriptionElement ? descriptionElement.textContent?.trim() || '' : '';
            
            // Try to extract requirements lists with expanded selectors
            const requirements = [];
            const requirementElements = document.querySelectorAll('.job-description li, .description__text li, .show-more-less-html li, .jobs-description__content li, .jobs-box__html-content li');
            requirementElements.forEach(item => {
              const text = item.textContent?.trim();
              if (text && text.length > 5) {
                requirements.push(text);
              }
            });
            
            // If we couldn't extract structured data, at least get all text content from the job page
            if (!description || description.length < 50) {
              const allJobContent = document.querySelector('.job-view-layout, .jobs-details, .jobs-unified-top-card__content-container');
              if (allJobContent) {
                const fullText = allJobContent.textContent?.trim() || '';
                return {
                  title,
                  company,
                  location,
                  description: fullText,
                  requirements,
                  url: window.location.href,
                  extractionMethod: 'puppeteer-fallback'
                };
              }
            }
            
            return {
              title,
              company,
              location,
              description,
              requirements,
              url: window.location.href,
              extractionMethod: 'puppeteer'
            };
          });
          
          await browser.close();
          console.log('[Firebase Function] Successfully extracted job with Puppeteer');
          return res.status(200).json({ job: jobData });
        } catch (error) {
          await browser.close();
          throw error;
        }
      } catch (puppeteerError) {
        console.error('[Firebase Function] Puppeteer extraction failed:', puppeteerError);
        // If all methods failed, return a useful error message to the client
        return res.status(200).json({ 
          job: {
            title: "Job Extraction Failed",
            company: "LinkedIn",
            location: "Unknown",
            description: "The system was unable to extract job details from the provided URL. Please paste the job description manually.",
            url: url,
            requirements: [],
            extractionError: true
          }
        });
      }
    } catch (error) {
      console.error('[Firebase Function] Error in /job/extract:', error);
      return res.status(500).json({ error: 'Failed to extract job details' });
    }
  });
});

/**
 * Simple function to check if OpenAI API key is configured
 */
exports.checkOpenAIConfig = functions.https.onCall(async (data, context) => {
  try {
    const openaiApiKey = functions.config().openai?.api_key || functions.config().openai?.apikey;
    
    if (!openaiApiKey) {
      return {
        status: 'error',
        message: 'OpenAI API key is not configured. Please set it using: firebase functions:config:set openai.api_key=YOUR_KEY'
      };
    }
    
    // Test the API key with a simple completion
    try {
      const testResponse = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: "You are a helpful assistant."
          },
          {
            role: "user",
            content: "Test the OpenAI API connection."
          }
        ],
        max_tokens: 5
      });
      
      return {
        status: 'success',
        message: 'OpenAI API key is valid and working.',
        test: testResponse ? 'Connection test succeeded' : null
      };
    } catch (apiError) {
      return {
        status: 'error',
        message: 'OpenAI API key is configured but failed testing: ' + apiError.message,
        error: apiError.message
      };
    }
  } catch (error) {
    return {
      status: 'error',
      message: 'Error checking OpenAI configuration: ' + error.message,
      error: error.message
    };
  }
});