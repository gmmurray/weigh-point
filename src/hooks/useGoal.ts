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
  }, [profile, profile.id, queryClient]);

  return useQuery({
    queryKey: ['activeGoal'],
    queryFn: () => api.getActiveGoal(),
    enabled: !!profile,
    select: data => data.data,
  });
};

export const useCompletedGoals = () => {
  const { profile } = useAuth();

  return useQuery({
    queryKey: ['completedGoals'],
    queryFn: () => api.getCompletedGoals(),
    enabled: !!profile,
    select: data => data.data || [],
  });
};

export const useSetGoal = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (goal: CreateGoalInput) => api.setGoal(goal),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activeGoal'] });
    },
  });
};

export const useCompleteGoal = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ goalId, entryId }: { goalId: string; entryId: string }) =>
      api.completeGoal(goalId, entryId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activeGoal'] });
      queryClient.invalidateQueries({ queryKey: ['completedGoals'] });
    },
  });
};

export const useClearGoal = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (goalId: string) => api.clearGoal(goalId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activeGoal'] });
      queryClient.invalidateQueries({ queryKey: ['completedGoals'] });
    },
  });
};
