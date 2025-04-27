import Image from "next/image";
import { useState, useEffect } from "react";

interface Beat {
  beatId: string;
  title: string;
  producer: string;
  genre?: string;
  bpm?: number;
  duration?: string;
  tags: string[];
  description: string;
  audioUrl: string;
  imageUrl: string;
  s3Key?: string;
  createdAt?: string;
}

interface BeatsGalleryProps {
  onSelectBeat?: (beatId: string) => void;
}

/**
 * Responsive, vibrant gallery for displaying FreestyleFiend beats.
 * Fetches beats from the backend API and displays them in a grid.
 */
export function BeatsGallery({ onSelectBeat }: BeatsGalleryProps) {
  const [isMobile, setIsMobile] = useState(false);
  const [beats, setBeats] = useState<Beat[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    // Initial check
    checkMobile();
    
    // Add event listener
    window.addEventListener('resize', checkMobile);
    
    // Cleanup
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Fetch beats from API
  useEffect(() => {
    const fetchBeats = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await fetch('/api/beats');
        
        if (!response.ok) {
          throw new Error(`Error fetching beats: ${response.status}`);
        }
        
        const data = await response.json();
        setBeats(data);
      } catch (err) {
        console.error('Error fetching beats:', err);
        setError('Failed to load beats. Please try again later.');
        
        // Fall back to demo beats if we can't fetch from API
        setBeats([
          {
            beatId: "beat1",
            title: "Move In Silence",
            producer: "FreestyleBeats.io",
            description: "Contemplative trap instrumental.",
            tags: ["Atmospheric", "Contemplative"],
            imageUrl: "https://placehold.co/400x400/330033/FFFFFF?text=SILENCE",
            audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3"
          },
          {
            beatId: "beat2",
            title: "One Love",
            producer: "FreshBeats.io",
            description: "Old school groovy hip hop beat.",
            tags: ["Nostalgic", "Old School"],
            imageUrl: "https://placehold.co/400x400/663300/FFFFFF?text=ONE+LOVE",
            audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3"
          },
          {
            beatId: "beat3",
            title: "Secrets",
            producer: "FreshBeats.io",
            description: "Dark and mysterious beat with trap elements.",
            tags: ["Dark", "Trap"],
            imageUrl: "https://placehold.co/400x400/330000/FFFFFF?text=SECRETS",
            audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3"
          }
        ]);
      } finally {
        setLoading(false);
      }
    };
    
    fetchBeats();
  }, []);

  return (
    <div
      style={{
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 0,
        backgroundColor: '#0f0f0f'
      }}
    >
      <div 
        style={{
          width: '100%',
          maxWidth: isMobile ? '95%' : '1200px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          margin: '0 auto'
        }}
      >
        {error && (
          <div style={{
            backgroundColor: 'rgba(239, 68, 68, 0.1)', // red with opacity
            color: 'white',
            padding: '1rem',
            borderRadius: '0.5rem',
            marginBottom: '1.5rem',
            textAlign: 'center',
            border: '1px solid rgba(239, 68, 68, 0.2)',
            width: '100%',
            margin: '0 0 1.5rem'
          }}>
            Error: {error}
          </div>
        )}
        
        {loading && (
          <div style={{ 
            display: 'flex',
            justifyContent: 'center',
            padding: '2rem',
            width: '100%'
          }}>
            <div
              style={{
                border: '4px solid rgba(147, 51, 234, 0.3)',
                borderTop: '4px solid #9333ea',
                borderRadius: '50%',
                width: '50px',
                height: '50px',
                animation: 'spin 1s linear infinite',
              }}
            />
            <style jsx>{`
              @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
              }
            `}</style>
          </div>
        )}
        
        {!loading && beats.length === 0 && (
          <div style={{
            textAlign: 'center',
            padding: '2rem',
            color: 'white',
            width: '100%'
          }}>
            No beats found. Check back later!
          </div>
        )}
        
        {!loading && beats.length > 0 && (
          <div 
            style={{
              width: '100%',
              display: isMobile ? 'flex' : 'grid',
              flexDirection: isMobile ? 'column' : undefined,
              gridTemplateColumns: isMobile ? undefined : 'repeat(auto-fill, minmax(280px, 1fr))',
              alignItems: 'center',
              justifyContent: isMobile ? 'center' : undefined,
              justifyItems: isMobile ? undefined : 'center',
              gap: isMobile ? '1.5rem' : '2rem',
              padding: isMobile ? '0.5rem 0' : '2rem 0'
            }}
          >
            {beats.map((beat) => (
              <div
                key={beat.beatId}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: '100%',
                  width: isMobile ? '100%' : '280px',
                  maxWidth: isMobile ? '100%' : '280px',
                  borderRadius: '0.75rem',
                  backgroundColor: '#111111',
                  boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3)',
                  border: '1px solid rgba(147, 51, 234, 0.2)',
                  overflow: 'hidden',
                  cursor: 'pointer',
                  transition: 'transform 0.3s, box-shadow 0.3s'
                }}
                onClick={() => onSelectBeat && onSelectBeat(beat.beatId)}
                onMouseOver={(e) => {
                  if (!isMobile) {
                    e.currentTarget.style.transform = 'scale(1.05)';
                    e.currentTarget.style.boxShadow = '0 25px 50px -12px rgba(147, 51, 234, 0.3)';
                  }
                }}
                onMouseOut={(e) => {
                  if (!isMobile) {
                    e.currentTarget.style.transform = 'scale(1)';
                    e.currentTarget.style.boxShadow = '0 20px 25px -5px rgba(0, 0, 0, 0.3)';
                  }
                }}
              >
                {/* Image and title section */}
                <div style={{
                  width: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: isMobile ? '1.5rem 1rem 1rem' : '2rem',
                  textAlign: 'center'
                }}>
                  <div style={{
                    width: '100%',
                    maxWidth: isMobile ? '85%' : '180px',
                    aspectRatio: '1',
                    borderRadius: '0.75rem',
                    overflow: 'hidden',
                    boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)',
                    margin: '0 auto',
                  }}>
                    <img
                      src={beat.imageUrl}
                      alt={beat.title}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        borderRadius: '0.75rem',
                        transition: 'transform 0.7s'
                      }}
                      onMouseOver={(e) => {
                        if (!isMobile) {
                          e.currentTarget.style.transform = 'scale(1.1)';
                        }
                      }}
                      onMouseOut={(e) => {
                        if (!isMobile) {
                          e.currentTarget.style.transform = 'scale(1)';
                        }
                      }}
                    />
                  </div>
                  <h3 style={{
                    color: 'white',
                    fontSize: isMobile ? '2rem' : '1.5rem',
                    fontWeight: 700,
                    marginTop: '1.75rem',
                    marginBottom: '0.5rem',
                    textAlign: 'center',
                    width: '100%'
                  }}>
                    {beat.title}
                  </h3>
                  <div style={{
                    color: 'rgba(229, 229, 229, 0.8)',
                    fontSize: isMobile ? '1.25rem' : '0.875rem',
                    marginBottom: '1rem',
                    textAlign: 'center',
                    width: '100%'
                  }}>
                    by {beat.producer}
                  </div>
                </div>

                {/* Audio player and details section */}
                <div style={{
                  width: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: isMobile ? '0 1rem 1.5rem' : '0 2rem 2rem',
                }}>
                  {/* Audio player */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '1.5rem',
                    width: '100%',
                  }}>
                    <audio 
                      src={beat.audioUrl} 
                      id={`audio-${beat.beatId}`}
                      crossOrigin="anonymous"
                      style={{ display: 'none' }} 
                      onTimeUpdate={(e) => {
                        const audio = e.currentTarget;
                        const timeDisplay = document.getElementById(`time-${beat.beatId}`);
                        if (timeDisplay) {
                          const minutes = Math.floor(audio.currentTime / 60);
                          const seconds = Math.floor(audio.currentTime % 60).toString().padStart(2, '0');
                          const totalMinutes = Math.floor(audio.duration / 60);
                          const totalSeconds = Math.floor(audio.duration % 60).toString().padStart(2, '0');
                          timeDisplay.textContent = `${minutes}:${seconds} / ${totalMinutes}:${totalSeconds}`;
                        }
                      }}
                      onEnded={(e) => {
                        const playButton = document.getElementById(`play-${beat.beatId}`);
                        if (playButton) {
                          playButton.innerHTML = `
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
                              <polygon points="5,3 19,12 5,21" fill="white" />
                            </svg>
                          `;
                        }
                      }}
                    />
                    <button
                      id={`play-${beat.beatId}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        const audio = document.getElementById(`audio-${beat.beatId}`) as HTMLAudioElement;
                        if (audio.paused) {
                          // Stop all other audio elements first
                          document.querySelectorAll('audio').forEach(a => {
                            if (a.id !== `audio-${beat.beatId}`) a.pause();
                          });
                          audio.play();
                          e.currentTarget.innerHTML = `
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
                              <rect x="6" y="4" width="4" height="16" fill="white" />
                              <rect x="14" y="4" width="4" height="16" fill="white" />
                            </svg>
                          `;
                        } else {
                          audio.pause();
                          e.currentTarget.innerHTML = `
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
                              <polygon points="5,3 19,12 5,21" fill="white" />
                            </svg>
                          `;
                        }
                      }}
                      style={{
                        width: isMobile ? '3.5rem' : '2.75rem',
                        height: isMobile ? '3.5rem' : '2.75rem',
                        borderRadius: '50%',
                        backgroundColor: '#9333ea',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: 'none',
                        cursor: 'pointer',
                        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
                        padding: 0,
                        marginRight: '1rem'
                      }}
                    >
                      <svg width={isMobile ? "24" : "16"} height={isMobile ? "24" : "16"} viewBox="0 0 24 24" fill="white">
                        <polygon points="5,3 19,12 5,21" fill="white" />
                      </svg>
                    </button>
                    
                    <span 
                      id={`time-${beat.beatId}`}
                      style={{
                        color: 'rgba(255, 255, 255, 0.8)',
                        fontSize: isMobile ? '1.25rem' : '0.875rem',
                      }}
                    >
                      0:00 / {beat.duration || '3:35'}
                    </span>
                  </div>
                  
                  {/* Description */}
                  <div style={{
                    color: 'rgba(229, 229, 229, 0.9)',
                    fontSize: isMobile ? '1.25rem' : '0.875rem',
                    textAlign: 'center',
                    marginBottom: '1.5rem',
                    width: '100%'
                  }}>
                    {beat.description}
                  </div>
                  
                  {/* Tags */}
                  <div style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: isMobile ? '1rem' : '0.75rem',
                    justifyContent: 'center',
                    marginBottom: '1.5rem',
                    width: '100%'
                  }}>
                    {beat.tags?.map((tag) => (
                      <span
                        key={tag}
                        style={{
                          backgroundColor: '#9333ea',
                          color: 'white',
                          padding: isMobile ? '0.75rem 1.5rem' : '0.4rem 1rem',
                          borderRadius: '9999px',
                          fontSize: isMobile ? '1.25rem' : '0.875rem',
                          fontWeight: 500,
                          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
                          transition: 'box-shadow 0.2s'
                        }}
                        onMouseOver={(e) => {
                          if (!isMobile) {
                            e.currentTarget.style.boxShadow = '0 4px 8px rgba(147, 51, 234, 0.3)';
                          }
                        }}
                        onMouseOut={(e) => {
                          if (!isMobile) {
                            e.currentTarget.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.1)';
                          }
                        }}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                  
                  {/* BPM indicator */}
                  {beat.bpm && (
                    <div style={{
                      backgroundColor: 'rgba(0, 0, 0, 0.2)',
                      color: 'rgba(255, 255, 255, 0.8)',
                      padding: isMobile ? '0.75rem 1.5rem' : '0.4rem 1rem',
                      borderRadius: '0.375rem',
                      fontSize: isMobile ? '1.25rem' : '0.875rem',
                      border: '1px solid rgba(147, 51, 234, 0.1)',
                      textAlign: 'center',
                      width: 'auto',
                      marginBottom: '1rem'
                    }}>
                      {beat.bpm} BPM
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
