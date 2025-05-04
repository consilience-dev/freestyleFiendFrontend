import { useState, useEffect } from 'react';
import { getPlayCount } from '@/lib/apiClient';

interface PlayCounterProps {
  recordingId: string;
  className?: string;
}

export default function PlayCounter({ recordingId, className = '' }: PlayCounterProps) {
  const [playCount, setPlayCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    
    async function fetchPlayCount() {
      if (!recordingId) return;
      
      setLoading(true);
      setError(null);
      
      try {
        const { data, error } = await getPlayCount(recordingId);
        
        if (error || !data) {
          throw new Error('Failed to fetch play count');
        }
        
        if (isMounted) {
          setPlayCount(data.playCount || 0);
        }
      } catch (err) {
        console.error('Error fetching play count:', err);
        if (isMounted) {
          setError('Failed to load play count');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }
    
    fetchPlayCount();
    
    return () => {
      isMounted = false;
    };
  }, [recordingId]);

  // Format large numbers (e.g., 1.5K for 1,500)
  const formatCount = (count: number): string => {
    if (count >= 1_000_000) {
      return `${(count / 1_000_000).toFixed(1)}M`;
    } else if (count >= 1_000) {
      return `${(count / 1_000).toFixed(1)}K`;
    }
    return count.toString();
  };

  return (
    <div className={className} style={{
      display: 'flex',
      alignItems: 'center',
      gap: '0.25rem',
      color: 'rgba(255, 255, 255, 0.7)',
      fontSize: '0.875rem',
    }}>
      {loading ? (
        <span style={{ fontSize: '0.75rem', opacity: 0.6 }}>Loading...</span>
      ) : error ? (
        <span style={{ fontSize: '0.75rem', opacity: 0.6 }}>-</span>
      ) : (
        <>
          <svg 
            width="14" 
            height="14" 
            viewBox="0 0 24 24" 
            fill="none" 
            xmlns="http://www.w3.org/2000/svg"
            style={{ opacity: 0.7 }}
          >
            <path d="M12 4L10.6 5.4L16.2 11H4V13H16.2L10.6 18.6L12 20L20 12L12 4Z" fill="currentColor" />
          </svg>
          <span>{playCount !== null ? formatCount(playCount) : '-'} plays</span>
        </>
      )}
    </div>
  );
}
