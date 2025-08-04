import { Button, Card, CardTitle, Modal, Toast } from '../components/ui';
import {
  FaChartBar,
  FaCog,
  FaInfoCircle,
  FaLock,
  FaUser,
} from 'react-icons/fa';

import { Layout } from '../components/Layout';
import { Link } from 'react-router-dom';
import { formatDate } from '../lib/dateUtils';
import { useAuth } from '../hooks/useAuth';
import { useForm } from 'react-hook-form';
import { useProfile } from '../hooks/useProfile';
import { useState } from 'react';
import { useToast } from '../hooks/useToast';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

const preferencesSchema = z.object({
  preferred_unit: z.enum(['lbs', 'kg']),
});

const passwordSchema = z
  .object({
    newPassword: z.string().min(6, 'Password must be at least 6 characters'),
    confirmPassword: z.string(),
  })
  .refine(data => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

type PreferencesFormData = z.infer<typeof preferencesSchema>;
type PasswordFormData = z.infer<typeof passwordSchema>;

/**
 * Settings page providing user account management and app preferences.
 *
 * Features:
 * - Account identity display with upgrade prompts for guest users
 * - Weight unit preferences (lbs/kg) with real-time form updates
 * - Data management: export/import tools and bulk deletion
 * - Security settings for authenticated users (password, account deletion)
 *
 * User Experience: Consolidated settings prevent UI fragmentation while
 * maintaining clear sections for different user types (guest vs authenticated).
 */
const Settings = () => {
  const { profile, user, isAuthenticated } = useAuth();
  const {
    updateProfile,
    resetData,
    deleteAllData,
    exportData,
    changePassword,
    deleteAccount,
    isUpdating,
    isResetting,
    isDeleting,
    isExporting,
    isChangingPassword,
    isDeletingAccount,
  } = useProfile();
  const { toasts, success, error } = useToast();
  const [showResetModal, setShowResetModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);

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

  const {
    register: registerPassword,
    handleSubmit: handleSubmitPassword,
    formState: { errors: passwordErrors },
    reset: resetPasswordForm,
  } = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
  });

  /**
   * Handles preference form submission with immediate UI feedback.
   *
   * Business Context: Weight unit changes affect all weight displays across
   * the application. Users expect immediate visual feedback when changing
   * their preferred unit to verify the setting took effect.
   *
   * User Experience: Form remains disabled during update to prevent duplicate
   * submissions. Success feedback is handled through optimistic updates in useProfile.
   */
  const onSubmitPreferences = async (data: PreferencesFormData) => {
    try {
      await updateProfile.mutateAsync(data);
      success('Preferences saved successfully!');
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : 'Failed to update preferences. Please try again.';
      error(errorMessage);
    }
  };

  /**
   * Handles data reset - clears entries and goals but keeps the account.
   *
   * Business Context: Allows users to start fresh while maintaining their
   * account preferences and settings. Common use case for new tracking periods.
   *
   * User Experience: Modal confirmation prevents accidental reset.
   * User stays logged in and remains on the same page after reset.
   */
  const handleResetData = async () => {
    try {
      await resetData.mutateAsync();
      success('Data reset successfully! You can start tracking fresh.');
      setShowResetModal(false);
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : 'Failed to reset data. Please try again.';
      error(errorMessage);
      setShowResetModal(false);
    }
  };

  /**
   * Handles complete account deletion with confirmation flow.
   *
   * Business Context: Provides complete account removal for all user types.
   * For guests, this deletes their profile. For authenticated users, this
   * removes both profile and auth account.
   *
   * User Experience: Modal confirmation prevents accidental deletion.
   * Operation is irreversible and redirects to landing page.
   */
  const handleDeleteAllData = async () => {
    try {
      if (profile?.is_anonymous) {
        // For guests, use deleteAllData (deletes profile)
        await deleteAllData.mutateAsync();
      } else {
        // For authenticated users, use deleteAccount (profile + auth)
        await deleteAccount.mutateAsync();
      }
      // Success handling (redirect to landing) is handled in useProfile
      setShowDeleteModal(false);
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : 'Failed to delete account. Please try again.';
      error(errorMessage);
      setShowDeleteModal(false);
    }
  };

  /**
   * Handles CSV data export with user feedback and error handling.
   *
   * Business Context: Data export provides users full control over their
   * weight tracking history. Essential for data portability and backup.
   *
   * User Experience: Modal provides clear explanation of what will be exported.
   * Multiple file downloads are handled with appropriate timing delays.
   */
  const handleExportData = async () => {
    try {
      await exportData.mutateAsync();
      success('Data exported successfully! Check your downloads folder.');
      setShowExportModal(false);
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : 'Failed to export data. Please try again.';
      error(errorMessage);
      setShowExportModal(false);
    }
  };

  /**
   * Handles password change with form validation and user feedback.
   *
   * Business Context: Essential security feature for authenticated users.
   * Allows users to update passwords for account security maintenance.
   *
   * User Experience: Form validation prevents weak passwords. Success
   * feedback confirms change while hiding the form to prevent confusion.
   */
  const onSubmitPasswordChange = async (data: PasswordFormData) => {
    try {
      await changePassword.mutateAsync(data.newPassword);
      success('Password updated successfully!');
      resetPasswordForm();
      setShowPasswordForm(false);
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : 'Failed to update password. Please try again.';
      error(errorMessage);
    }
  };

  if (!profile) {
    return (
      <Layout maxWidth="2xl">
        <div className="loading loading-spinner loading-lg mx-auto"></div>
      </Layout>
    );
  }

  const memberSince = profile.created_at
    ? formatDate.mediumDate(profile.created_at)
    : 'Unknown';

  return (
    <Layout maxWidth="4xl">
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
            <FaUser className="text-lg" />
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
                <FaInfoCircle className="shrink-0 w-6 h-6" />
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
            <FaCog className="text-lg" />
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

            <Button type="submit" variant="primary" loading={isUpdating}>
              Save Preferences
            </Button>
          </form>
        </Card>

        {/* Data Management Section */}
        <Card>
          <CardTitle className="mb-4 flex items-center gap-2">
            <FaChartBar className="text-lg" />
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
              <label className="btn btn-outline btn-sm cursor-pointer">
                <input
                  type="file"
                  accept=".csv"
                  className="hidden"
                  onChange={e => {
                    // TODO: Implement CSV import functionality
                    const file = e.target.files?.[0];
                    if (file) {
                      error(
                        'CSV import feature coming soon! Use export for now.',
                      );
                      e.target.value = ''; // Reset file input
                    }
                  }}
                />
                Import CSV
              </label>
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
                loading={isExporting}
              >
                Export
              </Button>
            </div>

            <div className="divider"></div>

            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-warning">Reset Data</div>
                <div className="text-sm text-base-content/70">
                  Clear all entries and goals, keep your account
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowResetModal(true)}
                className="text-warning border-warning hover:bg-warning/10"
                loading={isResetting}
              >
                Reset
              </Button>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-error">
                  {profile?.is_anonymous
                    ? 'Delete Guest Account'
                    : 'Delete Account'}
                </div>
                <div className="text-sm text-base-content/70">
                  {profile?.is_anonymous
                    ? 'Permanently delete your guest session and all data'
                    : 'Permanently delete your account and all data'}
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowDeleteModal(true)}
                className="text-error border-error hover:bg-error/10"
                loading={profile?.is_anonymous ? isDeleting : isDeletingAccount}
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
              <FaLock className="text-lg" />
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
                  onClick={() => setShowPasswordForm(!showPasswordForm)}
                >
                  {showPasswordForm ? 'Cancel' : 'Change Password'}
                </Button>
              </div>

              {showPasswordForm && (
                <form
                  onSubmit={handleSubmitPassword(onSubmitPasswordChange)}
                  className="space-y-4 p-4 bg-base-200 rounded-lg"
                >
                  <div>
                    <label className="label">
                      <span className="label-text">New Password</span>
                    </label>
                    <input
                      {...registerPassword('newPassword')}
                      type="password"
                      className="input input-bordered w-full"
                      placeholder="Enter new password"
                    />
                    {passwordErrors.newPassword && (
                      <div className="label">
                        <span className="label-text-alt text-error">
                          {passwordErrors.newPassword.message}
                        </span>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="label">
                      <span className="label-text">Confirm Password</span>
                    </label>
                    <input
                      {...registerPassword('confirmPassword')}
                      type="password"
                      className="input input-bordered w-full"
                      placeholder="Confirm new password"
                    />
                    {passwordErrors.confirmPassword && (
                      <div className="label">
                        <span className="label-text-alt text-error">
                          {passwordErrors.confirmPassword.message}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <Button
                      type="submit"
                      variant="primary"
                      size="sm"
                      loading={isChangingPassword}
                    >
                      Update Password
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setShowPasswordForm(false);
                        resetPasswordForm();
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              )}
            </div>
          </Card>
        )}
      </div>

      {/* Reset Data Modal */}
      <Modal
        isOpen={showResetModal}
        onClose={() => setShowResetModal(false)}
        title="Reset Data"
        actions={
          <>
            <Button variant="ghost" onClick={() => setShowResetModal(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleResetData}
              className="btn-warning"
              loading={isResetting}
            >
              Reset Data
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <p>
            Are you sure you want to reset all your weight entries and goals?
          </p>
          <ul className="list-disc list-inside space-y-1 text-sm">
            <li>All weight entries will be deleted</li>
            <li>All goals (active and completed) will be deleted</li>
            <li>Your account settings and preferences will be preserved</li>
            <li>You'll remain logged in and can start tracking fresh</li>
          </ul>
          <p className="text-sm text-base-content/70">
            <strong>This action cannot be undone.</strong> Consider exporting
            your data first for backup.
          </p>
        </div>
      </Modal>

      {/* Delete Account Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title={
          profile?.is_anonymous ? 'Delete Guest Account' : 'Delete Account'
        }
        actions={
          <>
            <Button variant="ghost" onClick={() => setShowDeleteModal(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleDeleteAllData}
              className="btn-error"
              loading={profile?.is_anonymous ? isDeleting : isDeletingAccount}
            >
              Delete Account
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <p className="font-semibold text-error">
            This will permanently delete your entire{' '}
            {profile?.is_anonymous ? 'guest session' : 'account'}.
          </p>
          <ul className="list-disc list-inside space-y-1 text-sm">
            {profile?.is_anonymous ? (
              <>
                <li>Your guest session will be permanently deleted</li>
                <li>All weight entries and goal history will be deleted</li>
                <li>This action cannot be undone</li>
                <li>You'll be redirected to the homepage to start fresh</li>
              </>
            ) : (
              <>
                <li>
                  Your email and authentication credentials will be removed
                </li>
                <li>All weight entries and goal history will be deleted</li>
                <li>This action cannot be undone</li>
                <li>
                  You will need to create a new account to use WeighPoint again
                </li>
              </>
            )}
          </ul>
          <p className="text-sm text-base-content/70">
            <strong>Are you sure you want to proceed?</strong> Consider using
            "Reset Data" instead if you want to keep your account.
          </p>
        </div>
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
            <Button
              variant="primary"
              onClick={handleExportData}
              loading={isExporting}
            >
              Download CSV
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <p>This will download your weight tracking data as CSV files:</p>
          <ul className="list-disc list-inside space-y-1 text-sm">
            <li>
              <strong>Weight Entries:</strong> All your recorded weights with
              dates and times
            </li>
            <li>
              <strong>Goal History:</strong> Your completed goals with
              achievement details (if any)
            </li>
          </ul>
          <p className="text-sm text-base-content/70">
            CSV files are compatible with Excel, Google Sheets, and other
            fitness apps. Use them to backup your data or analyze your progress.
          </p>
        </div>
      </Modal>

      {/* Toast Notifications */}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {toasts.map(toast => (
          <Toast
            key={toast.id}
            message={toast.message}
            type={toast.type}
            duration={toast.duration}
            onClose={toast.onClose}
          />
        ))}
      </div>
    </Layout>
  );
};

export default Settings;
export { Settings }; // Keep named export for compatibility
