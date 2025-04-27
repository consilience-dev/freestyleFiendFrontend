import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createMocks } from 'node-mocks-http';
import type { NextApiRequest, NextApiResponse } from 'next';
import uploadHandler from '@/pages/api/upload';
import fetch from 'node-fetch';
import * as fs from 'fs';

// Mock external dependencies
vi.mock('formidable', () => {
  const mockFile = {
    filepath: '/tmp/mock-file.wav',
    originalFilename: 'audio-recording.wav',
    mimetype: 'audio/wav',
    size: 1024,
  };
  
  const mockIncomingForm = vi.fn().mockImplementation(() => ({
    parse: vi.fn().mockImplementation((req, callback) => {
      callback(null, 
        { presignedUrl: ['https://example.com/presigned-upload-url'] }, 
        { audioFile: [mockFile] }
      );
    }),
    keepExtensions: true,
  }));
  
  // Store a reference to be able to modify it later in tests
  vi.stubGlobal('__mockFormParse', mockIncomingForm().parse);
  
  return {
    IncomingForm: mockIncomingForm
  };
});

// Properly mock fs with its promises property
vi.mock('fs', () => {
  // Create spy functions for tracking calls
  const readFileSpy = vi.fn().mockResolvedValue(Buffer.from('mock audio data'));
  const unlinkSpy = vi.fn().mockResolvedValue(undefined);
  
  return {
    default: {
      promises: {
        readFile: readFileSpy,
        unlink: unlinkSpy,
      }
    },
    promises: {
      readFile: readFileSpy,
      unlink: unlinkSpy,
    }
  };
});

vi.mock('node-fetch', () => {
  return {
    default: vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: vi.fn().mockResolvedValue('success'),
    }),
  };
});

describe('/api/upload endpoint', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 405 for non-POST requests', async () => {
    const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
      method: 'GET',
    });

    await uploadHandler(req, res);

    expect(res._getStatusCode()).toBe(405);
    expect(JSON.parse(res._getData())).toEqual({ message: 'Method Not Allowed' });
  });

  it('returns 401 when no authorization header is provided', async () => {
    const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
      method: 'POST',
      headers: {},
    });

    await uploadHandler(req, res);

    expect(res._getStatusCode()).toBe(401);
    expect(JSON.parse(res._getData())).toEqual({ message: 'Unauthorized - No token provided' });
  });

  it('successfully processes file upload to S3', async () => {
    const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
      method: 'POST',
      headers: {
        'authorization': 'Bearer mock-token',
      },
    });

    await uploadHandler(req, res);

    // Verify file was read and fetch was called with the correct params
    expect(fs.promises.readFile).toHaveBeenCalledWith('/tmp/mock-file.wav');
    expect(fetch).toHaveBeenCalledWith(
      'https://example.com/presigned-upload-url',
      expect.objectContaining({
        method: 'PUT',
        body: expect.any(Buffer),
        headers: expect.objectContaining({
          'Content-Type': 'audio/webm',
        }),
      })
    );

    // Verify temp file was deleted
    expect(fs.promises.unlink).toHaveBeenCalledWith('/tmp/mock-file.wav');

    // Verify success response
    expect(res._getStatusCode()).toBe(200);
    expect(JSON.parse(res._getData())).toEqual({
      success: true,
      message: 'Recording uploaded successfully',
    });
  });

  it('handles S3 upload errors', async () => {
    // Mock fetch to simulate an S3 upload error
    (fetch as unknown as any).mockResolvedValueOnce({
      ok: false,
      status: 403,
      text: vi.fn().mockResolvedValue('Access Denied'),
    });

    const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
      method: 'POST',
      headers: {
        'authorization': 'Bearer mock-token',
      },
    });

    await uploadHandler(req, res);

    // Verify error response
    expect(res._getStatusCode()).toBe(500);
    expect(JSON.parse(res._getData())).toEqual({
      message: 'Failed to upload recording',
      error: 'Failed to upload to S3: 403',
    });
  });

  it('handles missing file or presigned URL', async () => {
    // Temporarily override the mock implementation for this test
    const originalModule = await import('formidable');
    const mockFormidable = {
      IncomingForm: vi.fn().mockImplementation(() => ({
        parse: vi.fn().mockImplementation((req, callback) => {
          // Return empty data to simulate missing file/url
          callback(null, {}, {});
        }),
        keepExtensions: true,
      }))
    };
    
    // @ts-ignore - Override module for this test
    vi.doMock('formidable', () => mockFormidable);
    
    // Clear module cache to use the new mock
    vi.resetModules();
    
    // Re-import the handler with our new mock
    const uploadModule = await import('@/pages/api/upload');
    const handlerWithMissingFile = uploadModule.default;

    const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
      method: 'POST',
      headers: {
        'authorization': 'Bearer mock-token',
      },
    });

    await handlerWithMissingFile(req, res);

    // Verify error response
    expect(res._getStatusCode()).toBe(400);
    expect(JSON.parse(res._getData())).toEqual({
      message: 'Missing file or presigned URL',
    });
    
    // Restore the original mock for subsequent tests
    vi.doUnmock('formidable');
    vi.resetModules();
  });
});
