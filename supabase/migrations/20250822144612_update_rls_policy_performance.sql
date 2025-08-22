-- Fix Supabase linter warnings for RLS policies
-- BEGIN/COMMIT ensures the migration runs atomically
BEGIN;

-- ==============================
-- Table: public.wp_profiles
-- ==============================

-- Drop old policies if they exist
DROP POLICY IF EXISTS "Authenticated users can only create their own profile" ON public.wp_profiles;
DROP POLICY IF EXISTS "Anonymous profile creation allowed" ON public.wp_profiles;
DROP POLICY IF EXISTS "Users can only access their own profile" ON public.wp_profiles;
DROP POLICY IF EXISTS "Users can only update their own profile" ON public.wp_profiles;

-- Consolidated INSERT policy:
-- Allow anonymous OR authenticated users to insert a profile,
-- but only for themselves
CREATE POLICY "profile_insert_policy"
  ON public.wp_profiles
  FOR INSERT
  TO anon, authenticated, authenticator, dashboard_user
  WITH CHECK (
    (select auth.uid()) = id
  );

-- Consolidated SELECT policy:
-- Users can only view their own profile
CREATE POLICY "profile_select_policy"
  ON public.wp_profiles
  FOR SELECT
  TO authenticated, authenticator, dashboard_user
  USING (
    (select auth.uid()) = id
  );

-- Consolidated UPDATE policy:
-- Users can only update their own profile
CREATE POLICY "profile_update_policy"
  ON public.wp_profiles
  FOR UPDATE
  TO authenticated, authenticator, dashboard_user
  USING (
    (select auth.uid()) = id
  )
  WITH CHECK (
    (select auth.uid()) = id
  );

-- ==============================
-- Table: public.wp_entries
-- ==============================

DROP POLICY IF EXISTS "Users can only access their own entries" ON public.wp_entries;

CREATE POLICY "entries_owner_policy"
  ON public.wp_entries
  FOR ALL
  TO authenticated
  USING (
    (select auth.uid()) = user_id
  )
  WITH CHECK (
    (select auth.uid()) = user_id
  );

-- ==============================
-- Table: public.wp_goals
-- ==============================

DROP POLICY IF EXISTS "Users can only access their own goals" ON public.wp_goals;

CREATE POLICY "goals_owner_policy"
  ON public.wp_goals
  FOR ALL
  TO authenticated
  USING (
    (select auth.uid()) = user_id
  )
  WITH CHECK (
    (select auth.uid()) = user_id
  );

COMMIT;
