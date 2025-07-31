import { Button, Modal } from './ui';
import { Link, useLocation } from 'react-router-dom';

import { EntryForm } from './EntryForm';
import { useAuth } from '../hooks/useAuth';
import { useState } from 'react';
import {
  FaSignOutAlt,
  FaUser,
  FaInfoCircle,
  FaCog,
  FaBars,
  FaTimes,
  FaPlus,
} from 'react-icons/fa';

interface AppHeaderProps {
  showAddEntry?: boolean;
  customActions?: React.ReactNode;
}

export const AppHeader = ({
  showAddEntry = false,
  customActions,
}: AppHeaderProps) => {
  const { profile, user, signOut } = useAuth();
  const [showEntryModal, setShowEntryModal] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const location = useLocation();

  const handleEntrySuccess = () => {
    setShowEntryModal(false);
  };

  return (
    <>
      <header className="border-b border-base-300 bg-base-100">
        <div className="container mx-auto px-4 py-4 max-w-4xl">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-8">
              <Link to="/dashboard" className="flex items-center">
                <h1 className="font-bold text-2xl text-primary">WeighPoint</h1>
              </Link>

              {/* Navigation Links - Desktop */}
              <nav className="hidden md:flex items-center gap-6">
                <Link
                  to="/goals"
                  className={`px-3 py-2 rounded-lg text-sm font-medium hover:bg-base-200 transition-all ${
                    location.pathname === '/goals'
                      ? 'text-primary bg-primary/10 border border-primary/20'
                      : 'text-base-content/70 hover:text-base-content'
                  }`}
                >
                  Goals
                </Link>
                <Link
                  to="/entries"
                  className={`px-3 py-2 rounded-lg text-sm font-medium hover:bg-base-200 transition-all ${
                    location.pathname === '/entries'
                      ? 'text-primary bg-primary/10 border border-primary/20'
                      : 'text-base-content/70 hover:text-base-content'
                  }`}
                >
                  Entries
                </Link>
              </nav>
            </div>

            <div className="flex items-center gap-3">
              {/* Mobile Menu Button */}
              <button
                className="md:hidden btn btn-ghost btn-sm"
                onClick={() => setShowMobileMenu(!showMobileMenu)}
                aria-label="Toggle mobile menu"
              >
                {showMobileMenu ? <FaTimes /> : <FaBars />}
              </button>

              {/* User Menu */}
              <div className="dropdown dropdown-end">
                <div
                  tabIndex={0}
                  role="button"
                  className="flex items-center gap-2 p-2 rounded-lg hover:bg-base-200 cursor-pointer transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
                    <FaUser className="w-4 h-4 text-primary" />
                  </div>
                  <div className="hidden sm:block text-right">
                    <div className="text-sm font-medium text-base-content">
                      {profile?.is_anonymous
                        ? 'Guest'
                        : user?.email?.split('@')[0] || 'User'}
                    </div>
                    {!profile?.is_anonymous && (
                      <div className="text-xs text-base-content/60">
                        {user?.email}
                      </div>
                    )}
                  </div>
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
                          <FaInfoCircle className="w-4 h-4" />
                          <div>
                            <div>Create Account</div>
                            <div className="text-xs text-base-content/60">
                              Sync across devices
                            </div>
                          </div>
                        </Link>
                      </li>
                      <div className="divider my-1"></div>
                    </>
                  )}

                  <li>
                    <Link to="/settings">
                      <FaCog className="w-4 h-4" />
                      Settings
                    </Link>
                  </li>
                  {!profile?.is_anonymous && (
                    <>
                      <div className="divider my-1"></div>
                      <li>
                        <button onClick={signOut} className="text-error">
                          <FaSignOutAlt className="w-4 h-4" />
                          Sign Out
                        </button>
                      </li>
                    </>
                  )}
                </ul>
              </div>

              {customActions}

              {showAddEntry && (
                <Button
                  variant="primary"
                  onClick={() => setShowEntryModal(true)}
                  className="hidden md:flex shadow-lg hover:shadow-xl transition-shadow"
                >
                  + Add Entry
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {showMobileMenu && (
          <div className="border-t border-base-300">
            <div className="container mx-auto px-4 py-4 max-w-4xl">
              <nav className="flex flex-col gap-2">
                <Link
                  to="/goals"
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    location.pathname === '/goals'
                      ? 'text-primary bg-primary/10 border border-primary/20'
                      : 'text-base-content/70 hover:text-base-content hover:bg-base-200'
                  }`}
                  onClick={() => setShowMobileMenu(false)}
                >
                  Goals
                </Link>
                <Link
                  to="/entries"
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    location.pathname === '/entries'
                      ? 'text-primary bg-primary/10 border border-primary/20'
                      : 'text-base-content/70 hover:text-base-content hover:bg-base-200'
                  }`}
                  onClick={() => setShowMobileMenu(false)}
                >
                  Entries
                </Link>
              </nav>
            </div>
          </div>
        )}
      </header>

      {/* Floating Action Button - Mobile Only */}
      {showAddEntry && (
        <button
          onClick={() => setShowEntryModal(true)}
          className="md:hidden fixed bottom-6 right-6 z-50 w-14 h-14 bg-primary hover:bg-primary-focus text-primary-content rounded-full shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center active:scale-95"
          aria-label="Add Entry"
        >
          <FaPlus className="w-5 h-5" />
        </button>
      )}

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
