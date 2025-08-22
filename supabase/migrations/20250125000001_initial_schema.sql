-- User profiles (supports both auth and anon users)
CREATE TABLE wp_profiles (
  id UUID PRIMARY KEY, -- Can be auth.users(id) or generated for anon
  is_anonymous BOOLEAN DEFAULT false,
  preferred_unit TEXT DEFAULT 'lbs' CHECK (preferred_unit IN ('lbs', 'kg')),
  timezone TEXT DEFAULT 'UTC',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Weight entries
CREATE TABLE wp_entries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES wp_profiles(id) ON DELETE CASCADE,
  weight DECIMAL(6,2) NOT NULL,
  recorded_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Single goal per user
CREATE TABLE wp_goals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES wp_profiles(id) ON DELETE CASCADE,
  start_weight DECIMAL(6,2) NOT NULL,
  target_weight DECIMAL(6,2) NOT NULL,
  target_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  -- Constraint: one active goal per user
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE wp_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE wp_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE wp_goals ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can access own profile" ON wp_profiles FOR ALL USING (
  (auth.uid() IS NOT NULL AND auth.uid() = id) OR
  (auth.uid() IS NULL AND is_anonymous = true)
);

CREATE POLICY "Users can access own entries" ON wp_entries FOR ALL USING (
  EXISTS (
    SELECT 1 FROM wp_profiles
    WHERE wp_profiles.id = wp_entries.user_id
    AND ((auth.uid() IS NOT NULL AND auth.uid() = wp_profiles.id) OR
         (auth.uid() IS NULL AND wp_profiles.is_anonymous = true))
  )
);

CREATE POLICY "Users can access own goals" ON wp_goals FOR ALL USING (
  EXISTS (
    SELECT 1 FROM wp_profiles
    WHERE wp_profiles.id = wp_goals.user_id
    AND ((auth.uid() IS NOT NULL AND auth.uid() = wp_profiles.id) OR
         (auth.uid() IS NULL AND wp_profiles.is_anonymous = true))
  )
);

-- Indexes for performance
CREATE INDEX idx_entries_user_id_recorded_at ON wp_entries(user_id, recorded_at DESC);
CREATE INDEX idx_profiles_is_anonymous ON wp_profiles(is_anonymous) WHERE is_anonymous = true;