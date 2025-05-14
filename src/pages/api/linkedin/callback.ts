import type { NextApiRequest, NextApiResponse } from 'next';
import { getAccessToken, getProfileData } from '@/services/linkedin-service';

type RequestData = {
  code: string;
};

type ResponseData = {
  profile?: any;
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
    const { code } = req.body as RequestData;

    if (!code) {
      return res.status(400).json({ error: 'Missing authorization code' });
    }

    // Exchange code for access token
    const accessToken = await getAccessToken(code);

    // Get user profile data
    const profileData = await getProfileData(accessToken);
    
    return res.status(200).json({ profile: profileData });
  } catch (error) {
    console.error('Error processing LinkedIn callback:', error);
    return res.status(500).json({
      error: 'Failed to process LinkedIn authentication',
    });
  }
}