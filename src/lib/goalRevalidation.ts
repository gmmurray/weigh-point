import { api } from './api';
import type { Entry, Goal } from '../types';

/**
 * Goal revalidation utilities for maintaining goal completion accuracy.
 *
 * When entries are edited or deleted, goals that were completed by those entries
 * need to be revalidated to ensure the goal system remains accurate and trustworthy.
 *
 * Business Context: Users' achievements must remain accurate even when they
 * make retroactive changes to their weight tracking data.
 */

/**
 * Revalidates all goals that could be affected by entry changes.
 *
 * This function implements the goal revalidation algorithm documented in CLAUDE.md:
 * 1. Find goals completed by the modified/deleted entry
 * 2. For each affected goal, find all entries that could complete it
 * 3. Update goal status based on available qualifying entries
 *
 * @param userId - User ID for data filtering
 * @param affectedEntryId - ID of entry that was modified/deleted
 * @param modifiedEntry - The entry after modification (null if deleted)
 */
export const revalidateGoals = async (
  userId: string,
  affectedEntryId: string,
  modifiedEntry?: Entry | null,
): Promise<void> => {
  try {
    // Get all completed goals to check which ones might be affected
    const { data: completedGoals, error: goalsError } =
      await api.getCompletedGoals(userId);
    if (goalsError) {
      console.error(
        'Failed to fetch completed goals for revalidation:',
        goalsError,
      );
      return;
    }

    // Find goals that were completed by the affected entry
    const affectedGoals = (completedGoals || []).filter(
      goal => goal.completed_entry_id === affectedEntryId,
    );

    if (affectedGoals.length === 0) {
      // No goals were completed by this entry, nothing to revalidate
      return;
    }

    // Get all entries for revalidation logic
    const { data: allEntries, error: entriesError } = await api.getEntries(
      userId,
      { limit: 1000 },
    );
    if (entriesError) {
      console.error(
        'Failed to fetch entries for goal revalidation:',
        entriesError,
      );
      return;
    }

    const entries = allEntries || [];

    // Revalidate each affected goal
    for (const goal of affectedGoals) {
      await revalidateSingleGoal(userId, goal, entries, modifiedEntry);
    }
  } catch (error) {
    console.error('Goal revalidation failed:', error);
    // Don't throw - revalidation failure shouldn't block entry operations
  }
};

/**
 * Revalidates a single goal's completion status.
 *
 * @param userId - User ID for API calls
 * @param goal - Goal to revalidate
 * @param allEntries - All user entries for checking eligibility
 * @param modifiedEntry - Modified entry (null if deleted)
 */
const revalidateSingleGoal = async (
  userId: string,
  goal: Goal,
  allEntries: Entry[],
  modifiedEntry?: Entry | null,
): Promise<void> => {
  // Filter entries that could potentially complete this goal
  const eligibleEntries = allEntries.filter(entry => {
    // Skip the modified entry if it no longer exists or meets criteria
    if (entry.id === goal.completed_entry_id) {
      if (!modifiedEntry) {
        // Entry was deleted
        return false;
      }
      // Use modified entry data
      entry = modifiedEntry;
    }

    // Entry must be after goal creation (cannot retroactively complete goals)
    const entryDate = new Date(entry.recorded_at);
    const goalDate = new Date(goal.created_at);
    if (entryDate < goalDate) {
      return false;
    }

    // Entry must meet goal completion criteria
    const isLossGoal = goal.start_weight > goal.target_weight;
    const meetsGoal = isLossGoal
      ? entry.weight <= goal.target_weight
      : entry.weight >= goal.target_weight;

    return meetsGoal;
  });

  if (eligibleEntries.length === 0) {
    // No valid completing entries - revert goal to active
    await revertGoalToActive(userId, goal.id);
  } else {
    // Find earliest valid completing entry for accurate timeline
    const earliestEntry = eligibleEntries.sort(
      (a, b) =>
        new Date(a.recorded_at).getTime() - new Date(b.recorded_at).getTime(),
    )[0];

    // Check if goal completion details need updating
    const needsUpdate =
      goal.completed_entry_id !== earliestEntry.id ||
      goal.completed_at !== earliestEntry.recorded_at;

    if (needsUpdate) {
      await updateGoalCompletion(userId, goal.id, earliestEntry);
    }
  }
};

/**
 * Reverts a goal back to active status.
 */
const revertGoalToActive = async (
  userId: string,
  goalId: string,
): Promise<void> => {
  try {
    const { error } = await api.revertGoalToActive(userId, goalId);
    if (error) {
      console.error('Failed to revert goal to active:', error);
    }
  } catch (error) {
    console.error('Error reverting goal to active:', error);
  }
};

/**
 * Updates goal completion details with new completing entry.
 */
const updateGoalCompletion = async (
  userId: string,
  goalId: string,
  completingEntry: Entry,
): Promise<void> => {
  try {
    const { error } = await api.updateGoalCompletion(
      userId,
      goalId,
      completingEntry.id,
      completingEntry.recorded_at,
    );
    if (error) {
      console.error('Failed to update goal completion:', error);
    }
  } catch (error) {
    console.error('Error updating goal completion:', error);
  }
};
