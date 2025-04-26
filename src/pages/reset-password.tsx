import Head from 'next/head';
import { ResetPasswordForm } from '@/components/auth';
import { useRouter } from 'next/router';

/**
 * Reset Password page for setting a new password
 */
export default function ResetPasswordPage() {
  const router = useRouter();
  const { username } = router.query;

  return (
    <>
      <Head>
        <title>Reset Password - FreestyleFiend</title>
        <meta name="description" content="Set a new password for your FreestyleFiend account" />
      </Head>

      <main style={{
        minHeight: 'calc(100vh - 60px)', // Adjust based on navbar height
        padding: '2rem 1rem',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <ResetPasswordForm username={username as string} />
      </main>
    </>
  );
}
