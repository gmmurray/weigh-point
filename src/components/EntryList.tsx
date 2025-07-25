import { useState } from 'react';
import { format } from 'date-fns';
import { Button, Card, CardTitle, Modal } from './ui';
import { useEntries, useDeleteEntry } from '../hooks/useEntries';
import { useAuth } from '../hooks/useAuth';
import type { Entry } from '../types';

interface EntryListProps {
  limit?: number;
}

export const EntryList = ({ limit = 5 }: EntryListProps) => {
  const { profile } = useAuth();
  const { data: entries, isLoading } = useEntries(limit);
  const deleteEntry = useDeleteEntry();
  const [deleteModal, setDeleteModal] = useState<Entry | null>(null);

  const formatWeight = (weight: number) => {
    const unit = profile?.preferred_unit || 'lbs';
    return `${weight} ${unit}`;
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'MMM d, yyyy h:mm a');
  };

  const handleDelete = async (entry: Entry) => {
    try {
      await deleteEntry.mutateAsync(entry.id);
      setDeleteModal(null);
    } catch (error) {
      console.error('Failed to delete entry:', error);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardTitle>Recent Entries</CardTitle>
        <div className="space-y-2">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="skeleton h-12 w-full" />
          ))}
        </div>
      </Card>
    );
  }

  if (!entries?.length) {
    return (
      <Card>
        <CardTitle>Recent Entries</CardTitle>
        <p className="text-base-content/70 text-center py-8">
          No entries yet. Add your first weight entry to get started!
        </p>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardTitle>Recent Entries</CardTitle>
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
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setDeleteModal(entry)}
                className="text-error hover:bg-error/10"
              >
                Delete
              </Button>
            </div>
          ))}
        </div>
      </Card>

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
    </>
  );
};
