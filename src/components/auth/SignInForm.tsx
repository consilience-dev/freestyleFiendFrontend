import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { signInSchema, SignInFormData } from './schemas';
import { signIn } from '@/lib/auth';
import Link from 'next/link';
import { useRouter } from 'next/router';

/**
 * Sign In form component with validation and error handling
 */
export function SignInForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignInFormData>({
    resolver: zodResolver(signInSchema),
    defaultValues: {
      username: '',
      password: '',
    },
  });

  const onSubmit = async (data: SignInFormData) => {
    setIsLoading(true);
    setServerError(null);

    try {
      // Using AWS Amplify v6 signIn API
      const { isSignedIn, nextStep } = await signIn({
        username: data.username,
        password: data.password,
      });

      if (isSignedIn) {
        // Successful sign-in
        const redirectPath = (router.query.redirect as string) || '/profile';
        router.push(redirectPath);
      } else if (nextStep.signInStep === 'CONFIRM_SIGN_UP') {
        // User needs to confirm their account
        router.push(`/confirm-signup?username=${data.username}`);
      } else if (nextStep.signInStep === 'RESET_PASSWORD') {
        // User needs to reset their password
        router.push(`/reset-password?username=${data.username}`);
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
        Sign In
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

        <div style={{ 
          display: 'flex', 
          justifyContent: 'flex-end',
          fontSize: '0.75rem',
          marginTop: '-0.5rem'
        }}>
          <Link 
            href="/forgot-password" 
            style={{ 
              color: 'rgba(255, 255, 255, 0.7)',
              textDecoration: 'none',
              transition: 'color 0.2s',
            }}
            onMouseOver={(e) => e.currentTarget.style.color = 'white'}
            onMouseOut={(e) => e.currentTarget.style.color = 'rgba(255, 255, 255, 0.7)'}
          >
            Forgot password?
          </Link>
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
          {isLoading ? 'Signing In...' : 'Sign In'}
        </button>
      </form>

      <div style={{ 
        marginTop: '1.5rem',
        textAlign: 'center',
        color: 'rgba(255, 255, 255, 0.7)',
        fontSize: '0.875rem'
      }}>
        Don't have an account?{' '}
        <Link 
          href="/signup" 
          style={{ 
            color: 'white',
            textDecoration: 'none',
            fontWeight: 500,
          }}
          onMouseOver={(e) => e.currentTarget.style.textDecoration = 'underline'}
          onMouseOut={(e) => e.currentTarget.style.textDecoration = 'none'}
        >
          Sign up
        </Link>
      </div>
    </div>
  );
}
