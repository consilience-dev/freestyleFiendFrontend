import createClient from 'openapi-fetch';
import type { paths } from '../../types/openapi';

/**
 * Returns a type-safe OpenAPI client for the FreestyleFiend backend API.
 * Usage:
 *   const api = getApiClient();
 *   const { data, error } = await api.GET('/beats');
 *
 * All endpoints and payloads are fully typed from openapi.yaml.
 * See: /types/openapi.d.ts
 */
export function getApiClient(baseUrl: string = 'https://yq51xd1d5a.execute-api.us-east-1.amazonaws.com/prod') {
  return createClient<paths>({ baseUrl });
}

/**
 * Increments the play count for a recording
 * @param recordingId - The ID of the recording that was played
 * @returns Promise that resolves with the API response
 */
export async function incrementPlayCount(recordingId: string) {
  const baseUrl = 'https://yq51xd1d5a.execute-api.us-east-1.amazonaws.com/prod';
  try {
    const response = await fetch(`${baseUrl}/plays`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ recordingId }),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to increment play count: ${response.status}`);
    }
    
    const data = await response.json();
    return { data };
  } catch (error) {
    console.error('Error incrementing play count:', error);
    return { error };
  }
}

/**
 * Fetches the play count for a specific recording
 * @param recordingId - The ID of the recording to get play count for
 * @returns Promise that resolves with play count data
 */
export async function getPlayCount(recordingId: string) {
  const baseUrl = 'https://yq51xd1d5a.execute-api.us-east-1.amazonaws.com/prod';
  try {
    const response = await fetch(`${baseUrl}/plays?recordingId=${recordingId}`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch play count: ${response.status}`);
    }
    
    const data = await response.json();
    return { data };
  } catch (error) {
    console.error('Error fetching play count:', error);
    return { error };
  }
}

/**
 * Fetches most played recordings
 * @param limit - Optional number of recordings to retrieve (default 10)
 * @returns Promise that resolves with most played recordings data
 */
export async function getMostPlayedRecordings(limit: number = 10) {
  const baseUrl = 'https://yq51xd1d5a.execute-api.us-east-1.amazonaws.com/prod';
  try {
    const response = await fetch(`${baseUrl}/plays?limit=${limit}`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch most played recordings: ${response.status}`);
    }
    
    const data = await response.json();
    return { data };
  } catch (error) {
    console.error('Error fetching most played recordings:', error);
    return { error };
  }
}

// Example usage (uncomment to use):
// const api = getApiClient();
// api.GET('/beats').then(({ data, error }) => {
//   if (error) { console.error(error); return; }
//   console.log(data);
// });
