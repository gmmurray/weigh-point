-- Drop the session-based approach
DROP POLICY IF EXISTS "Users can access own profile" ON profiles;
DROP POLICY IF EXISTS "Users can access own entries" ON entries;
DROP POLICY IF EXISTS "Users can access own goals" ON goals;

-- Remove session_id column as we'll use Supabase's anonymous auth
ALTER TABLE profiles DROP COLUMN IF EXISTS session_id;
DROP INDEX IF EXISTS idx_profiles_session_id;

-- Update profiles to use auth.uid() for both anonymous and authenticated users
-- Anonymous users will get a UUID from Supabase's anonymous auth
ALTER TABLE profiles ALTER COLUMN id SET DEFAULT auth.uid();

-- Simple RLS policies using auth.uid() for both anonymous and authenticated users
CREATE POLICY "Users can access own profile" ON profiles FOR ALL USING (
  auth.uid() = id
);

CREATE POLICY "Users can access own entries" ON entries FOR ALL USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = entries.user_id
    AND profiles.id = auth.uid()
  )
);

CREATE POLICY "Users can access own goals" ON goals FOR ALL USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = goals.user_id
    AND profiles.id = auth.uid()
  )
);