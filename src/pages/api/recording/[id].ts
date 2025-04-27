import type { NextApiRequest, NextApiResponse } from 'next';
import { getAccessToken } from '@/lib/auth';
import { Recording } from '@/types/recordings';

/**
 * API handler for fetching a single recording by ID
 * Proxies request to the backend API
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  try {
    // Get the recording ID from the query
    const { id } = req.query;
    
    if (!id || Array.isArray(id)) {
      return res.status(400).json({ message: 'Invalid recording ID' });
    }
    
    // Get API base URL
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
    
    if (!apiBaseUrl) {
      throw new Error('API base URL is not defined');
    }
    
    // Try to get token for authenticated request (optional)
    let headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    
    try {
      const token = await getAccessToken();
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    } catch (error) {
      console.warn('No authentication token available:', error);
      // Continue without auth token
    }
    
    // Call the backend API
    const response = await fetch(`${apiBaseUrl}/recordings/${id}`, {
      method: 'GET',
      headers,
    });
    
    if (!response.ok) {
      if (response.status === 404) {
        return res.status(404).json({ message: 'Recording not found' });
      }
      throw new Error(`Error fetching recording: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Map the backend response to our frontend format
    const recording: Recording = {
      id: data.recordingId || data.id,
      title: data.title || 'Untitled Recording',
      artistName: data.artistName || 'Unknown Artist',
      beatId: data.beatId || '',
      beatName: data.beatName || '',
      createdAt: data.createdAt || new Date().toISOString(),
      explicit: data.explicit || false,
      audioUrl: data.audioUrl || `${apiBaseUrl}/recordings/${data.recordingId || data.id}/audio`,
      votes: data.votes || 0,
      userVote: data.userVote || null,
      fireRating: data.fireRating || 0,
      playCount: data.playCount || 0
    };
    
    return res.status(200).json(recording);
  } catch (error) {
    console.error('Error fetching recording:', error);
    return res.status(500).json({ message: 'Failed to fetch recording' });
  }
}
