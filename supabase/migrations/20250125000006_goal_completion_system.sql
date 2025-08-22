-- Add goal completion tracking columns
ALTER TABLE wp_goals ADD COLUMN status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed'));
ALTER TABLE wp_goals ADD COLUMN completed_at TIMESTAMPTZ NULL;
ALTER TABLE wp_goals ADD COLUMN completed_entry_id UUID REFERENCES wp_entries(id) NULL;

-- Drop the old unique constraint on user_id (allows multiple goals per user)
ALTER TABLE wp_goals DROP CONSTRAINT IF EXISTS goals_user_id_key;

-- Add new constraint: only one active goal per user (multiple completed goals allowed)
CREATE UNIQUE INDEX idx_goals_user_active ON wp_goals(user_id) WHERE status = 'active';

-- Add index for efficient completed goals queries
CREATE INDEX idx_goals_completed ON wp_goals(user_id, completed_at DESC) WHERE status = 'completed';

-- Update existing goals to have 'active' status
UPDATE wp_goals SET status = 'active' WHERE status IS NULL;