import { useState, useEffect } from 'react';

interface ContentDisclaimerProps {
  pageType: 'vote' | 'record' | 'leaderboard';
}

/**
 * A modal disclaimer for explicit content that appears once per session
 * on voting and recording pages
 */
export default function ContentDisclaimer({ pageType }: ContentDisclaimerProps) {
  const [showDisclaimer, setShowDisclaimer] = useState(false);

  useEffect(() => {
    // Check if user has already seen the disclaimer in this session
    const hasSeenDisclaimer = localStorage.getItem(`seenContentDisclaimer_${pageType}`);
    if (!hasSeenDisclaimer) {
      setShowDisclaimer(true);
    }
  }, [pageType]);

  const handleAccept = () => {
    // Mark this disclaimer as seen for this session
    localStorage.setItem(`seenContentDisclaimer_${pageType}`, 'true');
    setShowDisclaimer(false);
  };

  if (!showDisclaimer) return null;

  return (
    // Modal overlay with backdrop
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '1rem',
      }}
    >
      {/* Modal content */}
      <div
        style={{
          backgroundColor: '#0f0f0f',
          borderRadius: '0.75rem',
          padding: '2rem',
          maxWidth: '500px',
          width: '100%',
          boxShadow: '0 25px 50px -12px rgba(147, 51, 234, 0.25)',
          border: '1px solid rgba(147, 51, 234, 0.3)',
          display: 'flex',
          flexDirection: 'column',
          gap: '1.5rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <svg
            width="28"
            height="28"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#ef4444"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
          <h2
            style={{
              margin: 0,
              fontSize: '1.5rem',
              fontWeight: 600,
              color: 'white',
            }}
          >
            Content Disclaimer
          </h2>
        </div>

        <div style={{ color: 'rgba(255, 255, 255, 0.8)', lineHeight: 1.6 }}>
          <p>
            FreestyleFiend is a platform featuring user-generated rap freestyles that may contain:
          </p>
          <ul style={{ paddingLeft: '1.5rem', marginTop: '0.5rem' }}>
            <li>Strong language and explicit content</li>
            <li>References to mature themes</li>
            <li>Content that some viewers may find offensive</li>
          </ul>
          <p style={{ marginTop: '1rem' }}>
            By continuing, you acknowledge that you may encounter such content and are comfortable viewing/listening to it.
          </p>
        </div>

        <button
          onClick={handleAccept}
          style={{
            backgroundColor: '#9333ea',
            color: 'white',
            border: 'none',
            padding: '0.75rem 1.5rem',
            borderRadius: '0.5rem',
            fontSize: '1rem',
            fontWeight: 500,
            cursor: 'pointer',
            alignSelf: 'center',
            marginTop: '0.5rem',
            transition: 'background-color 0.2s',
          }}
          onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#7e22ce'}
          onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#9333ea'}
        >
          I Understand
        </button>
      </div>
    </div>
  );
}
