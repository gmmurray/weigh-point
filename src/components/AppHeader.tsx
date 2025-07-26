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
  const { profile, user, signOut, isAuthenticated } = useAuth();
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
            <Link to="/dashboard" className="flex items-center">
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
            {/* User Menu */}
            <div className="dropdown dropdown-end">
              <div
                tabIndex={0}
                role="button"
                className={`w-8 h-8 rounded-full border flex items-center justify-center hover:opacity-80 cursor-pointer ${
                  isAuthenticated
                    ? 'bg-success/20 border-success/40'
                    : 'bg-warning/20 border-warning/40'
                }`}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  className={`w-4 h-4 ${
                    isAuthenticated ? 'stroke-success' : 'stroke-warning'
                  }`}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
              </div>
              <ul
                tabIndex={0}
                className="dropdown-content menu bg-base-100 rounded-box z-[1] w-52 p-2 shadow-lg border border-base-300"
              >
                <li className="menu-title">
                  <span>{user?.email || 'Guest User'}</span>
                </li>

                {/* Guest users get Create Account option */}
                {profile?.is_anonymous && (
                  <>
                    <li>
                      <Link
                        to="/auth/signup?redirect=/dashboard"
                        className="text-warning"
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
                        Create Account
                      </Link>
                    </li>
                    <div className="divider my-1"></div>
                  </>
                )}

                <li>
                  <Link to="/settings">
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
                        d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                    Settings
                  </Link>
                </li>
                <div className="divider my-1"></div>
                <li>
                  <button onClick={signOut} className="text-error">
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
                        d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                      />
                    </svg>
                    Sign Out
                  </button>
                </li>
              </ul>
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
