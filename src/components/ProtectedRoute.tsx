import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAuth?: boolean; // If true, requires authenticated user (not guest)
}

export const ProtectedRoute = ({
  children,
  requireAuth = false,
}: ProtectedRouteProps) => {
  const { isAuthenticated, profile, isLoading, session } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // If route requires authentication and user is not authenticated
    if (requireAuth && !isAuthenticated) {
      navigate('/auth/signin');
      return;
    }

    // If user has no session and no profile, redirect to landing
    if (!isLoading && !session && !profile) {
      navigate('/');
      return;
    }
  }, [isAuthenticated, profile, isLoading, session, navigate, requireAuth]);

  // Show loading while checking auth status
  if (isLoading) {
    return (
      <div className="min-h-screen bg-base-100 flex items-center justify-center">
        <span className="loading loading-spinner loading-lg" />
      </div>
    );
  }

  // If no session and no profile, don't render (will redirect)
  if (!session && !profile) {
    return null;
  }

  // If route requires auth but user is not authenticated, don't render
  if (requireAuth && !isAuthenticated) {
    return null;
  }

  return <>{children}</>;
};
