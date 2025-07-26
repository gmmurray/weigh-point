import type {
  CreateEntryInput,
  CreateGoalInput,
  UpdateProfileInput,
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

    // Instead of trying to change the profile ID, we'll transfer the data
    // from the anonymous profile to a new authenticated profile

    // 1. Create authenticated profile with auth user ID
    const { data: authProfile, error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: user.user.id,
        is_anonymous: false,
      })
      .select()
      .single();

    if (profileError) throw profileError;

    // 2. Transfer entries from anonymous to authenticated profile
    const { error: entriesError } = await supabase
      .from('entries')
      .update({ user_id: user.user.id })
      .eq('user_id', anonId);

    if (entriesError) {
      console.error('Failed to transfer entries:', entriesError);
    }

    // 3. Transfer goals from anonymous to authenticated profile
    const { error: goalsError } = await supabase
      .from('goals')
      .update({ user_id: user.user.id })
      .eq('user_id', anonId);

    if (goalsError) {
      console.error('Failed to transfer goals:', goalsError);
    }

    // 4. Delete the old anonymous profile
    const { error: deleteError } = await supabase
      .from('profiles')
      .delete()
      .eq('id', anonId);

    if (deleteError) {
      console.error('Failed to delete anonymous profile:', deleteError);
    }

    return { data: authProfile, error: null };
  },

  createAuthProfile: async (userId: string) => {
    return supabase
      .from('profiles')
      .insert({
        id: userId,
        is_anonymous: false,
      })
      .select()
      .single();
  },

  // Entries with smart defaults
  getEntries: (userId: string, limit?: number) =>
    supabase
      .from('entries')
      .select('*')
      .eq('user_id', userId)
      .order('recorded_at', { ascending: false })
      .limit(limit || 100),

  createEntry: (userId: string, entry: CreateEntryInput) =>
    supabase
      .from('entries')
      .insert({
        ...entry,
        user_id: userId,
        recorded_at: entry.recorded_at || new Date().toISOString(),
      })
      .select()
      .single(),

  updateEntry: (userId: string, id: string, weight: number) =>
    supabase
      .from('entries')
      .update({ weight })
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single(),

  deleteEntry: (userId: string, id: string) =>
    supabase.from('entries').delete().eq('id', id).eq('user_id', userId),

  // Goal management with celebration focus
  getActiveGoal: (userId: string) =>
    supabase
      .from('goals')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'active')
      .maybeSingle(),

  getCompletedGoals: (userId: string) =>
    supabase
      .from('goals')
      .select(
        `
        *,
        entries!goals_completed_entry_id_fkey(*)
      `,
      )
      .eq('user_id', userId)
      .eq('status', 'completed')
      .order('completed_at', { ascending: false }),

  setGoal: async (userId: string, goal: CreateGoalInput) => {
    // Get the user's latest entry for start_weight
    const { data: entries } = await supabase
      .from('entries')
      .select('weight')
      .eq('user_id', userId)
      .order('recorded_at', { ascending: false })
      .limit(1);

    // Require at least one entry to set a goal
    if (!entries || entries.length === 0) {
      throw new Error(
        'You must add at least one weight entry before setting a goal',
      );
    }

    const startWeight = entries[0].weight;

    if (startWeight === goal.target_weight) {
      throw new Error(
        'Target weight must be different from your current weight',
      );
    }

    return supabase
      .from('goals')
      .insert({
        ...goal,
        user_id: userId,
        start_weight: startWeight,
        status: 'active',
      })
      .select()
      .single();
  },

  completeGoal: (
    userId: string,
    goalId: string,
    entryId: string,
    completedAt: string,
  ) =>
    supabase
      .from('goals')
      .update({
        status: 'completed',
        completed_at: completedAt,
        completed_entry_id: entryId,
      })
      .eq('id', goalId)
      .eq('user_id', userId)
      .select()
      .single(),

  clearGoal: (userId: string, goalId: string) =>
    supabase.from('goals').delete().eq('id', goalId).eq('user_id', userId),

  // Profile
  getProfile: (userId: string) =>
    supabase.from('profiles').select('*').eq('id', userId).single(),

  updateProfile: (userId: string, updates: UpdateProfileInput) =>
    supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId)
      .select()
      .single(),
};
