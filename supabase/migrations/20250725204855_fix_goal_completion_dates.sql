-- Fix existing completed goals to use the entry's recorded_at date instead of today's date
-- This makes the goal completion timeline more accurate for user's journey

UPDATE wp_goals 
SET completed_at = wp_entries.recorded_at
FROM wp_entries
WHERE wp_goals.status = 'completed'
  AND wp_goals.completed_entry_id = wp_entries.id
  AND wp_goals.completed_entry_id IS NOT NULL;