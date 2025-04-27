import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { Recording } from '@/types/recordings';
import { useAuth } from '@/lib/auth';
import { getAccessToken } from '@/lib/auth';
import AudioPlayer from '@/components/AudioPlayer';

// Reuse the same placeholder generation logic from leaderboard.tsx
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

const PLACEHOLDER_ICONS = ['🎤', '🎧', '🎵', '🎶', '🎙️', '🎸', '🔊', '🥁', '🔥', '🎹'];

const getPlaceholderImageForRecording = (recordingId: string) => {
  const idSum = recordingId.split('')
    .slice(0, 8)
    .reduce((sum, char) => sum + char.charCodeAt(0), 0);
  
  const backgroundIndex = idSum % PLACEHOLDER_BACKGROUNDS.length;
  const iconIndex = (idSum * 3) % PLACEHOLDER_ICONS.length;
  
  const rotation = (idSum % 5) * (idSum % 2 === 0 ? 1 : -1);
  
  return {
    background: PLACEHOLDER_BACKGROUNDS[backgroundIndex],
    icon: PLACEHOLDER_ICONS[iconIndex],
    rotation
  };
};

export default function VotePage() {
  const router = useRouter();
  const { authState } = useAuth();
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [swiping, setSwiping] = useState<'none' | 'left' | 'right'>('none');
  const [swipePosition, setSwipePosition] = useState({ x: 0, y: 0 });
  const [startPosition, setStartPosition] = useState({ x: 0, y: 0 });
  const [loadingVote, setLoadingVote] = useState(false);
  const [votedRecordingIds, setVotedRecordingIds] = useState<Set<string>>(new Set());
  const [allRecordingsVoted, setAllRecordingsVoted] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const touchActive = useRef(false);

  // Load data for the vote page in proper sequence
  const loadVotePageData = async () => {
    try {
      setLoading(true);
      
      // First get the voted IDs
      const votedIds = await fetchVotedRecordings();
      
      // Then fetch recordings with the voted IDs for direct filtering
      await fetchRecordings(votedIds);
    } catch (error) {
      console.error("Error loading vote page data:", error);
      setError("There was a problem loading content. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Fetch the list of recordings the user has already voted for
  const fetchVotedRecordings = async (): Promise<Set<string>> => {
    try {
      // Get authentication token
      const token = await getAccessToken();
      
      if (!token) {
        console.error('Failed to get authentication token');
        return new Set<string>(); // Return empty set if no token
      }
      
      // Call our Next.js API route that proxies to the backend /votes endpoint
      const response = await fetch('/api/votes', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('Previously voted recordings:', data);
        
        // Create a set from the backend data
        if (data.votedRecordingIds && Array.isArray(data.votedRecordingIds)) {
          console.log('Voted recording IDs from backend:', data.votedRecordingIds);
          
          // Update state AND return the set for immediate use
          const votedIds = new Set<string>(data.votedRecordingIds as string[]);
          setVotedRecordingIds(votedIds);
          return votedIds;
        }
      } else {
        console.warn(`Backend /votes endpoint failed with status ${response.status}. Using client-side vote tracking as fallback.`);
      }
      
      // If we reach here, return the current state value
      return votedRecordingIds;
    } catch (err) {
      console.error('Error fetching voted recordings:', err);
      console.warn('Using client-side vote tracking as fallback.');
      return votedRecordingIds;
    }
  };

  // Fetch recordings when component mounts
  useEffect(() => {
    if (!authState.isAuthenticated) {
      router.push(`/signin?redirect=${encodeURIComponent('/vote')}`);
      return;
    }
    
    // Load the vote page data
    loadVotePageData();
  }, [authState.isAuthenticated, router]);

  // Fetch recordings with explicit voted IDs parameter
  const fetchRecordings = async (votedIds?: Set<string>) => {
    setError(null);
    
    // Use provided votedIds or fall back to state
    const idsToFilter = votedIds || votedRecordingIds;
    console.log('IDs to filter against:', Array.from(idsToFilter));

    try {
      const queryParams = new URLSearchParams();
      queryParams.append('timeFrame', 'week');
      queryParams.append('limit', '50'); // Fetch more to account for filtering
      queryParams.append('randomize', 'true');

      const response = await fetch(`/api/leaderboard?${queryParams.toString()}`);
      
      if (!response.ok) {
        throw new Error(`Error fetching recordings: ${response.status}`);
      }

      const data = await response.json();
      console.log('Retrieved recordings count:', data.length);
      
      // Direct filtering with the provided set
      const filteredRecordings = data.filter(recording => {
        const alreadyVoted = idsToFilter.has(recording.id);
        if (alreadyVoted) {
          console.log(`Filtering out recording: ${recording.id} (already voted)`);
        }
        return !alreadyVoted;
      });
      
      console.log(`Filtered ${data.length - filteredRecordings.length} already-voted recordings`);
      console.log('Remaining recordings:', filteredRecordings.length);
      
      if (filteredRecordings.length === 0) {
        setAllRecordingsVoted(true);
      } else {
        setRecordings(filteredRecordings);
        setCurrentIndex(0); // Reset to first recording
      }
    } catch (err) {
      console.error('Error fetching recordings:', err);
      setError('Failed to load recordings. Please try again later.');
    }
  };

  // Refresh recordings after the user has seen all or wants to refresh
  const handleRefreshClick = () => {
    refreshRecordings();
  };
  
  const refreshRecordings = async () => {
    setAllRecordingsVoted(false);
    setCurrentIndex(0);
    setError(null);
    setLoading(true);
    
    try {
      // Get fresh voted IDs first
      const freshVotedIds = await fetchVotedRecordings();
      
      // Then fetch recordings with those IDs
      await fetchRecordings(freshVotedIds);
    } catch (error) {
      console.error("Error refreshing recordings:", error);
      setError("There was a problem refreshing content. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleVote = async (recordingId: string, voteType: 'up' | 'down') => {
    if (loadingVote) return;
    
    // Don't allow voting if user already voted on this recording
    if (votedRecordingIds.has(recordingId)) {
      console.log(`User already voted on recording ${recordingId}`);
      setError('You have already voted on this recording.');
      return;
    }
    
    // Check authentication state before attempting to vote
    if (!authState.isAuthenticated) {
      router.push(`/signin?redirect=${encodeURIComponent('/vote')}`);
      return;
    }
    
    setLoadingVote(true);
    
    try {
      // Get the token for API authentication
      console.log('Getting access token for voting...');
      const token = await getAccessToken();
      
      if (!token) {
        console.error('Authentication token is null or undefined');
        throw new Error('Failed to get authentication token');
      }
      
      console.log(`Submitting vote for recording ${recordingId}, vote type: ${voteType}`);
      
      const response = await fetch('/api/votes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          recordingId,
          voteType,
        }),
      });

      // Handle 409 Conflict (already voted)
      if (response.status === 409) {
        console.log('User has already voted on this recording (backend conflict)');
        
        // Add to voted set to prevent future attempts
        setVotedRecordingIds(prev => {
          const newSet = new Set(prev);
          newSet.add(recordingId);
          return newSet;
        });
        
        setError('You have already voted on this recording.');
        return;
      }

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Vote API error (${response.status}):`, errorText);
        throw new Error(`Failed to submit vote: ${response.status}`);
      }

      const data = await response.json();
      console.log('Vote submitted successfully:', data);
      
      // Add this recording ID to the set of voted recordings
      setVotedRecordingIds(prev => {
        const newSet = new Set(prev);
        newSet.add(recordingId);
        return newSet;
      });
      
      // Move to the next recording after voting
      goToNextRecording();
    } catch (err) {
      console.error('Error voting:', err);
      setError('Failed to submit your vote. Please try again.');
    } finally {
      setLoadingVote(false);
      setSwiping('none');
      setSwipePosition({ x: 0, y: 0 });
    }
  };

  const goToNextRecording = () => {
    // Check if there are unvoted recordings left
    for (let i = currentIndex + 1; i < recordings.length; i++) {
      if (!votedRecordingIds.has(recordings[i].id)) {
        setCurrentIndex(i);
        return;
      }
    }
    
    // If we've reached here, all recordings have been voted on
    setAllRecordingsVoted(true);
    setError('You\'ve voted on all available recordings!');
  };

  const handleSwipeStart = (clientX: number, clientY: number) => {
    touchActive.current = true;
    setStartPosition({ x: clientX, y: clientY });
  };

  const handleSwipeMove = (clientX: number, clientY: number) => {
    if (!touchActive.current) return;
    
    const deltaX = clientX - startPosition.x;
    const deltaY = clientY - startPosition.y;
    
    // Update the position of the card
    setSwipePosition({ x: deltaX, y: deltaY });
    
    // Determine swipe direction based on horizontal movement
    if (deltaX > 50) {
      setSwiping('right');
    } else if (deltaX < -50) {
      setSwiping('left');
    } else {
      setSwiping('none');
    }
  };

  const handleSwipeEnd = () => {
    touchActive.current = false;
    
    // Check if the current recording has been voted on
    const isCurrentRecordingVoted = recordings[currentIndex] ? 
      votedRecordingIds.has(recordings[currentIndex].id) : false;

    if (isCurrentRecordingVoted) {
      setSwiping('none');
      setSwipePosition({ x: 0, y: 0 });
      setError('You have already voted on this recording.');
      return;
    }
    
    // If we have a significant horizontal swipe, complete the action
    if (swiping === 'right' && recordings[currentIndex]) {
      handleVote(recordings[currentIndex].id, 'up');
    } else if (swiping === 'left' && recordings[currentIndex]) {
      handleVote(recordings[currentIndex].id, 'down');
    } else {
      // Reset position if swipe wasn't far enough
      setSwiping('none');
      setSwipePosition({ x: 0, y: 0 });
    }
  };

  // Mouse event handlers for desktop
  const handleMouseDown = (e: React.MouseEvent) => {
    handleSwipeStart(e.clientX, e.clientY);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    handleSwipeMove(e.clientX, e.clientY);
  };

  const handleMouseUp = () => {
    handleSwipeEnd();
  };

  const handleMouseLeave = () => {
    if (touchActive.current) {
      handleSwipeEnd();
    }
  };

  // Touch event handlers for mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    handleSwipeStart(touch.clientX, touch.clientY);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    handleSwipeMove(touch.clientX, touch.clientY);
  };

  const handleTouchEnd = () => {
    handleSwipeEnd();
  };

  // Current recording being displayed
  const currentRecording = recordings[currentIndex];
  const hasRecordings = recordings.length > 0 && currentIndex < recordings.length;
  
  // Calculate rotation and opacity based on swipe
  const cardRotation = swipePosition.x * 0.1; // Subtle rotation based on swipe distance
  const cardOpacity = Math.max(1 - Math.abs(swipePosition.x) / 400, 0); // Fade out as card moves away

  // Check if the current recording has been voted on
  const isCurrentRecordingVoted = recordings[currentIndex] ? 
    votedRecordingIds.has(recordings[currentIndex].id) : false;

  // Return a message if all recordings have been voted on
  if (allRecordingsVoted) {
    return (
      <>
        <Head>
          <title>Vote on Freestyles - FreestyleFiend</title>
          <meta name="description" content="Vote on the best freestyles from the community" />
        </Head>
        <main style={{
          padding: '2rem 1rem',
          minHeight: 'calc(100vh - 60px)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          background: 'linear-gradient(135deg, #4c1d95 0%, #2e1065 100%)',
        }}>
          <div style={{
            maxWidth: '600px',
            width: '100%',
            backgroundColor: 'rgba(76, 29, 149, 0.6)',
            borderRadius: '1rem',
            padding: '2rem',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.3)',
          }}>
            <h1 style={{ marginBottom: '1.5rem' }}>All Done!</h1>
            <p style={{ fontSize: '1.125rem', marginBottom: '2rem' }}>
              You've voted on all available recordings.
            </p>
            <button
              onClick={handleRefreshClick}
              style={{
                backgroundColor: '#4f46e5',
                color: 'white',
                border: 'none',
                padding: '0.75rem 1.5rem',
                borderRadius: '0.5rem',
                fontSize: '1rem',
                fontWeight: 'bold',
                cursor: 'pointer',
                transition: 'background-color 0.2s',
              }}
              onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#4338ca'}
              onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#4f46e5'}
            >
              Refresh Recordings
            </button>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>Vote on Freestyles - FreestyleFiend</title>
        <meta name="description" content="Vote on your favorite freestyle performances" />
      </Head>
      <main style={{ 
        minHeight: 'calc(100vh - 60px)', 
        backgroundColor: '#4c1d95', 
        color: 'white',
        padding: '1rem',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}>
        <div style={{ 
          maxWidth: '480px', 
          width: '100%',
          margin: '0 auto',
          paddingTop: '1rem',
        }}>
          <h1 style={{
            fontSize: '1.875rem',
            fontWeight: 700,
            textAlign: 'center',
            marginBottom: '1.5rem',
          }}>
            Vote on Freestyles
          </h1>
          
          {!authState.isAuthenticated ? (
            <div style={{
              textAlign: 'center',
              padding: '3rem 0',
            }}>
              <p style={{ marginBottom: '1rem' }}>Sign in to vote on freestyles</p>
              <button
                onClick={() => router.push(`/signin?redirect=${encodeURIComponent('/vote')}`)}
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
                Sign In
              </button>
            </div>
          ) : loading ? (
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
          ) : error && !hasRecordings ? (
            <div style={{
              textAlign: 'center',
              padding: '2rem 1rem',
              backgroundColor: 'rgba(31, 41, 55, 0.5)',
              borderRadius: '0.5rem',
            }}>
              <p style={{ marginBottom: '1rem' }}>{error}</p>
              <button
                onClick={fetchRecordings}
                style={{
                  backgroundColor: '#db2777', 
                  color: 'white',
                  border: 'none',
                  padding: '0.5rem 1rem',
                  borderRadius: '0.375rem',
                  fontWeight: 500,
                  cursor: 'pointer',
                }}
              >
                Try Again
              </button>
            </div>
          ) : hasRecordings ? (
            <div style={{
              position: 'relative',
              height: '500px',
              width: '100%',
            }}>
              {/* Swipe indicators */}
              <div style={{
                position: 'absolute',
                top: '50%',
                left: '2rem',
                transform: 'translateY(-50%)',
                opacity: swiping === 'left' ? 0.9 : 0,
                transition: 'opacity 0.2s ease',
                zIndex: 20,
                backgroundColor: 'rgba(239, 68, 68, 0.9)',
                borderRadius: '50%',
                width: '3rem',
                height: '3rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <span style={{ 
                  fontSize: '1.5rem',
                  fontWeight: 'bold',
                }}>✗</span>
              </div>
              
              <div style={{
                position: 'absolute',
                top: '50%',
                right: '2rem',
                transform: 'translateY(-50%)',
                opacity: swiping === 'right' ? 0.9 : 0,
                transition: 'opacity 0.2s ease',
                zIndex: 20,
                backgroundColor: 'rgba(16, 185, 129, 0.9)',
                borderRadius: '50%',
                width: '3rem',
                height: '3rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <span style={{ 
                  fontSize: '1.5rem',
                  fontWeight: 'bold',
                }}>✓</span>
              </div>

              {/* Card stack effect - show next card if available */}
              {currentIndex < recordings.length - 1 && (
                <div style={{
                  position: 'absolute',
                  top: '10px',
                  left: '0',
                  right: '0',
                  bottom: '0',
                  backgroundColor: 'rgba(139, 92, 246, 0.3)',
                  borderRadius: '1rem',
                  transform: 'scale(0.95)',
                  zIndex: 1,
                }}></div>
              )}
              
              {/* Current recording card */}
              <div
                ref={cardRef}
                style={{
                  position: 'absolute',
                  top: '0',
                  left: '0',
                  right: '0',
                  bottom: '0',
                  backgroundColor: 'rgba(91, 33, 182, 0.8)',
                  borderRadius: '1rem',
                  padding: '1.5rem',
                  display: 'flex',
                  flexDirection: 'column',
                  transform: `translateX(${swipePosition.x}px) translateY(${swipePosition.y}px) rotate(${cardRotation}deg)`,
                  opacity: cardOpacity,
                  transition: swiping === 'none' ? 'transform 0.5s ease, opacity 0.5s ease' : 'none',
                  zIndex: 10,
                  boxShadow: '0 10px 25px rgba(0, 0, 0, 0.2)',
                  cursor: 'grab',
                }}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseLeave}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
              >
                {/* Placeholder Image */}
                <div style={{
                  position: 'relative',
                  width: '100%',
                  height: '200px',
                  borderRadius: '0.5rem',
                  marginBottom: '1rem',
                  overflow: 'hidden',
                }}>
                  <div style={{
                    width: '100%',
                    height: '100%',
                    background: getPlaceholderImageForRecording(currentRecording.id).background,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '5rem',
                  }}>
                    {/* Background pattern */}
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
                    
                    {getPlaceholderImageForRecording(currentRecording.id).icon}
                  </div>
                </div>
                
                {/* Recording details */}
                <div style={{ marginBottom: '1rem' }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    marginBottom: '0.25rem',
                  }}>
                    <h2 style={{
                      fontSize: '1.5rem',
                      fontWeight: 600,
                      marginRight: '0.5rem',
                    }}>
                      {currentRecording.title}
                    </h2>
                    {currentRecording.explicit && (
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
                    fontSize: '1rem',
                    color: 'rgba(255, 255, 255, 0.8)',
                  }}>
                    by {currentRecording.artistName}
                  </p>
                </div>
                
                {/* Audio player */}
                <div style={{ marginBottom: '1rem', flex: 1 }}>
                  <AudioPlayer 
                    src={currentRecording.audioUrl} 
                    title={currentRecording.title}
                    artist={currentRecording.artistName}
                    onError={() => console.error(`Error loading audio for recording ${currentRecording.id}`)}
                  />
                </div>
                
                {/* Swipe instructions */}
                <div style={{
                  textAlign: 'center',
                  fontSize: '0.875rem',
                  color: 'rgba(255, 255, 255, 0.7)',
                  marginTop: 'auto',
                }}>
                  <p>Swipe right to like, left to dislike, or use the buttons below</p>
                </div>
                
                {/* Vote buttons for alternative interaction */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-around',
                  marginTop: '1rem',
                }}>
                  <button
                    onClick={() => handleVote(currentRecording.id, 'down')}
                    disabled={loadingVote || isCurrentRecordingVoted}
                    style={{
                      backgroundColor: 'rgba(239, 68, 68, 0.8)',
                      width: '3.5rem',
                      height: '3.5rem',
                      borderRadius: '50%',
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      border: 'none',
                      cursor: loadingVote || isCurrentRecordingVoted ? 'default' : 'pointer',
                      opacity: loadingVote || isCurrentRecordingVoted ? 0.5 : 1,
                    }}
                    aria-label="Dislike"
                  >
                    <span style={{ fontSize: '1.5rem' }}>✗</span>
                  </button>
                  
                  <button
                    onClick={() => handleVote(currentRecording.id, 'up')}
                    disabled={loadingVote || isCurrentRecordingVoted}
                    style={{
                      backgroundColor: 'rgba(16, 185, 129, 0.8)',
                      width: '3.5rem',
                      height: '3.5rem',
                      borderRadius: '50%',
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      border: 'none',
                      cursor: loadingVote || isCurrentRecordingVoted ? 'default' : 'pointer',
                      opacity: loadingVote || isCurrentRecordingVoted ? 0.5 : 1,
                    }}
                    aria-label="Like"
                  >
                    <span style={{ fontSize: '1.5rem' }}>✓</span>
                  </button>
                </div>
              </div>
              
              {/* Progress indicator */}
              <div style={{
                position: 'absolute',
                bottom: '-2rem',
                left: '0',
                right: '0',
                display: 'flex',
                justifyContent: 'center',
                gap: '0.5rem',
              }}>
                {recordings.slice(0, Math.min(recordings.length, 5)).map((_, i) => (
                  <div
                    key={i}
                    style={{
                      width: '0.5rem',
                      height: '0.5rem',
                      borderRadius: '50%',
                      backgroundColor: i === currentIndex ? 'white' : 'rgba(255, 255, 255, 0.3)',
                    }}
                  />
                ))}
                {recordings.length > 5 && (
                  <div style={{ 
                    fontSize: '0.75rem', 
                    color: 'rgba(255, 255, 255, 0.7)',
                    marginLeft: '0.25rem',
                  }}>
                    {currentIndex + 1}/{recordings.length}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div style={{
              textAlign: 'center',
              padding: '3rem 0',
              color: 'rgba(255, 255, 255, 0.7)',
            }}>
              <p style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>No freestyles found to vote on.</p>
              <p>Check back later for new submissions!</p>
            </div>
          )}
        </div>
        
        {/* Footer with instructions */}
        <div style={{
          maxWidth: '480px',
          width: '100%',
          margin: '2rem auto 0',
          padding: '1rem',
          backgroundColor: 'rgba(76, 29, 149, 0.6)',
          borderRadius: '0.5rem',
        }}>
          <h2 style={{
            fontSize: '1.25rem',
            fontWeight: 600,
            marginBottom: '0.5rem',
          }}>
            How to Vote
          </h2>
          <ul style={{
            listStyleType: 'disc',
            paddingLeft: '1.25rem',
            fontSize: '0.875rem',
            color: 'rgba(255, 255, 255, 0.8)',
          }}>
            <li>Swipe right or tap ✓ to like a freestyle</li>
            <li>Swipe left or tap ✗ to dislike a freestyle</li>
            <li>Listen to the full recording before voting</li>
            <li>Top-rated freestyles appear on the leaderboard</li>
          </ul>
        </div>
      </main>
      <style jsx>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </>
  );
}
