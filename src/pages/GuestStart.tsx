import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export const GuestStart = () => {
  const navigate = useNavigate();
  const { profile, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && profile) {
      // Guest profile created, redirect to dashboard
      navigate('/dashboard', { replace: true });
    }
  }, [profile, isLoading, navigate]);

  return (
    <div className="min-h-screen bg-base-100 flex items-center justify-center">
      <div className="text-center">
        <span className="loading loading-spinner loading-lg mb-4" />
        <p className="text-base-content/70">Setting up your guest session...</p>
      </div>
    </div>
  );
};
