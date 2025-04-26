import Link from "next/link";
import { useState, useEffect } from "react";
import { useAuth, signOut } from "@/lib/auth";
import { useRouter } from "next/router";

/**
 * Main site navigation bar for FreestyleFiend.
 * Modern, minimalist design with subtle animations.
 */
export function NavBar() {
  const [isMobile, setIsMobile] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const { authState } = useAuth();
  const router = useRouter();

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

  // Handle sign out
  const handleSignOut = async () => {
    try {
      await signOut();
      router.push('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <nav style={{
      width: '100%',
      backgroundColor: '#4c1d95', // Darker purple for less intensity
      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
      position: 'sticky',
      top: 0,
      zIndex: 50,
      padding: '0.75rem 1rem'
    }}>
      <div style={{
        maxWidth: '72rem',
        margin: '0 auto',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <Link 
          href="/" 
          style={{
            fontSize: '1.25rem',
            fontWeight: 600,
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            textDecoration: 'none'
          }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ marginRight: '8px' }}>
            <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM12 8C13.66 8 15 9.34 15 11V17C15 18.66 13.66 20 12 20C10.34 20 9 18.66 9 17V11C9 9.34 10.34 8 12 8ZM18 12C18 15.31 15.31 18 12 18V16C14.21 16 16 14.21 16 12H18Z" fill="#f9a8d4" />
          </svg>
          <span>FreestyleFiend</span>
        </Link>
        
        {/* Mobile menu button */}
        {isMobile && (
          <button 
            onClick={() => setMenuOpen(!menuOpen)}
            style={{
              backgroundColor: 'transparent',
              border: 'none',
              color: 'white',
              cursor: 'pointer',
              padding: '4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            aria-label="Toggle menu"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M3 18H21V16H3V18ZM3 13H21V11H3V13ZM3 6V8H21V6H3Z" fill="white" />
            </svg>
          </button>
        )}
        
        {/* Desktop navigation */}
        {!isMobile && (
          <div style={{
            display: 'flex',
            gap: '1rem',
            alignItems: 'center'
          }}>
            <Link 
              href="/record" 
              style={{
                color: 'rgba(255, 255, 255, 0.8)',
                fontSize: '0.875rem',
                fontWeight: 500,
                padding: '0.5rem 0.75rem',
                borderRadius: '0.375rem',
                transition: 'all 0.2s',
                textDecoration: 'none'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
                e.currentTarget.style.color = 'white';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = 'rgba(255, 255, 255, 0.8)';
              }}
            >
              Record
            </Link>
            <Link 
              href="/vote" 
              style={{
                color: 'rgba(255, 255, 255, 0.8)',
                fontSize: '0.875rem',
                fontWeight: 500,
                padding: '0.5rem 0.75rem',
                borderRadius: '0.375rem',
                transition: 'all 0.2s',
                textDecoration: 'none'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
                e.currentTarget.style.color = 'white';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = 'rgba(255, 255, 255, 0.8)';
              }}
            >
              Vote
            </Link>
            <Link 
              href="/leaderboard" 
              style={{
                color: 'rgba(255, 255, 255, 0.8)',
                fontSize: '0.875rem',
                fontWeight: 500,
                padding: '0.5rem 0.75rem',
                borderRadius: '0.375rem',
                transition: 'all 0.2s',
                textDecoration: 'none'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
                e.currentTarget.style.color = 'white';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = 'rgba(255, 255, 255, 0.8)';
              }}
            >
              Leaderboard
            </Link>
            
            {/* Auth buttons */}
            {authState.isAuthenticated ? (
              <>
                <Link 
                  href="/profile" 
                  style={{
                    color: 'rgba(255, 255, 255, 0.8)',
                    fontSize: '0.875rem',
                    fontWeight: 500,
                    padding: '0.5rem 0.75rem',
                    borderRadius: '0.375rem',
                    transition: 'all 0.2s',
                    textDecoration: 'none'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
                    e.currentTarget.style.color = 'white';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.color = 'rgba(255, 255, 255, 0.8)';
                  }}
                >
                  Profile
                </Link>
                <button
                  onClick={handleSignOut}
                  style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    color: 'white',
                    border: 'none',
                    padding: '0.5rem 0.75rem',
                    borderRadius: '0.375rem',
                    fontSize: '0.875rem',
                    fontWeight: 500,
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
                  }}
                >
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <Link 
                  href="/signin" 
                  style={{
                    color: 'rgba(255, 255, 255, 0.8)',
                    fontSize: '0.875rem',
                    fontWeight: 500,
                    padding: '0.5rem 0.75rem',
                    borderRadius: '0.375rem',
                    transition: 'all 0.2s',
                    textDecoration: 'none'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
                    e.currentTarget.style.color = 'white';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.color = 'rgba(255, 255, 255, 0.8)';
                  }}
                >
                  Sign In
                </Link>
                <Link 
                  href="/signup" 
                  style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    color: 'white',
                    padding: '0.5rem 0.75rem',
                    borderRadius: '0.375rem',
                    fontSize: '0.875rem',
                    fontWeight: 500,
                    transition: 'all 0.2s',
                    textDecoration: 'none'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
                  }}
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>
        )}
        
        {/* Mobile menu (slide down) */}
        {isMobile && menuOpen && (
          <div style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            backgroundColor: '#4c1d95',
            padding: '1rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.75rem',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
          }}>
            <Link 
              href="/record" 
              style={{
                color: 'white',
                fontSize: '1rem',
                padding: '0.5rem 0',
                display: 'block',
                textDecoration: 'none'
              }}
              onClick={() => setMenuOpen(false)}
            >
              Record
            </Link>
            <Link 
              href="/vote" 
              style={{
                color: 'white',
                fontSize: '1rem',
                padding: '0.5rem 0',
                display: 'block',
                textDecoration: 'none'
              }}
              onClick={() => setMenuOpen(false)}
            >
              Vote
            </Link>
            <Link 
              href="/leaderboard" 
              style={{
                color: 'white',
                fontSize: '1rem',
                padding: '0.5rem 0',
                display: 'block',
                textDecoration: 'none'
              }}
              onClick={() => setMenuOpen(false)}
            >
              Leaderboard
            </Link>
            
            {/* Auth links for mobile */}
            {authState.isAuthenticated ? (
              <>
                <Link 
                  href="/profile" 
                  style={{
                    color: 'white',
                    fontSize: '1rem',
                    padding: '0.5rem 0',
                    display: 'block',
                    textDecoration: 'none'
                  }}
                  onClick={() => setMenuOpen(false)}
                >
                  Profile
                </Link>
                <button
                  onClick={() => {
                    handleSignOut();
                    setMenuOpen(false);
                  }}
                  style={{
                    backgroundColor: 'transparent',
                    color: 'white',
                    fontSize: '1rem',
                    padding: '0.5rem 0',
                    border: 'none',
                    textAlign: 'left',
                    cursor: 'pointer'
                  }}
                >
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <Link 
                  href="/signin" 
                  style={{
                    color: 'white',
                    fontSize: '1rem',
                    padding: '0.5rem 0',
                    display: 'block',
                    textDecoration: 'none'
                  }}
                  onClick={() => setMenuOpen(false)}
                >
                  Sign In
                </Link>
                <Link 
                  href="/signup" 
                  style={{
                    color: 'white',
                    fontSize: '1rem',
                    padding: '0.5rem 0',
                    display: 'block',
                    textDecoration: 'none',
                    fontWeight: 500
                  }}
                  onClick={() => setMenuOpen(false)}
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}
