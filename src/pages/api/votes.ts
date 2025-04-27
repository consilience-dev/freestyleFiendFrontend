import type { NextApiRequest, NextApiResponse } from 'next';
import { VoteResponse } from '@/types/recordings';

/**
 * API handler for voting on recordings and retrieving voted recordings
 * Proxies requests to the backend API and handles authentication
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  console.log('Votes API called with method:', req.method);
  console.log('Request headers:', JSON.stringify(req.headers, null, 2));
  
  // Handle different HTTP methods
  if (req.method === 'GET') {
    return handleGetVotes(req, res);
  } else if (req.method === 'POST') {
    return handlePostVote(req, res);
  } else {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }
}

/**
 * Handle GET requests to fetch the user's previously voted recordings
 */
async function handleGetVotes(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    // Get JWT token from the Authorization header
    const authHeader = req.headers.authorization;
    console.log('Authorization header:', authHeader);
    const token = authHeader ? authHeader.split(' ')[1] : null;
    
    if (!token) {
      console.error('No token provided in Authorization header');
      return res.status(401).json({ message: 'Unauthorized - No token provided' });
    }
    
    // Get API base URL from environment variables
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
    if (!apiBaseUrl) {
      console.error('API base URL is not defined in environment variables');
      return res.status(500).json({ message: 'API configuration error' });
    }
    
    console.log(`Fetching voted recordings from: ${apiBaseUrl}/votes`);
    
    // Call the backend API to get the user's voted recordings
    const response = await fetch(`${apiBaseUrl}/votes`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    
    console.log('Backend API response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Backend API error (${response.status}):`, errorText);
      return res.status(response.status).json({ message: `Error from backend: ${errorText}` });
    }
    
    // Return the list of votedRecordingIds to the client
    const data = await response.json();
    console.log('Voted recordings response:', data);
    return res.status(200).json(data);
  } catch (error) {
    console.error('Error fetching voted recordings:', error);
    return res.status(500).json({ message: 'Failed to fetch voted recordings' });
  }
}

/**
 * Handle POST requests to submit a vote for a recording
 */
async function handlePostVote(
  req: NextApiRequest,
  res: NextApiResponse
) {
  console.log('Request body:', JSON.stringify(req.body, null, 2));
  
  try {
    // Get JWT token from the Authorization header sent by the client
    const authHeader = req.headers.authorization;
    console.log('Authorization header:', authHeader);
    const token = authHeader ? authHeader.split(' ')[1] : null;
    
    if (!token) {
      console.error('No token provided in Authorization header');
      return res.status(401).json({ message: 'Unauthorized - No token provided' });
    }
    
    try {
      // Get request data
      const { recordingId, voteType } = req.body;
      console.log('Vote request data:', { recordingId, voteType });
      
      if (!recordingId || !voteType) {
        console.error('Missing required fields:', { recordingId, voteType });
        return res.status(400).json({ message: 'Missing required fields' });
      }
      
      // Restore the real backend voting implementation
      try {
        // Convert voteType to voteValue expected by the backend API
        const voteValue = voteType === 'up' ? 1 : -1;
        // Get API base URL from environment variables
        const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
        if (!apiBaseUrl) {
          console.error('API base URL is not defined in environment variables');
          throw new Error('API base URL is not defined');
        }
        console.log(`Calling backend API: ${apiBaseUrl}/castvote`);
        // Call the new backend API endpoint as per backend team instructions
        const backendUrl = `${apiBaseUrl}/castvote`;
        console.log(`Calling backend API: ${backendUrl}`);
        const backendRequestBody = JSON.stringify({
          recordingId,
          voteValue, // Must match OpenAPI contract
        });
        console.log('Request body as string:', backendRequestBody);
        // Log token (partially redacted for security)
        const tokenPreview = token.length > 10 ? `${token.substring(0, 5)}...${token.substring(token.length - 5)}` : '[token]';
        console.log(`Using token preview: ${tokenPreview}`);
        const response = await fetch(backendUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: backendRequestBody,
        });
        console.log('Backend API response status:', response.status);
        if (!response.ok) {
          const errorText = await response.text();
          console.error(`Backend API error (${response.status}):`, errorText);
          return res.status(response.status).json({ message: `Error from backend: ${errorText}` });
        }
        try {
          const data = await response.json();
          console.log('Vote API response:', data);
          // Map the backend response to our frontend format (adjust as needed)
          const voteResponse: VoteResponse = {
            recordingId,
            votes: data.updatedVotes || 0,
            userVote: voteType,
          };
          return res.status(200).json(voteResponse);
        } catch (jsonError) {
          console.error('Error parsing response JSON:', jsonError);
          return res.status(500).json({ message: 'Error parsing backend response' });
        }
      } catch (apiUrlError) {
        console.error('Error preparing or sending backend request:', apiUrlError);
        return res.status(500).json({ message: `API configuration error: ${apiUrlError.message}` });
      }
    } catch (dataError) {
      console.error('Error processing request data:', dataError);
      return res.status(500).json({ message: `Data processing error: ${dataError.message}` });
    }
  } catch (authError) {
    console.error('Authentication error:', authError);
    return res.status(500).json({ message: `Authentication error: ${authError.message}` });
  }
}
