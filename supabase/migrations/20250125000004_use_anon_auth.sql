-- Drop the session-based approach
DROP POLICY IF EXISTS "Users can access own profile" ON wp_profiles;
DROP POLICY IF EXISTS "Users can access own entries" ON wp_entries;
DROP POLICY IF EXISTS "Users can access own goals" ON wp_goals;

-- Remove session_id column as we'll use Supabase's anonymous auth
ALTER TABLE wp_profiles DROP COLUMN IF EXISTS session_id;
DROP INDEX IF EXISTS idx_profiles_session_id;

-- Update profiles to use auth.uid() for both anonymous and authenticated users
-- Anonymous users will get a UUID from Supabase's anonymous auth
ALTER TABLE wp_profiles ALTER COLUMN id SET DEFAULT auth.uid();

-- Simple RLS policies using auth.uid() for both anonymous and authenticated users
CREATE POLICY "Users can access own profile" ON wp_profiles FOR ALL USING (
  auth.uid() = id
);

CREATE POLICY "Users can access own entries" ON wp_entries FOR ALL USING (
  EXISTS (
    SELECT 1 FROM wp_profiles
    WHERE wp_profiles.id = wp_entries.user_id
    AND wp_profiles.id = auth.uid()
  )
);

CREATE POLICY "Users can access own goals" ON wp_goals FOR ALL USING (
  EXISTS (
    SELECT 1 FROM wp_profiles
    WHERE wp_profiles.id = wp_goals.user_id
    AND wp_profiles.id = auth.uid()
  )
);