import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { Recording } from '@/types/recordings';
import { useAuth } from '@/lib/auth';
import { getAccessToken } from '@/lib/auth';
import { signOut } from 'aws-amplify/auth';
import AudioPlayer from '@/components/AudioPlayer';
import Link from 'next/link';

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

  // Handle sign out
  const handleSignOut = async () => {
    try {
      await signOut();
      router.push('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

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
    
    // If we have a significant horizontal swipe, complete the action with animation
    if (swiping === 'right' && recordings[currentIndex]) {
      // For right swipe (upvote) - add extra animation before handling vote
      const card = cardRef.current;
      if (card) {
        card.style.transition = 'transform 0.5s ease-out';
        card.style.transform = `translateX(${window.innerWidth}px) rotate(${Math.min(swipePosition.x * 0.1, 30)}deg)`;
        
        // Delay the vote handling to allow animation to complete
        setTimeout(() => {
          handleVote(recordings[currentIndex].id, 'up');
        }, 300);
      } else {
        handleVote(recordings[currentIndex].id, 'up');
      }
    } else if (swiping === 'left' && recordings[currentIndex]) {
      // For left swipe (downvote) - add extra animation before handling vote
      const card = cardRef.current;
      if (card) {
        card.style.transition = 'transform 0.5s ease-out';
        card.style.transform = `translateX(-${window.innerWidth}px) rotate(${Math.max(swipePosition.x * 0.1, -30)}deg)`;
        
        // Delay the vote handling to allow animation to complete
        setTimeout(() => {
          handleVote(recordings[currentIndex].id, 'down');
        }, 300);
      } else {
        handleVote(recordings[currentIndex].id, 'down');
      }
    } else {
      // Reset position if swipe wasn't far enough - add springy animation
      const card = cardRef.current;
      if (card) {
        card.style.transition = 'transform 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)'; // Bouncy effect
        card.style.transform = 'translateX(0) rotate(0deg)';
      }
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
          <style>{`
            body {
              background-color: #0f0f0f;
              color: #fff;
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
              margin: 0;
              padding: 0;
            }
            
            a {
              color: inherit;
              text-decoration: none;
            }
            
            @keyframes fadeIn {
              0% { opacity: 0; }
              100% { opacity: 1; }
            }
            
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}</style>
        </Head>
        
        {/* Custom Header */}
        <header style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          padding: '16px 20px',
          borderBottom: '1px solid #333',
          backgroundColor: '#0f0f0f'
        }}>
          <Link 
            href="/"
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              color: '#9333ea' 
            }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM12 8C13.66 8 15 9.34 15 11V17C15 18.66 13.66 20 12 20C10.34 20 9 18.66 9 17V11C9 9.34 10.34 8 12 8ZM18 12C18 15.31 15.31 18 12 18V16C14.21 16 16 14.21 16 12H18Z" fill="currentColor" />
            </svg>
            <span style={{ 
              marginLeft: '8px', 
              fontWeight: 'bold' 
            }}>
              FreestyleFiend
            </span>
          </Link>

          <div>
            {authState.isAuthenticated ? (
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <Link 
                  href="/profile" 
                  style={{ marginRight: '16px' }}
                >
                  Profile
                </Link>
                <button 
                  onClick={handleSignOut}
                  style={{
                    background: 'transparent',
                    border: '1px solid #444',
                    color: 'white',
                    padding: '6px 12px',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '14px'
                  }}
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <div>
                <Link 
                  href="/signin"
                  style={{
                    marginRight: '8px',
                    color: 'white',
                    padding: '6px 12px',
                    borderRadius: '4px',
                    fontSize: '14px'
                  }}
                >
                  Sign In
                </Link>
                <Link 
                  href="/signup"
                  style={{
                    background: 'transparent',
                    border: '1px solid #444',
                    color: 'white',
                    padding: '6px 12px',
                    borderRadius: '4px',
                    fontSize: '14px'
                  }}
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </header>
        
        <main style={{
          minHeight: 'calc(100vh - 60px)',
          backgroundColor: '#0f0f0f',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2rem 1rem',
        }}>
          <div style={{
            maxWidth: '600px',
            width: '100%',
            backgroundColor: 'rgba(17, 17, 17, 0.8)',
            borderRadius: '0.75rem',
            padding: '2rem',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.3)',
            border: '1px solid rgba(147, 51, 234, 0.2)',
            textAlign: 'center',
          }}>
            <h1 style={{ fontSize: '2rem', marginBottom: '1.5rem' }}>All Done!</h1>
            <p style={{ fontSize: '1.125rem', marginBottom: '2rem' }}>
              You've voted on all available recordings.
            </p>
            <Link 
              href="/"
              style={{
                backgroundColor: '#9333ea',
                color: 'white',
                border: 'none',
                padding: '0.75rem 1.5rem',
                borderRadius: '0.5rem',
                fontSize: '1rem',
                fontWeight: 'bold',
                cursor: 'pointer',
                textDecoration: 'none',
                display: 'inline-block',
              }}
            >
              Go Home
            </Link>
          </div>
        </main>
        
        <style jsx global>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>Vote on Freestyles - FreestyleFiend</title>
        <meta name="description" content="Vote on your favorite freestyle performances" />
        <style>{`
          body {
            background-color: #0f0f0f;
            color: #fff;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            margin: 0;
            padding: 0;
          }
          
          a {
            color: inherit;
            text-decoration: none;
          }
          
          @keyframes fadeIn {
            0% { opacity: 0; }
            100% { opacity: 1; }
          }
          
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </Head>
      <header style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        padding: '16px 20px',
        borderBottom: '1px solid #333',
        backgroundColor: '#0f0f0f'
      }}>
        <Link href="/">
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            color: '#9333ea' 
          }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM12 8C13.66 8 15 9.34 15 11V17C15 18.66 13.66 20 12 20C10.34 20 9 18.66 9 17V11C9 9.34 10.34 8 12 8ZM18 12C18 15.31 15.31 18 12 18V16C14.21 16 16 14.21 16 12H18Z" fill="currentColor" />
            </svg>
            <span style={{ 
              marginLeft: '8px', 
              fontWeight: 'bold' 
            }}>
              FreestyleFiend
            </span>
          </div>
        </Link>

        <div>
          {authState.isAuthenticated ? (
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <Link href="/profile" style={{ marginRight: '16px' }}>Profile</Link>
              <button 
                onClick={handleSignOut}
                style={{
                  background: 'transparent',
                  border: '1px solid #444',
                  color: 'white',
                  padding: '6px 12px',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                Sign Out
              </button>
            </div>
          ) : (
            <div>
              <Link 
                href="/signin"
                style={{
                  marginRight: '8px',
                  color: 'white',
                  padding: '6px 12px',
                  borderRadius: '4px',
                  fontSize: '14px',
                  backgroundColor: 'transparent',
                  border: '1px solid #444',
                  cursor: 'pointer',
                }}
              >
                Sign In
              </Link>
              <Link 
                href="/signup"
                style={{
                  background: 'transparent',
                  border: '1px solid #444',
                  color: 'white',
                  padding: '6px 12px',
                  borderRadius: '4px',
                  fontSize: '14px',
                  cursor: 'pointer',
                }}
              >
                Sign Up
              </Link>
            </div>
          )}
        </div>
      </header>
      <main style={{ 
        minHeight: 'calc(100vh - 60px)', 
        backgroundColor: '#0f0f0f', 
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
              backgroundColor: 'rgba(147, 51, 234, 0.1)',
              borderRadius: '0.75rem',
              border: '1px solid rgba(147, 51, 234, 0.2)',
            }}>
              <p style={{ marginBottom: '1rem' }}>Sign in to vote on freestyles</p>
              <Link 
                href="/signin"
                style={{
                  backgroundColor: '#9333ea', 
                  color: 'white',
                  border: 'none',
                  padding: '0.75rem 1.5rem',
                  borderRadius: '0.375rem',
                  fontWeight: 500,
                  cursor: 'pointer',
                  textDecoration: 'none',
                  display: 'inline-block',
                }}
              >
                Sign In
              </Link>
            </div>
          ) : loading ? (
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              height: '50vh',
            }}>
              <div style={{
                width: '2rem',
                height: '2rem',
                border: '4px solid rgba(147, 51, 234, 0.3)',
                borderRadius: '50%',
                borderTopColor: '#9333ea',
                animation: 'spin 1s linear infinite',
              }}></div>
            </div>
          ) : error ? (
            <div style={{
              backgroundColor: 'rgba(239, 68, 68, 0.2)', 
              padding: '1rem',
              borderRadius: '0.5rem',
              marginBottom: '1.5rem',
              textAlign: 'center',
              color: 'white',
            }}>
              {error}
              {allRecordingsVoted && (
                <div style={{ marginTop: '1rem' }}>
                  <button
                    onClick={() => loadVotePageData()}
                    style={{
                      backgroundColor: '#9333ea',
                      color: 'white',
                      border: 'none',
                      padding: '0.75rem 1.5rem',
                      borderRadius: '0.375rem',
                      fontWeight: 500,
                      cursor: 'pointer',
                      marginTop: '0.5rem',
                    }}
                  >
                    Refresh Recordings
                  </button>
                </div>
              )}
            </div>
          ) : recordings.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '3rem 0',
              color: 'rgba(255, 255, 255, 0.7)',
              backgroundColor: 'rgba(147, 51, 234, 0.1)',
              borderRadius: '0.75rem',
              border: '1px solid rgba(147, 51, 234, 0.2)',
            }}>
              <p style={{ marginBottom: '1rem' }}>No recordings available for voting at this time.</p>
              <Link 
                href="/leaderboard"
                style={{
                  backgroundColor: '#9333ea', 
                  color: 'white',
                  border: 'none',
                  padding: '0.75rem 1.5rem',
                  borderRadius: '0.375rem',
                  fontWeight: 500,
                  cursor: 'pointer',
                }}
              >
                View Leaderboard
              </Link>
            </div>
          ) : (
            <>
              {/* Recording Card */}
              <div
                ref={cardRef}
                style={{
                  width: '100%',
                  maxWidth: '100%',
                  backgroundColor: 'rgba(17, 17, 17, 0.8)',
                  borderRadius: '0.75rem',
                  overflow: 'hidden',
                  position: 'relative',
                  transform: `rotate(${swiping !== 'none' ? (swiping === 'left' ? Math.min(swipePosition.x * -0.05, 0) : Math.max(swipePosition.x * 0.05, 0)) : 0}deg) 
                              translateX(${swiping !== 'none' ? swipePosition.x : 0}px)`,
                  transition: swiping === 'none' ? 'all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)' : 'none',
                  border: '1px solid rgba(147, 51, 234, 0.2)',
                  boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
                  touchAction: 'pan-y', // Allow vertical scrolling but capture horizontal
                }}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseLeave}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
              >
                {/* Recording image */}
                <div style={{
                  height: '120px',
                  backgroundColor: recordings[currentIndex] ? getPlaceholderImageForRecording(recordings[currentIndex].id).background : 'black',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  position: 'relative',
                  overflow: 'hidden',
                }}>
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
                  
                  <span style={{
                    fontSize: '3rem',
                    textShadow: '0 2px 4px rgba(0,0,0,0.2)',
                  }}>
                    {recordings[currentIndex] && getPlaceholderImageForRecording(recordings[currentIndex].id).icon}
                  </span>
                  
                  {/* Vote Overlay */}
                  {swiping === 'left' && (
                    <div style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      backgroundColor: 'rgba(239, 68, 68, 0.5)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      opacity: Math.min(Math.abs(swipePosition.x) / 100, 1),
                      transition: 'opacity 0.2s',
                      borderRadius: '0.75rem',
                      border: `${Math.min(Math.abs(swipePosition.x) / 50, 4)}px solid rgba(239, 68, 68, 0.8)`, // Growing border with swipe
                    }}>
                      <span style={{ 
                        fontSize: '2rem', 
                        fontWeight: 'bold',
                        color: 'white',
                        textShadow: '0 2px 5px rgba(0,0,0,0.3)',
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '0.5rem'
                      }}>
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M12 5v14M5 12l7 7 7-7"/>
                        </svg>
                        Not Fire
                      </span>
                    </div>
                  )}
                  
                  {swiping === 'right' && (
                    <div style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      backgroundColor: 'rgba(16, 185, 129, 0.5)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      opacity: Math.min(Math.abs(swipePosition.x) / 100, 1),
                      transition: 'opacity 0.2s',
                      borderRadius: '0.75rem',
                      border: `${Math.min(Math.abs(swipePosition.x) / 50, 4)}px solid rgba(16, 185, 129, 0.8)`, // Growing border with swipe
                    }}>
                      <span style={{ 
                        fontSize: '2rem', 
                        fontWeight: 'bold',
                        color: 'white',
                        textShadow: '0 2px 5px rgba(0,0,0,0.3)',
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '0.5rem'
                      }}>
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M12 19V5M5 12l7-7 7 7"/>
                        </svg>
                        Fire
                      </span>
                    </div>
                  )}
                </div>
                
                <div style={{ padding: '1.25rem' }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    marginBottom: '0.5rem',
                  }}>
                    <h2 style={{ 
                      fontSize: '1.25rem', 
                      fontWeight: 'bold',
                      margin: 0,
                      flex: 1,
                    }}>
                      {recordings[currentIndex]?.title}
                    </h2>
                    {recordings[currentIndex]?.explicit && (
                      <span style={{
                        backgroundColor: 'rgba(147, 51, 234, 0.8)',
                        color: 'white',
                        padding: '0.125rem 0.375rem',
                        borderRadius: '0.25rem',
                        fontSize: '0.6875rem',
                        fontWeight: 600,
                        letterSpacing: '0.05em',
                      }}>
                        EXPLICIT
                      </span>
                    )}
                  </div>
                  
                  <p style={{
                    color: 'rgba(255, 255, 255, 0.7)',
                    fontSize: '0.875rem',
                    marginBottom: '1rem',
                  }}>
                    by <span style={{ color: 'rgba(147, 51, 234, 0.8)' }}>{recordings[currentIndex]?.artistName}</span>
                  </p>
                  
                  {/* Audio Player */}
                  <AudioPlayer 
                    src={recordings[currentIndex]?.audioUrl} 
                    title={recordings[currentIndex]?.title || 'Untitled Recording'}
                    artist={recordings[currentIndex]?.artistName || 'Unknown Artist'}
                    onError={() => {}}
                  />
                  
                  <div style={{
                    marginTop: '1.5rem',
                    display: 'flex',
                    justifyContent: 'space-between',
                    gap: '1rem',
                  }}>
                    <button
                      onClick={() => handleVote(recordings[currentIndex].id, 'down')}
                      disabled={loadingVote}
                      style={{
                        flex: 1,
                        backgroundColor: 'rgba(255, 255, 255, 0.1)',
                        color: 'white',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        height: '3rem',
                        borderRadius: '0.5rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.5rem',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                      }}
                      onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.15)'}
                      onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)'}
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 5v14M5 12l7 7 7-7"/>
                      </svg>
                      <span>Not Fire</span>
                    </button>
                    
                    <button
                      onClick={() => handleVote(recordings[currentIndex].id, 'up')}
                      disabled={loadingVote}
                      style={{
                        flex: 1,
                        backgroundColor: '#9333ea',
                        color: 'white',
                        border: 'none',
                        height: '3rem',
                        borderRadius: '0.5rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.5rem',
                        cursor: 'pointer',
                        fontWeight: 500,
                      }}
                      onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#7e22ce'}
                      onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#9333ea'}
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 19V5M5 12l7-7 7 7"/>
                      </svg>
                      <span>Fire</span>
                    </button>
                  </div>
                </div>
              </div>
              
              {/* Swipe Instruction */}
              <div style={{
                marginTop: '1rem',
                textAlign: 'center',
                color: 'rgba(255, 255, 255, 0.6)',
                fontSize: '0.875rem',
              }}>
                <p>
                  Swipe right to mark as Fire, left to mark as Not Fire
                </p>
                <p style={{ fontSize: '0.75rem', marginTop: '0.25rem', color: 'rgba(255, 255, 255, 0.4)' }}>
                  {currentIndex + 1} of {recordings.length} recordings
                </p>
              </div>
            </>
          )}
        </div>
        
        {/* Footer with instructions */}
        <div style={{
          maxWidth: '480px',
          width: '100%',
          margin: '2rem auto 0',
          padding: '1.25rem',
          backgroundColor: 'rgba(17, 17, 17, 0.8)',
          borderRadius: '0.75rem',
          border: '1px solid rgba(147, 51, 234, 0.2)',
          boxSizing: 'border-box',
        }}>
          <h2 style={{
            fontSize: '1.25rem',
            fontWeight: 600,
            marginBottom: '0.75rem',
            color: 'white',
            textAlign: 'center',
          }}>
            How to Vote
          </h2>
          <ul style={{
            listStyleType: 'disc',
            paddingLeft: '1.75rem',
            paddingRight: '0.75rem',
            fontSize: '0.875rem',
            color: 'rgba(255, 255, 255, 0.8)',
            margin: '0 auto',
            lineHeight: '1.6',
          }}>
            <li>Swipe right or tap <b>Fire</b> <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{display: 'inline', verticalAlign: 'middle'}}><path d="M12 19V5M5 12l7-7 7 7"/></svg> to like a freestyle</li>
            <li>Swipe left or tap <b>Not Fire</b> <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{display: 'inline', verticalAlign: 'middle'}}><path d="M12 5v14M5 12l7 7 7-7"/></svg> to dislike a freestyle</li>
            <li>Listen to the full recording before voting</li>
            <li>Top-rated freestyles appear on the leaderboard</li>
          </ul>
        </div>
      </main>
      
      <style jsx global>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </>
  );
}
