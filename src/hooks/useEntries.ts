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
    queryKey: ['entries', profile?.id, limit],
    queryFn: async () => {
      if (!profile?.id) return [];
      const result = await api.getEntries(profile.id, limit);
      return result.data || [];
    },
    enabled: !!profile?.id,
  });
};

export const useCreateEntry = () => {
  const queryClient = useQueryClient();
  const { profile } = useAuth();
  const { data: activeGoal } = useActiveGoal();
  const completeGoal = useCompleteGoal();

  return useMutation({
    mutationFn: async (entry: CreateEntryInput) => {
      if (!profile?.id) throw new Error('No user profile');
      const result = await api.createEntry(profile.id, entry);
      return result.data;
    },
    onSuccess: newEntry => {
      queryClient.invalidateQueries({ queryKey: ['entries'] });

      // Check if this entry completes the active goal
      if (activeGoal && newEntry) {
        // Safety check: ensure valid start weight
        if (activeGoal.start_weight <= 0) {
          console.warn('Invalid goal start weight, skipping completion check');
          return;
        }

        const isLossGoal = activeGoal.start_weight > activeGoal.target_weight;
        const isGoalAchieved = isLossGoal
          ? newEntry.weight <= activeGoal.target_weight
          : newEntry.weight >= activeGoal.target_weight;

        if (isGoalAchieved) {
          completeGoal.mutate({
            goalId: activeGoal.id,
            entryId: newEntry.id,
            completedAt: newEntry.recorded_at,
          });
        }
      }
    },
  });
};

export const useUpdateEntry = () => {
  const queryClient = useQueryClient();
  const { profile } = useAuth();

  return useMutation({
    mutationFn: async ({ id, weight }: { id: string; weight: number }) => {
      if (!profile?.id) throw new Error('No user profile');
      const result = await api.updateEntry(profile.id, id, weight);
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['entries'] });
    },
  });
};

export const useDeleteEntry = () => {
  const queryClient = useQueryClient();
  const { profile } = useAuth();

  return useMutation({
    mutationFn: async (id: string) => {
      if (!profile?.id) throw new Error('No user profile');
      const result = await api.deleteEntry(profile.id, id);
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['entries'] });
    },
  });
};
