import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { forgotPasswordSchema, ForgotPasswordFormData } from './schemas';
import { forgotPassword } from '@/lib/auth';
import Link from 'next/link';
import { useRouter } from 'next/router';

/**
 * Forgot Password form component with validation and error handling
 */
export function ForgotPasswordForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      username: '',
    },
  });

  const username = watch('username');

  const onSubmit = async (data: ForgotPasswordFormData) => {
    setIsLoading(true);
    setServerError(null);

    try {
      // Using AWS Amplify v6 resetPassword API
      await forgotPassword({
        username: data.username,
      });
      setIsSuccess(true);
      reset();
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
          Check Your Email
        </h2>
        <p style={{ color: 'rgba(255, 255, 255, 0.8)', marginBottom: '1.5rem', textAlign: 'center' }}>
          If an account exists with this username, we've sent a code to your email with instructions to reset your password.
        </p>
        <Link href={`/reset-password?username=${username}`}
          style={{
            display: 'block',
            backgroundColor: 'rgba(255, 255, 255, 0.15)',
            color: 'white',
            padding: '0.75rem 1rem',
            borderRadius: '0.375rem',
            fontWeight: 500,
            cursor: 'pointer',
            width: '100%',
            textAlign: 'center',
            textDecoration: 'none',
            transition: 'background-color 0.2s',
          }}
          onClick={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.25)';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.15)';
          }}
        >
          Reset Your Password
        </Link>
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
        Forgot Password
      </h2>
      <p style={{ 
        color: 'rgba(255, 255, 255, 0.8)', 
        marginBottom: '1.5rem', 
        textAlign: 'center',
        fontSize: '0.875rem'
      }}>
        Enter your username and we'll send you a code to reset your password.
      </p>
      
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
          onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.25)'}
          onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.15)'}
        >
          {isLoading ? 'Sending...' : 'Send Reset Code'}
        </button>
      </form>

      <div style={{ 
        marginTop: '1.5rem',
        textAlign: 'center',
        color: 'rgba(255, 255, 255, 0.7)',
        fontSize: '0.875rem'
      }}>
        Remember your password?{' '}
        <Link 
          href="/signin" 
          style={{ 
            color: 'white',
            textDecoration: 'none',
            fontWeight: 500,
          }}
          onMouseOver={(e) => e.currentTarget.style.textDecoration = 'underline'}
          onMouseOut={(e) => e.currentTarget.style.textDecoration = 'none'}
        >
          Sign in
        </Link>
      </div>
    </div>
  );
}
