import { useAuth } from '@/lib/auth';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';

/**
 * User profile page that displays information about the signed-in user
 * Protected by authentication
 */
export default function ProfilePage() {
  const { authState } = useAuth();
  const router = useRouter();

  return (
    <ProtectedRoute>
      <Head>
        <title>Your Profile - FreestyleFiend</title>
        <meta name="description" content="Manage your FreestyleFiend profile" />
      </Head>

      <main style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: 'calc(100vh - 60px)',
        padding: '1rem',
      }}>
        {authState.user && (
          <div style={{
            maxWidth: '600px',
            width: '100%',
            padding: '2rem',
            backgroundColor: 'rgba(79, 29, 127, 0.4)',
            borderRadius: '0.5rem',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
          }}>
            <h1 style={{ 
              fontSize: '1.5rem', 
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
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
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
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
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
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
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
              padding: '1rem',
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              borderRadius: '0.5rem',
              textAlign: 'center',
            }}>
              <h2 style={{ 
                fontSize: '1.25rem', 
                color: 'white',
                marginBottom: '0.5rem', 
              }}>
                Your Freestyles
              </h2>
              <p style={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                You haven't recorded any freestyles yet.
              </p>
              <button
                onClick={() => router.push('/record')}
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.15)',
                  color: 'white',
                  border: 'none',
                  padding: '0.75rem 1rem',
                  borderRadius: '0.375rem',
                  fontWeight: 500,
                  cursor: 'pointer',
                  width: '100%',
                  transition: 'background-color 0.2s',
                  marginTop: '1rem',
                }}
                onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.25)'}
                onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.15)'}
              >
                Record Your First Freestyle
              </button>
            </div>
          </div>
        )}
      </main>
    </ProtectedRoute>
  );
}
