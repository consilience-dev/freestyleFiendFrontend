import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { signInSchema, SignInFormData } from './schemas';
import { signIn } from '@/lib/auth';
import Link from 'next/link';
import { useRouter } from 'next/router';

// Import shadcn components
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardContent } from "@/components/ui/card";

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
    <div className="w-full max-w-md mx-auto">
      {/* Title outside the card */}
      <div className="text-center mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Create an account</h1>
        <p className="text-muted-foreground mt-1">
          Enter your email below to create your account
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
                type="email"
                placeholder="name@example.com"
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
            
            <Button 
              type="submit" 
              className="w-full bg-white text-black hover:bg-white/90"
              disabled={isLoading}
            >
              {isLoading ? "Signing in..." : "Sign In with Email"}
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
          
          <div className="mt-6 flex items-center text-xs text-muted-foreground">
            <div className="flex-grow border-t border-zinc-800"></div>
            <span className="mx-3 uppercase">or continue with</span>
            <div className="flex-grow border-t border-zinc-800"></div>
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
