import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { signUpSchema, SignUpFormData } from './schemas';
import { signUp } from '@/lib/auth';
import { useRouter } from 'next/router';

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
      <div style={{
        maxWidth: '400px',
        margin: '0 auto',
        padding: '2rem',
        backgroundColor: 'rgba(79, 29, 127, 0.4)',
        borderRadius: '0.5rem',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
      }}>
        <h2 style={{ color: 'white', fontSize: '1.5rem', marginBottom: '1rem', textAlign: 'center' }}>
          Account Created!
        </h2>
        <p style={{ color: 'rgba(255, 255, 255, 0.8)', marginBottom: '1.5rem', textAlign: 'center' }}>
          Please check your email for a verification code to confirm your account.
        </p>
        <button
          onClick={() => router.push('/confirm-signup')}
          style={{
            backgroundColor: 'rgba(255, 255, 255, 0.15)',
            color: 'white',
            border: 'none',
            padding: '0.75rem 1rem',
            borderRadius: '0.375rem',
            fontWeight: 500,
            cursor: 'pointer',
            width: '100%',
            transition: 'background-color 0.2s',
          }}
        >
          Verify Your Account
        </button>
      </div>
    );
  }

  return (
    <div style={{
      maxWidth: '400px',
      margin: '0 auto',
      padding: '2rem',
      backgroundColor: 'rgba(79, 29, 127, 0.4)',
      borderRadius: '0.5rem',
      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
    }}>
      <h2 style={{ color: 'white', fontSize: '1.5rem', marginBottom: '1rem', textAlign: 'center' }}>
        Create Your Account
      </h2>
      {serverError && (
        <div style={{
          backgroundColor: 'rgba(200, 30, 30, 0.2)',
          color: '#FFBBBB',
          padding: '0.75rem',
          borderRadius: '0.375rem',
          marginBottom: '1rem',
          fontSize: '0.875rem',
        }}>
          {serverError}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div>
          <label 
            htmlFor="username" 
            style={{ 
              display: 'block', 
              marginBottom: '0.5rem', 
              color: 'white', 
              fontSize: '0.875rem' 
            }}
          >
            Username
          </label>
          <input
            id="username"
            type="text"
            {...register('username')}
            style={{
              width: '100%',
              padding: '0.75rem',
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              border: errors.username ? '1px solid #ff4d4d' : '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '0.375rem',
              color: 'white',
              fontSize: '0.875rem',
            }}
            placeholder="Enter your username"
          />
          {errors.username && (
            <p style={{ color: '#ff4d4d', fontSize: '0.75rem', marginTop: '0.25rem' }}>
              {errors.username.message}
            </p>
          )}
        </div>

        <div>
          <label 
            htmlFor="email" 
            style={{ 
              display: 'block', 
              marginBottom: '0.5rem', 
              color: 'white', 
              fontSize: '0.875rem' 
            }}
          >
            Email
          </label>
          <input
            id="email"
            type="email"
            {...register('email')}
            style={{
              width: '100%',
              padding: '0.75rem',
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              border: errors.email ? '1px solid #ff4d4d' : '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '0.375rem',
              color: 'white',
              fontSize: '0.875rem',
            }}
            placeholder="Enter your email"
          />
          {errors.email && (
            <p style={{ color: '#ff4d4d', fontSize: '0.75rem', marginTop: '0.25rem' }}>
              {errors.email.message}
            </p>
          )}
        </div>

        <div>
          <label 
            htmlFor="name" 
            style={{ 
              display: 'block', 
              marginBottom: '0.5rem', 
              color: 'white', 
              fontSize: '0.875rem' 
            }}
          >
            Full Name (optional)
          </label>
          <input
            id="name"
            type="text"
            {...register('name')}
            style={{
              width: '100%',
              padding: '0.75rem',
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              border: errors.name ? '1px solid #ff4d4d' : '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '0.375rem',
              color: 'white',
              fontSize: '0.875rem',
            }}
            placeholder="Enter your full name"
          />
          {errors.name && (
            <p style={{ color: '#ff4d4d', fontSize: '0.75rem', marginTop: '0.25rem' }}>
              {errors.name.message}
            </p>
          )}
        </div>

        <div>
          <label 
            htmlFor="password" 
            style={{ 
              display: 'block', 
              marginBottom: '0.5rem', 
              color: 'white', 
              fontSize: '0.875rem' 
            }}
          >
            Password
          </label>
          <input
            id="password"
            type="password"
            {...register('password')}
            style={{
              width: '100%',
              padding: '0.75rem',
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              border: errors.password ? '1px solid #ff4d4d' : '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '0.375rem',
              color: 'white',
              fontSize: '0.875rem',
            }}
            placeholder="Enter your password"
          />
          {errors.password && (
            <p style={{ color: '#ff4d4d', fontSize: '0.75rem', marginTop: '0.25rem' }}>
              {errors.password.message}
            </p>
          )}
        </div>

        <div>
          <label 
            htmlFor="confirmPassword" 
            style={{ 
              display: 'block', 
              marginBottom: '0.5rem', 
              color: 'white', 
              fontSize: '0.875rem' 
            }}
          >
            Confirm Password
          </label>
          <input
            id="confirmPassword"
            type="password"
            {...register('confirmPassword')}
            style={{
              width: '100%',
              padding: '0.75rem',
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              border: errors.confirmPassword ? '1px solid #ff4d4d' : '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '0.375rem',
              color: 'white',
              fontSize: '0.875rem',
            }}
            placeholder="Confirm your password"
          />
          {errors.confirmPassword && (
            <p style={{ color: '#ff4d4d', fontSize: '0.75rem', marginTop: '0.25rem' }}>
              {errors.confirmPassword.message}
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={isLoading}
          style={{
            backgroundColor: 'rgba(255, 255, 255, 0.15)',
            color: 'white',
            border: 'none',
            padding: '0.75rem 1rem',
            borderRadius: '0.375rem',
            fontWeight: 500,
            cursor: isLoading ? 'not-allowed' : 'pointer',
            width: '100%',
            transition: 'background-color 0.2s',
            opacity: isLoading ? 0.7 : 1,
            marginTop: '0.5rem',
          }}
        >
          {isLoading ? 'Creating Account...' : 'Sign Up'}
        </button>
      </form>
    </div>
  );
}
