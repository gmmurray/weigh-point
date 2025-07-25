# WeighPoint - Weight Tracking Waypoints

## Project Overview

A thoughtfully minimal React TypeScript PWA for personal weight tracking. Clean, fast, beautifully designed app focused on the essentials - track weight, visualize progress, reach goals. Each entry is a waypoint on your health journey. Minimalism as a feature, not a limitation.

## Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Backend**: Supabase (Auth, Database, Real-time)
- **Styling**: Tailwind CSS + DaisyUI
- **State**: TanStack Query + minimal Zustand
- **Charts**: Recharts (lightweight, good performance)
- **Forms**: React Hook Form + Zod
- **PWA**: Vite PWA Plugin

## Project Structure

```
src/
├── lib/
│   ├── supabase.ts          # Supabase client
│   ├── api.ts               # API functions
│   └── validations.ts       # Zod schemas
├── hooks/
│   ├── useEntries.ts        # Entry queries/mutations
│   ├── useGoal.ts           # Goal queries/mutations
│   └── useAuth.ts           # Auth hook
├── components/
│   ├── ui/                  # Base components (Button, Input, etc)
│   ├── EntryForm.tsx        # Add/edit entry waypoint
│   ├── WeightChart.tsx      # Journey visualization
│   ├── GoalCard.tsx         # Destination display
│   └── EntryList.tsx        # Recent waypoints
├── pages/
│   ├── Dashboard.tsx        # Main view - your journey
│   ├── History.tsx          # All waypoints
│   └── Settings.tsx         # Goal + preferences
├── stores/
│   └── ui.ts                # Theme, units only
└── types/
    └── index.ts             # Core types
```

## Database Schema (Minimal)

```sql
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
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  weight DECIMAL(6,2) NOT NULL,
  recorded_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Single goal per user
CREATE TABLE goals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  start_weight DECIMAL(6,2) NOT NULL,
  target_weight DECIMAL(6,2) NOT NULL,
  target_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  -- Constraint: one active goal per user
  UNIQUE(user_id)
);

-- Simple RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE goals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can access own data" ON profiles FOR ALL USING (
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
```

## Core Data Models

```typescript
export interface Entry {
  id: string;
  user_id: string;
  weight: number;
  recorded_at: string;
  created_at: string;
}

export interface Goal {
  id: string;
  user_id: string;
  start_weight: number;
  target_weight: number;
  target_date?: string;
  created_at: string;
}

export interface Profile {
  id: string;
  is_anonymous: boolean;
  preferred_unit: 'lbs' | 'kg';
  timezone: string;
  created_at: string;
}
```

## API Layer (Minimal)

```typescript
// lib/api.ts - Clean, focused API
export const api = {
  // Auth & Profile
  createAnonProfile: () =>
    supabase
      .from('profiles')
      .insert({
        id: crypto.randomUUID(),
        is_anonymous: true,
      })
      .select()
      .single(),

  linkAnonToAuth: (anonId: string) =>
    supabase
      .from('profiles')
      .update({
        id: (await supabase.auth.getUser()).data.user!.id,
        is_anonymous: false,
      })
      .eq('id', anonId),

  // Entries with smart defaults
  getEntries: (limit?: number) =>
    supabase
      .from('entries')
      .select('*')
      .order('recorded_at', { ascending: false })
      .limit(limit || 100),

  createEntry: (entry: { weight: number; recorded_at?: string }) =>
    supabase
      .from('entries')
      .insert({
        ...entry,
        recorded_at: entry.recorded_at || new Date().toISOString(),
      })
      .select()
      .single(),

  updateEntry: (id: string, weight: number) =>
    supabase.from('entries').update({ weight }).eq('id', id).select().single(),

  deleteEntry: (id: string) => supabase.from('entries').delete().eq('id', id),

  // Goal management
  getGoal: () => supabase.from('goals').select('*').maybeSingle(),

  setGoal: (goal: { target_weight: number; target_date?: string }) =>
    supabase
      .from('goals')
      .upsert({
        ...goal,
        start_weight: 0, // Will be set by the app logic
      })
      .select()
      .single(),

  clearGoal: () => supabase.from('goals').delete(),

  // Profile
  getProfile: () => supabase.from('profiles').select('*').single(),

  updateProfile: (
    updates: Partial<Pick<Profile, 'preferred_unit' | 'timezone'>>,
  ) => supabase.from('profiles').update(updates).select().single(),
};
```

## State Management Strategy

```typescript
// hooks/useEntries.ts - TanStack Query with real-time
export const useEntries = () => {
  const queryClient = useQueryClient();
  const { data: user } = useUser();

  // Subscribe to real-time changes
  useEffect(() => {
    if (!user) return;

    const subscription = supabase
      .channel('entries')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'entries',
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['entries'] });
        },
      )
      .subscribe();

    return () => subscription.unsubscribe();
  }, [user?.id]);

  return useQuery({
    queryKey: ['entries'],
    queryFn: api.getEntries,
    enabled: !!user,
  });
};

// Minimal client state
export const useUIStore = create<{
  theme: 'light' | 'dark';
  toggleTheme: () => void;
}>(set => ({
  theme: 'light',
  toggleTheme: () =>
    set(state => ({
      theme: state.theme === 'light' ? 'dark' : 'light',
    })),
}));
```

## DaisyUI Component Examples

```typescript
// components/ui/Button.tsx
interface ButtonProps {
  variant?: "primary" | "secondary" | "ghost";
  size?: "sm" | "md" | "lg";
  children: React.ReactNode;
  onClick?: () => void;
}

export const Button = ({
  variant = "primary",
  size = "md",
  children,
  ...props
}: ButtonProps) => {
  const baseClasses = "btn";
  const variantClasses = {
    primary: "btn-primary",
    secondary: "btn-secondary",
    ghost: "btn-ghost",
  };
  const sizeClasses = {
    sm: "btn-sm",
    md: "",
    lg: "btn-lg",
  };

  return (
    <button
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]}`}
      {...props}
    >
      {children}
    </button>
  );
};

// components/EntryForm.tsx
export const EntryForm = ({
  onSubmit,
}: {
  onSubmit: (data: EntryData) => void;
}) => {
  const { register, handleSubmit } = useForm<EntryData>();

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="form-control">
        <label className="label">
          <span className="label-text">Weight</span>
        </label>
        <input
          {...register("weight", { required: true, valueAsNumber: true })}
          type="number"
          step="0.1"
          className="input input-bordered"
          placeholder="Enter weight"
        />
      </div>

      <div className="form-control">
        <label className="label">
          <span className="label-text">Date</span>
        </label>
        <input
          {...register("recorded_at", { required: true })}
          type="datetime-local"
          className="input input-bordered"
        />
      </div>

      <Button type="submit" variant="primary">
        Add Entry
      </Button>
    </form>
  );
};
```

## Key Features (Thoughtfully Minimal)

- **Instant Start**: Opens to anonymous mode, start tracking waypoints immediately
- **Smart Entry**: Quick weight logging with intelligent defaults (current time/date)
- **Journey Visualization**: Clean line chart showing your weight waypoints over time
- **Destination Setting**: Simple target setting with visual progress to your goal
- **Seamless Sync**: Optional account creation preserves all waypoint data across devices
- **Thoughtful UX**: Dark/light themes, haptic feedback, smooth animations
- **Offline First**: Works completely offline, syncs when connected
- **Export Ready**: CSV export for data portability

## User Experience Flow

```typescript
// Day 1: Anonymous user
1. Open WeighPoint → Immediately usable
2. Add first waypoint → See instant journey visualization
3. Continue tracking → Waypoints build up locally

// Later: Wants cross-device sync
4. "Sign up to sync waypoints" → Preserves all data
5. Login on phone → Same journey appears
6. Continues seamless experience

// Advanced: Goal setting
7. Set destination weight → Progress indicators appear
8. Hit waypoint milestones → Celebration animations
9. Reach destination → Achievement unlocked
```

## Pages/Routes (Focused & Polished)

```typescript
const routes = [
  {
    path: '/',
    component: Dashboard,
    // Weight chart + quick add + recent waypoints + goal progress
    features: [
      'Journey chart',
      'Quick waypoint entry',
      'Goal progress',
      'Recent 5 waypoints',
    ],
  },
  {
    path: '/history',
    component: History,
    // All waypoints with smart search/filter + bulk actions
    features: [
      'All waypoints',
      'Search by date range',
      'Bulk delete',
      'Export data',
    ],
  },
  {
    path: '/settings',
    component: Settings,
    // Goal management + preferences + account
    features: [
      'Destination setting',
      'Units & timezone',
      'Theme',
      'Account linking',
      'Data export',
    ],
  },
];
```

## Performance Benefits of This Approach

- **Fewer Queries**: Real-time subscriptions eliminate need for polling
- **Simple State**: TanStack Query handles server state, minimal client state
- **Fast Styling**: Tailwind + DaisyUI, no runtime CSS-in-JS
- **Lightweight Charts**: Recharts over heavy chart libraries
- **Optimistic Updates**: Immediate UI feedback with automatic rollback

## Development Workflow

1. **Auth**: Supabase Auth (email/magic link only)
2. **Real-time**: Single subscription per table
3. **Styling**: DaisyUI components + custom Tailwind
4. **Forms**: React Hook Form with simple validation
5. **Charts**: Basic line chart with Recharts
6. **Testing**: Vitest for utils, minimal component tests
7. **Deploy**: Vercel static deployment

## Why This Approach Works

- **Minimalism as Strategy**: Every feature serves a clear purpose
- **Anonymous First**: Zero friction to start using
- **Progressive Enhancement**: Features unlock as user engages more
- **Data Ownership**: User controls their data, easy export
- **Performance Focus**: Fast, responsive, delightful interactions
- **Cross-Platform**: PWA works everywhere, syncs everywhere

## Design Philosophy

- **Immediate Value**: Useful from first interaction
- **Respectful**: No tracking, no bloat, no dark patterns
- **Focused**: Does one thing exceptionally well
- **Extensible**: Clean architecture for future enhancements
- **Accessible**: Works for everyone, everywhere

## Common Tasks

- Creating DaisyUI component wrappers
- Setting up real-time subscriptions
- Building responsive charts with Recharts
- Implementing optimistic updates
- Adding form validation with Zod
- Setting up PWA offline support
- Implementing unit conversion utilities
