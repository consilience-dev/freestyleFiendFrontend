import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import RecordPage from '@/pages/record';
import { fetchAuthSession } from 'aws-amplify/auth';
import { AuthProvider } from '@/lib/auth';
import React from 'react';

// Mock the auth context
vi.mock('@/lib/auth', () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  useAuth: () => ({
    authState: {
      isAuthenticated: true,
      isLoading: false,
      user: {
        username: 'testuser',
        email: 'test@example.com',
      },
      error: null,
    },
  }),
}));

// Mock BeatsGallery component
vi.mock('@/components/BeatsGallery', () => ({
  BeatsGallery: ({ onBeatSelect }: { onBeatSelect: (beatId: string, beatDetails: any) => void }) => {
    // Using React.useEffect to safely handle the mock button click
    React.useEffect(() => {
      // Store the callback in a ref that can be accessed by the test
      if (typeof window !== 'undefined') {
        (window as any).__mockBeatSelectFn = (beatId: string, details: any) => {
          if (typeof onBeatSelect === 'function') {
            onBeatSelect(beatId, details);
          }
        };
      }
    }, [onBeatSelect]);

    return (
      <div data-testid="beats-gallery">
        <button
          data-testid="select-beat-btn"
          onClick={() => {
            if (typeof onBeatSelect === 'function') {
              onBeatSelect('test-beat-id', {
                beatId: 'test-beat-id',
                title: 'Test Beat',
                producer: 'Test Producer',
                audioUrl: 'https://example.com/test-beat.mp3',
              });
            }
          }}
        >
          Select Beat
        </button>
      </div>
    );
  },
}));

// Mock ProtectedRoute component
vi.mock('@/components/auth/ProtectedRoute', () => ({
  ProtectedRoute: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

describe('RecordPage', () => {
  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks();
    
    // Mock successful fetch responses
    global.fetch = vi.fn().mockImplementation((url) => {
      if (url === '/api/recordings') {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              recordingId: 'test-recording-id',
              presignedUrl: 'https://example.com/presigned-url',
            }),
        });
      } else if (url === '/api/upload') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ success: true }),
        });
      }
      
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({}),
      });
    });
    
    // Mock navigator.mediaDevices
    Object.defineProperty(global.navigator, 'mediaDevices', {
      value: {
        getUserMedia: vi.fn().mockResolvedValue({}),
        enumerateDevices: vi.fn().mockResolvedValue([
          { kind: 'audioinput', deviceId: 'default', label: 'Default Microphone' },
          { kind: 'audioinput', deviceId: 'mic-1', label: 'External Microphone' },
        ]),
      },
      writable: true,
    });
    
    // Mock AudioContext methods
    window.AudioContext = vi.fn().mockImplementation(() => ({
      createGain: vi.fn().mockReturnValue({
        connect: vi.fn(),
        gain: { value: 1 },
      }),
      createMediaStreamSource: vi.fn().mockReturnValue({
        connect: vi.fn(),
      }),
      createMediaElementSource: vi.fn().mockReturnValue({
        connect: vi.fn(),
      }),
      destination: {},
    }));
    
    // Mock MediaRecorder
    window.MediaRecorder = vi.fn().mockImplementation(() => ({
      start: vi.fn(),
      stop: vi.fn(),
      addEventListener: vi.fn((event, handler) => {
        if (event === 'dataavailable') {
          setTimeout(() => handler({ data: new Blob() }), 100);
        } else if (event === 'stop') {
          setTimeout(() => handler({}), 200);
        }
      }),
      state: 'inactive',
    }));
    
    // Add the required static method
    (window.MediaRecorder as any).isTypeSupported = vi.fn().mockReturnValue(true);
  });

  it('renders the record page with beats selection initially', async () => {
    render(<RecordPage />);
    
    // Initial state should show the beats selection
    expect(screen.getByText(/Select a Beat/i)).toBeInTheDocument();
    expect(screen.getByTestId('beats-gallery')).toBeInTheDocument();
  });

  it('advances to recording phase after beat selection', async () => {
    render(<RecordPage />);
    
    // Select a beat
    fireEvent.click(screen.getByTestId('select-beat-btn'));
    
    // Check if it advances to the recording phase
    await waitFor(() => {
      expect(screen.getByText(/Test Beat/i)).toBeInTheDocument();
      expect(screen.getByText(/Test Producer/i)).toBeInTheDocument();
    });
    
    // Recording controls should be visible
    expect(screen.getByText(/Start Recording/i)).toBeInTheDocument();
  });

  it('shows recording in progress UI during recording', async () => {
    render(<RecordPage />);
    
    // Select a beat
    fireEvent.click(screen.getByTestId('select-beat-btn'));
    
    // Start recording
    await waitFor(() => {
      fireEvent.click(screen.getByText(/Start Recording/i));
    });
    
    // Check if recording UI is shown
    await waitFor(() => {
      expect(screen.getByText(/Recording/i)).toBeInTheDocument();
      expect(screen.getByText(/Stop Recording/i)).toBeInTheDocument();
    });
  });

  it('shows preview controls after recording is complete', async () => {
    render(<RecordPage />);
    
    // Select a beat
    fireEvent.click(screen.getByTestId('select-beat-btn'));
    
    // Start recording
    await waitFor(() => {
      fireEvent.click(screen.getByText(/Start Recording/i));
    });
    
    // Stop recording
    await waitFor(() => {
      fireEvent.click(screen.getByText(/Stop Recording/i));
    });
    
    // Check if preview controls are shown
    await waitFor(() => {
      expect(screen.getByText(/Play/i)).toBeInTheDocument();
      expect(screen.getByText(/Save Recording/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Title/i)).toBeInTheDocument();
    });
  });

  it('successfully submits a recording with metadata', async () => {
    render(<RecordPage />);
    
    // Select a beat
    fireEvent.click(screen.getByTestId('select-beat-btn'));
    
    // Start recording
    await waitFor(() => {
      fireEvent.click(screen.getByText(/Start Recording/i));
    });
    
    // Stop recording
    await waitFor(() => {
      fireEvent.click(screen.getByText(/Stop Recording/i));
    });
    
    // Fill in title and save
    await waitFor(() => {
      const titleInput = screen.getByLabelText(/Title/i);
      fireEvent.change(titleInput, { target: { value: 'My Test Recording' } });
      fireEvent.click(screen.getByText(/Save Recording/i));
    });
    
    // Verify API calls
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/recordings', expect.any(Object));
      expect(global.fetch).toHaveBeenCalledWith('/api/upload', expect.any(Object));
    });
    
    // Should show success message
    await waitFor(() => {
      expect(screen.getByText(/successfully/i)).toBeInTheDocument();
    });
  });

  it('handles API errors during recording submission', async () => {
    // Mock API error
    global.fetch = vi.fn().mockImplementation((url) => {
      if (url === '/api/recordings') {
        return Promise.resolve({
          ok: false,
          status: 401,
          json: () => Promise.resolve({ message: 'Unauthorized' }),
        });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
    });
    
    render(<RecordPage />);
    
    // Select a beat
    fireEvent.click(screen.getByTestId('select-beat-btn'));
    
    // Start recording
    await waitFor(() => {
      fireEvent.click(screen.getByText(/Start Recording/i));
    });
    
    // Stop recording
    await waitFor(() => {
      fireEvent.click(screen.getByText(/Stop Recording/i));
    });
    
    // Fill in title and save
    await waitFor(() => {
      const titleInput = screen.getByLabelText(/Title/i);
      fireEvent.change(titleInput, { target: { value: 'My Test Recording' } });
      fireEvent.click(screen.getByText(/Save Recording/i));
    });
    
    // Should show error message
    await waitFor(() => {
      expect(screen.getByText(/Failed to save your recording/i)).toBeInTheDocument();
    });
  });

  it('handles authentication token retrieval', async () => {
    // Mock fetchAuthSession to test token retrieval
    (fetchAuthSession as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      tokens: {
        idToken: {
          toString: () => 'test-id-token',
        },
        accessToken: {
          toString: () => 'test-access-token',
        },
      },
    });
    
    render(<RecordPage />);
    
    // Select a beat
    fireEvent.click(screen.getByTestId('select-beat-btn'));
    
    // Start and stop recording
    await waitFor(() => {
      fireEvent.click(screen.getByText(/Start Recording/i));
    });
    
    await waitFor(() => {
      fireEvent.click(screen.getByText(/Stop Recording/i));
    });
    
    // Submit the recording
    await waitFor(() => {
      const titleInput = screen.getByLabelText(/Title/i);
      fireEvent.change(titleInput, { target: { value: 'My Test Recording' } });
      fireEvent.click(screen.getByText(/Save Recording/i));
    });
    
    // Verify token was retrieved
    expect(fetchAuthSession).toHaveBeenCalled();
    
    // Verify authorization header in API call
    await waitFor(() => {
      const calls = (global.fetch as ReturnType<typeof vi.fn>).mock.calls;
      const recordingsCall = calls.find(call => call[0] === '/api/recordings');
      expect(recordingsCall[1].headers).toHaveProperty('Authorization');
      expect(recordingsCall[1].headers.Authorization).toContain('Bearer');
    });
  });
});
