export interface Entry {
  id: string;
  user_id: string;
  weight: number;
  recorded_at: string;
  created_at: string;
}

export interface Goal {
  id: string;
  user_id: string;
  start_weight: number;
  target_weight: number;
  target_date?: string;
  status: 'active' | 'completed';
  completed_at?: string;
  completed_entry_id?: string;
  created_at: string;
}

export interface Profile {
  id: string;
  is_anonymous: boolean;
  preferred_unit: 'lbs' | 'kg';
  timezone: string;
  created_at: string;
}

export type WeightUnit = 'lbs' | 'kg';

export interface CreateEntryInput {
  weight: number;
  recorded_at?: string;
}

export interface CreateGoalInput {
  target_weight: number;
  target_date?: string;
}

export interface UpdateProfileInput {
  preferred_unit?: WeightUnit;
  timezone?: string;
}

// Joined types for API responses
export interface GoalWithEntry extends Goal {
  entries?: Entry;
}
