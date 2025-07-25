# WeighPoint - Weight Tracking Waypoints

## Project Overview

A thoughtfully minimal AND goal-focused React TypeScript PWA for personal weight tracking. Clean, fast, beautifully designed app that celebrates every milestone on your health journey. Each entry is a waypoint, each goal is a destination worth celebrating.

**Core Philosophy:**

- **Minimalism as Power**: Strip away distractions to focus on what matters - your progress
- **Goal-Centric Design**: Every feature serves the purpose of helping you set, track, and achieve meaningful goals
- **Celebrate Every Victory**: Whether you lose 2 pounds or 20, every goal completion deserves recognition and celebration
- **Progress Over Perfection**: Small consistent steps create lasting change
- **Permanent Achievement Tracking**: Once achieved, goals remain completed forever - weight fluctuations don't erase success

**Why Goal Celebration Matters:**
Weight loss and fitness journeys are deeply personal and often challenging. WeighPoint believes that every goal - no matter how "small" - represents dedication, discipline, and personal growth. A 5-pound goal achieved is just as worthy of celebration as a 50-pound goal. The app automatically detects goal completion and permanently records achievements, letting you savor success and build a timeline of victories before moving to the next challenge.

**Automatic Goal Completion:**
Unlike traditional tracking apps where achievements feel temporary, WeighPoint automatically completes goals the moment your weight entry reaches the target. This creates permanent milestones tied to specific entries, ensuring your success is always recognized and celebrated.

Each entry is a waypoint on your health journey. Minimalism as a feature, not a limitation.

## Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Backend**: Supabase (Auth, Database, Real-time)
- **Styling**: Tailwind CSS + DaisyUI
- **State**: TanStack Query + minimal Zustand
- **Charts**: Recharts (lightweight, good performance)
- **Forms**: React Hook Form + Zod
- **Routing**: React Router (Dashboard, Goal History)
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

## Database Schema (Current Implementation)

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
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  weight DECIMAL(6,2) NOT NULL,
  recorded_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Goals with completion tracking and celebration focus
CREATE TABLE goals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  start_weight DECIMAL(6,2) NOT NULL,
  target_weight DECIMAL(6,2) NOT NULL,
  target_date DATE,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed')),
  completed_at TIMESTAMPTZ NULL,
  completed_entry_id UUID REFERENCES entries(id) NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance and constraints
CREATE INDEX idx_entries_user_id_recorded_at ON entries(user_id, recorded_at DESC);
CREATE INDEX idx_goals_completed ON goals(user_id, completed_at DESC) WHERE status = 'completed';
CREATE UNIQUE INDEX idx_goals_user_active ON goals(user_id) WHERE status = 'active';

-- Note: RLS is currently disabled for development
-- In production, implement proper RLS policies for data security
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
  status: 'active' | 'completed';
  completed_at?: string;
  completed_entry_id?: string;
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

  // Goal management with celebration focus
  getActiveGoal: () =>
    supabase.from('goals').select('*').eq('status', 'active').maybeSingle(),

  getCompletedGoals: () =>
    supabase
      .from('goals')
      .select('*, entries(*)')
      .eq('status', 'completed')
      .order('completed_at', { ascending: false }),

  setGoal: (goal: { target_weight: number; target_date?: string }) =>
    supabase
      .from('goals')
      .insert({
        ...goal,
        start_weight: 0, // Will be set by the app logic
        status: 'active',
      })
      .select()
      .single(),

  completeGoal: (goalId: string, entryId: string) =>
    supabase
      .from('goals')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        completed_entry_id: entryId,
      })
      .eq('id', goalId)
      .select()
      .single(),

  clearGoal: (goalId: string) =>
    supabase.from('goals').delete().eq('id', goalId),

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

## Key Features (Thoughtfully Minimal & Goal-Focused)

- **Instant Start**: Opens to anonymous mode, start tracking waypoints immediately
- **Smart Entry**: Quick weight logging with intelligent defaults (current time/date)
- **Journey Visualization**: Clean line chart showing your weight waypoints over time
- **Automatic Goal Completion**: Goals complete instantly when weight entries reach targets
- **Goal Celebration System**: Permanent achievement tracking that celebrates every milestone
- **Achievement First UI**: Completed goals are prominently displayed with celebration details
- **Achievement Timeline**: Visual timeline of all completed goals with journey statistics
- **Goal History Navigation**: Dedicated page for viewing achievement history and stats
- **Smart Navigation**: Contextual links between dashboard and goal history
- **Seamless Sync**: Optional account creation preserves all waypoint data across devices
- **Thoughtful UX**: Dark/light themes, haptic feedback, smooth animations
- **Offline First**: Works completely offline, syncs when connected
- **Export Ready**: CSV export for data portability

### Goal Celebration System

WeighPoint transforms goal achievement from a fleeting moment into a lasting celebration:

**Permanent Milestones**: Once achieved, goals remain completed forever - weight fluctuations don't erase your success.

**Achievement-First Display**: Completed goals take visual priority over creating new ones, letting you savor your accomplishment.

**Rich Celebration Details**:

- Exact date and entry that achieved the goal
- Journey duration ("Completed in 45 days")
- Total progress made
- Achievement status ("Goal exceeded!" vs "Goal reached!")

**Progressive Goal Setting**: After celebrating, users can seamlessly set new goals directly from completed goal cards, building a history of achievements rather than endless cycles.

**Achievement Timeline**: The dedicated Goal History page provides a visual timeline of all completed goals, showing journey duration, weight changes, and celebration badges for exceeded targets.

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

// Goal setting and completion
7. Set destination weight → Progress indicators appear
8. Add weight entries → System monitors for goal achievement
9. Hit target weight → Goal automatically completes with celebration
10. View achievement → Permanent celebration card with journey stats
11. Set new goal → Continue building achievement timeline
12. Access goal history → Visual timeline of all completed goals
```

## Pages/Routes (Focused & Polished)

```typescript
const routes = [
  {
    path: '/',
    component: Dashboard,
    // Weight chart + quick add + goal celebration + recent waypoints + navigation
    features: [
      'Journey chart',
      'Quick waypoint entry',
      'Goal celebration system',
      'Recent 5 waypoints',
      'Achievement count link to history',
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
    path: '/goals',
    component: GoalHistory,
    // Achievement celebration and goal history
    features: [
      'Achievement timeline with visual indicators',
      'Goal completion statistics',
      'Journey duration and weight change stats',
      'Exceeded vs exact completion badges',
      'Motivational achievement celebration',
      'Empty state for new users',
    ],
  },
  {
    path: '/settings',
    component: Settings,
    // Preferences + account management
    features: [
      'Units & timezone',
      'Theme preferences',
      'Account linking',
      'Data export',
      'Privacy settings',
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

1. **Package Manager**: pnpm for fast, efficient dependency management
2. **Auth**: Supabase Auth (email/magic link only) with anonymous support
3. **Real-time**: Single subscription per table with automatic goal completion
4. **Routing**: React Router for Dashboard and Goal History navigation
5. **Styling**: DaisyUI components + custom Tailwind
6. **Forms**: React Hook Form with Zod validation
7. **Charts**: Basic line chart with Recharts
8. **Testing**: Vitest for utils, minimal component tests
9. **Deploy**: Cloudflare Workers static deployment

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
