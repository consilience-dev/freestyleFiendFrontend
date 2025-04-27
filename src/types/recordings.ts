/**
 * Recording types for FreestyleFiend
 */

export interface Recording {
  id: string;
  title: string;
  artistName: string;
  beatId: string;
  beatName?: string;
  createdAt: string;
  explicit: boolean;
  audioUrl: string;
  votes: number;
  userVote?: 'up' | 'down' | null;
  fireRating?: number;
  playCount?: number;
}

export interface LeaderboardFilters {
  timeFrame: 'day' | 'week' | 'month' | 'all';
  limit?: number;
  explicit?: boolean;
}

export interface RecordingFormData {
  beatId: string;
  title: string;
  explicit: boolean;
}

export interface VoteResponse {
  recordingId: string;
  votes: number;
  userVote: 'up' | 'down' | null;
}

export interface ApiError {
  statusCode: number;
  message: string;
}
