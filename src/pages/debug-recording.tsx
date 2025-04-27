import { useState } from 'react';
import Head from 'next/head';
import { Recording } from '@/types/recordings';
import AudioPlayer from '@/components/AudioPlayer';

export default function DebugRecordingPage() {
  const [recordingId, setRecordingId] = useState('');
  const [recording, setRecording] = useState<Recording | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [apiResponse, setApiResponse] = useState<any>(null);

  const fetchRecording = async () => {
    if (!recordingId.trim()) {
      setError('Please enter a recording ID');
      return;
    }

    setLoading(true);
    setError(null);
    setRecording(null);
    setApiResponse(null);

    try {
      // Try direct recording lookup endpoint
      const response = await fetch(`/api/recording/${recordingId}`);
      
      const data = await response.json();
      setApiResponse(data);
      
      if (!response.ok) {
        setError(`Error: ${data.message || response.statusText}`);
        return;
      }

      // Check if we got a valid recording
      if (data && data.id) {
        setRecording({
          id: data.id,
          title: data.title || `Recording ${data.id.substring(0, 6)}`,
          artistName: data.artistName || 'Unknown Artist',
          beatId: data.beatId || '',
          beatName: data.beatName || '',
          createdAt: data.createdAt || new Date().toISOString(),
          explicit: data.explicit || false,
          audioUrl: data.audioUrl || `/api/recordings/${data.id}/audio`,
          votes: data.votes || 0,
          userVote: data.userVote || null,
        });
      } else {
        setError('Invalid recording data returned from API');
      }
    } catch (err) {
      console.error('Error fetching recording:', err);
      setError('Failed to fetch recording. Check console for details.');
    } finally {
      setLoading(false);
    }
  };

  const checkLeaderboard = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Try all time periods to see if recording appears
      const timeFrames = ['day', 'week', 'month', 'all'];
      const results: {[key: string]: any} = {};
      
      for (const timeFrame of timeFrames) {
        const response = await fetch(`/api/leaderboard?timeFrame=${timeFrame}&limit=50&explicit=true`);
        const data = await response.json();
        
        results[timeFrame] = {
          count: Array.isArray(data) ? data.length : 'N/A',
          containsRecording: Array.isArray(data) && data.some(r => r.id === recordingId),
          firstFew: Array.isArray(data) ? data.slice(0, 3).map(r => r.id) : []
        };
      }
      
      setApiResponse({
        timeFrameResults: results
      });
    } catch (err) {
      console.error('Error checking leaderboard:', err);
      setError('Failed to check leaderboard. See console for details.');
    } finally {
      setLoading(false);
    }
  };

  const checkRecordingAudio = async () => {
    if (!recordingId.trim()) {
      setError('Please enter a recording ID');
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      // Just check if audio URL exists without actually fetching the full audio
      const audioUrl = `${process.env.NEXT_PUBLIC_API_BASE_URL}/recordings/${recordingId}/audio`;
      
      const response = await fetch(audioUrl, {
        method: 'HEAD',
      });
      
      setApiResponse({
        audioCheck: {
          exists: response.ok,
          status: response.status,
          contentType: response.headers.get('content-type'),
          contentLength: response.headers.get('content-length'),
        }
      });
      
      if (!response.ok) {
        setError(`Audio not available: ${response.status} ${response.statusText}`);
      } else {
        // If audio exists, create a basic recording object
        setRecording({
          id: recordingId,
          title: `Recording ${recordingId.substring(0, 6)}`,
          artistName: 'Unknown Artist',
          beatId: '',
          createdAt: new Date().toISOString(),
          explicit: false,
          audioUrl: audioUrl,
          votes: 0,
        });
      }
    } catch (err) {
      console.error('Error checking audio:', err);
      setError('Failed to check audio URL. See console for details.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>Debug Recording - FreestyleFiend</title>
      </Head>
      <main style={{ 
        minHeight: 'calc(100vh - 60px)', 
        backgroundColor: '#4c1d95', 
        color: 'white',
        padding: '2rem 1rem',
      }}>
        <div style={{ 
          maxWidth: '72rem', 
          margin: '0 auto',
        }}>
          <h1 style={{
            fontSize: '2.25rem',
            fontWeight: 700,
            textAlign: 'center',
            marginBottom: '2rem',
          }}>
            Debug Recording
          </h1>

          <div style={{
            backgroundColor: 'rgba(107, 33, 168, 0.5)',
            borderRadius: '0.5rem',
            padding: '1.5rem',
            marginBottom: '2rem',
          }}>
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem',
            }}>
              <div>
                <label style={{
                  display: 'block',
                  marginBottom: '0.5rem',
                  fontWeight: 500,
                }}>
                  Recording ID
                </label>
                <div style={{
                  display: 'flex',
                  gap: '0.5rem',
                }}>
                  <input
                    type="text"
                    value={recordingId}
                    onChange={(e) => setRecordingId(e.target.value)}
                    placeholder="Enter recording ID"
                    style={{
                      flex: 1,
                      padding: '0.5rem 0.75rem',
                      backgroundColor: 'rgba(255, 255, 255, 0.1)',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      borderRadius: '0.375rem',
                      color: 'white',
                    }}
                  />
                </div>
              </div>

              <div style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '0.5rem',
              }}>
                <button
                  onClick={fetchRecording}
                  disabled={loading}
                  style={{
                    backgroundColor: '#db2777',
                    color: 'white',
                    border: 'none',
                    padding: '0.5rem 1rem',
                    borderRadius: '0.375rem',
                    fontWeight: 500,
                    cursor: loading ? 'not-allowed' : 'pointer',
                    opacity: loading ? 0.7 : 1,
                  }}
                >
                  Fetch Recording Metadata
                </button>
                
                <button
                  onClick={checkLeaderboard}
                  disabled={loading}
                  style={{
                    backgroundColor: '#8b5cf6',
                    color: 'white',
                    border: 'none',
                    padding: '0.5rem 1rem',
                    borderRadius: '0.375rem',
                    fontWeight: 500,
                    cursor: loading ? 'not-allowed' : 'pointer',
                    opacity: loading ? 0.7 : 1,
                  }}
                >
                  Check Leaderboard Status
                </button>
                
                <button
                  onClick={checkRecordingAudio}
                  disabled={loading}
                  style={{
                    backgroundColor: '#10b981',
                    color: 'white',
                    border: 'none',
                    padding: '0.5rem 1rem',
                    borderRadius: '0.375rem',
                    fontWeight: 500,
                    cursor: loading ? 'not-allowed' : 'pointer',
                    opacity: loading ? 0.7 : 1,
                  }}
                >
                  Check Audio Availability
                </button>
              </div>
            </div>
          </div>

          {loading && (
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              padding: '2rem 0',
            }}>
              <div style={{
                width: '2rem',
                height: '2rem',
                border: '4px solid rgba(255, 255, 255, 0.3)',
                borderRadius: '50%',
                borderTopColor: 'white',
                animation: 'spin 1s linear infinite',
              }}></div>
              <style jsx>{`
                @keyframes spin {
                  to { transform: rotate(360deg); }
                }
              `}</style>
            </div>
          )}

          {error && (
            <div style={{
              backgroundColor: 'rgba(239, 68, 68, 0.2)',
              padding: '1rem',
              borderRadius: '0.5rem',
              marginBottom: '1.5rem',
            }}>
              <p>{error}</p>
            </div>
          )}

          {recording && (
            <div style={{
              backgroundColor: 'rgba(107, 33, 168, 0.5)',
              borderRadius: '0.5rem',
              padding: '1.5rem',
              marginBottom: '2rem',
            }}>
              <h2 style={{
                fontSize: '1.5rem',
                fontWeight: 600,
                marginBottom: '1rem',
              }}>
                Recording Details
              </h2>
              
              <div style={{
                display: 'grid',
                gap: '0.75rem',
                marginBottom: '1.5rem',
              }}>
                <div>
                  <strong>ID:</strong> {recording.id}
                </div>
                <div>
                  <strong>Title:</strong> {recording.title}
                </div>
                <div>
                  <strong>Artist:</strong> {recording.artistName}
                </div>
                <div>
                  <strong>Beat ID:</strong> {recording.beatId}
                </div>
                <div>
                  <strong>Created:</strong> {new Date(recording.createdAt).toLocaleString()}
                </div>
                <div>
                  <strong>Explicit:</strong> {recording.explicit ? 'Yes' : 'No'}
                </div>
                <div>
                  <strong>Votes:</strong> {recording.votes}
                </div>
                <div>
                  <strong>Audio URL:</strong> <span style={{ wordBreak: 'break-all' }}>{recording.audioUrl}</span>
                </div>
              </div>
              
              <h3 style={{
                fontSize: '1.25rem',
                fontWeight: 600,
                marginBottom: '0.75rem',
              }}>
                Audio Player
              </h3>
              
              <div style={{ maxWidth: '500px' }}>
                <AudioPlayer 
                  src={recording.audioUrl} 
                  title={recording.title}
                  artist={recording.artistName}
                  onError={() => console.error(`Error loading audio for recording ${recording.id}`)}
                />
              </div>
            </div>
          )}

          {apiResponse && (
            <div style={{
              backgroundColor: 'rgba(107, 33, 168, 0.5)',
              borderRadius: '0.5rem',
              padding: '1.5rem',
              marginBottom: '2rem',
            }}>
              <h2 style={{
                fontSize: '1.5rem',
                fontWeight: 600,
                marginBottom: '1rem',
              }}>
                API Response
              </h2>
              
              <pre style={{
                backgroundColor: 'rgba(0, 0, 0, 0.2)',
                padding: '1rem',
                borderRadius: '0.375rem',
                overflow: 'auto',
                maxHeight: '300px',
                fontSize: '0.875rem',
                color: 'rgba(255, 255, 255, 0.9)',
              }}>
                {JSON.stringify(apiResponse, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </main>
    </>
  );
}
