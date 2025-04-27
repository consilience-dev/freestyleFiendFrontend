import { Page } from '@playwright/test';

/**
 * Mocks the Cognito authentication API responses
 */
export async function mockCognitoSignIn(page: Page): Promise<void> {
  // Mock the Amplify auth API responses
  await page.route('**/cognito-idp.*.amazonaws.com/**', route => {
    // Return a successful auth response
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        AuthenticationResult: {
          AccessToken: 'mock-access-token',
          IdToken: 'mock-id-token',
          RefreshToken: 'mock-refresh-token',
          ExpiresIn: 3600,
          TokenType: 'Bearer',
        },
        ChallengeParameters: {},
      }),
    });
  });
  
  // Mock any calls to the AWS auth service for token verification
  await page.route('**/auth/current-session', route => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        tokens: {
          accessToken: {
            jwtToken: 'mock-access-token',
            payload: {
              sub: 'mock-user-id',
              email: 'test@example.com',
            },
          },
          idToken: {
            jwtToken: 'mock-id-token',
            payload: {
              sub: 'mock-user-id',
              email: 'test@example.com',
              'cognito:username': 'testuser',
            },
          },
          refreshToken: {
            token: 'mock-refresh-token',
          },
        },
      }),
    });
  });
  
  // Mock current user API
  await page.route('**/auth/current-user', route => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        username: 'testuser',
        userId: 'mock-user-id',
        signInDetails: {
          loginId: 'test@example.com',
        },
      }),
    });
  });
}

/**
 * Mocks the beats API responses
 */
export async function mockBeatsAPI(page: Page): Promise<void> {
  await page.route('**/api/beats', route => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([
        {
          beatId: 'test-beat-1',
          title: 'Classic Boom Bap',
          producer: 'DJ Producer',
          genre: 'Hip Hop',
          bpm: 90,
          key: 'C minor',
          audioUrl: 'https://example.com/beats/test-beat-1.mp3',
          imageUrl: 'https://example.com/beats/test-beat-1.jpg',
          duration: 120,
          tags: ['boom bap', 'classic', 'hip hop'],
        },
        {
          beatId: 'test-beat-2',
          title: 'Trap Vibes',
          producer: 'TrapMaster',
          genre: 'Trap',
          bpm: 140,
          key: 'F# minor',
          audioUrl: 'https://example.com/beats/test-beat-2.mp3',
          imageUrl: 'https://example.com/beats/test-beat-2.jpg',
          duration: 180,
          tags: ['trap', 'hard', 'dark'],
        },
        {
          beatId: 'test-beat-3',
          title: 'Chill Lo-Fi',
          producer: 'Lo-Fi Legend',
          genre: 'Lo-Fi',
          bpm: 75,
          key: 'D major',
          audioUrl: 'https://example.com/beats/test-beat-3.mp3',
          imageUrl: 'https://example.com/beats/test-beat-3.jpg',
          duration: 150,
          tags: ['lo-fi', 'chill', 'relaxed'],
        },
      ]),
    });
  });
}

/**
 * Mocks the API for creating recordings
 */
export async function mockRecordingsAPI(page: Page): Promise<void> {
  await page.route('**/api/recordings', route => {
    // Handle recording creation
    if (route.request().method() === 'POST') {
      route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({
          recordingId: 'mock-recording-id',
          presignedUrl: 'https://example.com/presigned-url',
        }),
      });
    }
    // Handle fetching recordings list
    else if (route.request().method() === 'GET') {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            recordingId: 'mock-recording-id-1',
            title: 'Amazing Freestyle',
            artistName: 'testuser',
            beatId: 'test-beat-1',
            beatTitle: 'Classic Boom Bap',
            producer: 'DJ Producer',
            explicit: false,
            audioUrl: 'https://example.com/recordings/mock-recording-id-1.wav',
            createdAt: new Date().toISOString(),
            votes: 42,
            userVote: null,
          },
        ]),
      });
    }
  });
}

/**
 * Mocks the upload API for file uploads
 */
export async function mockUploadAPI(page: Page): Promise<void> {
  await page.route('**/api/upload', route => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        message: 'Recording uploaded successfully',
      }),
    });
  });
  
  // Mock the presigned URL call to S3
  await page.route('https://example.com/presigned-url', route => {
    route.fulfill({
      status: 200,
      contentType: 'text/plain',
      body: 'OK',
    });
  });
}
