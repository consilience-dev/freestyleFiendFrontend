import '@testing-library/jest-dom';
import { vi, beforeEach } from 'vitest';

// Mock next/router
vi.mock('next/router', () => ({
  useRouter: () => ({
    query: {},
    pathname: '/',
    asPath: '/',
    events: {
      on: vi.fn(),
      off: vi.fn(),
      emit: vi.fn(),
    },
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
  }),
}));

// Mock the AWS Amplify authentication
vi.mock('aws-amplify/auth', () => ({
  fetchAuthSession: vi.fn().mockResolvedValue({
    tokens: {
      idToken: {
        toString: () => 'mock-id-token',
      },
      accessToken: {
        toString: () => 'mock-access-token',
      },
    },
  }),
  getCurrentUser: vi.fn().mockResolvedValue({
    username: 'testuser',
    userId: 'test-user-id',
    signInDetails: {
      loginId: 'test@example.com',
    },
  }),
}));

// Mock the Web Audio API
class MockAudioContext {
  destination = {};
  createGain = vi.fn().mockReturnValue({
    connect: vi.fn(),
    gain: { value: 1 },
  });
  createMediaStreamSource = vi.fn().mockReturnValue({
    connect: vi.fn(),
  });
  createMediaElementSource = vi.fn().mockReturnValue({
    connect: vi.fn(),
  });
}

class MockMediaRecorder {
  start = vi.fn();
  stop = vi.fn();
  ondataavailable = vi.fn();
  onstop = vi.fn();
  constructor() {
    setTimeout(() => {
      if (this.ondataavailable) {
        this.ondataavailable({ data: new Blob() });
      }
      if (this.onstop) {
        this.onstop();
      }
    }, 100);
  }
}

// Set up global mocks
Object.defineProperty(global, 'AudioContext', {
  value: MockAudioContext,
  writable: true,
});

Object.defineProperty(global, 'MediaRecorder', {
  value: MockMediaRecorder,
  writable: true,
});

Object.defineProperty(global, 'URL', {
  value: {
    createObjectURL: vi.fn(() => 'mock-url'),
    revokeObjectURL: vi.fn(),
  },
  writable: true,
});

// Mock fetch
global.fetch = vi.fn();

beforeEach(() => {
  vi.clearAllMocks();

  // Default fetch mock implementation
  (global.fetch as any).mockImplementation(() =>
    Promise.resolve({
      ok: true,
      json: () => Promise.resolve({}),
      text: () => Promise.resolve(''),
    })
  );
});
