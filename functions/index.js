const functions = require('firebase-functions');
const admin = require('firebase-admin');
const { OpenAI } = require('openai');

admin.initializeApp();

// Initialize OpenAI with API key from environment variables
// In production, this comes from Firebase Functions config
// In development, it comes from environment variables
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || functions.config().openai?.apikey,
});

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