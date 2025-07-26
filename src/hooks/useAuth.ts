import { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { Session } from '@supabase/supabase-js';
import type { Profile } from '../types';

import { api } from '../lib/api';
import { supabase } from '../lib/supabase';

export const useAuth = () => {
  const [isLoading, setIsLoading] = useState(true);
  const queryClient = useQueryClient();

  // Get current session
  const { data: session } = useQuery<Session | null>({
    queryKey: ['session'],
    queryFn: async () => {
      const { data } = await supabase.auth.getSession();
      return data.session;
    },
  });

  // Get or create profile
  const { data: profile, error: profileError } = useQuery<Profile | null>({
    queryKey: ['profile', session?.user?.id],
    queryFn: async () => {
      // Check if we have a stored anonymous profile ID
      const storedAnonId = localStorage.getItem('weigh-point-anon-id');

      // If authenticated, get auth user profile
      if (session?.user) {
        try {
          const { data: existingProfile } = await api.getProfile(
            session.user.id,
          );
          if (existingProfile) {
            return existingProfile;
          }
        } catch {
          // Profile doesn't exist, need to create one
        }

        // If we reach here, authenticated user has no profile
        // Create a new authenticated profile
        try {
          const { data: newAuthProfile } = await api.createAuthProfile(
            session.user.id,
          );
          return newAuthProfile;
        } catch (createError) {
          console.error('Failed to create authenticated profile:', createError);
          throw createError;
        }
      }

      // If we have stored anon ID, try to get that profile
      if (storedAnonId && !session) {
        try {
          const { data: existingProfile } = await api.getProfile(storedAnonId);
          if (existingProfile && existingProfile.is_anonymous) {
            return existingProfile;
          }
        } catch {
          // Profile doesn't exist or isn't accessible
          localStorage.removeItem('weigh-point-anon-id');
        }
      }

      // Create new anonymous profile if no session
      if (!session) {
        const { data: newProfile, error: createError } =
          await api.createAnonProfile();
        if (createError) throw createError;

        // Store profile ID for persistence
        localStorage.setItem('weigh-point-anon-id', newProfile.id);
        return newProfile;
      }

      throw new Error('Unable to get or create profile');
    },
    retry: false,
    enabled: true, // Always enabled, the logic inside handles different states
  });

  // Initialize anonymous session on mount
  useEffect(() => {
    const initializeAuth = async () => {
      setIsLoading(true);

      // Check if we have a stored anonymous profile ID
      const storedAnonId = localStorage.getItem('weigh-point-anon-id');
      if (storedAnonId && !session) {
        // Verify the anonymous profile still exists
        const { data } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', storedAnonId)
          .eq('is_anonymous', true)
          .single();

        if (data) {
          queryClient.setQueryData(['profile'], data);
        } else {
          // Clean up invalid stored ID
          localStorage.removeItem('weigh-point-anon-id');
        }
      }

      setIsLoading(false);
    };

    initializeAuth();
  }, [session, queryClient]);

  // Listen for auth changes
  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      queryClient.setQueryData(['session'], session);

      if (event === 'SIGNED_IN' && session) {
        // Refetch profile when user signs in
        queryClient.invalidateQueries({ queryKey: ['profile'] });
      }

      if (event === 'SIGNED_OUT') {
        // Clear all queries on sign out
        queryClient.clear();
        // Don't automatically create a new anonymous profile
        // Let the user choose what they want to do next
      }
    });

    return () => subscription.unsubscribe();
  }, [queryClient]);

  const signOut = async () => {
    await supabase.auth.signOut();
    // Clear all local data and redirect to landing page
    localStorage.removeItem('weigh-point-anon-id');
    queryClient.clear();
    // Redirect to landing page
    window.location.href = '/';
  };

  const signInWithPassword = async (email: string, password: string) => {
    const result = await supabase.auth.signInWithPassword({ email, password });

    // If sign in successful, force refresh of session and profile
    if (result.data?.session && !result.error) {
      queryClient.setQueryData(['session'], result.data.session);
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    }

    return result;
  };

  const signUpWithPassword = async (email: string, password: string) => {
    const result = await supabase.auth.signUp({ email, password });

    // If successful and we have an anonymous profile, we need to migrate the data
    if (result.data?.user && !result.error && profile?.is_anonymous) {
      try {
        // For now, we'll keep it simple and just upgrade the anonymous profile in place
        // This means the profile ID stays the same, but is_anonymous becomes false
        await api.linkAnonToAuth(profile.id);

        // Clear the anonymous ID from localStorage since we're now authenticated
        localStorage.removeItem('weigh-point-anon-id');

        // Invalidate queries to refresh with authenticated profile
        queryClient.invalidateQueries({ queryKey: ['profile'] });
      } catch (linkError) {
        console.error('Failed to upgrade anonymous account:', linkError);
        // The auth succeeded but upgrade failed - user will have new auth account
        // without their anonymous data. We could improve this UX later.
      }
    }

    return result;
  };

  const signInWithEmail = async (email: string) => {
    return supabase.auth.signInWithOtp({ email });
  };

  return {
    session,
    profile,
    user: session?.user || null,
    isLoading: isLoading,
    isAuthenticated: !!session,
    isAnonymous: profile?.is_anonymous || false,
    signOut,
    signInWithPassword,
    signUpWithPassword,
    signInWithEmail,
    error: profileError,
  };
};
