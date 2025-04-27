import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Amplify } from 'aws-amplify';
import { 
  signIn as amplifySignIn, 
  signUp as amplifySignUp, 
  confirmSignUp as amplifyConfirmSignUp, 
  signOut as amplifySignOut, 
  resetPassword as amplifyResetPassword, 
  confirmResetPassword as amplifyConfirmResetPassword, 
  fetchAuthSession, 
  getCurrentUser
} from 'aws-amplify/auth';
import { Hub } from 'aws-amplify/utils';
import { 
  AuthState, 
  User, 
  AuthContextType,
  SignUpData,
  SignInData,
  ConfirmSignUpData,
  ForgotPasswordData,
  ConfirmForgotPasswordData
} from '@/types/auth';

// Default authentication state
const initialAuthState: AuthState = {
  isAuthenticated: false,
  isLoading: true,
  user: null,
  error: null,
};

// Create context with default values
const AuthContext = createContext<AuthContextType>({
  authState: initialAuthState,
  signUp: () => Promise.resolve(),
  confirmSignUp: () => Promise.resolve(),
  signIn: () => Promise.resolve(),
  signOut: () => Promise.resolve(),
  forgotPassword: () => Promise.resolve(),
  confirmForgotPassword: () => Promise.resolve(),
});

/**
 * Authentication provider component that manages auth state and provides auth methods
 */
export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [authState, setAuthState] = useState<AuthState>(initialAuthState);

  // Helper function to transform Cognito user to our User type
  const formatUser = (cognitoUser: any): User => {
    return {
      id: cognitoUser.attributes?.sub || '',
      email: cognitoUser.attributes?.email || '',
      username: cognitoUser.username || '',
      attributes: cognitoUser.attributes || {},
    };
  };

  // Check if user is authenticated
  const checkAuthStatus = async () => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true, error: null }));
      const cognitoUser = await getCurrentUser();
      const formattedUser = formatUser(cognitoUser);
      setAuthState({
        isAuthenticated: true,
        isLoading: false,
        user: formattedUser,
        error: null,
      });
    } catch (error) {
      setAuthState({
        isAuthenticated: false,
        isLoading: false,
        user: null,
        error: null, // Don't set error when user is just not logged in
      });
    }
  };

  // Sign up a new user
  const signUp = async (data: SignUpData) => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true, error: null }));
      const signUpInput = {
        username: data.username,
        password: data.password,
        options: {
          userAttributes: {
            email: data.email,
            ...(data.name && { name: data.name }),
          }
        }
      };
      
      await amplifySignUp(signUpInput);
      setAuthState(prev => ({ ...prev, isLoading: false }));
    } catch (error) {
      console.error('Sign up error:', error);
      setAuthState(prev => ({ ...prev, isLoading: false, error: error as Error }));
      throw error;
    }
  };

  // Confirm sign up with verification code
  const confirmSignUp = async (data: ConfirmSignUpData) => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true, error: null }));
      const confirmSignUpInput = {
        username: data.username,
        confirmationCode: data.code,
      };
      
      await amplifyConfirmSignUp(confirmSignUpInput);
      setAuthState(prev => ({ ...prev, isLoading: false }));
    } catch (error) {
      console.error('Confirm sign up error:', error);
      setAuthState(prev => ({ ...prev, isLoading: false, error: error as Error }));
      throw error;
    }
  };

  // Sign in an existing user
  const signIn = async (data: SignInData) => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true, error: null }));
      const signInInput = {
        username: data.username,
        password: data.password,
      };
      
      await amplifySignIn(signInInput);
      await checkAuthStatus();
    } catch (error) {
      console.error('Sign in error:', error);
      setAuthState(prev => ({ ...prev, isLoading: false, error: error as Error }));
      throw error;
    }
  };

  // Sign out the current user
  const handleSignOut = async () => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true, error: null }));
      await amplifySignOut();
      setAuthState({
        isAuthenticated: false,
        isLoading: false,
        user: null,
        error: null,
      });
    } catch (error) {
      console.error('Sign out error:', error);
      setAuthState(prev => ({ ...prev, isLoading: false, error: error as Error }));
      throw error;
    }
  };

  // Trigger password reset for a user
  const forgotPassword = async (data: ForgotPasswordData) => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true, error: null }));
      const resetPasswordInput = {
        username: data.username,
      };
      
      await amplifyResetPassword(resetPasswordInput);
      setAuthState(prev => ({ ...prev, isLoading: false }));
    } catch (error) {
      console.error('Password reset error:', error);
      setAuthState(prev => ({ ...prev, isLoading: false, error: error as Error }));
      throw error;
    }
  };

  // Confirm password reset with verification code and new password
  const confirmForgotPassword = async (data: ConfirmForgotPasswordData) => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true, error: null }));
      const confirmResetPasswordInput = {
        username: data.username,
        confirmationCode: data.code,
        newPassword: data.newPassword,
      };
      
      await amplifyConfirmResetPassword(confirmResetPasswordInput);
      setAuthState(prev => ({ ...prev, isLoading: false }));
    } catch (error) {
      console.error('Confirm password reset error:', error);
      setAuthState(prev => ({ ...prev, isLoading: false, error: error as Error }));
      throw error;
    }
  };

  // Listen for auth events
  useEffect(() => {
    // Initialize the auth state
    checkAuthStatus();

    // Listen for auth events from Amplify
    const listener = (data: any) => {
      console.log('Auth event:', data.payload.event);
      
      switch (data.payload.event) {
        case 'signIn':
          checkAuthStatus();
          break;
        case 'signOut':
          setAuthState({
            ...initialAuthState,
            isLoading: false,
          });
          break;
        default:
          break;
      }
    };

    Hub.listen('auth', listener);
    
    // In Amplify v6, we use the returned function to unsubscribe
    return () => {
      // Use the newer pattern for v6 to unsubscribe
      const unsubscribe = Hub.listen('auth', () => {});
      unsubscribe();
    };
  }, []);

  // Authentication context value with state and methods
  const contextValue: AuthContextType = {
    authState,
    signUp,
    confirmSignUp,
    signIn,
    signOut: handleSignOut,
    forgotPassword,
    confirmForgotPassword,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use the auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
