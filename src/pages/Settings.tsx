import { Button, Card, CardTitle, Modal } from '../components/ui';

import { AppHeader } from '../components/AppHeader';
import { Link } from 'react-router-dom';
import { formatDate } from '../lib/dateUtils';
import { useAuth } from '../hooks/useAuth';
import { useForm } from 'react-hook-form';
import { useState } from 'react';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

const preferencesSchema = z.object({
  preferred_unit: z.enum(['lbs', 'kg']),
});

type PreferencesFormData = z.infer<typeof preferencesSchema>;

const Settings = () => {
  const { profile, user, isAuthenticated } = useAuth();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<PreferencesFormData>({
    resolver: zodResolver(preferencesSchema),
    defaultValues: {
      preferred_unit: profile?.preferred_unit || 'lbs',
    },
  });

  const onSubmitPreferences = async (data: PreferencesFormData) => {
    try {
      // TODO: Implement profile update API call
      console.log('Update preferences:', data);
    } catch (error) {
      console.error('Failed to update preferences:', error);
    }
  };

  const handleDeleteAllData = async () => {
    try {
      // TODO: Implement delete all data
      console.log('Delete all data');
      setShowDeleteModal(false);
    } catch (error) {
      console.error('Failed to delete data:', error);
    }
  };

  const handleExportData = () => {
    // TODO: Implement data export
    console.log('Export data as CSV');
    setShowExportModal(false);
  };

  if (!profile) {
    return (
      <div className="min-h-screen bg-base-100">
        <AppHeader />
        <div className="container mx-auto px-4 max-w-2xl">
          <div className="loading loading-spinner loading-lg mx-auto"></div>
        </div>
      </div>
    );
  }

  const memberSince = profile.created_at
    ? formatDate.mediumDate(profile.created_at)
    : 'Unknown';

  return (
    <div className="min-h-screen bg-base-100">
      <AppHeader />

      <div className="container mx-auto px-4 max-w-2xl">
        {/* Page Header */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold">Settings</h2>
          <p className="text-base-content/70">
            Manage your account and preferences
          </p>
        </div>

        <div className="space-y-6">
          {/* Account Section */}
          <Card>
            <CardTitle className="mb-4 flex items-center gap-2">
              <span>👤</span>
              Account
            </CardTitle>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">
                    {isAuthenticated ? user?.email : 'Guest User'}
                  </div>
                  <div className="text-sm text-base-content/70">
                    {isAuthenticated
                      ? `Member since ${memberSince}`
                      : `Guest since ${memberSince}`}
                  </div>
                </div>
                {profile.is_anonymous && (
                  <Link to="/auth/signup?redirect=/settings">
                    <Button variant="outline" size="sm">
                      Create Account
                    </Button>
                  </Link>
                )}
              </div>

              {profile.is_anonymous && (
                <div className="alert alert-info">
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
                    <h3 className="font-bold">Guest Mode</h3>
                    <div className="text-xs">
                      Your data is stored locally. Create an account to sync
                      across devices.
                    </div>
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* Preferences Section */}
          <Card>
            <CardTitle className="mb-4 flex items-center gap-2">
              <span>⚙️</span>
              Preferences
            </CardTitle>

            <form
              onSubmit={handleSubmit(onSubmitPreferences)}
              className="space-y-4"
            >
              <div>
                <label className="label">
                  <span className="label-text">Weight Unit</span>
                </label>
                <div className="flex gap-4">
                  <label className="label cursor-pointer">
                    <input
                      {...register('preferred_unit')}
                      type="radio"
                      value="lbs"
                      className="radio checked:bg-primary"
                    />
                    <span className="label-text ml-2">Pounds (lbs)</span>
                  </label>
                  <label className="label cursor-pointer">
                    <input
                      {...register('preferred_unit')}
                      type="radio"
                      value="kg"
                      className="radio checked:bg-primary"
                    />
                    <span className="label-text ml-2">Kilograms (kg)</span>
                  </label>
                </div>
                {errors.preferred_unit && (
                  <div className="label">
                    <span className="label-text-alt text-error">
                      {errors.preferred_unit.message}
                    </span>
                  </div>
                )}
              </div>

              <Button type="submit" variant="primary">
                Save Preferences
              </Button>
            </form>
          </Card>

          {/* Data Management Section */}
          <Card>
            <CardTitle className="mb-4 flex items-center gap-2">
              <span>📊</span>
              Data Management
            </CardTitle>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">Import Data</div>
                  <div className="text-sm text-base-content/70">
                    Import weight entries from CSV file
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  disabled
                  className="opacity-50"
                >
                  Coming Soon
                </Button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">Export Data</div>
                  <div className="text-sm text-base-content/70">
                    Download all your weight entries as CSV
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowExportModal(true)}
                  disabled
                  className="opacity-50"
                >
                  Coming Soon
                </Button>
              </div>

              <div className="divider"></div>

              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-error">Delete All Data</div>
                  <div className="text-sm text-base-content/70">
                    Permanently delete all entries and goals
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowDeleteModal(true)}
                  className="text-error border-error hover:bg-error/10"
                >
                  Delete
                </Button>
              </div>
            </div>
          </Card>

          {/* Security Section (Auth users only) */}
          {isAuthenticated && (
            <Card>
              <CardTitle className="mb-4 flex items-center gap-2">
                <span>🔒</span>
                Account Security
              </CardTitle>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">Change Password</div>
                    <div className="text-sm text-base-content/70">
                      Update your account password
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled
                    className="opacity-50"
                  >
                    Coming Soon
                  </Button>
                </div>

                <div className="divider"></div>

                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-error">Delete Account</div>
                    <div className="text-sm text-base-content/70">
                      Permanently delete your account and all data
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled
                    className="opacity-50 text-error border-error"
                  >
                    Coming Soon
                  </Button>
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* Delete Data Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Delete All Data"
        actions={
          <>
            <Button variant="ghost" onClick={() => setShowDeleteModal(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleDeleteAllData}
              className="btn-error"
            >
              Delete Everything
            </Button>
          </>
        }
      >
        <p>
          Are you sure you want to delete all your weight entries and goals?
        </p>
        <p className="text-sm text-base-content/70 mt-2">
          <strong>This action cannot be undone.</strong> All your data will be
          permanently removed.
        </p>
      </Modal>

      {/* Export Data Modal */}
      <Modal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        title="Export Data"
        actions={
          <>
            <Button variant="ghost" onClick={() => setShowExportModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleExportData}>
              Download CSV
            </Button>
          </>
        }
      >
        <p>
          This will download all your weight entries and goals as a CSV file.
        </p>
        <p className="text-sm text-base-content/70 mt-2">
          You can use this to backup your data or import it into other
          applications.
        </p>
      </Modal>
    </div>
  );
};

export default Settings;
export { Settings }; // Keep named export for compatibility
