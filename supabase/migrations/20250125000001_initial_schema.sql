-- User profiles (supports both auth and anon users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY, -- Can be auth.users(id) or generated for anon
  is_anonymous BOOLEAN DEFAULT false,
  preferred_unit TEXT DEFAULT 'lbs' CHECK (preferred_unit IN ('lbs', 'kg')),
  timezone TEXT DEFAULT 'UTC',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Weight entries
CREATE TABLE entries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  weight DECIMAL(6,2) NOT NULL,
  recorded_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Single goal per user
CREATE TABLE goals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  start_weight DECIMAL(6,2) NOT NULL,
  target_weight DECIMAL(6,2) NOT NULL,
  target_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  -- Constraint: one active goal per user
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE goals ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can access own profile" ON profiles FOR ALL USING (
  (auth.uid() IS NOT NULL AND auth.uid() = id) OR
  (auth.uid() IS NULL AND is_anonymous = true)
);

CREATE POLICY "Users can access own entries" ON entries FOR ALL USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = entries.user_id
    AND ((auth.uid() IS NOT NULL AND auth.uid() = profiles.id) OR
         (auth.uid() IS NULL AND profiles.is_anonymous = true))
  )
);

CREATE POLICY "Users can access own goals" ON goals FOR ALL USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = goals.user_id
    AND ((auth.uid() IS NOT NULL AND auth.uid() = profiles.id) OR
         (auth.uid() IS NULL AND profiles.is_anonymous = true))
  )
);

-- Indexes for performance
CREATE INDEX idx_entries_user_id_recorded_at ON entries(user_id, recorded_at DESC);
CREATE INDEX idx_profiles_is_anonymous ON profiles(is_anonymous) WHERE is_anonymous = true;