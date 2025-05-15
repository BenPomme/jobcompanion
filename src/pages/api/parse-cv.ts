import type { NextApiRequest, NextApiResponse } from 'next';
import { parseCV } from '@/services/cv-parser';
import axios from 'axios';

type RequestData = {
  fileUrl: string;
};

type ResponseData = {
  parsedData?: any;
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
    const { fileUrl } = req.body as RequestData;

    if (!fileUrl) {
      return res.status(400).json({ error: 'Missing file URL' });
    }

    // Download the file
    const response = await axios.get(fileUrl, {
      responseType: 'arraybuffer',
    });

    // Determine file type from URL or content-type
    const contentType = response.headers['content-type'];
    const fileType = contentType.includes('pdf') ? 'pdf' 
                   : contentType.includes('word') ? 'docx' 
                   : 'unknown';

    if (fileType === 'unknown') {
      return res.status(400).json({ error: 'Unsupported file type' });
    }

    // Convert file to buffer
    const fileBuffer = Buffer.from(response.data);

    // Extract text content from file
    const textContent = await parseCV(fileBuffer.toString('utf-8'));

    return res.status(200).json({ 
      parsedData: textContent
    });
  } catch (error) {
    console.error('Error parsing CV:', error);
    return res.status(500).json({
      error: 'Failed to parse CV',
    });
  }
}