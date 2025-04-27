import Head from 'next/head';
import { ForgotPasswordForm } from '@/components/auth';
import Link from 'next/link';

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
          <ForgotPasswordForm />
        </main>
      </div>
    </>
  );
}
