import { useState } from 'react';
import { formatDate as formatDateUtil } from '../lib/dateUtils';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button, Card, CardTitle, CardActions, Input, Modal } from './ui';
import { createGoalSchema, type GoalFormData } from '../lib/validations';
import {
  useActiveGoal,
  useCompletedGoals,
  useSetGoal,
  useClearGoal,
} from '../hooks/useGoal';
import { useEntries } from '../hooks/useEntries';
import { useAuth } from '../hooks/useAuth';
import { CompletedGoalCard } from './CompletedGoalCard';
import { FaCheckCircle, FaInfoCircle, FaTimesCircle } from 'react-icons/fa';

export const GoalCard = () => {
  const { profile } = useAuth();
  const { data: goal, isLoading: goalLoading } = useActiveGoal();
  const { data: completedGoals } = useCompletedGoals();
  const { data: entries } = useEntries(1); // Get latest entry for current weight
  const setGoal = useSetGoal();
  const clearGoal = useClearGoal();

  const [showGoalModal, setShowGoalModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const currentWeight = entries?.[0]?.weight;
  const unit = profile?.preferred_unit || 'lbs';

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<GoalFormData>({
    resolver: zodResolver(createGoalSchema(currentWeight)),
    defaultValues: {
      target_date: formatDateUtil.inputDate(
        new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days from now
      ),
    },
  });

  const onSubmit = async (data: GoalFormData) => {
    try {
      await setGoal.mutateAsync(data);
      setShowGoalModal(false);
      reset();
    } catch (error) {
      console.error('Failed to set goal:', error);
      // The error will be displayed in the UI via the mutation error state
    }
  };

  const handleClearGoal = async () => {
    if (!goal) return;
    try {
      await clearGoal.mutateAsync(goal.id);
      setShowDeleteModal(false);
    } catch (error) {
      console.error('Failed to clear goal:', error);
    }
  };

  const calculateProgress = () => {
    if (!goal || !currentWeight) return 0;

    const totalChange = Math.abs(goal.target_weight - goal.start_weight);
    const currentChange = Math.abs(currentWeight - goal.start_weight);

    if (totalChange === 0) return 100;

    // Calculate progress as percentage of distance covered
    const progress = (currentChange / totalChange) * 100;

    // Cap at 100% but allow display of over-achievement
    return Math.min(progress, 100);
  };

  const formatDate = (dateString: string) => {
    // For date-only strings (YYYY-MM-DD), treat as local date to avoid timezone offset
    if (dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
      const [year, month, day] = dateString.split('-').map(Number);
      const localDate = new Date(year, month - 1, day); // month is 0-indexed
      return formatDateUtil.mediumDate(localDate);
    }
    return formatDateUtil.mediumDate(dateString);
  };

  const getTodayDate = () => {
    return formatDateUtil.inputDate(new Date());
  };

  if (goalLoading) {
    return (
      <Card>
        <div className="skeleton h-6 w-32 mb-4" />
        <div className="skeleton h-12 w-full" />
      </Card>
    );
  }

  // PRIORITY 1: Show most recent completed goal (celebration first!)
  const mostRecentCompleted = completedGoals?.[0];
  if (mostRecentCompleted && !goal) {
    return (
      <CompletedGoalCard
        goal={mostRecentCompleted}
        completingEntry={mostRecentCompleted.entries}
      />
    );
  }

  if (!goal) {
    return (
      <>
        <Card>
          <CardTitle>Set Your Goal</CardTitle>
          {!currentWeight ? (
            <div className="alert alert-info mb-4">
              <FaInfoCircle className="shrink-0 w-6 h-6" />
              <div>
                <h3 className="font-bold">Add an entry first</h3>
                <div className="text-xs">
                  You need at least one weight entry before setting a goal.
                </div>
              </div>
            </div>
          ) : (
            <p className="text-base-content/70 mb-4">
              Define your target weight to track your progress and stay
              motivated.
            </p>
          )}
          <CardActions>
            <Button
              onClick={() => setShowGoalModal(true)}
              disabled={!currentWeight}
            >
              Set Goal
            </Button>
          </CardActions>
        </Card>

        <Modal
          isOpen={showGoalModal}
          onClose={() => setShowGoalModal(false)}
          title="Set Weight Goal"
        >
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {setGoal.error && (
              <div className="alert alert-error">
                <FaTimesCircle className="shrink-0 h-6 w-6" />
                <span>{setGoal.error.message}</span>
              </div>
            )}
            <Input
              {...register('target_weight', { valueAsNumber: true })}
              type="number"
              step="0.1"
              label={`Target Weight (${unit})`}
              placeholder="Enter your target weight"
              error={errors.target_weight?.message}
            />

            <Input
              {...register('target_date')}
              type="date"
              label="Target Date (Optional)"
              min={getTodayDate()}
              error={errors.target_date?.message}
            />

            <div className="flex gap-2 pt-4">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setShowGoalModal(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                loading={setGoal.isPending}
                className="flex-1"
              >
                Set Goal
              </Button>
            </div>
          </form>
        </Modal>
      </>
    );
  }

  const progress = calculateProgress();
  const isLossGoal = goal.start_weight > goal.target_weight;

  // Calculate remaining weight and goal status
  const remainingWeight = currentWeight
    ? Math.abs(currentWeight - goal.target_weight)
    : 0;
  const isGoalReached =
    currentWeight &&
    ((isLossGoal && currentWeight <= goal.target_weight) ||
      (!isLossGoal && currentWeight >= goal.target_weight));
  const isOverAchieved =
    currentWeight &&
    ((isLossGoal && currentWeight < goal.target_weight) ||
      (!isLossGoal && currentWeight > goal.target_weight));

  return (
    <>
      <Card>
        <div className="flex items-center justify-between mb-4">
          <CardTitle>Your Goal</CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowDeleteModal(true)}
            className="text-error hover:bg-error/10"
          >
            Clear
          </Button>
        </div>

        <div className="space-y-4">
          {/* Goal details */}
          <div className="flex justify-between items-center">
            <div>
              <div className="text-sm text-base-content/70">Target Weight</div>
              <div className="font-semibold text-lg">
                {goal.target_weight} {unit}
              </div>
            </div>
            {goal.target_date && (
              <div className="text-right">
                <div className="text-sm text-base-content/70">Target Date</div>
                <div className="font-semibold">
                  {formatDate(goal.target_date)}
                </div>
              </div>
            )}
          </div>

          {/* Progress bar */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium">Progress</span>
              <div className="text-right">
                <span
                  className={`text-sm font-medium ${
                    isGoalReached ? 'text-success' : 'text-base-content/70'
                  }`}
                >
                  {progress.toFixed(1)}%
                </span>
                {isGoalReached && (
                  <div className="text-xs text-success">
                    {isOverAchieved ? 'Goal exceeded!' : 'Goal reached!'}
                  </div>
                )}
              </div>
            </div>
            <div className="w-full bg-base-300 rounded-full h-3">
              <div
                className={`h-3 rounded-full transition-all duration-500 ${
                  isGoalReached ? 'bg-success' : 'bg-primary'
                }`}
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-4 pt-2">
            <div className="text-center">
              <div className="text-sm text-base-content/70">Starting</div>
              <div className="font-semibold">
                {goal.start_weight} {unit}
              </div>
            </div>
            <div className="text-center">
              <div className="text-sm text-base-content/70">
                {isGoalReached
                  ? isOverAchieved
                    ? 'Exceeded by'
                    : 'Goal reached!'
                  : isLossGoal
                    ? 'To Lose'
                    : 'To Gain'}
              </div>
              <div
                className={`font-semibold ${
                  isGoalReached ? 'text-success' : ''
                }`}
              >
                {isGoalReached && !isOverAchieved ? (
                  <FaCheckCircle className="text-success" />
                ) : (
                  `${remainingWeight.toFixed(1)} ${unit}`
                )}
              </div>
            </div>
          </div>
        </div>
      </Card>

      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Clear Goal"
        actions={
          <>
            <Button variant="ghost" onClick={() => setShowDeleteModal(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              loading={clearGoal.isPending}
              onClick={handleClearGoal}
              className="btn-error"
            >
              Clear Goal
            </Button>
          </>
        }
      >
        <p>Are you sure you want to clear your current goal?</p>
        <p className="text-sm text-base-content/70 mt-2">
          This action cannot be undone.
        </p>
      </Modal>
    </>
  );
};
