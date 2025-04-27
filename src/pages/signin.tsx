import Head from 'next/head';
import { useRouter } from 'next/router';
import { useState } from 'react';
import Link from 'next/link';
import { useAuth, signIn } from '@/lib/auth';
import { useEffect } from 'react';

/**
 * Sign In page for user authentication
 */
export default function SignInPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const { authState } = useAuth();
  
  // Redirect if already authenticated
  useEffect(() => {
    if (authState.isAuthenticated) {
      const redirectPath = (router.query.redirect as string) || '/profile';
      router.replace(redirectPath);
    }
  }, [authState.isAuthenticated, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const { isSignedIn } = await signIn({
        username: email,
        password: password,
      });

      if (isSignedIn) {
        router.push('/');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>Sign in - FreestyleFiend</title>
        <meta name="description" content="Sign in to your FreestyleFiend account" />
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

      <div style={{ maxWidth: '100%', margin: '0 auto', padding: '0' }}>
        {/* Header */}
        <header style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          padding: '16px 20px' 
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
          <Link href="/signup" style={{ color: '#fff' }}>
            Create account
          </Link>
        </header>

        {/* Main Content */}
        <main style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          justifyContent: 'center', 
          padding: '0 20px', 
          marginTop: '60px',
          height: 'calc(100vh - 180px)'
        }}>
          <h1 style={{ 
            fontSize: '32px', 
            fontWeight: 'bold', 
            marginBottom: '8px', 
            textAlign: 'center' 
          }}>
            Sign in to your account
          </h1>
          <p style={{ 
            color: '#888', 
            marginBottom: '24px', 
            textAlign: 'center' 
          }}>
            Enter your email and password below
          </p>

          <form 
            onSubmit={handleSubmit}
            style={{ width: '100%', maxWidth: '360px' }}
          >
            {error && (
              <div style={{ 
                backgroundColor: 'rgba(220, 38, 38, 0.1)', 
                color: '#ef4444', 
                padding: '12px', 
                borderRadius: '6px', 
                marginBottom: '16px',
                fontSize: '14px'
              }}>
                {error}
              </div>
            )}
            
            <div style={{ marginBottom: '16px' }}>
              <label htmlFor="email" style={{ 
                display: 'block', 
                marginBottom: '8px', 
                fontSize: '14px' 
              }}>
                Email
              </label>
              <input
                id="email"
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                style={{ 
                  width: '100%', 
                  padding: '12px 16px', 
                  backgroundColor: 'transparent', 
                  border: '1px solid #333', 
                  borderRadius: '4px', 
                  color: '#fff',
                  fontSize: '16px',
                  boxSizing: 'border-box'
                }}
              />
            </div>
            
            <div style={{ marginBottom: '24px' }}>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                marginBottom: '8px'
              }}>
                <label htmlFor="password" style={{ fontSize: '14px' }}>
                  Password
                </label>
                <Link href="/forgot-password" style={{ 
                  fontSize: '14px', 
                  color: '#888',
                  textDecoration: 'none'
                }}>
                  Forgot password?
                </Link>
              </div>
              <input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                style={{ 
                  width: '100%', 
                  padding: '12px 16px', 
                  backgroundColor: 'transparent', 
                  border: '1px solid #333', 
                  borderRadius: '4px', 
                  color: '#fff',
                  fontSize: '16px',
                  boxSizing: 'border-box'
                }}
              />
            </div>
            
            <button
              type="submit"
              disabled={isLoading}
              style={{ 
                width: '100%', 
                padding: '12px 16px', 
                backgroundColor: '#fff', 
                color: '#000', 
                border: 'none', 
                borderRadius: '4px', 
                fontWeight: 'bold',
                cursor: isLoading ? 'not-allowed' : 'pointer',
                fontSize: '16px'
              }}
            >
              {isLoading ? 'Signing in...' : 'Sign in'}
            </button>

            <div style={{ 
              fontSize: '12px', 
              color: '#666', 
              marginTop: '16px', 
              textAlign: 'center' 
            }}>
              By clicking sign in, you agree to our{' '}
              <Link href="/terms" style={{ color: '#fff', textDecoration: 'underline' }}>
                Terms of Service
              </Link>{' '}
              and{' '}
              <Link href="/privacy" style={{ color: '#fff', textDecoration: 'underline' }}>
                Privacy Policy
              </Link>.
            </div>

            <div style={{ textAlign: 'center', marginTop: '24px', fontSize: '14px', color: '#888' }}>
              Need an account?{' '}
              <Link href="/signup" style={{ color: '#fff', textDecoration: 'underline' }}>
                Sign up
              </Link>
            </div>
          </form>
        </main>
      </div>
    </>
  );
}
