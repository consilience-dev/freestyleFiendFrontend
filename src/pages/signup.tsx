import Head from 'next/head';
import { SignUpForm } from '@/components/auth';

/**
 * Sign Up page for new users to create an account
 */
export default function SignUpPage() {
  return (
    <>
      <Head>
        <title>Sign Up - FreestyleFiend</title>
        <meta name="description" content="Create a new FreestyleFiend account" />
      </Head>

      <main style={{
        minHeight: 'calc(100vh - 60px)', // Adjust based on navbar height
        padding: '2rem 1rem',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <SignUpForm />
      </main>
    </>
  );
}
