import { useAuth, signOut } from '@/lib/auth';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import Link from 'next/link';

/**
 * User profile page that displays information about the signed-in user
 * Protected by authentication
 */
export default function ProfilePage() {
  const { authState } = useAuth();
  const router = useRouter();

  const handleSignOut = async () => {
    try {
      await signOut();
      router.push('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <ProtectedRoute>
      <Head>
        <title>Your Profile - FreestyleFiend</title>
        <meta name="description" content="Manage your FreestyleFiend profile" />
        <style>{`
          body {
            background-color: #000;
            color: #fff;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            margin: 0;
            padding: 0;
          }
          
          a {
            color: inherit;
            text-decoration: none;
          }
        `}</style>
      </Head>

      {/* Custom Header */}
      <header style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        padding: '16px 20px',
        borderBottom: '1px solid #333' 
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
          <span style={{ marginRight: '16px' }}>Profile</span>
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
      </header>

      <main style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: 'calc(100vh - 120px)',
        padding: '2rem 1rem',
      }}>
        {authState.user && (
          <div style={{
            maxWidth: '600px',
            width: '100%',
            padding: '2rem',
            backgroundColor: 'rgba(147, 51, 234, 0.1)', 
            borderRadius: '12px',
            border: '1px solid rgba(147, 51, 234, 0.2)',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
          }}>
            <h1 style={{ 
              fontSize: '28px', 
              fontWeight: 'bold', 
              marginBottom: '1.5rem',
              color: 'white',
              textAlign: 'center',
            }}>
              Your Profile
            </h1>
            
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem',
            }}>
              <div style={{
                padding: '1rem',
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                borderRadius: '0.5rem',
              }}>
                <p style={{ 
                  color: 'rgba(255, 255, 255, 0.7)', 
                  fontSize: '0.875rem',
                  marginBottom: '0.25rem',
                }}>
                  Username
                </p>
                <p style={{ color: 'white', fontWeight: 500 }}>
                  {authState.user.username}
                </p>
              </div>
              
              <div style={{
                padding: '1rem',
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                borderRadius: '0.5rem',
              }}>
                <p style={{ 
                  color: 'rgba(255, 255, 255, 0.7)', 
                  fontSize: '0.875rem',
                  marginBottom: '0.25rem', 
                }}>
                  Email
                </p>
                <p style={{ color: 'white', fontWeight: 500 }}>
                  {authState.user.email || 'Not provided'}
                </p>
              </div>
              
              {authState.user.attributes?.name && (
                <div style={{
                  padding: '1rem',
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  borderRadius: '0.5rem',
                }}>
                  <p style={{ 
                    color: 'rgba(255, 255, 255, 0.7)', 
                    fontSize: '0.875rem',
                    marginBottom: '0.25rem', 
                  }}>
                    Name
                  </p>
                  <p style={{ color: 'white', fontWeight: 500 }}>
                    {authState.user.attributes.name}
                  </p>
                </div>
              )}
            </div>
            
            <div style={{
              marginTop: '2rem',
              display: 'flex',
              justifyContent: 'center',
            }}>
              <Link 
                href="/" 
                style={{
                  display: 'inline-block',
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  color: 'white',
                  padding: '10px 20px',
                  borderRadius: '8px',
                  fontWeight: '500',
                  transition: 'background-color 0.2s ease',
                  textAlign: 'center',
                }}
              >
                Return to Home
              </Link>
            </div>
          </div>
        )}
      </main>
    </ProtectedRoute>
  );
}
