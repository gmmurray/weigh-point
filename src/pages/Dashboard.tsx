import { Layout } from '../components/Layout';
import { EntryList } from '../components/EntryList';
import { GoalCard } from '../components/GoalCard';
import { GoalsAchievedCard } from '../components/GoalsAchievedCard';
import { RecentEntryCard } from '../components/RecentEntryCard';
import { SummaryStatsCard } from '../components/SummaryStatsCard';
import { WeightChart } from '../components/WeightChart';
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
    <Layout showAddEntry>
      {/* Page Header */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold">Dashboard</h2>
      </div>

      {/* Quick Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
        <RecentEntryCard />
        <SummaryStatsCard />
        <GoalsAchievedCard />
      </div>

      {/* Main content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart and Entry List - spans 2 columns on large screens */}
        <div className="lg:col-span-2 space-y-6">
          <WeightChart />
          <EntryList title="Recent Entries" limit={5} showViewAll />
        </div>

        {/* Sidebar - spans 1 column */}
        <div className="lg:col-span-1">
          <GoalCard />
        </div>
      </div>
    </Layout>
  );
};
