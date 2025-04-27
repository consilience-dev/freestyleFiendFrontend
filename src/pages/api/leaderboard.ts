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

  // Get filter parameters from the query
  const { timeFrame = 'week', limit = '20', explicit = 'true' } = req.query;
  
  console.log('Leaderboard API request received with params:', { 
    timeFrame, 
    explicit,
    headers: req.headers,
    fullQuery: req.query
  });
  
  const isExplicit = explicit === 'true';

  try {
    // Create query parameters for backend API
    const queryParams = new URLSearchParams();
    
    // Add all relevant parameters from the request
    if (timeFrame) queryParams.append('timeFrame', timeFrame.toString());
    if (limit) queryParams.append('limit', limit.toString());
    if (explicit !== undefined) queryParams.append('explicit', explicit.toString());
    
    // Add randomize parameter if specified
    const { randomize } = req.query;
    if (randomize === 'true') {
      queryParams.append('randomize', 'true');
      console.log('Randomizing results for voting page');
    }
    
    // Get API base URL from environment variables
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
    
    if (!apiBaseUrl) {
      console.error('API base URL not defined in environment variables');
      return res.status(500).json({ message: 'Server configuration error' });
    }
    
    // Get JWT token for authenticated requests
    const token = await getAccessToken();
    
    // Construct the full API URL
    const apiUrl = `${apiBaseUrl}/leaderboard${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    console.log('Fetching leaderboard data from:', apiUrl);
    
    console.log('Using timeFrame:', timeFrame);
    console.log('All query params:', queryParams.toString());
    
    // Call the backend API
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      },
    });
    
    console.log('Backend API response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error fetching leaderboard data:', errorText);
      return res.status(response.status).json({ message: 'Failed to fetch leaderboard data', error: errorText });
    }
    
    const data = await response.json();
    
    console.log('Backend API response data type:', typeof data);
    console.log('Backend API response is array?', Array.isArray(data));
    console.log('Backend API response data length:', Array.isArray(data) ? data.length : 'N/A');
    console.log('Backend API response data sample:', JSON.stringify(data).substring(0, 500));
    
    // Mapping function to convert backend response to frontend format
    const mapToRecordings = (data: any): Recording[] => {
      console.log('Backend data structure:', JSON.stringify(data, null, 2));
      
      // Handle the actual response format with topRecordings array
      if (data && Array.isArray(data.topRecordings)) {
        console.log('Found topRecordings array with', data.topRecordings.length, 'items');
        
        // Map backend recordings to our frontend format
        return data.topRecordings.map((recording: any) => {
          const recordingId = recording.recordingId;
          
          // Use the direct S3 URL provided by the backend
          const audioUrl = recording.audioUrl || `${apiBaseUrl}/recordings/${recordingId}/audio`;
          
          const mappedRecording: Recording = {
            id: recordingId,
            title: recording.title || `Untitled Recording`,
            // Use the artist name provided by the backend instead of userId
            artistName: recording.artistName || 'Unknown Artist',
            beatId: recording.beatId || '',
            beatName: recording.beatName || '',
            createdAt: recording.createdAt || data.generatedAt || new Date().toISOString(),
            explicit: recording.explicit || false,
            audioUrl: audioUrl,
            votes: recording.votes || 0,
            userVote: null,
            // Add additional fields if we want to use them in the UI
            fireRating: recording.fireRating || 0,
            playCount: recording.playCount || 0
          };
          
          console.log('Mapped recording:', {
            id: mappedRecording.id,
            title: mappedRecording.title,
            artistName: mappedRecording.artistName,
            audioUrl: mappedRecording.audioUrl?.substring(0, 100) + '...' // Log just the beginning of the URL
          });
          
          return mappedRecording;
        });
      }
      
      // If backend sends a direct array of recordings
      if (data && Array.isArray(data)) {
        return data.map((item: any, index: number) => {
          // Get the nested recordingId if it exists
          const recordingId = item.recordingId || `recording-${index}`;
          
          return {
            id: recordingId,
            title: item.title || `Freestyle #${index + 1}`,
            artistName: item.artistName || item.userId || 'Unknown Artist',
            beatId: item.beatId || 'unknown',
            beatName: item.beatName || '',
            createdAt: item.createdAt || new Date().toISOString(),
            explicit: item.explicit || false,
            audioUrl: item.audioUrl || `${apiBaseUrl}/recordings/${recordingId}/audio`,
            votes: item.votes || 0,
            userVote: null
          };
        });
      }
      
      // If the format is unexpected, log it and return an empty array
      console.warn('Unexpected backend response format:', data);
      return [];
    };
    
    // Transform the backend response to our frontend format
    const recordings = mapToRecordings(data);
    
    // Log the mapped recordings
    console.log('Mapped recordings count:', recordings.length);
    if (recordings.length > 0) {
      console.log('First mapped recording sample:', JSON.stringify(recordings[0]));
    }
    
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
    console.error('Error fetching leaderboard data:', error);
    return res.status(500).json({ message: 'An error occurred while fetching leaderboard data' });
  }
}
