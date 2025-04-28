import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { signUpSchema, SignUpFormData } from './schemas';
import { signUp } from '@/lib/auth';
import { useRouter } from 'next/router';
import Link from 'next/link';

// Import shadcn components
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardContent } from "@/components/ui/card";

/**
 * Sign Up form component with validation and error handling
 */
export function SignUpForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<SignUpFormData>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      username: '',
      email: '',
      password: '',
      confirmPassword: '',
      name: '',
    },
  });

  const onSubmit = async (data: SignUpFormData) => {
    setIsLoading(true);
    setServerError(null);

    try {
      // Using AWS Amplify v6 signUp API
      const { isSignUpComplete, userId, nextStep } = await signUp({
        username: data.username,
        password: data.password,
        options: {
          userAttributes: {
            email: data.email,
            name: data.name || undefined
          },
          autoSignIn: true
        }
      });

      setIsSuccess(true);
      reset();
      
      // If verification is required, redirect to confirm signup page
      if (!isSignUpComplete && nextStep.signUpStep === 'CONFIRM_SIGN_UP') {
        router.push(`/confirm-signup?username=${data.username}`);
      }
    } catch (error) {
      if (error instanceof Error) {
        setServerError(error.message);
      } else {
        setServerError('An unexpected error occurred. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div style={{ width: '100%' }}>
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#fff' }}>Account Created!</h1>
          <p style={{ fontSize: '0.875rem', color: 'rgba(255, 255, 255, 0.7)', marginTop: '0.5rem' }}>
            Please check your email for a verification code to confirm your account.
          </p>
        </div>
        
        <Button 
          onClick={() => router.push('/confirm-signup')}
          style={{ 
            width: '100%', 
            backgroundColor: '#9333ea', 
            color: '#fff', 
            padding: '0.75rem 1rem', 
            borderRadius: '0.375rem', 
            fontSize: '0.875rem', 
            cursor: 'pointer',
            border: 'none'
          }}
        >
          Verify Your Account
        </Button>
      </div>
    );
  }

  return (
    <div style={{ width: '100%' }}>
      <form onSubmit={handleSubmit(onSubmit)}>
        {serverError && (
          <div style={{
            marginBottom: '1rem',
            backgroundColor: 'rgba(220, 38, 38, 0.15)',
            color: 'rgb(220, 38, 38)',
            padding: '0.75rem 1rem',
            borderRadius: '0.375rem',
            fontSize: '0.875rem'
          }}>
            {serverError}
          </div>
        )}
        
        <div style={{ marginBottom: '1.5rem' }}>
          <div style={{ marginBottom: '1rem' }}>
            <Input
              id="username"
              type="text"
              placeholder="Username"
              {...register('username')}
              style={{ 
                width: '100%', 
                padding: '0.75rem 1rem', 
                borderRadius: '0.375rem', 
                fontSize: '0.875rem', 
                border: errors.username ? '1px solid rgb(220, 38, 38)' : '1px solid rgba(255, 255, 255, 0.2)', 
                backgroundColor: 'rgba(17, 17, 17, 0.8)', 
                color: '#fff',
                boxSizing: 'border-box',
                margin: '0 0 0.5rem 0'
              }}
              disabled={isLoading}
            />
            {errors.username && (
              <p style={{
                color: 'rgb(220, 38, 38)',
                fontSize: '0.75rem',
                margin: '0.25rem 0 0 0'
              }}>
                {errors.username.message}
              </p>
            )}
          </div>
          
          <div style={{ marginBottom: '1rem' }}>
            <Input
              id="name"
              type="text"
              placeholder="Full Name"
              {...register('name')}
              style={{ 
                width: '100%', 
                padding: '0.75rem 1rem', 
                borderRadius: '0.375rem', 
                fontSize: '0.875rem', 
                border: errors.name ? '1px solid rgb(220, 38, 38)' : '1px solid rgba(255, 255, 255, 0.2)', 
                backgroundColor: 'rgba(17, 17, 17, 0.8)', 
                color: '#fff',
                boxSizing: 'border-box',
                margin: '0 0 0.5rem 0'
              }}
              disabled={isLoading}
            />
            {errors.name && (
              <p style={{
                color: 'rgb(220, 38, 38)',
                fontSize: '0.75rem',
                margin: '0.25rem 0 0 0'
              }}>
                {errors.name.message}
              </p>
            )}
          </div>
          
          <div style={{ marginBottom: '1rem' }}>
            <Input
              id="email"
              type="email"
              placeholder="Email address"
              {...register('email')}
              style={{ 
                width: '100%', 
                padding: '0.75rem 1rem', 
                borderRadius: '0.375rem', 
                fontSize: '0.875rem', 
                border: errors.email ? '1px solid rgb(220, 38, 38)' : '1px solid rgba(255, 255, 255, 0.2)', 
                backgroundColor: 'rgba(17, 17, 17, 0.8)', 
                color: '#fff',
                boxSizing: 'border-box',
                margin: '0 0 0.5rem 0'
              }}
              disabled={isLoading}
            />
            {errors.email && (
              <p style={{
                color: 'rgb(220, 38, 38)',
                fontSize: '0.75rem',
                margin: '0.25rem 0 0 0'
              }}>
                {errors.email.message}
              </p>
            )}
          </div>
          
          <div style={{ marginBottom: '1rem' }}>
            <Input
              id="password"
              type="password"
              placeholder="Password"
              {...register('password')}
              style={{ 
                width: '100%', 
                padding: '0.75rem 1rem', 
                borderRadius: '0.375rem', 
                fontSize: '0.875rem', 
                border: errors.password ? '1px solid rgb(220, 38, 38)' : '1px solid rgba(255, 255, 255, 0.2)', 
                backgroundColor: 'rgba(17, 17, 17, 0.8)', 
                color: '#fff',
                boxSizing: 'border-box',
                margin: '0 0 0.5rem 0'
              }}
              disabled={isLoading}
            />
            {errors.password && (
              <p style={{
                color: 'rgb(220, 38, 38)',
                fontSize: '0.75rem',
                margin: '0.25rem 0 0 0'
              }}>
                {errors.password.message}
              </p>
            )}
          </div>
          
          <div style={{ marginBottom: '1rem' }}>
            <Input
              id="confirmPassword"
              type="password"
              placeholder="Confirm password"
              {...register('confirmPassword')}
              style={{ 
                width: '100%', 
                padding: '0.75rem 1rem', 
                borderRadius: '0.375rem', 
                fontSize: '0.875rem', 
                border: errors.confirmPassword ? '1px solid rgb(220, 38, 38)' : '1px solid rgba(255, 255, 255, 0.2)', 
                backgroundColor: 'rgba(17, 17, 17, 0.8)', 
                color: '#fff',
                boxSizing: 'border-box',
                margin: '0 0 0.5rem 0'
              }}
              disabled={isLoading}
            />
            {errors.confirmPassword && (
              <p style={{
                color: 'rgb(220, 38, 38)',
                fontSize: '0.75rem',
                margin: '0.25rem 0 0 0'
              }}>
                {errors.confirmPassword.message}
              </p>
            )}
          </div>
          
          <Button 
            type="submit" 
            style={{ 
              width: '100%', 
              backgroundColor: '#9333ea', 
              color: '#fff', 
              padding: '0.75rem 1rem', 
              borderRadius: '0.375rem', 
              fontSize: '0.875rem', 
              cursor: isLoading ? 'not-allowed' : 'pointer',
              opacity: isLoading ? '0.7' : '1',
              border: 'none'
            }}
            disabled={isLoading}
          >
            {isLoading ? "Creating account..." : "Sign Up with Email"}
          </Button>
        </div>
        
        <div style={{
          marginTop: '1rem',
          textAlign: 'center',
          fontSize: '0.75rem',
          color: 'rgba(255, 255, 255, 0.7)'
        }}>
          By clicking continue, you agree to our{' '}
          <Link href="/terms" style={{ color: '#9333ea', textDecoration: 'underline' }}>
            Terms of Service
          </Link>{' '}
          and{' '}
          <Link href="/privacy" style={{ color: '#9333ea', textDecoration: 'underline' }}>
            Privacy Policy
          </Link>
          .
        </div>
        
        <div style={{
          marginTop: '1.5rem',
          textAlign: 'center',
          fontSize: '0.875rem',
          color: 'rgba(255, 255, 255, 0.7)'
        }}>
          <span>Already have an account?</span>{' '}
          <Link
            href="/signin"
            style={{ color: '#9333ea', textDecoration: 'underline' }}
          >
            Sign in
          </Link>
        </div>
      </form>
    </div>
  );
}
