import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { Recording, LeaderboardFilters } from '@/types/recordings';
import { useAuth } from '@/lib/auth';

export default function LeaderboardPage() {
  const router = useRouter();
  const { authState } = useAuth();
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<LeaderboardFilters>({
    timeFrame: 'week',
    limit: 20,
    explicit: true,
  });

  useEffect(() => {
    fetchLeaderboard();
  }, [filters]);

  const fetchLeaderboard = async () => {
    setLoading(true);
    setError(null);

    try {
      const queryParams = new URLSearchParams();
      queryParams.append('timeFrame', filters.timeFrame);
      if (filters.limit) queryParams.append('limit', filters.limit.toString());
      if (filters.explicit !== undefined) queryParams.append('explicit', filters.explicit.toString());

      const response = await fetch(`/api/leaderboard?${queryParams.toString()}`);
      
      if (!response.ok) {
        throw new Error(`Error fetching leaderboard: ${response.status}`);
      }

      const data = await response.json();
      setRecordings(data);
    } catch (err) {
      console.error('Error fetching leaderboard:', err);
      setError('Failed to load leaderboard. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleVote = async (recordingId: string, voteType: 'up' | 'down') => {
    if (!authState.isAuthenticated) {
      router.push(`/signin?redirect=${encodeURIComponent('/leaderboard')}`);
      return;
    }

    try {
      const response = await fetch('/api/votes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          recordingId,
          voteType,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to submit vote');
      }

      const data = await response.json();
      
      // Update the recordings state to reflect the new vote count
      setRecordings(prevRecordings => 
        prevRecordings.map(recording => 
          recording.id === recordingId 
            ? { 
                ...recording, 
                votes: data.votes,
                userVote: data.userVote 
              } 
            : recording
        )
      );
    } catch (err) {
      console.error('Error voting:', err);
      setError('Failed to submit your vote. Please try again.');
    }
  };

  const handleTimeFrameChange = (timeFrame: LeaderboardFilters['timeFrame']) => {
    setFilters(prev => ({ ...prev, timeFrame }));
  };

  const handleExplicitToggle = () => {
    setFilters(prev => ({ ...prev, explicit: !prev.explicit }));
  };

  return (
    <>
      <Head>
        <title>Leaderboard - FreestyleFiend</title>
        <meta name="description" content="Check out the top freestyle performances ranked by community votes." />
      </Head>
      <main style={{ 
        minHeight: 'calc(100vh - 60px)', 
        backgroundColor: '#4c1d95', // purple-900
        color: 'white',
        padding: '2rem 1rem',
      }}>
        <div style={{ 
          maxWidth: '72rem', // max-w-6xl
          margin: '0 auto',
        }}>
          <h1 style={{
            fontSize: '2.25rem',
            fontWeight: 700,
            textAlign: 'center',
            marginBottom: '2rem',
          }}>
            Freestyle Leaderboard
          </h1>

          {error && (
            <div style={{
              backgroundColor: 'rgba(239, 68, 68, 0.2)', // red with opacity
              padding: '1rem',
              borderRadius: '0.5rem',
              marginBottom: '1.5rem',
              textAlign: 'center'
            }}>
              {error}
            </div>
          )}

          {/* Filters */}
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '1rem',
            marginBottom: '1.5rem',
            justifyContent: 'center',
          }}>
            <div style={{
              display: 'flex',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '0.5rem',
              overflow: 'hidden',
            }}>
              {(['day', 'week', 'month', 'all'] as const).map((timeFrame) => (
                <button
                  key={timeFrame}
                  onClick={() => handleTimeFrameChange(timeFrame)}
                  style={{
                    padding: '0.5rem 1rem',
                    backgroundColor: filters.timeFrame === timeFrame 
                      ? 'rgba(219, 39, 119, 0.8)' // pink-600 with opacity
                      : 'rgba(255, 255, 255, 0.1)',
                    color: 'white',
                    border: 'none',
                    borderRight: timeFrame !== 'all' ? '1px solid rgba(255, 255, 255, 0.2)' : 'none',
                    cursor: 'pointer',
                    transition: 'background-color 0.2s',
                    fontWeight: filters.timeFrame === timeFrame ? 600 : 400,
                  }}
                >
                  {timeFrame === 'day' ? 'Today' : 
                   timeFrame === 'week' ? 'This Week' : 
                   timeFrame === 'month' ? 'This Month' : 'All Time'}
                </button>
              ))}
            </div>
            
            <button
              onClick={handleExplicitToggle}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.5rem 1rem',
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '0.5rem',
                color: 'white',
                cursor: 'pointer',
              }}
            >
              <span style={{
                width: '1.25rem',
                height: '1.25rem',
                backgroundColor: filters.explicit ? 'rgba(219, 39, 119, 0.8)' : 'transparent',
                border: '2px solid rgba(255, 255, 255, 0.5)',
                borderRadius: '0.25rem',
                display: 'inline-block',
                position: 'relative',
              }}>
                {filters.explicit && (
                  <svg 
                    viewBox="0 0 24 24" 
                    width="20" 
                    height="20" 
                    stroke="white" 
                    strokeWidth="3" 
                    fill="none"
                    style={{
                      position: 'absolute',
                      top: '-2px',
                      left: '-2px',
                    }}
                  >
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                )}
              </span>
              Include Explicit Content
            </button>
          </div>

          {loading ? (
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              padding: '3rem 0',
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
          ) : recordings.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '3rem 0',
              color: 'rgba(255, 255, 255, 0.7)',
            }}>
              <p style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>No freestyles found for this time period.</p>
              <button
                onClick={() => router.push('/record')}
                style={{
                  backgroundColor: '#db2777', // pink-600
                  color: 'white',
                  border: 'none',
                  padding: '0.75rem 1.5rem',
                  borderRadius: '0.375rem',
                  fontWeight: 500,
                  cursor: 'pointer',
                }}
              >
                Record Your First Freestyle
              </button>
            </div>
          ) : (
            <div>
              {/* Recordings list */}
              <div style={{
                display: 'grid',
                gap: '1rem',
              }}>
                {recordings.map((recording, index) => (
                  <div
                    key={recording.id}
                    style={{
                      backgroundColor: 'rgba(107, 33, 168, 0.5)', // purple-800 with opacity
                      borderRadius: '0.5rem',
                      padding: '1rem',
                      display: 'flex',
                      gap: '1rem',
                      alignItems: 'center',
                    }}
                  >
                    <div style={{
                      width: '2.5rem',
                      height: '2.5rem',
                      backgroundColor: 'rgba(255, 255, 255, 0.1)',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 'bold',
                      fontSize: '1.25rem',
                      flexShrink: 0,
                    }}>
                      {index + 1}
                    </div>
                    
                    <div style={{ flex: '1' }}>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        marginBottom: '0.25rem',
                      }}>
                        <h3 style={{
                          fontSize: '1.125rem',
                          fontWeight: 600,
                          marginRight: '0.5rem',
                        }}>
                          {recording.title}
                        </h3>
                        {recording.explicit && (
                          <span style={{
                            backgroundColor: 'rgba(219, 39, 119, 0.8)', // pink-600 with opacity
                            color: 'white',
                            padding: '0.125rem 0.375rem',
                            borderRadius: '0.25rem',
                            fontSize: '0.75rem',
                            fontWeight: 500,
                          }}>
                            E
                          </span>
                        )}
                      </div>
                      <p style={{
                        fontSize: '0.875rem',
                        color: 'rgba(255, 255, 255, 0.8)',
                      }}>
                        by {recording.artistName}
                        {recording.beatName && ` • Beat: ${recording.beatName}`}
                      </p>
                    </div>
                    
                    {/* Audio player */}
                    <div style={{ 
                      display: 'flex',
                      alignItems: 'center',
                      gap: '1rem',
                      minWidth: '200px',
                    }}>
                      <audio 
                        src={recording.audioUrl} 
                        controls 
                        style={{
                          height: '2rem',
                        }}
                      />
                    </div>
                    
                    {/* Vote buttons */}
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                    }}>
                      <button
                        onClick={() => handleVote(recording.id, 'up')}
                        aria-label="Upvote"
                        style={{
                          backgroundColor: recording.userVote === 'up' 
                            ? 'rgba(16, 185, 129, 0.8)' // green with opacity 
                            : 'rgba(255, 255, 255, 0.1)',
                          border: 'none',
                          borderRadius: '0.25rem',
                          width: '2rem',
                          height: '2rem',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                        }}
                      >
                        <svg 
                          width="16" 
                          height="16" 
                          viewBox="0 0 24 24" 
                          fill="none" 
                          stroke="currentColor" 
                          strokeWidth="2"
                        >
                          <path d="M12 19V5M5 12l7-7 7 7" />
                        </svg>
                      </button>
                      
                      <span style={{ fontWeight: 500, minWidth: '2rem', textAlign: 'center' }}>
                        {recording.votes}
                      </span>
                      
                      <button
                        onClick={() => handleVote(recording.id, 'down')}
                        aria-label="Downvote"
                        style={{
                          backgroundColor: recording.userVote === 'down' 
                            ? 'rgba(239, 68, 68, 0.8)' // red with opacity
                            : 'rgba(255, 255, 255, 0.1)',
                          border: 'none',
                          borderRadius: '0.25rem',
                          width: '2rem',
                          height: '2rem',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                        }}
                      >
                        <svg 
                          width="16" 
                          height="16" 
                          viewBox="0 0 24 24" 
                          fill="none" 
                          stroke="currentColor" 
                          strokeWidth="2"
                        >
                          <path d="M12 5v14M5 12l7 7 7-7" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
    </>
  );
}
