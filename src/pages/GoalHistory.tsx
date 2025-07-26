import { Card, CardTitle } from '../components/ui';
import { differenceInDays, format } from 'date-fns';

import { AppHeader } from '../components/AppHeader';
import { GoalCard } from '../components/GoalCard';
import type { GoalWithEntry } from '../types';
import { useAuth } from '../hooks/useAuth';
import { useCompletedGoals } from '../hooks/useGoal';

interface GoalTimelineItemProps {
  goal: GoalWithEntry;
  unit: string;
}

const GoalTimelineItem = ({ goal, unit }: GoalTimelineItemProps) => {
  const isLossGoal = goal.start_weight > goal.target_weight;
  const totalChange = Math.abs(goal.target_weight - goal.start_weight);
  const completingEntry = goal.entries;
  const actualWeight = completingEntry?.weight || goal.target_weight;
  const exceededBy = Math.abs(actualWeight - goal.target_weight);
  const isOverAchieved = isLossGoal
    ? actualWeight < goal.target_weight
    : actualWeight > goal.target_weight;

  const startDate = new Date(goal.created_at);
  const completedDate = new Date(goal.completed_at!);
  // Add 1 to include both start and end days in the count
  const daysToComplete = Math.max(
    1,
    differenceInDays(completedDate, startDate) + 1,
  );

  return (
    <div className="flex gap-4 pb-6 last:pb-0 border-b last:border-b-0 border-base-300">
      {/* Timeline indicator */}
      <div className="flex flex-col items-center">
        <div className="w-3 h-3 bg-success rounded-full flex-shrink-0 mt-1" />
        <div className="w-px bg-base-300 flex-1 mt-2 last:hidden" />
      </div>

      {/* Achievement content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between mb-2">
          <div>
            <div className="font-semibold text-success flex items-center gap-2">
              <span>🎯</span>
              Goal Achieved
            </div>
            <div className="text-sm text-base-content/70">
              {format(completedDate, 'MMM d, yyyy')} • {daysToComplete} days
            </div>
          </div>
          <div className="text-right text-sm">
            <div className="font-semibold">
              {goal.start_weight} → {actualWeight} {unit}
            </div>
            <div className="text-base-content/70">
              Target: {goal.target_weight} {unit}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4 text-sm">
          <div className="bg-success/10 px-2 py-1 rounded">
            <span className="text-success font-medium">
              {isLossGoal ? 'Lost' : 'Gained'} {totalChange.toFixed(1)} {unit}
            </span>
          </div>
          {isOverAchieved && (
            <div className="bg-primary/10 px-2 py-1 rounded">
              <span className="text-primary font-medium">
                Exceeded by {exceededBy.toFixed(1)} {unit}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const AchievementStats = ({
  completedGoals,
  unit,
}: {
  completedGoals: GoalWithEntry[];
  unit: string;
}) => {
  if (!completedGoals.length) return null;

  const totalGoals = completedGoals.length;
  const totalWeightChange = completedGoals.reduce((sum, goal) => {
    return sum + Math.abs(goal.target_weight - goal.start_weight);
  }, 0);

  const averageDuration = Math.round(
    completedGoals.reduce((sum, goal) => {
      const start = new Date(goal.created_at);
      const end = new Date(goal.completed_at!);
      // Add 1 to include both start and end days in the count
      return sum + Math.max(1, differenceInDays(end, start) + 1);
    }, 0) / totalGoals,
  );

  return (
    <div className="grid grid-cols-3 gap-4 mb-6">
      <div className="text-center p-3 bg-success/5 rounded-lg border border-success/20">
        <div className="text-2xl font-bold text-success">{totalGoals}</div>
        <div className="text-xs text-base-content/70">Goals Achieved</div>
      </div>
      <div className="text-center p-3 bg-primary/5 rounded-lg border border-primary/20">
        <div className="text-2xl font-bold text-primary">
          {totalWeightChange.toFixed(0)}
        </div>
        <div className="text-xs text-base-content/70">Total {unit}</div>
      </div>
      <div className="text-center p-3 bg-secondary/5 rounded-lg border border-secondary/20">
        <div className="text-2xl font-bold text-secondary">
          {averageDuration}
        </div>
        <div className="text-xs text-base-content/70">Avg Days</div>
      </div>
    </div>
  );
};

export const GoalHistory = () => {
  const { profile, isLoading } = useAuth();
  const { data: completedGoals = [], isLoading: goalsLoading } =
    useCompletedGoals();

  const unit = profile?.preferred_unit || 'lbs';

  if (isLoading || goalsLoading) {
    return (
      <div className="min-h-screen bg-base-100">
        <AppHeader showAddEntry />

        <div className="container mx-auto px-4 max-w-4xl">
          {/* Page Header */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold">Goals</h2>
          </div>

          <div className="skeleton h-32 w-full mb-6" />
          <div className="skeleton h-8 w-48 mb-6" />
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="skeleton h-20 w-full" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-base-100">
      <AppHeader showAddEntry />

      <div className="container mx-auto px-4 max-w-4xl">
        {/* Page Header */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold">Goals</h2>
          <p className="text-base-content/70">
            Track your current goal and celebrate past achievements
          </p>
        </div>

        <div className="space-y-8">
          {/* Current Goal (or Goal Creation) */}
          <div>
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <span>🎯</span>
              Current Goal
            </h3>
            <GoalCard />
          </div>

          {/* Completed Goals Section */}
          {completedGoals?.length > 0 && (
            <>
              {/* Achievement Stats */}
              <AchievementStats completedGoals={completedGoals} unit={unit} />

              {/* Achievement Timeline */}
              <Card>
                <CardTitle className="mb-6 flex items-center gap-2">
                  <span>🏆</span>
                  Achievement Timeline
                </CardTitle>

                <div className="space-y-0">
                  {completedGoals.map(goal => (
                    <GoalTimelineItem key={goal.id} goal={goal} unit={unit} />
                  ))}
                </div>
              </Card>

              {/* Motivational footer */}
              <div className="text-center p-6 bg-success/5 rounded-lg border border-success/20">
                <div className="text-success font-semibold mb-2">
                  🎉 Every goal achieved is a victory worth celebrating!
                </div>
                <div className="text-sm text-base-content/70">
                  Keep up the amazing progress on your health journey.
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
