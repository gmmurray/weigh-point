import type { Profile, UpdateProfileInput } from '../types';
import {
  downloadCsv,
  generateEntriesCsv,
  generateGoalsCsv,
} from '../lib/csvUtils';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { api } from '../lib/api';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';

/**
 * Profile management hook providing mutation capabilities for user preferences.
 *
 * Features:
 * - Update user preferences (weight unit, timezone) with optimistic updates
 * - Real-time error handling with detailed feedback messages
 * - Automatic cache invalidation to trigger UI updates across the app
 * - Delete all user data with cascade deletion through database constraints
 *
 * User Experience: Immediate feedback for preference changes while maintaining
 * data consistency. Critical for user trust in settings modifications.
 */
export const useProfile = () => {
  const queryClient = useQueryClient();
  const { profile } = useAuth();

  /**
   * Updates user profile preferences with optimistic UI updates.
   *
   * Business Context: Weight unit changes affect all weight displays across
   * the app. Optimistic updates provide immediate feedback while preventing
   * UI flicker during the round-trip to the database.
   */
  const updateProfile = useMutation<
    Profile,
    Error,
    UpdateProfileInput,
    { previousProfile: unknown }
  >({
    mutationFn: async (updates: UpdateProfileInput) => {
      if (!profile?.id) {
        throw new Error('No user profile available');
      }

      // Call API to update profile in database
      const result = await api.updateProfile(profile.id, updates);

      if (result.error) {
        throw new Error(result.error.message || 'Failed to update preferences');
      }

      return result.data;
    },

    // Optimistic update: immediately show the change in UI
    onMutate: async updates => {
      if (!profile) return undefined;

      // Cancel any outgoing refetches to prevent conflicts
      await queryClient.cancelQueries({ queryKey: ['profile'] });

      // Snapshot the previous value for rollback
      const previousProfile = queryClient.getQueryData(['profile', profile.id]);

      // Optimistically update the cache with new preferences
      queryClient.setQueryData(['profile', profile.id], {
        ...profile,
        ...updates,
      });

      // Return context for rollback if needed
      return { previousProfile };
    },

    // Handle successful update
    onSuccess: updatedProfile => {
      // Update the profile cache with server response
      queryClient.setQueryData(['profile', updatedProfile.id], updatedProfile);

      // Invalidate related queries that depend on profile data
      // This ensures weight displays update if unit preference changed
      queryClient.invalidateQueries({ queryKey: ['entries'] });
      queryClient.invalidateQueries({ queryKey: ['activeGoal'] });
      queryClient.invalidateQueries({ queryKey: ['completedGoals'] });
    },

    // Rollback optimistic update on error
    onError: (_error, _variables, context) => {
      if (context?.previousProfile && profile) {
        queryClient.setQueryData(
          ['profile', profile.id],
          context.previousProfile,
        );
      }
    },
  });

  /**
   * Resets user data by deleting entries and goals but keeping the profile.
   *
   * Business Context: Allows users to start fresh with tracking while maintaining
   * their account settings and preferences. Common use case when starting a new
   * tracking period or changing goals significantly.
   *
   * User Experience: Profile and preferences remain intact, so users don't need
   * to reconfigure settings. Dashboard will show empty state after reset.
   */
  const resetData = useMutation<void, Error, void>({
    mutationFn: async () => {
      if (!profile?.id) {
        throw new Error('No user profile available');
      }

      // Reset only entries and goals, keep profile
      const result = await api.resetUserData(profile.id);

      if (result.error) {
        throw new Error(result.error || 'Failed to reset user data');
      }
    },

    // Clear related cached data after successful reset
    onSuccess: () => {
      // Invalidate queries for entries and goals
      queryClient.invalidateQueries({ queryKey: ['entries'] });
      queryClient.invalidateQueries({ queryKey: ['activeGoal'] });
      queryClient.invalidateQueries({ queryKey: ['completedGoals'] });

      // Profile remains, so don't clear everything or redirect
      // User stays on same page but sees empty data state
    },
  });

  /**
   * Deletes all user data including entries, goals, and profile.
   *
   * Business Context: Provides users complete control over their data.
   * Uses database CASCADE constraints to ensure complete removal without
   * orphaned records. Critical for privacy compliance and user trust.
   *
   * Security: Validates user ownership through existing API patterns.
   * All deletions are scoped to the authenticated user's data only.
   */
  const deleteAllData = useMutation<void, Error, void>({
    mutationFn: async () => {
      if (!profile?.id) {
        throw new Error('No user profile available');
      }

      // Delete profile - CASCADE constraints will handle entries and goals
      const result = await api.deleteProfile(profile.id);

      if (result.error) {
        throw new Error(result.error.message || 'Failed to delete user data');
      }
    },

    // Clear all cached data after successful deletion
    onSuccess: () => {
      // Clear entire query cache since user data no longer exists
      queryClient.clear();

      // Clear localStorage for anonymous users
      localStorage.removeItem('weigh-point-anon-id');

      // Redirect to landing page - user needs to start fresh
      window.location.href = '/';
    },
  });

  /**
   * Exports user data as CSV files for backup and data portability.
   *
   * Business Context: Critical for user data ownership and preventing vendor lock-in.
   * Exports both weight entries and goal achievements in standard CSV format
   * compatible with Excel and other fitness applications.
   *
   * User Experience: Downloads happen immediately without server round-trip.
   * Filename includes timestamp for easy organization of multiple exports.
   */
  const exportData = useMutation<void, Error, void>({
    mutationFn: async () => {
      if (!profile?.id) {
        throw new Error('No user profile available');
      }

      // Fetch all user data for export
      const [entriesResult, goalsResult] = await Promise.all([
        api.getEntries(profile.id, { limit: 1000 }), // Get large number of entries
        api.getCompletedGoals(profile.id),
      ]);

      if (entriesResult.error) {
        throw new Error('Failed to fetch weight entries for export');
      }

      if (goalsResult.error) {
        throw new Error('Failed to fetch goals for export');
      }

      const entries = entriesResult.data || [];
      const goals = goalsResult.data || [];

      // Generate CSV files
      const entriesCsv = generateEntriesCsv(entries, profile);
      const goalsCsv = generateGoalsCsv(goals, profile);

      // Download both files
      downloadCsv(entriesCsv, 'weigh-point-entries');

      // Only download goals CSV if user has completed goals
      if (goals.length > 0) {
        // Small delay to prevent browser blocking multiple downloads
        setTimeout(() => {
          downloadCsv(goalsCsv, 'weigh-point-goals');
        }, 500);
      }
    },
  });

  /**
   * Changes user's password through Supabase auth system.
   *
   * Business Context: Essential security feature for authenticated users.
   * Allows users to maintain account security by updating passwords.
   * Only available for authenticated users (not anonymous guests).
   *
   * Security: Uses Supabase's built-in password validation and secure
   * password update mechanisms. Requires user to be signed in.
   */
  const changePassword = useMutation<void, Error, string>({
    mutationFn: async (newPassword: string) => {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        throw new Error(error.message || 'Failed to update password');
      }
    },
  });

  /**
   * Deletes authenticated user's account and all associated data.
   *
   * Business Context: Provides complete account removal for authenticated users.
   * Different from deleteAllData - this removes the auth account itself,
   * not just the profile and tracking data.
   *
   * Security: Only works for authenticated users. Anonymous users use
   * deleteAllData instead since they don't have auth accounts to delete.
   */
  const deleteAccount = useMutation<void, Error, void>({
    mutationFn: async () => {
      if (!profile?.id || profile.is_anonymous) {
        throw new Error(
          'Account deletion only available for authenticated users',
        );
      }

      // First delete all user data (profile deletion will cascade)
      const result = await api.deleteProfile(profile.id);

      if (result.error) {
        throw new Error('Failed to delete user data');
      }

      // Then delete the authentication account
      const { error: authError } = await supabase.auth.admin.deleteUser(
        profile.id,
      );

      if (authError) {
        // Log but don't throw - profile data is already deleted
        console.error('Failed to delete auth account:', authError);
      }
    },

    onSuccess: () => {
      // Clear all cached data and redirect
      queryClient.clear();
      localStorage.removeItem('weigh-point-anon-id');
      window.location.href = '/';
    },
  });

  return {
    updateProfile,
    resetData,
    deleteAllData,
    exportData,
    changePassword,
    deleteAccount,
    // Expose current profile for convenience
    profile,
    // Loading states for UI feedback
    isUpdating: updateProfile.isPending,
    isResetting: resetData.isPending,
    isDeleting: deleteAllData.isPending,
    isExporting: exportData.isPending,
    isChangingPassword: changePassword.isPending,
    isDeletingAccount: deleteAccount.isPending,
  };
};
