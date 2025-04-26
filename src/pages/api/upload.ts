import type { NextApiRequest, NextApiResponse } from 'next';
import { IncomingForm } from 'formidable';
import { promises as fs } from 'fs';
import fetch from 'node-fetch';

// Disable the default body parser to handle form data with files
export const config = {
  api: {
    bodyParser: false,
  },
};

/**
 * API handler for uploading audio files to S3 via presigned URL
 * Acts as a proxy to avoid CORS issues when uploading directly from the browser
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
    // Get JWT token from the Authorization header sent by the client
    const authHeader = req.headers.authorization;
    const token = authHeader ? authHeader.split(' ')[1] : null;
    
    if (!token) {
      return res.status(401).json({ message: 'Unauthorized - No token provided' });
    }
    
    // Parse the multipart form data (file and presigned URL)
    const form = new IncomingForm({
      keepExtensions: true,
    });
    
    // Promise-based parsing of the form data
    const parseForm = (): Promise<{ fields: any; files: any }> => {
      return new Promise((resolve, reject) => {
        form.parse(req, (err, fields, files) => {
          if (err) return reject(err);
          resolve({ fields, files });
        });
      });
    };
    
    const { fields, files } = await parseForm();
    const audioFile = files.audioFile[0]; // Get the uploaded file
    const presignedUrl = fields.presignedUrl[0]; // Get the presigned URL
    
    if (!audioFile || !presignedUrl) {
      return res.status(400).json({ message: 'Missing file or presigned URL' });
    }
    
    console.log(`Uploading file ${audioFile.originalFilename} to S3 via presigned URL`);
    
    // Read the file from disk
    const fileData = await fs.readFile(audioFile.filepath);
    
    // Upload the file to S3 using the presigned URL
    const uploadResponse = await fetch(presignedUrl, {
      method: 'PUT',
      body: fileData,
      headers: {
        'Content-Type': 'audio/webm',
      },
    });
    
    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text();
      console.error('S3 upload error:', errorText);
      throw new Error(`Failed to upload to S3: ${uploadResponse.status}`);
    }
    
    console.log('File uploaded successfully to S3');
    
    // Delete the temporary file
    await fs.unlink(audioFile.filepath);
    
    return res.status(200).json({ 
      success: true,
      message: 'Recording uploaded successfully',
    });
  } catch (error: any) {
    console.error('Upload API error:', error);
    return res.status(500).json({ 
      message: 'Failed to upload recording',
      error: error.message,
    });
  }
}
