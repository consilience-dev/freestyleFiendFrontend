import type { AppProps } from "next/app";
import { NavBar } from "@/components/NavBar";
import Head from "next/head";
import { useEffect } from "react";
import { AuthProvider } from "@/lib/auth";

// We'll initialize Amplify in the AuthProvider component instead
export default function App({ Component, pageProps }: AppProps) {
  return (
    <>
      <Head>
        <style>
          {`
            body {
              margin: 0;
              padding: 0;
              font-family: 'Inter', system-ui, -apple-system, BlinkMacSystemFont, sans-serif;
              background-color: #3b0764;
              color: white;
              line-height: 1.5;
            }
            
            a {
              color: inherit;
              text-decoration: none;
            }
            
            * {
              box-sizing: border-box;
            }

            @media (max-width: 768px) {
              body {
                font-size: 14px;
              }
            }
          `}
        </style>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </Head>
      <AuthProvider>
        <NavBar />
        <Component {...pageProps} />
      </AuthProvider>
    </>
  );
}
