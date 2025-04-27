import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { forgotPasswordSchema, ForgotPasswordFormData } from './schemas';
import { forgotPassword } from '@/lib/auth';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

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
      <Card className="w-full max-w-md mx-auto bg-background/30 backdrop-blur border-border">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl text-center font-bold">Check Your Email</CardTitle>
          <CardDescription className="text-center">
            If an account exists with this username, we've sent a code to your email with instructions to reset your password.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Link 
            href={`/reset-password?username=${username}`}
            className="block w-full bg-white text-black hover:bg-white/90 py-3 px-4 rounded-md font-medium text-center transition-colors"
          >
            Reset Your Password
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto bg-background/30 backdrop-blur border-border">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl text-center font-bold">Forgot Password</CardTitle>
        <CardDescription className="text-center">
          Enter your username and we'll send you a code to reset your password.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {serverError && (
          <div className="bg-destructive/20 text-destructive-foreground px-4 py-3 rounded-md mb-4 text-sm">
            {serverError}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="username">
              Username
            </Label>
            <Input
              id="username"
              type="text"
              {...register('username')}
              placeholder="Enter your username"
              className={errors.username ? "border-destructive" : ""}
            />
            {errors.username && (
              <p className="text-destructive text-xs mt-1">
                {errors.username.message}
              </p>
            )}
          </div>

          <Button
            type="submit"
            disabled={isLoading}
            className="w-full bg-white text-black hover:bg-white/90 mt-2"
          >
            {isLoading ? 'Sending...' : 'Send Reset Code'}
          </Button>
          
          <div className="text-center text-sm text-muted-foreground mt-4">
            Remember your password?{' '}
            <Link 
              href="/signin" 
              className="text-foreground font-medium hover:underline"
            >
              Sign in
            </Link>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
