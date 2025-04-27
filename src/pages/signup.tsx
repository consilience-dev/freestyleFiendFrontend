import Head from 'next/head';
import { SignUpForm } from '@/components/auth';
import Link from 'next/link';

/**
 * Sign Up page for new users to create an account
 */
export default function SignUpPage() {
  return (
    <>
      <Head>
        <title>Create an account - FreestyleFiend</title>
        <meta name="description" content="Create a new FreestyleFiend account" />
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
          <Link href="/signin" style={{ color: '#fff' }}>
            Sign in
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
          <SignUpForm />
        </main>
      </div>
    </>
  );
}
