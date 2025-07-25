-- Add goal completion tracking columns
ALTER TABLE goals ADD COLUMN status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed'));
ALTER TABLE goals ADD COLUMN completed_at TIMESTAMPTZ NULL;
ALTER TABLE goals ADD COLUMN completed_entry_id UUID REFERENCES entries(id) NULL;

-- Drop the old unique constraint on user_id (allows multiple goals per user)
ALTER TABLE goals DROP CONSTRAINT IF EXISTS goals_user_id_key;

-- Add new constraint: only one active goal per user (multiple completed goals allowed)
CREATE UNIQUE INDEX idx_goals_user_active ON goals(user_id) WHERE status = 'active';

-- Add index for efficient completed goals queries
CREATE INDEX idx_goals_completed ON goals(user_id, completed_at DESC) WHERE status = 'completed';

-- Update existing goals to have 'active' status
UPDATE goals SET status = 'active' WHERE status IS NULL;