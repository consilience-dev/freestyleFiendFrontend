import type { NextApiRequest, NextApiResponse } from 'next';
import { getAccessToken } from '@/lib/auth';

interface RecordingResponse {
  recordingId: string;
  presignedUrl: string;
}

/**
 * API handler for creating new recordings
 * Creates metadata in the backend and returns a presigned URL for uploading the audio file
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Only allow POST requests for creating new recordings
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  try {
    // Get JWT token - this endpoint requires authentication
    const token = await getAccessToken();
    
    if (!token) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    
    // Get request data
    const { beatId, title, explicit, artistName } = req.body;
    
    if (!beatId || !title) {
      return res.status(400).json({ message: 'Missing required fields' });
    }
    
    // Get API base URL from environment variables
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
    
    if (!apiBaseUrl) {
      throw new Error('API base URL is not defined');
    }
    
    console.log(`Creating recording at ${apiBaseUrl}/recordings`);
    
    // Call the backend API to create recording metadata
    const response = await fetch(`${apiBaseUrl}/recordings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        beatId,
        title,
        artistName,
        explicit: explicit === true,
      }),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Recording API error response:', errorText);
      throw new Error(`Error creating recording: ${response.status}`);
    }
    
    const data: RecordingResponse = await response.json();
    console.log('Recording created successfully:', data);
    
    // Return the recordingId and presignedUrl for uploading the audio file
    return res.status(201).json(data);
  } catch (error) {
    console.error('Recording API error:', error);
    return res.status(500).json({ message: 'Failed to create recording' });
  }
}
