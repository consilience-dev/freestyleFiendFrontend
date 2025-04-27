import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Image from 'next/image';
import { Recording, LeaderboardFilters } from '@/types/recordings';
import { useAuth } from '@/lib/auth';
import AudioPlayer from '@/components/AudioPlayer';

// Array of vibrant gradient backgrounds for placeholder images
const PLACEHOLDER_BACKGROUNDS = [
  'linear-gradient(45deg, #ff8a00, #e52e71)',
  'linear-gradient(45deg, #7928ca, #ff0080)',
  'linear-gradient(45deg, #0070f3, #00dfd8)',
  'linear-gradient(45deg, #6300e0, #1da1f2)',
  'linear-gradient(45deg, #ff4d4d, #f9cb28)',
  'linear-gradient(45deg, #00b09b, #96c93d)',
  'linear-gradient(45deg, #4776e6, #8e54e9)',
  'linear-gradient(45deg, #fd1d1d, #833ab4)',
  'linear-gradient(45deg, #f953c6, #b91d73)',
  'linear-gradient(45deg, #00c6ff, #0072ff)',
];

// Array of music-related emoji icons for placeholder images
const PLACEHOLDER_ICONS = ['🎤', '🎧', '🎵', '🎶', '🎙️', '🎸', '🔊', '🥁', '🔥', '🎹'];

// Function to get a deterministic but random-looking image for a recording
const getPlaceholderImageForRecording = (recordingId: string) => {
  // Use the first few characters of the ID to select background and icon
  const idSum = recordingId.split('')
    .slice(0, 8)
    .reduce((sum, char) => sum + char.charCodeAt(0), 0);
  
  const backgroundIndex = idSum % PLACEHOLDER_BACKGROUNDS.length;
  const iconIndex = (idSum * 3) % PLACEHOLDER_ICONS.length;
  
  // Add some variation to the rotation
  const rotation = (idSum % 5) * (idSum % 2 === 0 ? 1 : -1);
  
  return {
    background: PLACEHOLDER_BACKGROUNDS[backgroundIndex],
    icon: PLACEHOLDER_ICONS[iconIndex],
    rotation
  };
};

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
  const [playingRecordingId, setPlayingRecordingId] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [hoveredImageId, setHoveredImageId] = useState<string | null>(null);

  // Handle responsive layout detection on client side
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    // Initial check
    checkMobile();
    
    // Add event listener for window resize
    window.addEventListener('resize', checkMobile);
    
    // Cleanup
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

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

  const handleTimeFrameChange = (timeFrame: LeaderboardFilters['timeFrame']) => {
    setFilters(prev => ({ ...prev, timeFrame }));
  };

  const handlePlayRecording = (recordingId: string) => {
    setPlayingRecordingId(recordingId);
  };

  return (
    <>
      <Head>
        <title>Freestyle Leaderboard - FreestyleFiend</title>
        <meta name="description" content="Check out the top freestyles from the community" />
      </Head>
      
      <main style={{
        padding: '2rem 1rem',
        backgroundColor: '#3b0764',
        minHeight: 'calc(100vh - 60px)',
      }}>
        <div style={{
          maxWidth: '72rem',
          margin: '0 auto',
        }}>
          <div style={{
            display: 'flex',
            flexDirection: isMobile ? 'column' : 'row',
            justifyContent: 'space-between',
            alignItems: isMobile ? 'flex-start' : 'center',
            marginBottom: '2rem',
            gap: '1rem',
          }}>
            <h1 style={{
              fontSize: '2.25rem',
              fontWeight: 700,
              marginBottom: isMobile ? '0.5rem' : 0,
            }}>
              Freestyle Leaderboard
            </h1>
            
            {/* Add "Go to Vote Page" CTA button */}
            <button
              onClick={() => router.push('/vote')}
              style={{
                backgroundColor: '#db2777',
                color: 'white',
                border: 'none',
                borderRadius: '0.5rem',
                padding: '0.75rem 1.25rem',
                fontSize: '1rem',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
              onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#be185d'}
              onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#db2777'}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 12l2 2 4-4"/>
                <circle cx="12" cy="12" r="10"/>
              </svg>
              Vote on Freestyles
            </button>
          </div>
          {error && (
            <div style={{
              backgroundColor: 'rgba(239, 68, 68, 0.2)', 
              padding: '1rem',
              borderRadius: '0.5rem',
              marginBottom: '1.5rem',
              textAlign: 'center',
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
                      ? 'rgba(219, 39, 119, 0.8)' 
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
              onClick={() => setFilters(prev => ({ ...prev, explicit: !prev.explicit }))}
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
                  backgroundColor: '#db2777', 
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
                {recordings.map((recording, index) => {
                  // Get deterministic placeholder image based on recording ID
                  const placeholderImage = getPlaceholderImageForRecording(recording.id);
                  
                  return (
                    <div
                      key={recording.id}
                      style={{
                        backgroundColor: 'rgba(107, 33, 168, 0.5)', 
                        borderRadius: '0.5rem',
                        padding: '1rem',
                        display: 'flex',
                        flexDirection: isMobile ? 'column' : 'row',
                        gap: '1rem',
                        alignItems: isMobile ? 'flex-start' : 'center',
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
                      
                      {/* Placeholder Image with hover effects and playback indicator */}
                      <div 
                        style={{
                          width: '4.5rem',
                          height: '4.5rem',
                          borderRadius: '0.5rem',
                          background: placeholderImage.background,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '2rem',
                          flexShrink: 0,
                          overflow: 'hidden',
                          boxShadow: hoveredImageId === recording.id 
                            ? '0 8px 20px rgba(0, 0, 0, 0.25)' 
                            : '0 4px 12px rgba(0, 0, 0, 0.15)',
                          position: 'relative',
                          transform: `rotate(${placeholderImage.rotation}deg) ${hoveredImageId === recording.id ? 'scale(1.05)' : ''}`,
                          transition: 'all 0.3s ease-in-out',
                          cursor: 'pointer',
                        }}
                        onMouseEnter={() => setHoveredImageId(recording.id)}
                        onMouseLeave={() => setHoveredImageId(null)}
                        onClick={() => handlePlayRecording(recording.id)}
                        role="button"
                        aria-label={`Play ${recording.title} by ${recording.artistName}`}
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            handlePlayRecording(recording.id);
                          }
                        }}
                      >
                        {/* Background pattern overlay */}
                        <div style={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          right: 0,
                          bottom: 0,
                          opacity: 0.15,
                          backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)',
                          backgroundSize: '10px 10px',
                        }} />
                        
                        {/* Center icon */}
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: '100%',
                          height: '100%',
                          transform: 'rotate(0deg)',
                          textShadow: '0 2px 4px rgba(0,0,0,0.2)',
                          opacity: hoveredImageId === recording.id ? 0.9 : 1,
                          transition: 'opacity 0.3s ease',
                        }}>
                          {placeholderImage.icon}
                        </div>
                        
                        {/* Vote count badge - show at top right corner */}
                        {recording.votes > 0 && (
                          <div style={{
                            position: 'absolute',
                            top: '-8px',
                            right: '-8px',
                            backgroundColor: recording.votes > 5 ? '#10b981' : '#f59e0b',
                            color: 'white',
                            borderRadius: '50%',
                            width: '1.5rem',
                            height: '1.5rem',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '0.75rem',
                            fontWeight: 'bold',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                            border: '2px solid rgba(255,255,255,0.7)',
                            zIndex: 2,
                          }}>
                            {recording.votes}
                          </div>
                        )}
                        
                        {/* Currently playing indicator */}
                        {playingRecordingId === recording.id && (
                          <div style={{
                            position: 'absolute',
                            bottom: '4px',
                            left: '4px',
                            right: '4px',
                            height: '4px',
                            backgroundColor: 'rgba(255,255,255,0.7)',
                            borderRadius: '2px',
                            overflow: 'hidden',
                          }}>
                            <div style={{
                              height: '100%',
                              width: '30%',
                              backgroundColor: 'white',
                              animation: 'progressPulse 2s ease-in-out infinite',
                              borderRadius: '2px',
                            }} />
                          </div>
                        )}
                        
                        {/* Play indicator on hover */}
                        {hoveredImageId === recording.id && (
                          <div style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            backgroundColor: 'rgba(0, 0, 0, 0.3)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'white',
                            animation: 'fadeIn 0.2s ease-in-out',
                          }}>
                            <svg 
                              width="24" 
                              height="24" 
                              viewBox="0 0 24 24" 
                              fill="white"
                              style={{
                                filter: 'drop-shadow(0 2px 3px rgba(0,0,0,0.3))'
                              }}
                            >
                              <path d="M8 5v14l11-7z" />
                            </svg>
                          </div>
                        )}
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
                              backgroundColor: 'rgba(219, 39, 119, 0.8)', 
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
                        width: '100%',
                        maxWidth: isMobile ? '100%' : '350px',
                      }}>
                        <AudioPlayer 
                          src={recording.audioUrl} 
                          title={recording.title}
                          artist={recording.artistName}
                          onError={() => console.error(`Error loading audio for recording ${recording.id}`)}
                          className="audio-player"
                        />
                      </div>
                      
                      {/* Display votes only */}
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                      }}>
                        {/* Votes display (not interactive) */}
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.25rem',
                          backgroundColor: 'rgba(16, 185, 129, 0.1)',
                          padding: '0.25rem 0.5rem',
                          borderRadius: '0.25rem',
                        }}>
                          <svg 
                            width="16" 
                            height="16" 
                            viewBox="0 0 24 24" 
                            fill="none" 
                            stroke="currentColor" 
                            strokeWidth="2"
                            strokeLinecap="round" 
                            strokeLinejoin="round"
                          >
                            <path d="M12 19V5M5 12l7-7 7 7"/>
                          </svg>
                          <span style={{ fontWeight: 600 }}>
                            {recording.votes}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </main>
      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @keyframes progressPulse {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(400%); }
        }
      `}</style>
    </>
  );
}
