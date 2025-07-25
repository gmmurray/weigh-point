import { z } from 'zod';

export const entrySchema = z.object({
  weight: z.number().min(0.1).max(1000),
  recorded_at: z
    .string()
    .optional()
    .transform(val => {
      if (!val) return new Date().toISOString();
      // Handle datetime-local format (YYYY-MM-DDTHH:mm) by converting to ISO
      return new Date(val).toISOString();
    }),
});

export const goalSchema = z.object({
  target_weight: z.number().min(0.1).max(1000),
  target_date: z.string().date().optional(),
});

export const profileSchema = z.object({
  preferred_unit: z.enum(['lbs', 'kg']).optional(),
  timezone: z.string().optional(),
});

export type EntryFormData = z.infer<typeof entrySchema>;
export type GoalFormData = z.infer<typeof goalSchema>;
export type ProfileFormData = z.infer<typeof profileSchema>;
