import type { CreateEntryInput, Entry } from '../types';
import { useActiveGoal, useCompleteGoal } from './useGoal';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { api } from '../lib/api';
import { revalidateGoals } from '../lib/goalRevalidation';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';
import { useEffect } from 'react';

interface UseEntriesOptions {
  limit?: number;
  offset?: number;
  includeCount?: boolean;
  dateFrom?: string;
  dateTo?: string;
}

interface EntriesResult {
  entries: Entry[];
  totalCount?: number | null;
}

export const useEntries = (options?: UseEntriesOptions | number) => {
  const queryClient = useQueryClient();
  const { profile } = useAuth();

  // Handle backward compatibility - if number passed, treat as limit
  const normalizedOptions: UseEntriesOptions =
    typeof options === 'number' ? { limit: options } : options || {};

  const {
    limit = 100,
    offset = 0,
    includeCount = false,
    dateFrom,
    dateTo,
  } = normalizedOptions;

  // Subscribe to real-time changes
  useEffect(() => {
    if (!profile) return () => {};

    const subscription = supabase
      .channel('wp_entries')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'wp_entries',
          filter: `user_id=eq.${profile.id}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['entries'] });
        },
      )
      .subscribe();

    return () => subscription.unsubscribe();
  }, [profile, profile?.id, queryClient]);

  return useQuery<EntriesResult>({
    queryKey: [
      'entries',
      profile?.id,
      limit,
      offset,
      includeCount,
      dateFrom,
      dateTo,
    ],
    queryFn: async () => {
      if (!profile?.id) return { entries: [] };

      // Fetch entries and optionally count in parallel
      const promises = [
        api.getEntries(profile.id, { limit, offset, dateFrom, dateTo }),
      ];

      if (includeCount) {
        promises.push(api.getEntriesCount(profile.id, { dateFrom, dateTo }));
      }

      const results = await Promise.all(promises);
      const entriesResult = results[0];
      const countResult = results[1] as (typeof results)[0] | undefined;

      return {
        entries: entriesResult.data || [],
        totalCount: includeCount ? (countResult?.count ?? null) : undefined,
      };
    },
    enabled: !!profile?.id,
  });
};

export const useCreateEntry = () => {
  const queryClient = useQueryClient();
  const { profile } = useAuth();
  const { data: activeGoal } = useActiveGoal();
  const completeGoal = useCompleteGoal();

  return useMutation<Entry, Error, CreateEntryInput>({
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
    mutationFn: async ({
      id,
      weight,
      recorded_at,
    }: {
      id: string;
      weight: number;
      recorded_at?: string;
    }) => {
      if (!profile?.id) throw new Error('No user profile');
      const updates = { weight, ...(recorded_at && { recorded_at }) };
      const result = await api.updateEntry(profile.id, id, updates);
      return { updatedEntry: result.data, entryId: id };
    },
    onSuccess: async ({ updatedEntry, entryId }) => {
      // Invalidate queries first for immediate UI update
      queryClient.invalidateQueries({ queryKey: ['entries'] });
      queryClient.invalidateQueries({ queryKey: ['activeGoal'] });
      queryClient.invalidateQueries({ queryKey: ['completedGoals'] });

      // Trigger goal revalidation in background
      if (profile?.id && updatedEntry) {
        try {
          await revalidateGoals(profile.id, entryId, updatedEntry);
          // Invalidate goal queries again after revalidation
          queryClient.invalidateQueries({ queryKey: ['activeGoal'] });
          queryClient.invalidateQueries({ queryKey: ['completedGoals'] });
        } catch (error) {
          console.error('Goal revalidation failed after entry update:', error);
        }
      }
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
      return { result: result.data, deletedEntryId: id };
    },
    onSuccess: async ({ deletedEntryId }) => {
      // Invalidate queries first for immediate UI update
      queryClient.invalidateQueries({ queryKey: ['entries'] });
      queryClient.invalidateQueries({ queryKey: ['activeGoal'] });
      queryClient.invalidateQueries({ queryKey: ['completedGoals'] });

      // Trigger goal revalidation in background
      if (profile?.id) {
        try {
          await revalidateGoals(profile.id, deletedEntryId, null);
          // Invalidate goal queries again after revalidation
          queryClient.invalidateQueries({ queryKey: ['activeGoal'] });
          queryClient.invalidateQueries({ queryKey: ['completedGoals'] });
        } catch (error) {
          console.error(
            'Goal revalidation failed after entry deletion:',
            error,
          );
        }
      }
    },
  });
};
