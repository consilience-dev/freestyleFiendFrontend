import { test, expect, Page } from '@playwright/test';
import { 
  mockCognitoSignIn, 
  mockBeatsAPI,
  mockRecordingsAPI,
  mockUploadAPI
} from './mocks/api-mocks';

test.describe('Recording Feature', () => {
  let page: Page;
  
  test.beforeEach(async ({ browser }) => {
    // Start with a fresh context and page for each test
    const context = await browser.newContext({
      permissions: ['microphone'],
      // Mock navigator.mediaDevices for audio recording
      userAgent: 'Mozilla/5.0 Playwright Test with MediaRecorder',
    });
    
    page = await context.newPage();
    
    // Set up request interceptions for API mocking
    await mockCognitoSignIn(page);
    await mockBeatsAPI(page);
    await mockRecordingsAPI(page);
    await mockUploadAPI(page);

    // Navigate to the home page and sign in
    await page.goto('/');
    await page.click('text=Sign In');
    
    // Fill in auth details (these will be intercepted by our mocks)
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'Password123!');
    await page.click('button:has-text("Sign In")');
    
    // Verify auth succeeded
    await expect(page.locator('text=Welcome, testuser')).toBeVisible();
  });
  
  test('complete recording flow from beat selection to submission', async () => {
    // Navigate to the record page
    await page.goto('/record');
    
    // Verify the page is protected and accessible when logged in
    await expect(page.locator('text=Select a Beat')).toBeVisible();
    
    // Ensure beats are loaded
    await expect(page.locator('[data-testid="beat-card"]').first()).toBeVisible();
    
    // Select a beat
    await page.click('[data-testid="beat-card"]');
    
    // Expect to see the recording interface
    await expect(page.locator('button:has-text("Start Recording")')).toBeVisible();
    
    // Mock MediaRecorder interactions
    await page.addScriptTag({
      content: `
        // Mock MediaRecorder
        window.mockMediaRecorderInstance = null;
        const realMediaRecorder = window.MediaRecorder;
        window.MediaRecorder = function MockMediaRecorder(stream) {
          this.stream = stream;
          this.state = 'inactive';
          this.onstart = null;
          this.onstop = null;
          this.ondataavailable = null;
          
          this.start = () => {
            this.state = 'recording';
            if (this.onstart) this.onstart();
          };
          
          this.stop = () => {
            this.state = 'inactive';
            
            // Create a mock audio blob
            const mockAudioBlob = new Blob(
              [new Uint8Array(100)], 
              { type: 'audio/webm' }
            );
            
            // Trigger data availability
            if (this.ondataavailable) {
              this.ondataavailable(new Event('dataavailable', { 
                data: mockAudioBlob 
              }));
            }
            
            // Trigger stop event
            if (this.onstop) this.onstop();
          };
          
          this.addEventListener = (eventName, handler) => {
            if (eventName === 'dataavailable') this.ondataavailable = handler;
            if (eventName === 'stop') this.onstop = handler;
          };
          
          window.mockMediaRecorderInstance = this;
        };
        
        // Add static method required for type checking
        window.MediaRecorder.isTypeSupported = () => true;
        
        // Mock Web Audio API elements
        if (!window.AudioContext) {
          window.AudioContext = class MockAudioContext {
            constructor() {
              this.destination = {};
            }
            
            createGain() {
              return { 
                connect: () => {},
                gain: { value: 1 }
              };
            }
            
            createMediaStreamSource() {
              return { connect: () => {} };
            }
            
            createMediaElementSource() {
              return { connect: () => {} };
            }
          };
        }
        
        // Mock getUserMedia
        if (navigator.mediaDevices && !navigator.mediaDevices._mocked) {
          const originalGetUserMedia = navigator.mediaDevices.getUserMedia;
          navigator.mediaDevices.getUserMedia = async (constraints) => {
            console.log('Mock getUserMedia called with:', constraints);
            
            // Create a mock audio track
            const mockTrack = {
              kind: 'audio',
              enabled: true,
              id: 'mock-audio-track-id',
              label: 'Mock Microphone',
              stop: () => {}
            };
            
            // Create a mock stream with this track
            const mockStream = {
              id: 'mock-stream-id',
              active: true,
              getAudioTracks: () => [mockTrack],
              getTracks: () => [mockTrack],
              getVideoTracks: () => [],
              addTrack: () => {},
              removeTrack: () => {},
              clone: () => mockStream
            };
            
            return mockStream;
          };
          
          navigator.mediaDevices._mocked = true;
        }
      `
    });
    
    // Configure audio settings
    await page.click('button:has-text("Configure Audio")');
    await page.click('text=Default Microphone');
    await page.click('text=Save Settings');
    
    // Start recording
    await page.click('button:has-text("Start Recording")');
    
    // Verify recording state is active
    await expect(page.locator('text=Recording in progress')).toBeVisible();
    
    // Wait a moment for "recording"
    await page.waitForTimeout(2000);
    
    // Stop recording
    await page.click('button:has-text("Stop Recording")');
    
    // Verify preview state
    await expect(page.locator('button:has-text("Play")')).toBeVisible();
    await expect(page.locator('text=Save Recording')).toBeVisible();
    
    // Fill in recording details
    await page.fill('input[placeholder="Enter a title for your freestyle"]', 'My E2E Test Recording');
    await page.check('input[type="checkbox"]', { force: true }); // For explicit content checkbox
    
    // Submit the recording
    await page.click('button:has-text("Save Recording")');
    
    // Verify success message
    await expect(page.locator('text=Your freestyle has been saved successfully')).toBeVisible();
    
    // Verify redirection to leaderboard
    await expect(page).toHaveURL(/.*leaderboard/);
  });

  test('handles recording errors and validation', async () => {
    // Navigate to record page
    await page.goto('/record');
    
    // Select a beat
    await page.click('[data-testid="beat-card"]');
    
    // Start recording
    await page.click('button:has-text("Start Recording")');
    
    // Stop recording
    await page.click('button:has-text("Stop Recording")');
    
    // Try to submit without a title
    await page.click('button:has-text("Save Recording")');
    
    // Should show validation error
    await expect(page.locator('text=Please enter a title for your freestyle')).toBeVisible();
    
    // Now add a title and try again
    await page.fill('input[placeholder="Enter a title for your freestyle"]', 'My E2E Test Recording');
    
    // Mock API error response for recording submission
    await page.route('**/api/recordings', route => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Server error' })
      });
    });
    
    // Submit the recording
    await page.click('button:has-text("Save Recording")');
    
    // Verify error message
    await expect(page.locator('text=Failed to save your recording')).toBeVisible();
  });
});
