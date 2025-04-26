import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Auth, Hub } from 'aws-amplify';
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
  const checkAuthState = async () => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true, error: null }));
      const cognitoUser = await Auth.currentAuthenticatedUser();
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
      await Auth.signUp({
        username: data.username,
        password: data.password,
        attributes: {
          email: data.email,
          ...(data.name ? { name: data.name } : {}),
        },
      });
      setAuthState(prev => ({ ...prev, isLoading: false }));
    } catch (error) {
      setAuthState(prev => ({ 
        ...prev, 
        isLoading: false, 
        error: error instanceof Error ? error : new Error('An unknown error occurred during sign up') 
      }));
      throw error;
    }
  };

  // Confirm sign up with verification code
  const confirmSignUp = async (data: ConfirmSignUpData) => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true, error: null }));
      await Auth.confirmSignUp(data.username, data.code);
      setAuthState(prev => ({ ...prev, isLoading: false }));
    } catch (error) {
      setAuthState(prev => ({ 
        ...prev, 
        isLoading: false, 
        error: error instanceof Error ? error : new Error('An unknown error occurred during confirmation') 
      }));
      throw error;
    }
  };

  // Sign in a user
  const signIn = async (data: SignInData) => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true, error: null }));
      const cognitoUser = await Auth.signIn(data.username, data.password);
      const formattedUser = formatUser(cognitoUser);
      setAuthState({
        isAuthenticated: true,
        isLoading: false,
        user: formattedUser,
        error: null,
      });
    } catch (error) {
      setAuthState(prev => ({ 
        ...prev, 
        isLoading: false, 
        error: error instanceof Error ? error : new Error('An unknown error occurred during sign in') 
      }));
      throw error;
    }
  };

  // Sign out the current user
  const signOut = async () => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true, error: null }));
      await Auth.signOut();
      setAuthState({
        isAuthenticated: false,
        isLoading: false,
        user: null,
        error: null,
      });
    } catch (error) {
      setAuthState(prev => ({ 
        ...prev, 
        isLoading: false, 
        error: error instanceof Error ? error : new Error('An unknown error occurred during sign out') 
      }));
      throw error;
    }
  };

  // Request a password reset
  const forgotPassword = async (data: ForgotPasswordData) => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true, error: null }));
      await Auth.forgotPassword(data.username);
      setAuthState(prev => ({ ...prev, isLoading: false }));
    } catch (error) {
      setAuthState(prev => ({ 
        ...prev, 
        isLoading: false, 
        error: error instanceof Error ? error : new Error('An unknown error occurred during password reset request') 
      }));
      throw error;
    }
  };

  // Confirm new password with verification code
  const confirmForgotPassword = async (data: ConfirmForgotPasswordData) => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true, error: null }));
      await Auth.forgotPasswordSubmit(data.username, data.code, data.newPassword);
      setAuthState(prev => ({ ...prev, isLoading: false }));
    } catch (error) {
      setAuthState(prev => ({ 
        ...prev, 
        isLoading: false, 
        error: error instanceof Error ? error : new Error('An unknown error occurred during password reset confirmation') 
      }));
      throw error;
    }
  };

  // Listen for authentication events
  useEffect(() => {
    // Check auth state on mount
    checkAuthState();

    // Set up listener for auth events
    const unsubscribe = Hub.listen('auth', ({ payload: { event, data } }) => {
      switch (event) {
        case 'signIn':
          setAuthState({
            isAuthenticated: true,
            isLoading: false,
            user: formatUser(data),
            error: null,
          });
          break;
        case 'signOut':
          setAuthState({
            isAuthenticated: false,
            isLoading: false,
            user: null,
            error: null,
          });
          break;
        case 'tokenRefresh':
          checkAuthState();
          break;
        default:
          break;
      }
    });

    // Clean up listener on unmount
    return () => unsubscribe();
  }, []);

  // Authentication context value with state and methods
  const contextValue: AuthContextType = {
    authState,
    signUp,
    confirmSignUp,
    signIn,
    signOut,
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
