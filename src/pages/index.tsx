import Link from "next/link";
import Head from "next/head";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";

export default function Home() {
  const { authState } = useAuth();

  return (
    <>
      <Head>
        <title>FreestyleFiend - Freestyle Rap Platform</title>
        <meta name="description" content="Record, vote, and discover the best freestyle rap content" />
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
      
      {/* Header/NavBar */}
      <header style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        padding: '16px 20px',
        borderBottom: '1px solid #333' 
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
        <div>
          {authState.isAuthenticated ? (
            <Link href="/profile" style={{ color: '#fff', marginRight: '10px' }}>
              Profile
            </Link>
          ) : (
            <>
              <Link href="/signin" style={{ color: '#fff', marginRight: '10px' }}>
                Sign In
              </Link>
              <Link href="/signup" style={{ color: '#fff' }}>
                Sign Up
              </Link>
            </>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        justifyContent: 'center', 
        padding: '60px 20px', 
        minHeight: 'calc(100vh - 120px)',
        textAlign: 'center'
      }}>
        <div style={{ marginBottom: '60px', maxWidth: '600px' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '24px' }}>
            <svg width="80" height="80" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ 
              borderRadius: '50%',
              backgroundColor: '#9333ea',
              padding: '16px'
            }}>
              <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM12 8C13.66 8 15 9.34 15 11V17C15 18.66 13.66 20 12 20C10.34 20 9 18.66 9 17V11C9 9.34 10.34 8 12 8ZM18 12C18 15.31 15.31 18 12 18V16C14.21 16 16 14.21 16 12H18Z" fill="black" />
            </svg>
          </div>
          <h1 style={{ fontSize: '42px', fontWeight: 'bold', marginBottom: '16px' }}>
            FreestyleFiend
          </h1>
          <p style={{ fontSize: '20px', color: '#ddd', marginBottom: '40px' }}>
            Record your freestyles, vote on others, and climb the leaderboard
          </p>
        </div>
        
        <div style={{ 
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '24px',
          width: '100%',
          maxWidth: '1000px'
        }}>
          <div style={{ 
            padding: '24px', 
            backgroundColor: 'rgba(147, 51, 234, 0.1)', 
            borderRadius: '12px',
            border: '1px solid rgba(147, 51, 234, 0.2)',
            textAlign: 'center'
          }}>
            <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '16px' }}>Record</h2>
            <p style={{ color: '#bbb', marginBottom: '24px' }}>Choose a beat and get your bars down</p>
            <Link href="/record" style={{ 
              display: 'inline-block',
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              color: 'white',
              padding: '10px 20px',
              borderRadius: '8px',
              fontWeight: '500',
              transition: 'background-color 0.2s ease'
            }}>
              Start Recording
            </Link>
          </div>
          
          <div style={{ 
            padding: '24px', 
            backgroundColor: 'rgba(147, 51, 234, 0.1)', 
            borderRadius: '12px',
            border: '1px solid rgba(147, 51, 234, 0.2)',
            textAlign: 'center'
          }}>
            <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '16px' }}>Vote</h2>
            <p style={{ color: '#bbb', marginBottom: '24px' }}>Listen to freestyles and cast your votes</p>
            <Link href="/vote" style={{ 
              display: 'inline-block',
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              color: 'white',
              padding: '10px 20px',
              borderRadius: '8px',
              fontWeight: '500',
              transition: 'background-color 0.2s ease'
            }}>
              Cast Your Votes
            </Link>
          </div>
          
          <div style={{ 
            padding: '24px', 
            backgroundColor: 'rgba(147, 51, 234, 0.1)', 
            borderRadius: '12px',
            border: '1px solid rgba(147, 51, 234, 0.2)',
            textAlign: 'center'
          }}>
            <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '16px' }}>Leaderboard</h2>
            <p style={{ color: '#bbb', marginBottom: '24px' }}>See who's at the top of the freestyle game</p>
            <Link href="/leaderboard" style={{ 
              display: 'inline-block',
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              color: 'white',
              padding: '10px 20px',
              borderRadius: '8px',
              fontWeight: '500',
              transition: 'background-color 0.2s ease'
            }}>
              View Leaderboard
            </Link>
          </div>
        </div>
      </main>
    </>
  );
}
