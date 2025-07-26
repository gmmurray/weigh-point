import { Link } from 'react-router-dom';
import { Card, CardTitle } from './ui';
import { useCompletedGoals } from '../hooks/useGoal';

export const GoalsAchievedCard = () => {
  const { data: completedGoals, isLoading } = useCompletedGoals();

  if (isLoading) {
    return (
      <Card>
        <div className="skeleton h-6 w-32 mb-4" />
        <div className="skeleton h-12 w-full" />
      </Card>
    );
  }

  const goalCount = completedGoals?.length || 0;

  if (goalCount === 0) {
    return (
      <Card>
        <CardTitle className="flex items-center gap-2">
          <span>🏆</span>
          Goals Achieved
        </CardTitle>
        <div className="text-center py-4">
          <div className="text-3xl font-bold text-base-content/50 mb-2">0</div>
          <p className="text-sm text-base-content/70">
            Complete your first goal to start building your achievement history!
          </p>
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <CardTitle className="flex items-center gap-2">
        <span>🏆</span>
        Goals Achieved
      </CardTitle>
      <div className="text-center py-4">
        <div className="text-4xl font-bold text-success mb-2">{goalCount}</div>
        <p className="text-sm text-base-content/70 mb-3">
          {goalCount === 1 ? 'Goal completed' : 'Goals completed'}
        </p>
        <Link
          to="/goals"
          className="text-sm text-primary hover:underline inline-flex items-center gap-1"
        >
          View Achievement Timeline
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            className="stroke-current w-4 h-4"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M9 5l7 7-7 7"
            />
          </svg>
        </Link>
      </div>
    </Card>
  );
};
