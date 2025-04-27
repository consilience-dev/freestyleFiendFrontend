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
      </Head>

      <div className="flex flex-col min-h-screen">
        <header className="flex items-center justify-between py-6 px-8 border-b border-border">
          <div className="flex items-center gap-2">
            <Link href="/" className="font-bold text-2xl">
              FreestyleFiend
            </Link>
          </div>
          <Link href="/signin" className="text-sm">
            Login
          </Link>
        </header>

        <main className="flex flex-col items-center justify-center flex-1 px-4 py-8">
          <ConfirmSignUpForm username={username as string} />
        </main>
      </div>
    </>
  );
}
