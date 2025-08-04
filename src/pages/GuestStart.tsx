import { useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { FaExclamationTriangle, FaHome } from 'react-icons/fa';

export const GuestStart = () => {
  const navigate = useNavigate();
  const { profile, isLoading, error, hasConnectionError } = useAuth();

  useEffect(() => {
    if (!isLoading && profile) {
      // Guest profile created, redirect to dashboard
      navigate('/dashboard', { replace: true });
    }
  }, [profile, isLoading, navigate]);

  // Show error state if we can't connect
  if (hasConnectionError || (error && !isLoading)) {
    return (
      <div className="min-h-screen bg-base-100 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <FaExclamationTriangle className="h-16 w-16 text-error mx-auto mb-6" />
          <h1 className="text-2xl font-bold mb-4">Connection Error</h1>
          <p className="text-base-content/70 mb-6">
            Unable to connect to the database service. This usually means the
            local Supabase server isn't running.
          </p>
          <div className="space-y-4">
            <div className="bg-base-200 p-4 rounded-lg text-left">
              <p className="font-semibold mb-2">To fix this:</p>
              <ol className="list-decimal list-inside space-y-1 text-sm">
                <li>Make sure Docker is running</li>
                <li>
                  Run{' '}
                  <code className="bg-base-300 px-1 rounded">
                    npx supabase start
                  </code>
                </li>
                <li>Wait for all services to be ready</li>
                <li>Try again</li>
              </ol>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => window.location.reload()}
                className="btn btn-primary flex-1"
              >
                Try Again
              </button>
              <Link to="/" className="btn btn-outline flex-1">
                <FaHome className="mr-2" />
                Go Home
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-base-100 flex items-center justify-center">
      <div className="text-center">
        <span className="loading loading-spinner loading-lg mb-4" />
        <p className="text-base-content/70">Setting up your guest session...</p>
      </div>
    </div>
  );
};
