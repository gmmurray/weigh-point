import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button, Input, Modal } from './ui';
import { useUpdateEntry } from '../hooks/useEntries';
import { useAuth } from '../hooks/useAuth';
import type { Entry } from '../types';

const editEntrySchema = z.object({
  weight: z
    .number()
    .min(1, 'Weight must be at least 1')
    .max(2000, 'Weight must be less than 2000'),
  recorded_at: z.string().min(1, 'Date and time are required'),
});

type EditEntryFormData = z.infer<typeof editEntrySchema>;

interface EditEntryModalProps {
  entry: Entry | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const EditEntryModal = ({
  entry,
  isOpen,
  onClose,
  onSuccess,
}: EditEntryModalProps) => {
  const { profile } = useAuth();
  const updateEntry = useUpdateEntry();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<EditEntryFormData>({
    resolver: zodResolver(editEntrySchema),
    values: entry
      ? {
          weight: entry.weight,
          // Convert ISO string to datetime-local format
          recorded_at: new Date(entry.recorded_at).toISOString().slice(0, 16),
        }
      : undefined,
  });

  const unit = profile?.preferred_unit || 'lbs';

  const onSubmit = async (data: EditEntryFormData) => {
    if (!entry) return;

    try {
      // Convert datetime-local back to ISO string
      const recordedAt = new Date(data.recorded_at).toISOString();

      await updateEntry.mutateAsync({
        id: entry.id,
        weight: data.weight,
        recorded_at: recordedAt,
      });

      onSuccess?.();
      onClose();
      reset();
    } catch (error) {
      console.error('Failed to update entry:', error);
    }
  };

  const handleClose = () => {
    onClose();
    reset();
  };

  if (!entry) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Edit Entry"
      actions={
        <>
          <Button variant="ghost" onClick={handleClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleSubmit(onSubmit)}
            loading={isSubmitting}
          >
            Save Changes
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          {...register('weight', { valueAsNumber: true })}
          type="number"
          step="0.1"
          label={`Weight (${unit})`}
          placeholder={`Enter weight in ${unit}`}
          error={errors.weight?.message}
          autoFocus
        />

        <Input
          {...register('recorded_at')}
          type="datetime-local"
          label="Date and Time"
          error={errors.recorded_at?.message}
        />

        <div className="text-xs text-base-content/60">
          <p>
            <strong>Tip:</strong> Make sure the date is accurate as it affects
            your weight journey timeline and goal completion tracking.
          </p>
        </div>
      </form>
    </Modal>
  );
};
