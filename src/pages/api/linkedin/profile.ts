import type { NextApiRequest, NextApiResponse } from 'next';
import { OpenAI } from 'openai';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { url } = req.body;
  if (!url || typeof url !== 'string' || !url.includes('linkedin.com/in/')) {
    return res.status(400).json({ error: 'Invalid LinkedIn profile URL' });
  }

  try {
    // Use OpenAI API to extract profile data
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

    // Parse the response
    let profileData;
    const content = completion.choices[0].message.content || '{}';
    try {
      profileData = JSON.parse(content);
    } catch (parseError) {
      console.error('Failed to parse OpenAI response:', parseError);
      profileData = {
        name: "Failed to extract",
        headline: "Could not parse LinkedIn profile",
        summary: "Please enter your profile information manually.",
        url
      };
    }

    return res.status(200).json({ profile: profileData });
  } catch (error: any) {
    console.error('Error extracting LinkedIn profile:', error);
    return res.status(500).json({ error: 'Failed to extract profile data' });
  }
} 