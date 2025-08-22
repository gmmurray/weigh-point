-- Drop existing policies
DROP POLICY IF EXISTS "Users can access own profile" ON wp_profiles;
DROP POLICY IF EXISTS "Users can access own entries" ON wp_entries;
DROP POLICY IF EXISTS "Users can access own goals" ON wp_goals;

-- Simplified policies for anonymous access
-- Allow all operations for authenticated users on their own data
-- Allow all operations for anonymous users
CREATE POLICY "Enable access for users" ON wp_profiles FOR ALL USING (
  auth.uid() IS NULL OR auth.uid() = id
);

CREATE POLICY "Enable access for users" ON wp_entries FOR ALL USING (
  auth.uid() IS NULL OR 
  EXISTS (
    SELECT 1 FROM wp_profiles 
    WHERE wp_profiles.id = wp_entries.user_id 
    AND wp_profiles.id = auth.uid()
  )
);

CREATE POLICY "Enable access for users" ON wp_goals FOR ALL USING (
  auth.uid() IS NULL OR 
  EXISTS (
    SELECT 1 FROM wp_profiles 
    WHERE wp_profiles.id = wp_goals.user_id 
    AND wp_profiles.id = auth.uid()
  )
);