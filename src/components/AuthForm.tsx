import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { Button, Input } from './ui';
import { useAuth } from '../hooks/useAuth';
import { FaTimesCircle } from 'react-icons/fa';

const authSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type AuthFormData = z.infer<typeof authSchema>;

interface AuthFormProps {
  mode: 'signin' | 'signup';
  redirectTo?: string;
}

export const AuthForm = ({
  mode,
  redirectTo = '/dashboard',
}: AuthFormProps) => {
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { signInWithPassword, signUpWithPassword } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<AuthFormData>({
    resolver: zodResolver(authSchema),
  });

  const onSubmit = async (data: AuthFormData) => {
    try {
      setError(null);

      const result =
        mode === 'signin'
          ? await signInWithPassword(data.email, data.password)
          : await signUpWithPassword(data.email, data.password);

      if (result.error) {
        setError(result.error.message);
        return;
      }

      // For sign up, we might need to show email confirmation message
      if (mode === 'signup' && result.data?.user && !result.data.session) {
        setError('Please check your email to confirm your account');
        return;
      }

      // Successful auth - redirect
      navigate(redirectTo, { replace: true });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'An unexpected error occurred',
      );
    }
  };

  const isSignUp = mode === 'signup';

  return (
    <div className="min-h-screen bg-base-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-base-100 rounded-lg shadow-xl border border-base-300 p-8">
          <div className="text-center mb-8">
            <Link to="/" className="inline-block mb-4">
              <h1 className="text-3xl font-bold">WeighPoint</h1>
            </Link>
            <h2 className="text-xl font-semibold mb-2">
              {isSignUp ? 'Create your account' : 'Welcome back'}
            </h2>
            <p className="text-base-content/70">
              {isSignUp
                ? 'Start tracking your weight journey with sync across devices'
                : 'Sign in to access your weight tracking data'}
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {error && (
              <div className="alert alert-error">
                <FaTimesCircle className="shrink-0 h-6 w-6" />
                <span>{error}</span>
              </div>
            )}

            <Input
              {...register('email')}
              type="email"
              label="Email address"
              placeholder="you@example.com"
              error={errors.email?.message}
              autoComplete="email"
            />

            <Input
              {...register('password')}
              type="password"
              label="Password"
              placeholder="••••••••"
              error={errors.password?.message}
              autoComplete={isSignUp ? 'new-password' : 'current-password'}
            />

            <Button type="submit" loading={isSubmitting} className="w-full">
              {isSignUp ? 'Create Account' : 'Sign In'}
            </Button>
          </form>

          <div className="text-center mt-6">
            <p className="text-sm text-base-content/60">
              {isSignUp
                ? 'Already have an account? '
                : "Don't have an account? "}
              <Link
                to={isSignUp ? '/auth/signin' : '/auth/signup'}
                className="text-primary hover:underline"
              >
                {isSignUp ? 'Sign in' : 'Create one'}
              </Link>
            </p>
          </div>

          <div className="text-center mt-4">
            <Link
              to="/"
              className="text-sm text-base-content/50 hover:underline"
            >
              ← Back to home
            </Link>
          </div>

          {isSignUp && (
            <div className="text-center mt-6">
              <p className="text-xs text-base-content/50">
                By creating an account, you agree to our terms and privacy
                policy.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
