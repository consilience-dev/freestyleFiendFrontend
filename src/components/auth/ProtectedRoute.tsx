import { useAuth } from '@/lib/auth';
import { useRouter } from 'next/router';
import { useEffect, ReactNode } from 'react';

interface ProtectedRouteProps {
  children: ReactNode;
  fallbackUrl?: string;
}

/**
 * Higher-Order Component that protects routes requiring authentication
 * Will redirect to sign-in page if user is not authenticated
 */
export function ProtectedRoute({ 
  children, 
  fallbackUrl = '/signin' 
}: ProtectedRouteProps) {
  const { authState } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // If auth state is no longer loading and user is not authenticated
    if (!authState.isLoading && !authState.isAuthenticated) {
      // Add the current path as a redirect parameter
      const currentPath = encodeURIComponent(router.asPath);
      router.push(`${fallbackUrl}?redirect=${currentPath}`);
    }
  }, [authState.isLoading, authState.isAuthenticated, router, fallbackUrl]);

  // Show loading state while checking authentication
  if (authState.isLoading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: 'calc(100vh - 60px)',
      }}>
        <div style={{
          padding: '2rem',
          backgroundColor: 'rgba(79, 29, 127, 0.4)',
          borderRadius: '0.5rem',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
          textAlign: 'center',
        }}>
          <p style={{ color: 'white', fontSize: '1.25rem' }}>Loading...</p>
        </div>
      </div>
    );
  }

  // If authenticated, render the children
  return authState.isAuthenticated ? <>{children}</> : null;
}
