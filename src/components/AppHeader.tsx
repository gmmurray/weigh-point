import { Button, Modal } from './ui';
import { Link, useLocation } from 'react-router-dom';

import { EntryForm } from './EntryForm';
import { useAuth } from '../hooks/useAuth';
import { useState } from 'react';

interface AppHeaderProps {
  showAddEntry?: boolean;
  customActions?: React.ReactNode;
}

export const AppHeader = ({
  showAddEntry = false,
  customActions,
}: AppHeaderProps) => {
  const { profile } = useAuth();
  const [showEntryModal, setShowEntryModal] = useState(false);
  const location = useLocation();

  const handleEntrySuccess = () => {
    setShowEntryModal(false);
  };

  return (
    <>
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-8">
            <Link to="/" className="flex items-center">
              <div>
                <h1 className="font-bold text-3xl">WeighPoint</h1>
                <p className="text-sm text-base-content/60 -mt-1">
                  Track your weight journey with precision
                </p>
              </div>
            </Link>

            {/* Navigation Links */}
            <nav className="flex items-center gap-6">
              <Link
                to="/goals"
                className={`text-sm font-medium hover:text-primary transition-colors ${
                  location.pathname === '/goals'
                    ? 'text-primary'
                    : 'text-base-content/70'
                }`}
              >
                Goals
              </Link>
              <Link
                to="/entries"
                className={`text-sm font-medium hover:text-primary transition-colors ${
                  location.pathname === '/entries'
                    ? 'text-primary'
                    : 'text-base-content/70'
                }`}
              >
                Entries
              </Link>
            </nav>
          </div>

          <div className="flex items-center gap-3">
            {/* User Status */}
            <div className="flex items-center gap-2">
              {profile?.is_anonymous ? (
                <Button
                  variant="ghost"
                  size="sm"
                  className="bg-warning/10 border border-warning/30 hover:bg-warning/20 text-warning px-3 py-1 h-auto gap-2"
                >
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
                      d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <span className="text-xs font-medium">Sign Up to Sync</span>
                </Button>
              ) : (
                <div className="w-8 h-8 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    className="stroke-primary w-4 h-4"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                </div>
              )}
            </div>

            {customActions}

            {showAddEntry && (
              <Button variant="primary" onClick={() => setShowEntryModal(true)}>
                Add Entry
              </Button>
            )}
          </div>
        </div>
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
