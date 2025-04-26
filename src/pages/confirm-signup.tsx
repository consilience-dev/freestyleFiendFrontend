import Head from 'next/head';
import { ConfirmSignUpForm } from '@/components/auth';
import { useRouter } from 'next/router';

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
      </Head>

      <main style={{
        minHeight: 'calc(100vh - 60px)', // Adjust based on navbar height
        padding: '2rem 1rem',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <ConfirmSignUpForm username={username as string} />
      </main>
    </>
  );
}
