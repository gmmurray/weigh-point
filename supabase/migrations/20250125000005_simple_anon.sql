-- Drop existing policies
DROP POLICY IF EXISTS "Users can access own profile" ON wp_profiles;
DROP POLICY IF EXISTS "Users can access own entries" ON wp_entries;
DROP POLICY IF EXISTS "Users can access own goals" ON wp_goals;

-- Temporarily disable RLS for development
ALTER TABLE wp_profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE wp_entries DISABLE ROW LEVEL SECURITY;  
ALTER TABLE wp_goals DISABLE ROW LEVEL SECURITY;