import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { resetPasswordSchema, ResetPasswordFormData } from './schemas';
import { confirmForgotPassword } from '@/lib/auth';
import { useRouter } from 'next/router';

interface ResetPasswordFormProps {
  username?: string;
}

/**
 * Reset Password form component with validation and error handling
 */
export function ResetPasswordForm({ username: initialUsername }: ResetPasswordFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      username: initialUsername || router.query.username as string || '',
      code: '',
      newPassword: '',
      confirmNewPassword: '',
    },
  });

  const onSubmit = async (data: ResetPasswordFormData) => {
    setIsLoading(true);
    setServerError(null);

    try {
      // Using AWS Amplify v6 confirmResetPassword API
      await confirmForgotPassword({
        username: data.username,
        confirmationCode: data.code,
        newPassword: data.newPassword,
      });
      
      // Redirect to sign in page after successful password reset
      router.push('/signin');
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
        Reset Your Password
      </h2>
      <p style={{ 
        color: 'rgba(255, 255, 255, 0.8)', 
        marginBottom: '1.5rem', 
        textAlign: 'center',
        fontSize: '0.875rem'
      }}>
        Enter the verification code sent to your email and create a new password.
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

        <div>
          <label 
            htmlFor="newPassword" 
            style={{ 
              display: 'block', 
              marginBottom: '0.5rem', 
              color: 'white', 
              fontSize: '0.875rem' 
            }}
          >
            New Password
          </label>
          <input
            id="newPassword"
            type="password"
            {...register('newPassword')}
            style={{
              width: '100%',
              padding: '0.75rem',
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              border: errors.newPassword ? '1px solid #ff4d4d' : '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '0.375rem',
              color: 'white',
              fontSize: '0.875rem',
            }}
            placeholder="Enter your new password"
          />
          {errors.newPassword && (
            <p style={{ color: '#ff4d4d', fontSize: '0.75rem', marginTop: '0.25rem' }}>
              {errors.newPassword.message}
            </p>
          )}
        </div>

        <div>
          <label 
            htmlFor="confirmNewPassword" 
            style={{ 
              display: 'block', 
              marginBottom: '0.5rem', 
              color: 'white', 
              fontSize: '0.875rem' 
            }}
          >
            Confirm New Password
          </label>
          <input
            id="confirmNewPassword"
            type="password"
            {...register('confirmNewPassword')}
            style={{
              width: '100%',
              padding: '0.75rem',
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              border: errors.confirmNewPassword ? '1px solid #ff4d4d' : '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '0.375rem',
              color: 'white',
              fontSize: '0.875rem',
            }}
            placeholder="Confirm your new password"
          />
          {errors.confirmNewPassword && (
            <p style={{ color: '#ff4d4d', fontSize: '0.75rem', marginTop: '0.25rem' }}>
              {errors.confirmNewPassword.message}
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
          {isLoading ? 'Resetting Password...' : 'Reset Password'}
        </button>
      </form>
    </div>
  );
}
