import Head from 'next/head';
import { SignInForm } from '@/components/auth';
import { useAuth } from '@/lib/auth';
import { useRouter } from 'next/router';
import { useEffect } from 'react';

/**
 * Sign In page for user authentication
 */
export default function SignInPage() {
  const { authState } = useAuth();
  const router = useRouter();
  
  // Redirect to home if already authenticated
  useEffect(() => {
    if (authState.isAuthenticated) {
      const redirectPath = (router.query.redirect as string) || '/profile';
      router.replace(redirectPath);
    }
  }, [authState.isAuthenticated, router]);

  return (
    <>
      <Head>
        <title>Sign In - FreestyleFiend</title>
        <meta name="description" content="Sign in to your FreestyleFiend account" />
      </Head>

      <main style={{
        minHeight: 'calc(100vh - 60px)', // Adjust based on navbar height
        padding: '2rem 1rem',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <SignInForm />
      </main>
    </>
  );
}
