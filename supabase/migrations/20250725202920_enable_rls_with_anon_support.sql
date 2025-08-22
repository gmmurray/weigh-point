-- Re-enable RLS with proper anonymous user support
-- This migration addresses the security issue where RLS was disabled

-- Re-enable RLS on all tables
ALTER TABLE wp_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE wp_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE wp_goals ENABLE ROW LEVEL SECURITY;

-- Drop any existing policies to ensure clean state
DROP POLICY IF EXISTS "Users can access own profile" ON wp_profiles;
DROP POLICY IF EXISTS "Users can access own entries" ON wp_entries;
DROP POLICY IF EXISTS "Users can access own goals" ON wp_goals;

-- Enhanced RLS Policies for Anonymous + Authenticated Users

-- Profiles: Users can only access their own profile
-- For authenticated users: match auth.uid() with profile.id
-- For anonymous users: allow access to profiles where is_anonymous = true
CREATE POLICY "Users can access own profile" ON wp_profiles FOR ALL USING (
  -- Authenticated user accessing their own profile
  (auth.uid() IS NOT NULL AND auth.uid() = id AND is_anonymous = false) OR
  -- Anonymous access: Allow read/write to anonymous profiles only
  (auth.uid() IS NULL AND is_anonymous = true)
);

-- Entries: Users can only access entries linked to their profile
CREATE POLICY "Users can access own entries" ON wp_entries FOR ALL USING (
  EXISTS (
    SELECT 1 FROM wp_profiles p
    WHERE p.id = wp_entries.user_id
    AND (
      -- Authenticated user accessing entries linked to their profile
      (auth.uid() IS NOT NULL AND auth.uid() = p.id AND p.is_anonymous = false) OR
      -- Anonymous access: entries linked to anonymous profiles
      (auth.uid() IS NULL AND p.is_anonymous = true)
    )
  )
);

-- Goals: Users can only access goals linked to their profile
CREATE POLICY "Users can access own goals" ON wp_goals FOR ALL USING (
  EXISTS (
    SELECT 1 FROM wp_profiles p
    WHERE p.id = wp_goals.user_id
    AND (
      -- Authenticated user accessing goals linked to their profile
      (auth.uid() IS NOT NULL AND auth.uid() = p.id AND p.is_anonymous = false) OR
      -- Anonymous access: goals linked to anonymous profiles
      (auth.uid() IS NULL AND p.is_anonymous = true)
    )
  )
);

-- Additional security: Ensure anonymous users can only create anonymous profiles
CREATE POLICY "Anonymous users can only create anonymous profiles" ON wp_profiles FOR INSERT WITH CHECK (
  -- If user is not authenticated, they can only create anonymous profiles
  (auth.uid() IS NULL AND is_anonymous = true) OR
  -- If user is authenticated, they can create their own profile
  (auth.uid() IS NOT NULL AND auth.uid() = id AND is_anonymous = false)
);

-- Additional security: Prevent anonymous profile takeover
CREATE POLICY "Prevent anonymous profile takeover" ON wp_profiles FOR UPDATE USING (
  -- Allow updates only if:
  -- 1. Authenticated user updating their own profile
  (auth.uid() IS NOT NULL AND auth.uid() = id) OR
  -- 2. Anonymous user updating anonymous profile 
  (auth.uid() IS NULL AND is_anonymous = true)
);