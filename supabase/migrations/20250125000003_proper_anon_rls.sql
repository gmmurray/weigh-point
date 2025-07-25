-- Drop the overly permissive policies
DROP POLICY IF EXISTS "Enable access for users" ON profiles;
DROP POLICY IF EXISTS "Enable access for users" ON entries;
DROP POLICY IF EXISTS "Enable access for users" ON goals;

-- Add a session_id column to profiles for anonymous users
ALTER TABLE profiles ADD COLUMN session_id TEXT;

-- Create index for session lookups
CREATE INDEX idx_profiles_session_id ON profiles(session_id) WHERE session_id IS NOT NULL;

-- Proper RLS policies
-- Profiles: authenticated users access their own, anonymous users access by session_id
CREATE POLICY "Users can access own profile" ON profiles FOR ALL USING (
  (auth.uid() IS NOT NULL AND auth.uid() = id) OR
  (auth.uid() IS NULL AND session_id = current_setting('app.session_id', true))
);

-- Entries: access through profile relationship
CREATE POLICY "Users can access own entries" ON entries FOR ALL USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = entries.user_id
    AND (
      (auth.uid() IS NOT NULL AND auth.uid() = profiles.id) OR
      (auth.uid() IS NULL AND profiles.session_id = current_setting('app.session_id', true))
    )
  )
);

-- Goals: access through profile relationship  
CREATE POLICY "Users can access own goals" ON goals FOR ALL USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = goals.user_id
    AND (
      (auth.uid() IS NOT NULL AND auth.uid() = profiles.id) OR
      (auth.uid() IS NULL AND profiles.session_id = current_setting('app.session_id', true))
    )
  )
);