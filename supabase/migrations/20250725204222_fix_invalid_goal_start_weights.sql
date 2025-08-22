-- Fix existing goals that have invalid start weights (0 or negative)
-- This prevents the goal completion bug from affecting existing data

-- Delete goals with invalid start weights as they are fundamentally broken
-- Users will need to recreate them after adding proper weight entries
DELETE FROM wp_goals 
WHERE start_weight <= 0 
AND status = 'active';

-- Add a database constraint to prevent future invalid goals
ALTER TABLE wp_goals 
ADD CONSTRAINT check_valid_start_weight 
CHECK (start_weight > 0);

-- Add a constraint to ensure target weight is also valid
ALTER TABLE wp_goals 
ADD CONSTRAINT check_valid_target_weight 
CHECK (target_weight > 0);

-- Ensure start and target weights are different (no point in a goal to same weight)
ALTER TABLE wp_goals 
ADD CONSTRAINT check_different_weights 
CHECK (start_weight != target_weight);