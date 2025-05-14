import type { NextApiRequest, NextApiResponse } from 'next';
import { getLinkedInAuthUrl } from '@/services/linkedin-service';

type ResponseData = {
  authUrl?: string;
  error?: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const authUrl = await getLinkedInAuthUrl();
    
    return res.status(200).json({ authUrl });
  } catch (error) {
    console.error('Error getting LinkedIn auth URL:', error);
    return res.status(500).json({
      error: 'Failed to generate LinkedIn authentication URL',
    });
  }
}