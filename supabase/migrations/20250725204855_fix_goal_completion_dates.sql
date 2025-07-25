-- Fix existing completed goals to use the entry's recorded_at date instead of today's date
-- This makes the goal completion timeline more accurate for user's journey

UPDATE goals 
SET completed_at = entries.recorded_at
FROM entries
WHERE goals.status = 'completed'
  AND goals.completed_entry_id = entries.id
  AND goals.completed_entry_id IS NOT NULL;