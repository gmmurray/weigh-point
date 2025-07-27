import { Button, Card, CardTitle, Modal, Toast } from '../components/ui';

import { AppHeader } from '../components/AppHeader';
import { Link } from 'react-router-dom';
import { formatDate } from '../lib/dateUtils';
import { useAuth } from '../hooks/useAuth';
import { useProfile } from '../hooks/useProfile';
import { useToast } from '../hooks/useToast';
import { useForm } from 'react-hook-form';
import { useState } from 'react';
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
    deleteAllData,
    exportData,
    changePassword,
    deleteAccount,
    isUpdating,
    isDeleting,
    isExporting,
    isChangingPassword,
    isDeletingAccount,
  } = useProfile();
  const { toasts, success, error } = useToast();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [showAccountDeleteModal, setShowAccountDeleteModal] = useState(false);

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
   * Handles complete user data deletion with confirmation flow.
   *
   * Business Context: Provides users complete control over their data for
   * privacy compliance. Uses database CASCADE constraints to ensure no
   * orphaned records remain after deletion.
   *
   * User Experience: Modal confirmation prevents accidental deletion.
   * Operation is irreversible, so clear warning messaging is critical.
   */
  const handleDeleteAllData = async () => {
    try {
      await deleteAllData.mutateAsync();
      // Success handling (redirect to landing) is handled in useProfile
      setShowDeleteModal(false);
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : 'Failed to delete data. Please try again.';
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

  /**
   * Handles complete account deletion for authenticated users.
   *
   * Business Context: Provides complete account removal including auth
   * credentials. Different from data deletion - removes the entire account.
   *
   * User Experience: Modal confirmation prevents accidental deletion.
   * Operation is irreversible and includes all user data.
   */
  const handleDeleteAccount = async () => {
    try {
      await deleteAccount.mutateAsync();
      // Success handling (redirect) is handled in useProfile
      setShowAccountDeleteModal(false);
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : 'Failed to delete account. Please try again.';
      error(errorMessage);
      setShowAccountDeleteModal(false);
    }
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

              <Button type="submit" variant="primary" loading={isUpdating}>
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
                  loading={isDeleting}
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
                    onClick={() => setShowAccountDeleteModal(true)}
                    className="text-error border-error hover:bg-error/10"
                    loading={isDeletingAccount}
                  >
                    Delete Account
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
              loading={isDeleting}
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

      {/* Account Deletion Modal */}
      <Modal
        isOpen={showAccountDeleteModal}
        onClose={() => setShowAccountDeleteModal(false)}
        title="Delete Account"
        actions={
          <>
            <Button
              variant="ghost"
              onClick={() => setShowAccountDeleteModal(false)}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleDeleteAccount}
              className="btn-error"
              loading={isDeletingAccount}
            >
              Delete Account
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <p className="font-semibold text-error">
            This will permanently delete your entire account.
          </p>
          <ul className="list-disc list-inside space-y-1 text-sm">
            <li>Your email and authentication credentials will be removed</li>
            <li>All weight entries and goal history will be deleted</li>
            <li>This action cannot be undone</li>
            <li>
              You will need to create a new account to use WeighPoint again
            </li>
          </ul>
          <p className="text-sm text-base-content/70">
            <strong>Are you sure you want to proceed?</strong> This is different
            from deleting just your data - this removes your entire account.
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
    </div>
  );
};

export default Settings;
export { Settings }; // Keep named export for compatibility
