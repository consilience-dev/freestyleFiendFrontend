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
      <div className="w-full max-w-md mx-auto">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold tracking-tight">Account Created!</h1>
          <p className="text-muted-foreground mt-2">
            Please check your email for a verification code to confirm your account.
          </p>
        </div>
        
        <Button 
          onClick={() => router.push('/confirm-signup')}
          className="w-full bg-white text-black hover:bg-white/90 mt-4"
        >
          Verify Your Account
        </Button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="text-center mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Create an account</h1>
        <p className="text-muted-foreground mt-1">
          Enter your details below to create your account
        </p>
      </div>
      
      <div className="w-full">
        <form onSubmit={handleSubmit(onSubmit)}>
          {serverError && (
            <div className="mb-4 bg-destructive/15 text-destructive px-4 py-3 rounded-md text-sm">
              {serverError}
            </div>
          )}
          
          <div className="space-y-4">
            <div>
              <Input
                id="username"
                type="text"
                placeholder="Username"
                {...register('username')}
                className={errors.username ? "border-destructive" : ""}
                disabled={isLoading}
              />
              {errors.username && (
                <p className="text-destructive text-xs mt-1">
                  {errors.username.message}
                </p>
              )}
            </div>
            
            <div>
              <Input
                id="email"
                type="email"
                placeholder="name@example.com"
                {...register('email')}
                className={errors.email ? "border-destructive" : ""}
                disabled={isLoading}
              />
              {errors.email && (
                <p className="text-destructive text-xs mt-1">
                  {errors.email.message}
                </p>
              )}
            </div>
            
            <div>
              <Input
                id="password"
                type="password"
                placeholder="Password"
                {...register('password')}
                className={errors.password ? "border-destructive" : ""}
                disabled={isLoading}
              />
              {errors.password && (
                <p className="text-destructive text-xs mt-1">
                  {errors.password.message}
                </p>
              )}
            </div>
            
            <div>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Confirm password"
                {...register('confirmPassword')}
                className={errors.confirmPassword ? "border-destructive" : ""}
                disabled={isLoading}
              />
              {errors.confirmPassword && (
                <p className="text-destructive text-xs mt-1">
                  {errors.confirmPassword.message}
                </p>
              )}
            </div>
            
            <Button 
              type="submit" 
              className="w-full bg-white text-black hover:bg-white/90"
              disabled={isLoading}
            >
              {isLoading ? "Creating account..." : "Sign Up with Email"}
            </Button>
          </div>
          
          <div className="mt-4 text-center text-xs text-muted-foreground">
            By clicking continue, you agree to our{' '}
            <Link href="/terms" className="text-primary underline-offset-4 hover:underline">
              Terms of Service
            </Link>{' '}
            and{' '}
            <Link href="/privacy" className="text-primary underline-offset-4 hover:underline">
              Privacy Policy
            </Link>
            .
          </div>
          
          <div className="mt-6 text-center text-sm text-muted-foreground">
            <span>Already have an account?</span>{' '}
            <Link
              href="/signin"
              className="text-primary underline-offset-4 hover:underline"
            >
              Sign in
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
