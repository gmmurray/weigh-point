-- Drop existing policies
DROP POLICY IF EXISTS "Users can access own profile" ON profiles;
DROP POLICY IF EXISTS "Users can access own entries" ON entries;
DROP POLICY IF EXISTS "Users can access own goals" ON goals;

-- Temporarily disable RLS for development
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE entries DISABLE ROW LEVEL SECURITY;  
ALTER TABLE goals DISABLE ROW LEVEL SECURITY;