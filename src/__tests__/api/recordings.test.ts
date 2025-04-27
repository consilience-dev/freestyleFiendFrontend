import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createMocks } from 'node-mocks-http';
import type { NextApiRequest, NextApiResponse } from 'next';
import recordingsHandler from '@/pages/api/recordings';

describe('/api/recordings endpoint', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock fetch for all tests
    global.fetch = vi.fn();
  });

  it('returns 405 for non-POST requests', async () => {
    // Create mock request and response
    const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
      method: 'GET',
    });

    // Call the handler
    await recordingsHandler(req, res);

    // Verify response
    expect(res._getStatusCode()).toBe(405);
    expect(JSON.parse(res._getData())).toEqual({ message: 'Method Not Allowed' });
  });

  it('returns 401 when no authorization header is provided', async () => {
    // Create mock request and response
    const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
      method: 'POST',
      headers: {},
      body: {
        beatId: 'test-beat-id',
        title: 'Test Recording',
        artistName: 'testuser',
        explicit: false,
      },
    });

    // Call the handler
    await recordingsHandler(req, res);

    // Verify response
    expect(res._getStatusCode()).toBe(401);
    expect(JSON.parse(res._getData())).toEqual({ message: 'Unauthorized - No token provided' });
  });

  it('successfully creates a recording when authentication is provided', async () => {
    // Mock successful API response
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        recordingId: 'test-recording-id',
        presignedUrl: 'https://example.com/test-presigned-url'
      }),
      text: () => Promise.resolve(''),
    });
    
    // Mock environment variable
    process.env.NEXT_PUBLIC_API_BASE_URL = 'https://api.example.com';
    
    // Create mock request and response
    const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
      method: 'POST',
      headers: {
        'authorization': 'Bearer test-token'
      },
      body: {
        beatId: 'test-beat-id',
        title: 'Test Recording',
        artistName: 'testuser',
        explicit: false,
      },
    });

    // Call the handler
    await recordingsHandler(req, res);

    // Verify the API was called with correct parameters
    expect(global.fetch).toHaveBeenCalledWith(
      'https://api.example.com/recordings',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'Authorization': 'Bearer test-token'
        }),
        body: expect.any(String)
      })
    );
    
    // Verify response
    expect(res._getStatusCode()).toBe(201);
    expect(JSON.parse(res._getData())).toEqual({
      recordingId: 'test-recording-id',
      presignedUrl: 'https://example.com/test-presigned-url'
    });
  });
});
