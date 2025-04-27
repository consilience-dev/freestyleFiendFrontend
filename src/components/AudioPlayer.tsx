import { useState, useRef, useEffect } from 'react';

interface AudioPlayerProps {
  src: string;
  title: string;
  artist: string;
  onError?: () => void;
  className?: string;
}

export default function AudioPlayer({ src, title, artist, onError, className = '' }: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load audio metadata when src changes
  useEffect(() => {
    setIsLoading(true);
    setError(null);
    setCurrentTime(0);
    setDuration(0);
    setIsPlaying(false);
  }, [src]);

  const handlePlay = () => {
    if (audioRef.current) {
      audioRef.current.play().catch(err => {
        console.error('Error playing audio:', err);
        setError('Could not play the audio');
        setIsPlaying(false);
        if (onError) onError();
      });
    }
  };

  const handlePause = () => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
  };

  const togglePlayPause = () => {
    if (isPlaying) {
      handlePause();
      setIsPlaying(false);
    } else {
      handlePlay();
      setIsPlaying(true);
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
      setIsLoading(false);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = parseFloat(e.target.value);
    if (audioRef.current) {
      audioRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  const handleEnded = () => {
    setIsPlaying(false);
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      setCurrentTime(0);
    }
  };

  const handleError = () => {
    setError('Error loading audio');
    setIsLoading(false);
    if (onError) onError();
  };

  // Format time as MM:SS
  const formatTime = (time: number) => {
    if (!isFinite(time)) return '00:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      width: '100%',
    }} className={className}>
      <audio
        ref={audioRef}
        src={src}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleEnded}
        onError={handleError}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        preload="metadata"
      />

      {isLoading && !error ? (
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '40px',
          width: '100%',
        }}>
          <div style={{
            animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
            color: 'rgba(255, 255, 255, 0.6)',
            fontSize: '0.875rem',
          }}>Loading audio...</div>
          <style jsx>{`
            @keyframes pulse {
              0%, 100% {
                opacity: 1;
              }
              50% {
                opacity: 0.5;
              }
            }
          `}</style>
        </div>
      ) : error ? (
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '40px',
          width: '100%',
        }}>
          <div style={{
            color: 'rgb(248, 113, 113)',
            fontSize: '0.875rem',
          }}>{error}</div>
        </div>
      ) : (
        <>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '0.25rem',
          }}>
            <button
              onClick={togglePlayPause}
              style={{
                width: '2rem',
                height: '2rem',
                borderRadius: '9999px',
                backgroundColor: 'rgba(219, 39, 119, 0.8)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                border: 'none',
                cursor: 'pointer',
              }}
              aria-label={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="white">
                  <rect x="6" y="4" width="4" height="16" />
                  <rect x="14" y="4" width="4" height="16" />
                </svg>
              ) : (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="white">
                  <path d="M8 5v14l11-7z" />
                </svg>
              )}
            </button>
            
            <div style={{
              flex: '1',
              marginLeft: '0.5rem',
              marginRight: '0.5rem',
            }}>
              <input
                type="range"
                min="0"
                max={duration || 100}
                value={currentTime}
                onChange={handleSeek}
                style={{
                  width: '100%',
                  height: '0.5rem',
                  borderRadius: '0.5rem',
                  appearance: 'none',
                  cursor: 'pointer',
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                }}
                aria-label="Audio timeline"
              />
            </div>
            
            <div style={{
              fontSize: '0.75rem',
              color: 'rgba(255, 255, 255, 0.8)',
              whiteSpace: 'nowrap',
            }}>
              {formatTime(currentTime)} / {formatTime(duration)}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
