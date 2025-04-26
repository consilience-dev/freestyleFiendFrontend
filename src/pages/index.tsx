import Link from "next/link";
import Head from "next/head";
import { useEffect, useState } from "react";

export default function Home() {
  const [isMobile, setIsMobile] = useState(true);

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

  const cardStyle = {
    backgroundColor: 'rgba(88, 28, 135, 0.6)', // Less intense purple
    borderRadius: '0.75rem',
    padding: '2rem',
    textAlign: 'center' as const,
    height: '100%',
    border: '1px solid rgba(124, 58, 237, 0.2)',
    transition: 'all 0.3s',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
  };

  return (
    <>
      <Head>
        <title>FreestyleFiend - Freestyle Rap Platform</title>
        <meta name="description" content="Record, vote, and discover the best freestyle rap content" />
      </Head>
      
      <main style={{ 
        minHeight: '100vh', 
        padding: isMobile ? '3rem 1rem' : '4rem 2rem',
        display: 'flex',
        flexDirection: 'column' as const,
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '3rem', maxWidth: '640px' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem' }}>
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ margin: '0 auto' }}>
              <circle cx="12" cy="12" r="10" fill="#4c1d95" />
              <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM12 8C13.66 8 15 9.34 15 11V17C15 18.66 13.66 20 12 20C10.34 20 9 18.66 9 17V11C9 9.34 10.34 8 12 8ZM18 12C18 15.31 15.31 18 12 18V16C14.21 16 16 14.21 16 12H18Z" fill="#f472b6" />
            </svg>
          </div>
          <h1 style={{ 
            fontSize: isMobile ? '2.5rem' : '3rem', 
            fontWeight: 700, 
            color: 'white',
            marginBottom: '0.75rem' 
          }}>
            Freestyle<span style={{ color: '#ec4899' }}>Fiend</span>
          </h1>
          <p style={{ 
            fontSize: '1.125rem', 
            color: 'rgba(255, 255, 255, 0.8)', 
            maxWidth: '36rem',
            margin: '0 auto',
            lineHeight: 1.6
          }}>
            Record your best freestyles, vote on others, and climb the leaderboard
          </p>
        </div>

        <div style={{ 
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)',
          gap: isMobile ? '1.5rem' : '2rem',
          maxWidth: '1200px',
          width: '100%',
          marginBottom: '3rem'
        }}>
          {/* Record Card */}
          <Link href="/record" style={{ textDecoration: 'none' }}>
            <div style={cardStyle} onMouseOver={(e) => {
              e.currentTarget.style.transform = 'translateY(-4px)';
              e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.1)';
            }} onMouseOut={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)';
            }}>
              <div style={{
                width: '3rem',
                height: '3rem',
                borderRadius: '50%',
                backgroundColor: 'rgba(127, 29, 189, 0.5)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1rem auto',
              }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 14C13.66 14 15 12.66 15 11V5C15 3.34 13.66 2 12 2C10.34 2 9 3.34 9 5V11C9 12.66 10.34 14 12 14Z" fill="#f9a8d4" />
                  <path d="M17.91 11C17.96 11.33 18 11.66 18 12C18 15.31 15.31 18 12 18C8.69 18 6 15.31 6 12C6 11.66 6.04 11.33 6.09 11H4.07C4.03 11.33 4 11.66 4 12C4 16.08 7.06 19.44 11 19.93V22H13V19.93C16.94 19.44 20 16.08 20 12C20 11.66 19.97 11.33 19.93 11H17.91Z" fill="#f9a8d4" />
                </svg>
              </div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'white', marginBottom: '0.5rem' }}>Record</h2>
              <p style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '0.875rem' }}>
                Choose a beat and spit your best freestyle
              </p>
            </div>
          </Link>

          {/* Vote Card */}
          <Link href="/vote" style={{ textDecoration: 'none' }}>
            <div style={cardStyle} onMouseOver={(e) => {
              e.currentTarget.style.transform = 'translateY(-4px)';
              e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.1)';
            }} onMouseOut={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)';
            }}>
              <div style={{
                width: '3rem',
                height: '3rem',
                borderRadius: '50%',
                backgroundColor: 'rgba(127, 29, 189, 0.5)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1rem auto',
              }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M14.59 8.59L16 7.18L12 3.18L8 7.18L9.41 8.59L11 7V15H13V7L14.59 8.59Z" fill="#f9a8d4" />
                  <path d="M18 16H6C4.9 16 4 16.9 4 18C4 19.1 4.9 20 6 20H18C19.1 20 20 19.1 20 18C20 16.9 19.1 16 18 16Z" fill="#f9a8d4" />
                </svg>
              </div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'white', marginBottom: '0.5rem' }}>Vote</h2>
              <p style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '0.875rem' }}>
                Listen to freestyles and vote for your favorites
              </p>
            </div>
          </Link>

          {/* Leaderboard Card */}
          <Link href="/leaderboard" style={{ textDecoration: 'none' }}>
            <div style={cardStyle} onMouseOver={(e) => {
              e.currentTarget.style.transform = 'translateY(-4px)';
              e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.1)';
            }} onMouseOut={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)';
            }}>
              <div style={{
                width: '3rem',
                height: '3rem',
                borderRadius: '50%',
                backgroundColor: 'rgba(127, 29, 189, 0.5)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1rem auto',
              }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M19 5H17V3H7V5H5C3.9 5 3 5.9 3 7V8C3 10.55 4.92 12.63 7.39 12.94C8.02 14.44 9.37 15.57 11 15.9V19H7V21H17V19H13V15.9C14.63 15.57 15.98 14.44 16.61 12.94C19.08 12.63 21 10.55 21 8V7C21 5.9 20.1 5 19 5ZM5 8V7H7V10.82C5.84 10.4 5 9.3 5 8ZM12 14C10.35 14 9 12.65 9 11V5H15V11C15 12.65 13.65 14 12 14ZM19 8C19 9.3 18.16 10.4 17 10.82V7H19V8Z" fill="#f9a8d4" />
                </svg>
              </div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'white', marginBottom: '0.5rem' }}>Leaderboard</h2>
              <p style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '0.875rem' }}>
                See who's at the top of the freestyle game
              </p>
            </div>
          </Link>
        </div>

        <div style={{ textAlign: 'center' }}>
          <Link href="/profile" style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '0.75rem 1.5rem',
            borderRadius: '0.5rem',
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            color: 'white',
            fontWeight: 500,
            fontSize: '0.875rem',
            transition: 'all 0.2s',
            textDecoration: 'none'
          }} onMouseOver={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
          }} onMouseOut={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
          }}>
            Create Your Profile
          </Link>
        </div>
      </main>
    </>
  );
}
