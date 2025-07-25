import type { Entry, Goal } from '../types';

import { useCompleteGoal } from './useGoal';

/**
 * Hook that monitors entries and automatically completes goals when achieved
 */
export const useGoalCompletion = () => {
  const completeGoal = useCompleteGoal();

  const checkGoalCompletion = (entry: Entry, goal: Goal) => {
    // Safety check: ensure valid goal data
    if (!goal.start_weight || goal.start_weight <= 0) {
      console.warn('Invalid goal start weight, cannot check completion');
      return;
    }

    const isLossGoal = goal.start_weight > goal.target_weight;
    const isGoalAchieved = isLossGoal
      ? entry.weight <= goal.target_weight
      : entry.weight >= goal.target_weight;

    if (isGoalAchieved) {
      completeGoal.mutate({
        goalId: goal.id,
        entryId: entry.id,
        completedAt: entry.recorded_at,
      });
    }
  };

  return {
    checkGoalCompletion,
    isCompletingGoal: completeGoal.isPending,
  };
};
