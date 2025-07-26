import { EntryList } from '../components/EntryList';
import { GoalCard } from '../components/GoalCard';
import { GoalsAchievedCard } from '../components/GoalsAchievedCard';
import { WeightChart } from '../components/WeightChart';
import { AppHeader } from '../components/AppHeader';
import { useAuth } from '../hooks/useAuth';

export const Dashboard = () => {
  const { isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-base-100 flex items-center justify-center">
        <span className="loading loading-spinner loading-lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-base-100">
      <AppHeader showAddEntry />

      <div className="container mx-auto px-4 max-w-4xl">
        {/* Page Header */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-2">Dashboard</h2>
          <p className="text-base-content/70">
            Track your weight journey with precision
          </p>
        </div>

        {/* Main content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Chart - spans 2 columns on large screens */}
          <div className="lg:col-span-2">
            <WeightChart />
          </div>

          {/* Sidebar - spans 1 column */}
          <div className="lg:col-span-1 space-y-6">
            <GoalCard />
            <GoalsAchievedCard />
            <EntryList title="Recent Entries" limit={5} showViewAll />
          </div>
        </div>
      </div>
    </div>
  );
};
