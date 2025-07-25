import { useState } from 'react';
import { Link } from 'react-router-dom';
import { format, differenceInDays } from 'date-fns';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button, Card, CardTitle, CardActions, Modal, Input } from './ui';
import { useSetGoal, useClearGoal } from '../hooks/useGoal';
import { useAuth } from '../hooks/useAuth';
import { goalSchema, type GoalFormData } from '../lib/validations';
import type { Goal, Entry } from '../types';

interface CompletedGoalCardProps {
  goal: Goal;
  completingEntry?: Entry;
}

export const CompletedGoalCard = ({
  goal,
  completingEntry,
}: CompletedGoalCardProps) => {
  const { profile } = useAuth();
  const setGoal = useSetGoal();
  const clearGoal = useClearGoal();

  const [showNewGoalModal, setShowNewGoalModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const unit = profile?.preferred_unit || 'lbs';
  const isLossGoal = goal.start_weight > goal.target_weight;

  // Calculate achievement details
  const actualWeight = completingEntry?.weight || goal.target_weight;
  const exceededBy = Math.abs(actualWeight - goal.target_weight);
  const isOverAchieved = isLossGoal
    ? actualWeight < goal.target_weight
    : actualWeight > goal.target_weight;

  // Calculate duration
  const startDate = new Date(goal.created_at);
  const completedDate = new Date(goal.completed_at!);
  const daysToComplete = differenceInDays(completedDate, startDate);

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'MMM d, yyyy');
  };

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<GoalFormData>({
    resolver: zodResolver(goalSchema),
    defaultValues: {
      target_date: format(
        new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days from now
        'yyyy-MM-dd',
      ),
    },
  });

  const handleNewGoal = () => {
    setShowNewGoalModal(true);
  };

  const onSubmitNewGoal = async (data: GoalFormData) => {
    try {
      await setGoal.mutateAsync(data);
      setShowNewGoalModal(false);
      reset();
    } catch (error) {
      console.error('Failed to set goal:', error);
    }
  };

  const handleClearGoal = async () => {
    try {
      await clearGoal.mutateAsync(goal.id);
      setShowDeleteModal(false);
    } catch (error) {
      console.error('Failed to clear goal:', error);
    }
  };

  return (
    <>
      <Card compact className="border-l-4 border-l-success bg-success/5">
        {/* Compact Celebration Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🎉</span>
            <div>
              <CardTitle className="text-lg text-success mb-0">
                Goal Achieved!
              </CardTitle>
              <div className="text-sm text-base-content/70">
                {formatDate(goal.completed_at!)} • {daysToComplete} days
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="font-semibold">
              {actualWeight} {unit}
            </div>
            <div className="text-xs text-base-content/70">
              Target: {goal.target_weight} {unit}
            </div>
          </div>
        </div>

        {/* Compact Progress Bar */}
        <div className="mb-4">
          <div className="w-full bg-base-300 rounded-full h-2 mb-1">
            <div className="bg-success h-2 rounded-full w-full" />
          </div>
          <div className="text-xs text-success text-center">
            {isOverAchieved
              ? `Exceeded by ${exceededBy.toFixed(1)} ${unit}`
              : 'Target reached'}
          </div>
        </div>

        {/* Compact Actions */}
        <CardActions>
          <Button onClick={handleNewGoal} size="sm" variant="outline">
            Set New Goal
          </Button>
          <Link to="/goals">
            <Button variant="ghost" size="sm">
              View History
            </Button>
          </Link>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowDeleteModal(true)}
            className="text-base-content/50"
          >
            Remove
          </Button>
        </CardActions>
      </Card>

      {/* New Goal Modal */}
      <Modal
        isOpen={showNewGoalModal}
        onClose={() => setShowNewGoalModal(false)}
        title="Set New Goal"
      >
        <p className="mb-4">
          Congratulations on achieving your goal! Ready to set a new challenge?
        </p>

        <form onSubmit={handleSubmit(onSubmitNewGoal)} className="space-y-4">
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
            error={errors.target_date?.message}
          />

          <div className="flex gap-2 pt-4">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setShowNewGoalModal(false)}
              className="flex-1"
            >
              Not Yet
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

      {/* Delete Confirmation */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Remove Achievement"
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
              Remove
            </Button>
          </>
        }
      >
        <p>
          Are you sure you want to remove this achievement from your history?
        </p>
        <p className="text-sm text-base-content/70 mt-2">
          This action cannot be undone.
        </p>
      </Modal>
    </>
  );
};
