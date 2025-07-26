import { Button, Modal } from './ui';

import { EntryForm } from './EntryForm';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useCompletedGoals } from '../hooks/useGoal';
import { useState } from 'react';

interface AppHeaderProps {
  title: string;
  subtitle?: string;
  showAddEntry?: boolean;
  showBackButton?: boolean;
  backTo?: string;
  backText?: string;
  showAchievements?: boolean;
  customActions?: React.ReactNode;
}

export const AppHeader = ({
  title,
  subtitle,
  showAddEntry = false,
  showBackButton = false,
  backTo = '/',
  backText,
  showAchievements = false,
  customActions,
}: AppHeaderProps) => {
  const { profile } = useAuth();
  const { data: completedGoals } = useCompletedGoals();
  const [showEntryModal, setShowEntryModal] = useState(false);

  const handleEntrySuccess = () => {
    setShowEntryModal(false);
  };

  return (
    <>
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1
              className={`font-bold ${title === 'WeighPoint' ? 'text-4xl' : 'text-3xl'}`}
            >
              {title}
            </h1>
            {subtitle && (
              <div className="flex items-center gap-4 mt-1">
                <p className="text-base-content/70">{subtitle}</p>
                {showAchievements &&
                  completedGoals &&
                  completedGoals.length > 0 && (
                    <Link
                      to="/goals"
                      className="text-sm text-primary hover:underline"
                    >
                      🏆 {completedGoals.length} goals achieved
                    </Link>
                  )}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            {showBackButton && (
              <Link to={backTo}>
                <Button variant="ghost" size="sm">
                  ← {backText ?? 'Back'}
                </Button>
              </Link>
            )}

            {customActions}

            {showAddEntry && (
              <Button
                variant="primary"
                onClick={() => setShowEntryModal(true)}
                className={title === 'WeighPoint' ? 'btn-lg' : ''}
              >
                Add Entry
              </Button>
            )}
          </div>
        </div>

        {/* Anonymous user alert */}
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
      </div>

      {/* Global Entry Modal */}
      <Modal
        isOpen={showEntryModal}
        onClose={() => setShowEntryModal(false)}
        title="Add Weight Entry"
      >
        <EntryForm onSuccess={handleEntrySuccess} />
      </Modal>
    </>
  );
};
