import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { confirmSignUpSchema, ConfirmSignUpFormData } from './schemas';
import { confirmSignUp } from '@/lib/auth';
import { useRouter } from 'next/router';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

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
    <div style={{ width: '100%', backgroundColor: '#0f0f0f', padding: '2rem' }}>
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

      <form onSubmit={handleSubmit(onSubmit)}>
        <div style={{ marginBottom: '1rem' }}>
          <label 
            htmlFor="username" 
            style={{ 
              display: 'block', 
              marginBottom: '0.5rem', 
              fontSize: '0.875rem',
              color: 'rgba(255, 255, 255, 0.7)'
            }}
          >
            Username
          </label>
          <Input
            id="username"
            type="text"
            {...register('username')}
            disabled={!!initialUsername || !!router.query.username}
            placeholder="Enter your username"
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
          />
          {errors.username && (
            <p style={{
              color: 'rgb(220, 38, 38)',
              fontSize: '0.75rem',
              margin: '0.25rem 0 0.75rem 0'
            }}>
              {errors.username.message}
            </p>
          )}
        </div>

        <div style={{ marginBottom: '1.5rem' }}>
          <label 
            htmlFor="code" 
            style={{ 
              display: 'block', 
              marginBottom: '0.5rem', 
              fontSize: '0.875rem',
              color: 'rgba(255, 255, 255, 0.7)'
            }}
          >
            Confirmation Code
          </label>
          <Input
            id="code"
            type="text"
            {...register('code')}
            placeholder="Enter 6-digit code"
            style={{ 
              width: '100%', 
              padding: '0.75rem 1rem', 
              borderRadius: '0.375rem', 
              fontSize: '0.875rem', 
              border: errors.code ? '1px solid rgb(220, 38, 38)' : '1px solid rgba(255, 255, 255, 0.2)', 
              backgroundColor: 'rgba(17, 17, 17, 0.8)', 
              color: '#fff',
              boxSizing: 'border-box',
              margin: '0 0 0.5rem 0'
            }}
          />
          {errors.code && (
            <p style={{
              color: 'rgb(220, 38, 38)',
              fontSize: '0.75rem',
              margin: '0.25rem 0 0 0'
            }}>
              {errors.code.message}
            </p>
          )}
        </div>

        <Button 
          type="submit" 
          disabled={isLoading}
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
        >
          {isLoading ? "Verifying..." : "Verify Account"}
        </Button>
      </form>
    </div>
  );
}
