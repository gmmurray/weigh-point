import { useActiveGoal, useCompleteGoal } from './useGoal';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type { CreateEntryInput } from '../types';
import { api } from '../lib/api';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';
import { useEffect } from 'react';

export const useEntries = (limit?: number) => {
  const queryClient = useQueryClient();
  const { profile } = useAuth();

  // Subscribe to real-time changes
  useEffect(() => {
    if (!profile) return () => {};

    const subscription = supabase
      .channel('entries')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'entries',
          filter: `user_id=eq.${profile.id}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['entries'] });
        },
      )
      .subscribe();

    return () => subscription.unsubscribe();
  }, [profile, profile.id, queryClient]);

  return useQuery({
    queryKey: ['entries', limit],
    queryFn: () => api.getEntries(limit),
    enabled: !!profile,
    select: data => data.data || [],
  });
};

export const useCreateEntry = () => {
  const queryClient = useQueryClient();
  const { data: activeGoal } = useActiveGoal();
  const completeGoal = useCompleteGoal();

  return useMutation({
    mutationFn: (entry: CreateEntryInput) => api.createEntry(entry),
    onSuccess: result => {
      queryClient.invalidateQueries({ queryKey: ['entries'] });

      // Check if this entry completes the active goal
      if (activeGoal && result.data) {
        const newEntry = result.data;
        const isLossGoal = activeGoal.start_weight > activeGoal.target_weight;
        const isGoalAchieved = isLossGoal
          ? newEntry.weight <= activeGoal.target_weight
          : newEntry.weight >= activeGoal.target_weight;

        if (isGoalAchieved) {
          completeGoal.mutate({
            goalId: activeGoal.id,
            entryId: newEntry.id,
          });
        }
      }
    },
  });
};

export const useUpdateEntry = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, weight }: { id: string; weight: number }) =>
      api.updateEntry(id, weight),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['entries'] });
    },
  });
};

export const useDeleteEntry = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => api.deleteEntry(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['entries'] });
    },
  });
};
