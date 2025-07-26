import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type { CreateGoalInput } from '../types';
import { api } from '../lib/api';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';
import { useEffect } from 'react';

export const useActiveGoal = () => {
  const queryClient = useQueryClient();
  const { profile } = useAuth();

  // Subscribe to real-time changes
  useEffect(() => {
    if (!profile) return () => {};

    const subscription = supabase
      .channel('goals')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'goals',
          filter: `user_id=eq.${profile.id}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['activeGoal'] });
          queryClient.invalidateQueries({ queryKey: ['completedGoals'] });
        },
      )
      .subscribe();

    return () => subscription.unsubscribe();
  }, [profile, profile?.id, queryClient]);

  return useQuery({
    queryKey: ['activeGoal', profile?.id],
    queryFn: async () => {
      if (!profile?.id) return null;
      const result = await api.getActiveGoal(profile.id);
      return result.data;
    },
    enabled: !!profile?.id,
  });
};

export const useCompletedGoals = () => {
  const { profile } = useAuth();

  return useQuery({
    queryKey: ['completedGoals', profile?.id],
    queryFn: async () => {
      if (!profile?.id) return [];
      const result = await api.getCompletedGoals(profile.id);
      return result.data || [];
    },
    enabled: !!profile?.id,
  });
};

export const useSetGoal = () => {
  const queryClient = useQueryClient();
  const { profile } = useAuth();

  return useMutation({
    mutationFn: async (goal: CreateGoalInput) => {
      if (!profile?.id) throw new Error('No user profile');
      const result = await api.setGoal(profile.id, goal);
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activeGoal'] });
    },
  });
};

export const useCompleteGoal = () => {
  const queryClient = useQueryClient();
  const { profile } = useAuth();

  return useMutation({
    mutationFn: async ({
      goalId,
      entryId,
      completedAt,
    }: {
      goalId: string;
      entryId: string;
      completedAt: string;
    }) => {
      if (!profile?.id) throw new Error('No user profile');
      const result = await api.completeGoal(
        profile.id,
        goalId,
        entryId,
        completedAt,
      );
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activeGoal'] });
      queryClient.invalidateQueries({ queryKey: ['completedGoals'] });
    },
  });
};

export const useClearGoal = () => {
  const queryClient = useQueryClient();
  const { profile } = useAuth();

  return useMutation({
    mutationFn: async (goalId: string) => {
      if (!profile?.id) throw new Error('No user profile');
      const result = await api.clearGoal(profile.id, goalId);
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activeGoal'] });
      queryClient.invalidateQueries({ queryKey: ['completedGoals'] });
    },
  });
};
