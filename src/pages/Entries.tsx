import { useState } from 'react';
import { Layout } from '../components/Layout';
import { Card, Pagination } from '../components/ui';
import { useEntries, useDeleteEntry } from '../hooks/useEntries';
import { useAuth } from '../hooks/useAuth';
import { formatDate as formatDateUtil } from '../lib/dateUtils';
import { Button, Modal } from '../components/ui';
import { EditEntryModal } from '../components/EditEntryModal';
import {
  getDateFilterOptions,
  getDefaultDateFilter,
  type DateFilterOption,
} from '../lib/dateFilters';
import type { Entry } from '../types';

const ENTRIES_PER_PAGE = 20;

const Entries = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [deleteModal, setDeleteModal] = useState<Entry | null>(null);
  const [editModal, setEditModal] = useState<Entry | null>(null);
  const [dateFilter, setDateFilter] = useState<DateFilterOption>(
    getDefaultDateFilter(),
  );
  const { profile } = useAuth();
  const deleteEntry = useDeleteEntry();

  const offset = (currentPage - 1) * ENTRIES_PER_PAGE;

  const { data, isLoading } = useEntries({
    limit: ENTRIES_PER_PAGE,
    offset,
    includeCount: true,
    dateFrom: dateFilter.dateFrom,
    dateTo: dateFilter.dateTo,
  });

  const entries = data?.entries || [];
  const totalCount = data?.totalCount || 0;
  const totalPages = Math.ceil(totalCount / ENTRIES_PER_PAGE);

  const formatWeight = (weight: number) => {
    const unit = profile?.preferred_unit || 'lbs';
    return `${weight} ${unit}`;
  };

  const formatDate = (dateString: string) => {
    return formatDateUtil.dateTime(dateString);
  };

  const handleDelete = async (entry: Entry) => {
    try {
      await deleteEntry.mutateAsync(entry.id);
      setDeleteModal(null);
      // If we deleted the last entry on this page and it's not page 1, go to previous page
      if (entries.length === 1 && currentPage > 1) {
        setCurrentPage(currentPage - 1);
      }
    } catch (error) {
      console.error('Failed to delete entry:', error);
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleDateFilterChange = (filterValue: string) => {
    const newFilter = getDateFilterOptions().find(f => f.value === filterValue);
    if (newFilter) {
      setDateFilter(newFilter);
      setCurrentPage(1); // Reset to first page when filter changes
    }
  };

  const dateFilterOptions = getDateFilterOptions();

  if (isLoading && currentPage === 1) {
    return (
      <Layout showAddEntry>
        <div className="mb-8">
          <h2 className="text-2xl font-bold">All Entries</h2>
        </div>
        <Card>
          <div className="space-y-2">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="skeleton h-12 w-full" />
            ))}
          </div>
        </Card>
      </Layout>
    );
  }

  return (
    <Layout showAddEntry>
      {/* Page Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">All Entries</h2>
            {totalCount > 0 && (
              <p className="text-base-content/70">
                {totalCount} {totalCount === 1 ? 'entry' : 'entries'}
                {dateFilter.value !== 'all' &&
                  ` (${dateFilter.label.toLowerCase()})`}
              </p>
            )}
          </div>

          {/* Date Filter Dropdown */}
          <div className="flex items-center gap-2">
            <label className="text-sm text-base-content/70">Filter:</label>
            <select
              className="select select-bordered select-sm"
              value={dateFilter.value}
              onChange={e => handleDateFilterChange(e.target.value)}
              disabled={isLoading}
            >
              {dateFilterOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Entries List */}
      {!entries.length ? (
        <Card>
          <p className="text-base-content/70 text-center py-8">
            {dateFilter.value === 'all'
              ? 'No entries yet. Add your first weight entry to get started!'
              : `No entries found for ${dateFilter.label.toLowerCase()}. Try a different time period or add new entries.`}
          </p>
        </Card>
      ) : (
        <div className="space-y-6">
          <Card>
            <div className="space-y-2">
              {entries.map((entry: Entry) => (
                <div
                  key={entry.id}
                  className="flex items-center justify-between p-3 bg-base-200 rounded-lg"
                >
                  <div>
                    <div className="font-semibold">
                      {formatWeight(entry.weight)}
                    </div>
                    <div className="text-sm text-base-content/70">
                      {formatDate(entry.recorded_at)}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setEditModal(entry)}
                      className="text-primary hover:bg-primary/10"
                    >
                      Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDeleteModal(entry)}
                      className="text-error hover:bg-error/10"
                      disabled={deleteEntry.isPending}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Pagination */}
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
            isLoading={isLoading}
          />
        </div>
      )}

      {/* Delete Modal */}
      <Modal
        isOpen={!!deleteModal}
        onClose={() => setDeleteModal(null)}
        title="Delete Entry"
        actions={
          <>
            <Button variant="ghost" onClick={() => setDeleteModal(null)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              loading={deleteEntry.isPending}
              onClick={() => deleteModal && handleDelete(deleteModal)}
              className="btn-error"
            >
              Delete
            </Button>
          </>
        }
      >
        <p>
          Are you sure you want to delete the entry for{' '}
          <strong>{deleteModal && formatWeight(deleteModal.weight)}</strong>?
        </p>
        <p className="text-sm text-base-content/70 mt-2">
          This action cannot be undone.
        </p>
      </Modal>

      {/* Edit Entry Modal */}
      <EditEntryModal
        entry={editModal}
        isOpen={!!editModal}
        onClose={() => setEditModal(null)}
        onSuccess={() => {
          // Modal will close automatically on success
          // Data will refresh via react-query invalidation
        }}
      />
    </Layout>
  );
};

export default Entries;
export { Entries }; // Keep named export for compatibility
