import type { NextApiRequest, NextApiResponse } from 'next';
import { getAccessToken } from '@/lib/auth';

interface Beat {
  beatId: string;
  title: string;
  producer: string;
  genre: string;
  bpm: number;
  duration: string;
  tags: string[];
  description: string;
  audioUrl: string;
  imageUrl: string;
  s3Key: string;
  createdAt: string;
}

/**
 * API handler for fetching beats
 * Proxies requests to the backend API
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
    // Get API base URL from environment variables
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
    
    if (!apiBaseUrl) {
      throw new Error('API base URL is not defined');
    }
    
    // According to the OpenAPI spec, this endpoint doesn't require authentication
    // But we'll include the token if available for potential future changes
    const token = await getAccessToken();
    
    console.log(`Fetching beats from ${apiBaseUrl}/beats`);
    
    // Call the backend API
    const response = await fetch(`${apiBaseUrl}/beats`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      },
    });
    
    if (!response.ok) {
      console.error(`Error response: ${response.status}`);
      throw new Error(`Error fetching beats: ${response.status}`);
    }
    
    const beats: Beat[] = await response.json();
    console.log(`Successfully fetched ${beats.length} beats`);
    
    return res.status(200).json(beats);
  } catch (error) {
    console.error('Beats API error:', error);
    return res.status(500).json({ message: 'Failed to fetch beats' });
  }
}
