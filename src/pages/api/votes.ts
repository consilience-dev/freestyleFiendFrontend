import type { NextApiRequest, NextApiResponse } from 'next';
import { getAccessToken } from '@/lib/auth';
import { VoteResponse } from '@/types/recordings';

/**
 * API handler for voting on recordings
 * Proxies requests to the backend API and handles authentication
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Only allow POST requests
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
    const { recordingId, voteType } = req.body;
    
    if (!recordingId || !voteType) {
      return res.status(400).json({ message: 'Missing required fields' });
    }
    
    // Convert voteType to voteValue expected by the backend API
    const voteValue = voteType === 'up' ? 1 : -1;
    
    // Get API base URL from environment variables
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
    
    if (!apiBaseUrl) {
      throw new Error('API base URL is not defined');
    }
    
    console.log(`Submitting vote to ${apiBaseUrl}/votes`);
    
    // Call the backend API
    const response = await fetch(`${apiBaseUrl}/votes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        recordingId,
        voteValue,
      }),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Vote API error response:', errorText);
      throw new Error(`Error submitting vote: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('Vote API response:', data);
    
    // Map the backend response to our frontend format
    // Adjust based on the actual response format
    const voteResponse: VoteResponse = {
      recordingId,
      votes: data.updatedVotes || 0,
      userVote: voteType,
    };
    
    return res.status(201).json(voteResponse);
  } catch (error) {
    console.error('Vote API error:', error);
    return res.status(500).json({ message: 'Failed to submit vote' });
  }
}
