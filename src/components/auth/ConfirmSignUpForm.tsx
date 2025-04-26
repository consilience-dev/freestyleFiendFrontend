import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { confirmSignUpSchema, ConfirmSignUpFormData } from './schemas';
import { confirmSignUp } from '@/lib/auth';
import { useRouter } from 'next/router';

interface ConfirmSignUpFormProps {
  username?: string;
  onSuccess?: () => void;
}

/**
 * Confirmation form for verifying user accounts after signup
 */
export function ConfirmSignUpForm({ username: initialUsername, onSuccess }: ConfirmSignUpFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ConfirmSignUpFormData>({
    resolver: zodResolver(confirmSignUpSchema),
    defaultValues: {
      username: initialUsername || router.query.username as string || '',
      code: '',
    },
  });

  const onSubmit = async (data: ConfirmSignUpFormData) => {
    setIsLoading(true);
    setServerError(null);

    try {
      // Using AWS Amplify v6 confirmSignUp API
      const { isSignUpComplete } = await confirmSignUp({
        username: data.username,
        confirmationCode: data.code,
      });
      
      if (isSignUpComplete) {
        if (onSuccess) {
          onSuccess();
        } else {
          // Redirect to sign in page after successful confirmation
          router.push('/signin');
        }
      } else {
        // Should not reach here normally, but just in case
        router.push('/signin');
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
        Confirm Your Account
      </h2>
      <p style={{ 
        color: 'rgba(255, 255, 255, 0.8)', 
        marginBottom: '1.5rem', 
        textAlign: 'center',
        fontSize: '0.875rem'
      }}>
        Please enter the verification code sent to your email.
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
            disabled={!!initialUsername || !!router.query.username}
            style={{
              width: '100%',
              padding: '0.75rem',
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              border: errors.username ? '1px solid #ff4d4d' : '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '0.375rem',
              color: 'white',
              fontSize: '0.875rem',
              opacity: (initialUsername || router.query.username) ? 0.7 : 1,
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
            htmlFor="code" 
            style={{ 
              display: 'block', 
              marginBottom: '0.5rem', 
              color: 'white', 
              fontSize: '0.875rem' 
            }}
          >
            Confirmation Code
          </label>
          <input
            id="code"
            type="text"
            {...register('code')}
            style={{
              width: '100%',
              padding: '0.75rem',
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              border: errors.code ? '1px solid #ff4d4d' : '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '0.375rem',
              color: 'white',
              fontSize: '0.875rem',
              letterSpacing: '0.25rem',
            }}
            placeholder="Enter 6-digit code"
            maxLength={6}
          />
          {errors.code && (
            <p style={{ color: '#ff4d4d', fontSize: '0.75rem', marginTop: '0.25rem' }}>
              {errors.code.message}
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
            marginTop: '1rem',
          }}
          onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.25)'}
          onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.15)'}
        >
          {isLoading ? 'Verifying...' : 'Verify Account'}
        </button>
      </form>
    </div>
  );
}
