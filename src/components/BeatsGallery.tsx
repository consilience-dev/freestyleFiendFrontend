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
  const [isMobile, setIsMobile] = useState(true);
  const [beats, setBeats] = useState<Beat[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  // Handle responsive layout
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    // Set initial state
    handleResize();
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div style={{
      width: '100%',
      padding: '2.5rem 1rem'
    }}>
      {error && (
        <div style={{
          backgroundColor: 'rgba(239, 68, 68, 0.2)', // red with opacity
          color: 'white',
          padding: '1rem',
          borderRadius: '0.5rem',
          marginBottom: '1.5rem',
          textAlign: 'center'
        }}>
          {error}
        </div>
      )}
      
      {loading ? (
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '50vh',
        }}>
          <div style={{
            width: '3rem',
            height: '3rem',
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
      ) : (
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(300px, 1fr))',
          gap: '2.5rem',
          justifyItems: 'center'
        }}>
          {beats.map((beat) => (
            <div
              key={beat.beatId}
              style={{
                display: 'flex',
                flexDirection: 'column',
                height: '100%',
                maxWidth: '320px',
                width: '100%',
                borderRadius: '1.5rem',
                backgroundColor: 'rgba(107, 33, 168, 0.6)',
                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                overflow: 'hidden',
                cursor: 'pointer',
                transition: 'transform 0.3s, box-shadow 0.3s',
              }}
              onClick={() => onSelectBeat && onSelectBeat(beat.beatId)}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = 'scale(1.05)';
                e.currentTarget.style.boxShadow = '0 25px 50px -12px rgba(147, 51, 234, 0.3)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.boxShadow = '0 20px 25px -5px rgba(0, 0, 0, 0.3)';
              }}
            >
              <div style={{
                width: '100%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                padding: '2rem 2rem 0.75rem'
              }}>
                <div style={{
                  position: 'relative',
                  display: 'flex',
                  justifyContent: 'center',
                  aspectRatio: '1',
                  width: '100%',
                  maxWidth: '240px',
                  overflow: 'hidden',
                  borderRadius: '1rem'
                }}>
                  <img
                    src={beat.imageUrl}
                    alt={beat.title}
                    style={{
                      borderRadius: '1rem',
                      objectFit: 'cover',
                      width: '100%',
                      height: '100%',
                      transition: 'transform 0.7s'
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.transform = 'scale(1.1)';
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.transform = 'scale(1)';
                    }}
                  />
                </div>
                <h3 style={{
                  marginTop: '1.5rem',
                  color: 'white',
                  fontSize: '1.5rem',
                  fontWeight: 800,
                  textAlign: 'center'
                }}>
                  {beat.title}
                </h3>
                <div style={{
                  fontSize: '0.75rem',
                  color: 'rgba(229, 229, 229, 0.8)',
                  fontWeight: 500,
                  marginTop: '0.25rem',
                  textAlign: 'center',
                  opacity: 0.8
                }}>
                  by {beat.producer}
                </div>
              </div>
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                width: '100%',
                padding: '0 2rem 2rem'
              }}>
                <audio 
                  controls 
                  src={beat.audioUrl} 
                  style={{
                    width: '100%',
                    marginTop: '1rem',
                    borderRadius: '0.75rem',
                    backgroundColor: 'rgba(0, 0, 0, 0.5)'
                  }}
                />
                <div style={{
                  marginTop: '1rem',
                  fontSize: '1rem',
                  color: 'rgba(229, 229, 229, 0.9)',
                  textAlign: 'center',
                  minHeight: '2.5em',
                  fontWeight: 500
                }}>
                  {beat.description}
                </div>
                <div style={{
                  marginTop: '1rem',
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '0.75rem',
                  justifyContent: 'center'
                }}>
                  {beat.tags?.map((tag) => (
                    <span
                      key={tag}
                      style={{
                        background: 'linear-gradient(to right, #9333ea, #db2777)',
                        color: 'white',
                        padding: '0.25rem 1rem',
                        borderRadius: '9999px',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                        transition: 'box-shadow 0.2s'
                      }}
                      onMouseOver={(e) => {
                        e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.2)';
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)';
                      }}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
                {beat.bpm && (
                  <div style={{
                    marginTop: '1rem',
                    padding: '0.25rem 0.75rem',
                    backgroundColor: 'rgba(0, 0, 0, 0.2)',
                    borderRadius: '0.375rem',
                    fontSize: '0.75rem',
                    color: 'rgba(255, 255, 255, 0.8)'
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
  );
}
