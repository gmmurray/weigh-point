import { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';

import { api } from '../lib/api';
import { supabase } from '../lib/supabase';

export const useAuth = () => {
  const [isLoading, setIsLoading] = useState(true);
  const queryClient = useQueryClient();

  // Get current session
  const { data: session } = useQuery({
    queryKey: ['session'],
    queryFn: async () => {
      const { data } = await supabase.auth.getSession();
      return data.session;
    },
  });

  // Get or create profile
  const { data: profile, error: profileError } = useQuery({
    queryKey: ['profile'],
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
          // Profile doesn't exist, will create below
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
        // Clear all queries and create new anonymous profile
        queryClient.clear();
        queryClient.invalidateQueries({ queryKey: ['profile'] });
      }
    });

    return () => subscription.unsubscribe();
  }, [queryClient]);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const signInWithEmail = async (email: string) => {
    return supabase.auth.signInWithOtp({ email });
  };

  return {
    session,
    profile,
    user: session?.user || null,
    isLoading: isLoading || !profile,
    isAuthenticated: !!session,
    isAnonymous: profile?.is_anonymous || false,
    signOut,
    signInWithEmail,
    error: profileError,
  };
};
