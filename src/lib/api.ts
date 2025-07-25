import type {
  CreateEntryInput,
  CreateGoalInput,
  UpdateProfileInput,
  GoalWithEntry,
} from '../types';

import { supabase } from './supabase';

export const api = {
  // Auth & Profile
  createAnonProfile: () => {
    const id = crypto.randomUUID();
    return supabase
      .from('profiles')
      .insert({
        id,
        is_anonymous: true,
      })
      .select()
      .single();
  },

  linkAnonToAuth: async (anonId: string) => {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) throw new Error('No authenticated user');

    return supabase
      .from('profiles')
      .update({
        id: user.user.id,
        is_anonymous: false,
      })
      .eq('id', anonId);
  },

  // Entries with smart defaults
  getEntries: (limit?: number) =>
    supabase
      .from('entries')
      .select('*')
      .order('recorded_at', { ascending: false })
      .limit(limit || 100),

  createEntry: async (entry: CreateEntryInput) => {
    // Get current user profile to determine user_id
    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .single();
    if (!profile) throw new Error('No user profile found');

    return supabase
      .from('entries')
      .insert({
        ...entry,
        user_id: profile.id,
        recorded_at: entry.recorded_at || new Date().toISOString(),
      })
      .select()
      .single();
  },

  updateEntry: (id: string, weight: number) =>
    supabase.from('entries').update({ weight }).eq('id', id).select().single(),

  deleteEntry: (id: string) => supabase.from('entries').delete().eq('id', id),

  // Goal management with celebration focus
  getActiveGoal: () =>
    supabase.from('goals').select('*').eq('status', 'active').maybeSingle(),

  getCompletedGoals: (): Promise<{
    data: GoalWithEntry[] | null;
    error: Error | null;
  }> =>
    supabase
      .from('goals')
      .select(
        `
        *,
        entries!goals_completed_entry_id_fkey(*)
      `,
      )
      .eq('status', 'completed')
      .order('completed_at', { ascending: false }),

  setGoal: async (goal: CreateGoalInput) => {
    // Get the user's latest entry for start_weight
    const { data: entries } = await supabase
      .from('entries')
      .select('weight')
      .order('recorded_at', { ascending: false })
      .limit(1);

    const startWeight = entries?.[0]?.weight || 0;

    return supabase
      .from('goals')
      .insert({
        ...goal,
        start_weight: startWeight,
        status: 'active',
      })
      .select()
      .single();
  },

  completeGoal: (goalId: string, entryId: string) =>
    supabase
      .from('goals')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        completed_entry_id: entryId,
      })
      .eq('id', goalId)
      .select()
      .single(),

  clearGoal: (goalId: string) =>
    supabase.from('goals').delete().eq('id', goalId),

  // Profile
  getProfile: () => supabase.from('profiles').select('*').single(),

  updateProfile: (updates: UpdateProfileInput) =>
    supabase.from('profiles').update(updates).select().single(),
};
