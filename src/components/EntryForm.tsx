import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useRef } from 'react';
import { Button, Input } from './ui';
import { entrySchema, type EntryFormData } from '../lib/validations';
import { useCreateEntry } from '../hooks/useEntries';

interface EntryFormProps {
  onSuccess?: () => void;
}

export const EntryForm = ({ onSuccess }: EntryFormProps) => {
  const createEntry = useCreateEntry();
  const weightInputRef = useRef<HTMLInputElement>(null);

  const getCurrentDateTime = () => {
    const now = new Date();
    // Set to current local time to avoid timezone offset issues
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  const getMaxDateTime = () => {
    // Prevent future dates by setting max to current date/time
    return getCurrentDateTime();
  };

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<EntryFormData>({
    resolver: zodResolver(entrySchema),
    defaultValues: {
      recorded_at: getCurrentDateTime(),
    },
  });

  // Auto-focus weight input when form opens
  useEffect(() => {
    if (weightInputRef.current) {
      weightInputRef.current.focus();
    }
  }, []);

  const onSubmit = async (data: EntryFormData) => {
    try {
      await createEntry.mutateAsync(data);
      reset();
      onSuccess?.();
    } catch (error) {
      console.error('Failed to create entry:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <Input
        {...register('weight', { valueAsNumber: true })}
        ref={weightInputRef}
        type="number"
        step="0.1"
        label="Weight"
        placeholder="Enter your weight"
        error={errors.weight?.message}
        autoFocus
      />

      <Input
        {...register('recorded_at')}
        type="datetime-local"
        label="Date & Time"
        max={getMaxDateTime()}
        error={errors.recorded_at?.message}
      />

      <Button type="submit" loading={createEntry.isPending} className="w-full">
        Add Entry
      </Button>
    </form>
  );
};
