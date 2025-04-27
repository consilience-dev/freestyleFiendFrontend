import { Amplify } from 'aws-amplify';
import { signUp, signIn, signOut, confirmSignUp, resetPassword, confirmResetPassword } from 'aws-amplify/auth';
import { fetchAuthSession, getCurrentUser } from 'aws-amplify/auth';

// Configure Amplify during import - v6 compliant configuration
Amplify.configure({
  Auth: {
    Cognito: {
      userPoolId: process.env.NEXT_PUBLIC_USER_POOL_ID || '',
      userPoolClientId: process.env.NEXT_PUBLIC_USER_POOL_CLIENT_ID || '',
      loginWith: {
        username: true,
        email: true
      }
    }
  }
});

// Function to get the current token for API authentication
export async function getAccessToken(): Promise<string | null> {
  try {
    const session = await fetchAuthSession();
    // Try ID token first (like recording page does), then fall back to access token
    return session.tokens?.idToken?.toString() || session.tokens?.accessToken?.toString() || null;
  } catch (error) {
    console.error('Error fetching authentication token:', error);
    return null;
  }
}

// Export the AuthProvider
export { AuthProvider, useAuth } from './AuthProvider';

// Export auth functions directly
export {
  signUp,
  signIn,
  signOut,
  confirmSignUp,
  resetPassword as forgotPassword,
  confirmResetPassword as confirmForgotPassword,
  fetchAuthSession,
  getCurrentUser
};
