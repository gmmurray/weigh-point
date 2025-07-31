import { Card } from './ui';
import { Link } from 'react-router-dom';
import { useCompletedGoals } from '../hooks/useGoal';

export const GoalsAchievedCard = () => {
  const { data: completedGoals, isLoading } = useCompletedGoals();

  if (isLoading) {
    return (
      <Card>
        <div className="flex flex-col justify-center h-full">
          <div className="skeleton h-8 w-16 mb-1" />
          <div className="skeleton h-4 w-20" />
        </div>
      </Card>
    );
  }

  const goalCount = completedGoals?.length || 0;

  if (goalCount === 0) {
    return (
      <Card>
        <div className="flex flex-col justify-center h-full">
          <div className="text-2xl font-bold text-base-content/50 mb-1">0</div>
          <div className="text-xs text-base-content/70">Goals Achieved</div>
          <div className="text-xs text-base-content/60 mt-1">
            Complete your first goal!
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <div className="flex flex-col justify-center h-full">
        <div className="text-2xl font-bold text-success mb-1">{goalCount}</div>
        <div className="text-xs text-base-content/70">Goals Achieved</div>
        <Link to="/goals" className="text-xs text-primary hover:underline mt-1">
          View Timeline
        </Link>
      </div>
    </Card>
  );
};
