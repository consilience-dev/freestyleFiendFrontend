import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Hub } from '@aws-amplify/core';
import { AuthUser } from 'aws-amplify/auth';
import { fetchAuthSession, getCurrentUser } from 'aws-amplify/auth';
import { AuthState, User } from '@/types/auth';

// Default authentication state
const initialAuthState: AuthState = {
  isAuthenticated: false,
  isLoading: true,
  user: null,
  error: null,
};

// Create context with default values
interface AuthContextType {
  authState: AuthState;
}

const AuthContext = createContext<AuthContextType>({
  authState: initialAuthState,
});

/**
 * Authentication provider component that manages auth state
 */
export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [authState, setAuthState] = useState<AuthState>(initialAuthState);

  // Helper function to transform Cognito user to our User type
  const formatUser = (cognitoUser: AuthUser): User => {
    return {
      id: cognitoUser.userId || '',
      email: cognitoUser.username || '',
      username: cognitoUser.username || '',
      attributes: cognitoUser.signInDetails?.loginId ? {
        email: cognitoUser.signInDetails.loginId
      } : {},
    };
  };

  // Check if user is authenticated
  const checkAuthState = async () => {
    try {
      const user = await getCurrentUser();
      const session = await fetchAuthSession();
      
      setAuthState({
        isAuthenticated: true,
        isLoading: false,
        user: formatUser(user),
        error: null,
      });
    } catch (error) {
      // User is not authenticated
      setAuthState({
        isAuthenticated: false,
        isLoading: false,
        user: null,
        error: null,
      });
    }
  };

  useEffect(() => {
    // Check authentication state when component mounts
    checkAuthState();

    // Listen for authentication events
    const hubListener = Hub.listen('auth', ({ payload }) => {
      const { event } = payload;

      if (event === 'signedIn') {
        checkAuthState();
      } else if (event === 'signedOut') {
        setAuthState({
          isAuthenticated: false,
          isLoading: false,
          user: null,
          error: null,
        });
      }
    });

    return () => {
      hubListener();
    };
  }, []);

  return (
    <AuthContext.Provider value={{ authState }}>
      {children}
    </AuthContext.Provider>
  );
};

/**
 * Custom hook to use the auth context
 */
export const useAuth = () => useContext(AuthContext);
