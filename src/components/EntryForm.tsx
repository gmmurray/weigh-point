import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button, Input } from './ui';
import { entrySchema, type EntryFormData } from '../lib/validations';
import { useCreateEntry } from '../hooks/useEntries';

interface EntryFormProps {
  onSuccess?: () => void;
}

export const EntryForm = ({ onSuccess }: EntryFormProps) => {
  const createEntry = useCreateEntry();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<EntryFormData>({
    resolver: zodResolver(entrySchema),
    defaultValues: {
      recorded_at: new Date().toISOString().slice(0, 16), // YYYY-MM-DDTHH:mm format
    },
  });

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
        type="number"
        step="0.1"
        label="Weight"
        placeholder="Enter your weight"
        error={errors.weight?.message}
      />

      <Input
        {...register('recorded_at')}
        type="datetime-local"
        label="Date & Time"
        error={errors.recorded_at?.message}
      />

      <Button type="submit" loading={createEntry.isPending} className="w-full">
        Add Entry
      </Button>
    </form>
  );
};
