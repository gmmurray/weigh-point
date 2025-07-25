-- Drop existing policies
DROP POLICY IF EXISTS "Users can access own profile" ON profiles;
DROP POLICY IF EXISTS "Users can access own entries" ON entries;
DROP POLICY IF EXISTS "Users can access own goals" ON goals;

-- Simplified policies for anonymous access
-- Allow all operations for authenticated users on their own data
-- Allow all operations for anonymous users
CREATE POLICY "Enable access for users" ON profiles FOR ALL USING (
  auth.uid() IS NULL OR auth.uid() = id
);

CREATE POLICY "Enable access for users" ON entries FOR ALL USING (
  auth.uid() IS NULL OR 
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = entries.user_id 
    AND profiles.id = auth.uid()
  )
);

CREATE POLICY "Enable access for users" ON goals FOR ALL USING (
  auth.uid() IS NULL OR 
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = goals.user_id 
    AND profiles.id = auth.uid()
  )
);