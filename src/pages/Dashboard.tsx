import { Button, Modal } from '../components/ui';

import { EntryForm } from '../components/EntryForm';
import { EntryList } from '../components/EntryList';
import { GoalCard } from '../components/GoalCard';
import { Link } from 'react-router-dom';
import { WeightChart } from '../components/WeightChart';
import { useAuth } from '../hooks/useAuth';
import { useCompletedGoals } from '../hooks/useGoal';
import { useState } from 'react';

export const Dashboard = () => {
  const { profile, isLoading } = useAuth();
  const { data: completedGoals } = useCompletedGoals();
  const [showEntryModal, setShowEntryModal] = useState(false);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-base-100 flex items-center justify-center">
        <span className="loading loading-spinner loading-lg" />
      </div>
    );
  }

  const handleEntrySuccess = () => {
    setShowEntryModal(false);
  };

  return (
    <div className="min-h-screen bg-base-100">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold">WeighPoint</h1>
            <div className="flex items-center gap-4 mt-1">
              <p className="text-base-content/70">
                Track your weight journey with precision
              </p>
              {completedGoals && completedGoals.length > 0 && (
                <Link
                  to="/goals"
                  className="text-sm text-primary hover:underline"
                >
                  🏆 {completedGoals.length} goals achieved
                </Link>
              )}
            </div>
          </div>

          <Button
            variant="primary"
            onClick={() => setShowEntryModal(true)}
            className="btn-lg"
          >
            Add Entry
          </Button>
        </div>

        {/* Status indicator for anonymous users */}
        {profile?.is_anonymous && (
          <div className="alert alert-info mb-6">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              className="stroke-current shrink-0 w-6 h-6"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <div>
              <h3 className="font-bold">Anonymous Mode</h3>
              <div className="text-xs">
                Your data is stored locally. Sign up to sync across devices.
              </div>
            </div>
          </div>
        )}

        {/* Main content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Chart - spans 2 columns on large screens */}
          <div className="lg:col-span-2">
            <WeightChart />
          </div>

          {/* Sidebar - spans 1 column */}
          <div className="lg:col-span-1 space-y-6">
            <GoalCard />
            <EntryList title="Recent Entries" limit={5} showViewAll />
          </div>
        </div>

        {/* Entry modal */}
        <Modal
          isOpen={showEntryModal}
          onClose={() => setShowEntryModal(false)}
          title="Add Weight Entry"
        >
          <EntryForm onSuccess={handleEntrySuccess} />
        </Modal>
      </div>
    </div>
  );
};
