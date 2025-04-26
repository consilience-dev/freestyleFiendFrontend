import Head from 'next/head';
import { ForgotPasswordForm } from '@/components/auth';

/**
 * Forgot Password page for initiating password resets
 */
export default function ForgotPasswordPage() {
  return (
    <>
      <Head>
        <title>Forgot Password - FreestyleFiend</title>
        <meta name="description" content="Reset your FreestyleFiend password" />
      </Head>

      <main style={{
        minHeight: 'calc(100vh - 60px)', // Adjust based on navbar height
        padding: '2rem 1rem',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <ForgotPasswordForm />
      </main>
    </>
  );
}
