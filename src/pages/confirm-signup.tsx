import Head from 'next/head';
import { ConfirmSignUpForm } from '@/components/auth';
import { useRouter } from 'next/router';
import Link from 'next/link';

/**
 * Confirm Sign Up page for verifying new user accounts
 */
export default function ConfirmSignUpPage() {
  const router = useRouter();
  const { username } = router.query;

  return (
    <>
      <Head>
        <title>Confirm Account - FreestyleFiend</title>
        <meta name="description" content="Confirm your FreestyleFiend account" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <style>{`
          body {
            background-color: #0f0f0f;
            color: #fff;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            margin: 0;
            padding: 0;
          }
          
          a {
            color: inherit;
            text-decoration: none;
          }

          /* Fix for input styling */
          input {
            background-color: rgba(17, 17, 17, 0.8) !important;
            color: white !important;
            border: 1px solid rgba(147, 51, 234, 0.3) !important;
            border-radius: 0.375rem !important;
            padding: 0.75rem !important;
            width: 100% !important;
            font-size: 1rem !important;
            box-sizing: border-box !important;
            margin-bottom: 0.75rem !important;
          }
          
          input:focus {
            outline: none !important;
            border-color: #9333ea !important;
            box-shadow: 0 0 0 1px #9333ea !important;
          }

          button {
            background-color: #9333ea !important;
            border: none !important;
            color: white !important;
            padding: 0.75rem 1.5rem !important;
            font-weight: 500 !important;
            border-radius: 0.375rem !important;
            width: 100% !important;
            cursor: pointer !important;
            font-size: 1rem !important;
            margin-top: 0.75rem !important;
          }

          button:hover {
            background-color: #7e22ce !important;
          }

          button:disabled {
            opacity: 0.7 !important;
            cursor: not-allowed !important;
          }
        `}</style>
      </Head>

      <div style={{ 
        maxWidth: '100%', 
        margin: '0 auto', 
        padding: '0',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column'
      }}>
        <header style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          padding: '16px 20px', 
          backgroundColor: '#0f0f0f',
          color: '#fff'
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
          <Link href="/signin" style={{ color: '#fff' }}>
            Sign in
          </Link>
        </header>

        <main style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          justifyContent: 'center', 
          padding: '20px',
          flex: '1' 
        }}>
          <div style={{
            width: '100%',
            maxWidth: '400px',
            margin: '0 auto',
          }}>
            <h1 style={{
              fontSize: '1.875rem',
              fontWeight: 700,
              textAlign: 'center',
              marginBottom: '1rem',
            }}>
              Confirm Account
            </h1>
            <p style={{
              fontSize: '0.875rem',
              textAlign: 'center',
              marginBottom: '2rem',
              color: 'rgba(255, 255, 255, 0.7)',
            }}>
              Enter the verification code sent to your email
            </p>
            <ConfirmSignUpForm username={username as string} />
          </div>
        </main>
      </div>
    </>
  );
}
