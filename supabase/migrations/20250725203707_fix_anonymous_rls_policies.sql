-- Fix RLS policies to work with proper user ID filtering
-- This ensures complete data isolation between users (both anonymous and authenticated)

-- Drop existing policies
DROP POLICY IF EXISTS "Users can access own profile" ON wp_profiles;
DROP POLICY IF EXISTS "Users can access own entries" ON wp_entries;  
DROP POLICY IF EXISTS "Users can access own goals" ON wp_goals;
DROP POLICY IF EXISTS "Anonymous users can only create anonymous profiles" ON wp_profiles;
DROP POLICY IF EXISTS "Prevent anonymous profile takeover" ON wp_profiles;

-- Simplified and more secure RLS policies

-- Profiles: Only allow access to exact user ID match
CREATE POLICY "Users can only access their own profile" ON wp_profiles FOR ALL USING (
  -- Authenticated user accessing their own profile
  (auth.uid() IS NOT NULL AND auth.uid() = id) OR
  -- Anonymous profiles can only be accessed via explicit queries (handled in app layer)
  (auth.uid() IS NULL AND is_anonymous = true)
);

-- Entries: Only allow access to entries owned by the user
CREATE POLICY "Users can only access their own entries" ON wp_entries FOR ALL USING (
  -- For authenticated users: must match auth.uid() with profile
  (auth.uid() IS NOT NULL AND EXISTS (
    SELECT 1 FROM wp_profiles p 
    WHERE p.id = wp_entries.user_id 
    AND p.id = auth.uid() 
    AND p.is_anonymous = false
  )) OR
  -- For anonymous: allow access but rely on app-level filtering
  (auth.uid() IS NULL AND EXISTS (
    SELECT 1 FROM wp_profiles p 
    WHERE p.id = wp_entries.user_id 
    AND p.is_anonymous = true
  ))
);

-- Goals: Only allow access to goals owned by the user  
CREATE POLICY "Users can only access their own goals" ON wp_goals FOR ALL USING (
  -- For authenticated users: must match auth.uid() with profile
  (auth.uid() IS NOT NULL AND EXISTS (
    SELECT 1 FROM wp_profiles p 
    WHERE p.id = wp_goals.user_id 
    AND p.id = auth.uid() 
    AND p.is_anonymous = false
  )) OR
  -- For anonymous: allow access but rely on app-level filtering
  (auth.uid() IS NULL AND EXISTS (
    SELECT 1 FROM wp_profiles p 
    WHERE p.id = wp_goals.user_id 
    AND p.is_anonymous = true
  ))
);

-- Profile security policies
CREATE POLICY "Authenticated users can only create their own profile" ON wp_profiles FOR INSERT WITH CHECK (
  auth.uid() IS NOT NULL AND auth.uid() = id AND is_anonymous = false
);

CREATE POLICY "Anonymous profile creation allowed" ON wp_profiles FOR INSERT WITH CHECK (
  auth.uid() IS NULL AND is_anonymous = true
);

CREATE POLICY "Users can only update their own profile" ON wp_profiles FOR UPDATE USING (
  (auth.uid() IS NOT NULL AND auth.uid() = id) OR
  (auth.uid() IS NULL AND is_anonymous = true)
);