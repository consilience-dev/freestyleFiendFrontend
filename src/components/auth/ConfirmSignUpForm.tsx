import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { confirmSignUpSchema, ConfirmSignUpFormData } from './schemas';
import { confirmSignUp } from '@/lib/auth';
import { useRouter } from 'next/router';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
    <Card className="w-full max-w-md mx-auto bg-background/30 backdrop-blur border-border">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl text-center font-bold">Confirm Account</CardTitle>
        <CardDescription className="text-center">
          Enter the verification code sent to your email
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
              disabled={!!initialUsername || !!router.query.username}
              placeholder="Enter your username"
              className={errors.username ? "border-destructive" : ""}
            />
            {errors.username && (
              <p className="text-destructive text-xs mt-1">
                {errors.username.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="code">
              Confirmation Code
            </Label>
            <Input
              id="code"
              type="text"
              {...register('code')}
              placeholder="Enter 6-digit code"
              maxLength={6}
              className={`tracking-widest ${errors.code ? "border-destructive" : ""}`}
            />
            {errors.code && (
              <p className="text-destructive text-xs mt-1">
                {errors.code.message}
              </p>
            )}
          </div>

          <Button
            type="submit"
            disabled={isLoading}
            className="w-full bg-white text-black hover:bg-white/90 mt-2"
          >
            {isLoading ? 'Verifying...' : 'Verify Account'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
