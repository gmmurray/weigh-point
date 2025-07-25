import type { Entry, Goal } from '../types';

import { useCompleteGoal } from './useGoal';

/**
 * Hook that monitors entries and automatically completes goals when achieved
 */
export const useGoalCompletion = () => {
  const completeGoal = useCompleteGoal();

  const checkGoalCompletion = (entry: Entry, goal: Goal) => {
    const isLossGoal = goal.start_weight > goal.target_weight;
    const isGoalAchieved = isLossGoal
      ? entry.weight <= goal.target_weight
      : entry.weight >= goal.target_weight;

    if (isGoalAchieved) {
      completeGoal.mutate({
        goalId: goal.id,
        entryId: entry.id,
      });
    }
  };

  return {
    checkGoalCompletion,
    isCompletingGoal: completeGoal.isPending,
  };
};
