/**
 * Authentication types for AWS Cognito
 */

export interface User {
  id: string;
  email: string;
  username: string;
  attributes?: {
    sub?: string;
    email_verified?: boolean;
    name?: string;
    preferred_username?: string;
    picture?: string;
    [key: string]: any;
  };
}

export interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: User | null;
  error: Error | null;
}

export interface SignUpData {
  username: string;
  email: string;
  password: string;
  name?: string;
}

export interface SignInData {
  username: string;
  password: string;
}

export interface ConfirmSignUpData {
  username: string;
  code: string;
}

export interface ForgotPasswordData {
  username: string;
}

export interface ConfirmForgotPasswordData {
  username: string;
  code: string;
  newPassword: string;
}

export interface AuthContextType {
  authState: AuthState;
  signUp: (data: SignUpData) => Promise<void>;
  confirmSignUp: (data: ConfirmSignUpData) => Promise<void>;
  signIn: (data: SignInData) => Promise<void>;
  signOut: () => Promise<void>;
  forgotPassword: (data: ForgotPasswordData) => Promise<void>;
  confirmForgotPassword: (data: ConfirmForgotPasswordData) => Promise<void>;
}
