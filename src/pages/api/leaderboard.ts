import type { NextApiRequest, NextApiResponse } from 'next';
import { getAccessToken } from '@/lib/auth';
import { Recording } from '@/types/recordings';

/**
 * API handler for fetching leaderboard data
 * Proxies requests to the backend API and handles authentication
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  try {
    // Get filter parameters from query
    const { timeFrame = 'week', limit = '20', explicit = 'true' } = req.query;
    
    // Create query parameters for backend API
    const queryParams = new URLSearchParams();
    
    // API expects date in YYYYMMDD format for specific dates
    // Let's only add date for 'day' timeframe
    if (timeFrame === 'day') {
      const today = new Date();
      const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
      queryParams.append('date', dateStr);
    }
    
    // Get API base URL from environment variables
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
    
    if (!apiBaseUrl) {
      throw new Error('API base URL is not defined');
    }
    
    // Get JWT token for authenticated requests
    const token = await getAccessToken();
    
    // Construct the full API URL
    const apiUrl = `${apiBaseUrl}/leaderboard${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    
    console.log(`Calling backend API: ${apiUrl}`);
    
    // Call the backend API
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      },
    });
    
    if (!response.ok) {
      throw new Error(`Error fetching leaderboard: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Mapping function to convert backend response to frontend format
    // Adjust this based on the actual response format from your backend
    const mapToRecordings = (data: any): Recording[] => {
      // Check if we have the expected backend format
      if (data && data.topRecordings && Array.isArray(data.topRecordings)) {
        // Map backend recordings to our frontend format
        return data.topRecordings.map((id: string, index: number) => ({
          id,
          title: `Freestyle #${index + 1}`,
          artistName: 'Unknown Artist',
          beatId: 'unknown',
          beatName: 'Unknown Beat',
          createdAt: new Date().toISOString(),
          explicit: false,
          audioUrl: `${apiBaseUrl}/recordings/${id}`,
          votes: 0
        }));
      }
      
      // If the format is unexpected, return an empty array
      console.warn('Unexpected backend response format:', data);
      return [];
    };
    
    // Transform the backend response to our frontend format
    const recordings = mapToRecordings(data);
    
    // Filter explicit content if needed
    const filteredRecordings = explicit === 'false' 
      ? recordings.filter(recording => !recording.explicit)
      : recordings;
    
    // Apply limit
    const limitNum = parseInt(limit as string, 10);
    const limitedRecordings = !isNaN(limitNum) && limitNum > 0
      ? filteredRecordings.slice(0, limitNum)
      : filteredRecordings;
    
    return res.status(200).json(limitedRecordings);
  } catch (error) {
    console.error('Leaderboard API error:', error);
    return res.status(500).json({ message: 'Failed to fetch leaderboard data' });
  }
}
