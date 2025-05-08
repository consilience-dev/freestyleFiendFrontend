import type { AppProps } from "next/app";
import { NavBar } from "@/components/NavBar";
import Head from "next/head";
import { Inter as FontSans } from "next/font/google";
import { AuthProvider } from "@/lib/auth";
import { useRouter } from "next/router";
import { Analytics } from "@vercel/analytics/next";

import "@/styles/globals.css"; 

const fontSans = FontSans({
  subsets: ["latin"],
  variable: "--font-sans",
});

export default function App({ Component, pageProps }: AppProps) {
  const router = useRouter();
  
  // Don't show the NavBar on homepage, profile, leaderboard, vote, record, or authentication pages
  const hideNavbar = router.pathname === '/' || 
                     router.pathname === '/profile' ||
                     router.pathname === '/leaderboard' ||
                     router.pathname === '/vote' ||
                     router.pathname === '/record' ||
                     router.pathname === '/signin' || 
                     router.pathname === '/signup' ||
                     router.pathname === '/confirm-signup' ||
                     router.pathname === '/forgot-password' ||
                     router.pathname === '/reset-password';

  return (
    <>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
      </Head>
      <div className={`${fontSans.variable} font-sans antialiased`}>
        <AuthProvider>
          <div className="relative flex min-h-screen flex-col bg-background text-foreground">
            {!hideNavbar && <NavBar />}
            <div className="flex-1">
              <Component {...pageProps} />
            </div>
            <Analytics />
          </div>
        </AuthProvider>
      </div>
    </>
  );
}
