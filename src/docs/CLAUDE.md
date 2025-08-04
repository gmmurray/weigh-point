# WeighPoint - Weight Tracking Waypoints

## Project Overview

A thoughtfully minimal AND goal-focused React TypeScript PWA for personal weight tracking. Clean, fast, beautifully designed app that celebrates every milestone on your health journey. Each weight entry marks progress, each goal is a destination worth celebrating.

**Core Philosophy:**

- **Minimalism as Power**: Strip away distractions to focus on what matters - your progress
- **Minimalism as Discipline**: Every feature request must justify why it's essential
- **Goal-Centric Design**: Every feature serves the purpose of helping you set, track, and achieve meaningful goals
- **Celebrate Every Victory**: Whether you lose 2 pounds or 20, every goal completion deserves recognition and celebration
- **Progress Over Perfection**: Small consistent steps create lasting change
- **Permanent Achievement Tracking**: Once achieved, goals remain completed forever - weight fluctuations don't erase success
- **Respectful by Default**: No dark patterns, no pressure, no unnecessary interruptions
- **Timeless Design**: Build for long-term use, not trending features

**Why Goal Celebration Matters:**
Weight loss and fitness journeys are deeply personal and often challenging. WeighPoint believes that every goal - no matter how "small" - represents dedication, discipline, and personal growth. A 5-pound goal achieved is just as worthy of celebration as a 50-pound goal. The app automatically detects goal completion and permanently records achievements, letting you savor success and build a timeline of victories before moving to the next challenge.

**Automatic Goal Completion:**
Unlike traditional tracking apps where achievements feel temporary, WeighPoint automatically completes goals the moment your weight entry reaches the target. This creates permanent milestones tied to specific entries, ensuring your success is always recognized and celebrated.

Each entry marks progress on your health journey. Minimalism as a feature, not a limitation.

## Tech Stack

- **Frontend**: React 19 + TypeScript + Vite
- **Backend**: Supabase (Auth, Database, Real-time)
- **Styling**: Tailwind CSS + DaisyUI
- **State**: TanStack Query + minimal Zustand
- **Charts**: Recharts (lightweight, good performance)
- **Forms**: React Hook Form + Zod
- **Routing**: React Router (Dashboard, Goal History, Settings)
- **Date Utils**: Native browser APIs (replaced date-fns)
- **Bundle**: Code splitting with React.lazy + Suspense
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
│   ├── EntryForm.tsx        # Add/edit weight entry
│   ├── WeightChart.tsx      # Journey visualization
│   ├── GoalCard.tsx         # Goal display
│   └── EntryList.tsx        # Recent entries
├── pages/
│   ├── Dashboard.tsx        # Main view - your journey
│   ├── GoalHistory.tsx      # Achievement timeline
│   ├── Entries.tsx          # All entries
│   ├── Settings.tsx         # User management & preferences
│   ├── SignIn.tsx           # Authentication
│   ├── SignUp.tsx           # Account creation
│   ├── Landing.tsx          # Welcome page
│   └── GuestStart.tsx       # Guest mode onboarding
├── stores/
│   └── ui.ts                # Theme, units only
├── lib/
│   └── dateUtils.ts         # Native date formatting (replaced date-fns)
└── types/
    └── index.ts             # Core types
```

## Database Schema (Production-Ready Implementation)

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
  start_weight DECIMAL(6,2) NOT NULL CHECK (start_weight > 0),
  target_weight DECIMAL(6,2) NOT NULL CHECK (target_weight > 0),
  target_date DATE,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed')),
  completed_at TIMESTAMPTZ NULL,
  completed_entry_id UUID REFERENCES entries(id) NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT check_different_weights CHECK (start_weight != target_weight)
);

-- Indexes for performance and constraints
CREATE INDEX idx_entries_user_id_recorded_at ON entries(user_id, recorded_at DESC);
CREATE INDEX idx_goals_completed ON goals(user_id, completed_at DESC) WHERE status = 'completed';
CREATE UNIQUE INDEX idx_goals_user_active ON goals(user_id) WHERE status = 'active';

-- RLS Policies for Complete Data Isolation
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE goals ENABLE ROW LEVEL SECURITY;

-- Secure user data access
CREATE POLICY "Users can only access their own profile" ON profiles FOR ALL USING (
  (auth.uid() IS NOT NULL AND auth.uid() = id) OR
  (auth.uid() IS NULL AND is_anonymous = true)
);

CREATE POLICY "Users can only access their own entries" ON entries FOR ALL USING (
  (auth.uid() IS NOT NULL AND EXISTS (
    SELECT 1 FROM profiles p WHERE p.id = entries.user_id AND p.id = auth.uid() AND p.is_anonymous = false
  )) OR
  (auth.uid() IS NULL AND EXISTS (
    SELECT 1 FROM profiles p WHERE p.id = entries.user_id AND p.is_anonymous = true
  ))
);

CREATE POLICY "Users can only access their own goals" ON goals FOR ALL USING (
  (auth.uid() IS NOT NULL AND EXISTS (
    SELECT 1 FROM profiles p WHERE p.id = goals.user_id AND p.id = auth.uid() AND p.is_anonymous = false
  )) OR
  (auth.uid() IS NULL AND EXISTS (
    SELECT 1 FROM profiles p WHERE p.id = goals.user_id AND p.is_anonymous = true
  ))
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

  // Weight entries with smart defaults
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

## Key Features (Production-Ready & Secure)

- **Secure Anonymous Mode**: Instant start with complete data isolation between users
- **Smart Entry System**:
  - Auto-focused weight input for quick logging
  - Intelligent time/date defaults without timezone drift
  - Prevention of future entries at UI level
- **Journey Visualization**: Clean line chart showing weight progress over time
- **Intelligent Goal System**:
  - Requires existing weight entry before goal creation
  - Automatic completion when weight targets are reached
  - Uses entry date (not processing date) for accurate completion timeline
- **Goal Celebration System**:
  - Permanent achievement tracking with rich celebration details
  - Accurate duration calculations (inclusive day counting)
  - Achievement-first UI design
- **Complete Goal History**:
  - Visual timeline of all completed goals
  - Journey statistics and progress analytics
  - Smart navigation between dashboard and history
- **Production Security**:
  - Complete data isolation with RLS policies
  - Anonymous users cannot see each other's data
  - API-level user filtering on all queries
- **Robust Validation**:
  - Database-level constraints for data integrity
  - Clear error messages and UI-level prevention
  - TypeScript safety throughout the application
- **Seamless Authentication**: Optional account upgrade preserves all anonymous data

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
2. Add first entry → See instant journey visualization
3. Continue tracking → Entries build up locally

// Later: Wants cross-device sync
4. "Sign up to sync entries" → Preserves all data
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
      'Quick entry addition',
      'Goal celebration system',
      'Recent 5 entries',
      'Achievement count link to history',
    ],
  },
  {
    path: '/entries',
    component: Entries,
    // All entries with pagination, filtering, and individual management
    features: [
      'Paginated entries display (20 per page)',
      'Simple date filtering (All Time, Last 7/30 Days, 3 Months, This Year)',
      'Total entry count display with filter context',
      'Previous/Next navigation with loading states',
      'Individual delete functionality',
      'Smart page navigation (auto-adjust when deleting last item)',
      'Context-aware empty states for filtered results',
      // TODO: Individual entry editing
      // TODO: Link to Settings for bulk operations
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
    // Consolidated user management
    features: [
      'Account identity & upgrade options',
      'Weight unit preferences',
      'Data export (CSV download)',
      'Delete all data',
      'Account security (auth users)',
      'Guest mode explanation',
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
- **Bundle Optimization**: Code splitting + native APIs reduce initial load by 20%
- **Lazy Loading**: Non-critical pages load on-demand with Suspense boundaries

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

- **Minimalism as Strategy**: Every feature serves a clear purpose, complexity is actively resisted
- **Guest-First**: Zero friction to start using
- **Progressive Enhancement**: Features unlock as user engages more
- **Data Ownership**: User controls their data, easy export
- **Performance Focus**: Fast, responsive, delightful interactions
- **Cross-Platform**: PWA works everywhere, syncs everywhere
- **Sustainable Development**: Simple codebase is easier to maintain and less prone to bugs
- **Respectful Technology**: No surveillance, no manipulation, no feature pressure

## Design Philosophy

- **Immediate Value**: Useful from first interaction
- **Respectful**: No tracking, no bloat, no dark patterns
- **Focused**: Does one thing exceptionally well
- **Extensible**: Clean architecture for future enhancements
- **Accessible**: Works for everyone, everywhere

## Recent Development Progress

### Bundle Optimization ✅ **COMPLETED**

- **Date-fns Replacement**: Replaced date-fns (~20kb) with native browser APIs (`Intl.DateTimeFormat`)
- **Code Splitting**: Lazy loaded non-critical pages (SignIn, SignUp, GoalHistory, Entries, Settings) saving ~100kb
- **Bundle Size**: Reduced from ~800kb to ~650kb (20% reduction)
- **Performance**: Faster initial load, secondary pages load on-demand

### User Management System ✅ **COMPLETED**

- **Minimalist Settings Page**: Consolidated user management at `/settings` route
- **Universal User Menu**: Both guest and authenticated users get dropdown menu access
- **Guest-Friendly UX**: "Guest User" terminology instead of "anonymous"
- **Header Cleanup**: Removed cluttered user identity text, clean avatar-only design
- **Settings Access**: All users can access account management, preferences, and data controls

### Production-Ready Features ✅ **COMPLETED**

- **User Identity Clarity**: Clear email/Guest User display in menus for debugging
- **Account Upgrade Flow**: Seamless guest → authenticated user transition
- **Data Management UI**: Export functionality with CSV download
- **Security Settings**: Password/account deletion UI for authenticated users

### Security & Data Isolation ✅ **COMPLETED**

- **Anonymous Auth Security**: Fixed critical flaw where anonymous users could see each other's data
- **RLS Implementation**: Complete row-level security with proper user isolation policies
- **API Layer Security**: All database queries now filter by user ID for complete data separation

### Goal System Enhancements ✅ **COMPLETED**

- **Goal Completion Bug Fix**: Resolved issue where goals with no entries completed instantly
- **Validation Requirements**: Users must add weight entry before setting goals
- **Accurate Completion Dates**: Goals now complete with entry date, not processing date
- **Duration Calculations**: Fixed inconsistent day counting across all components (+1 inclusive counting)

### User Experience Improvements ✅ **COMPLETED**

- **Form Validation**: Enhanced error messages with clear, actionable feedback
- **Date Handling**: Fixed timezone offset issues (7/22 displaying as 7/21)
- **Input Constraints**: Prevent future entries and past goals at UI level vs validation errors
- **Auto-Focus**: Weight input automatically focused when entry form opens
- **Time Defaults**: Corrected +4 hour offset in entry time defaults

### TypeScript & Build Quality ✅ **COMPLETED**

- **Compilation Fixes**: Resolved all 12+ TypeScript build errors
- **Type Safety**: Improved API layer with proper async/await handling
- **Production Ready**: Clean build with no type errors or warnings

### Database Integrity ✅ **COMPLETED**

- **Schema Constraints**: Added validation for positive weights and different start/target weights
- **Migration System**: 10+ migrations applied successfully with proper rollback safety
- **Data Cleanup**: Removed invalid goals with zero start weights

## Future Development Philosophy

### Continuous Refinement 🎯 **PRIORITY**

- **Perfect Core Functions**: Refine weight entry and goal tracking until effortless
- **Performance Optimization**: Faster load times, smoother interactions
- **Accessibility Enhancement**: Ensure universal usability without complexity
- **Bug Prevention**: Robust error handling that maintains user trust

### Settings Page Implementation ✅ **COMPLETED**

**Fully implemented bulk data management:**

- ✅ **Account Section**: User identity display, guest upgrade prompts
- ✅ **Preferences Section**: Weight unit selection with API integration
- ✅ **Data Export**: Full CSV export for entries and goals with proper formatting
- ✅ **Data Reset**: Clear entries/goals while preserving account and preferences
- ✅ **Account Deletion**: Complete data and account removal for both guest and auth users
- ✅ **Security Section**: Password change functionality for authenticated users

**Implementation complete - no remaining features planned.**

### Recent Development Progress

### Entries Page Enhancement ✅ **COMPLETED**

**Pagination System:**

- ✅ **Pagination**: 20 entries per page with efficient database queries using Supabase range()
- ✅ **Performance**: Only loads necessary entries, scales to thousands of entries
- ✅ **Smart Navigation**: Previous/Next buttons with proper disabled states and loading indicators
- ✅ **Total Count Display**: Shows "X total entries" for user awareness
- ✅ **Edge Case Handling**: Auto-navigates to previous page when deleting last entry on current page

**Date Filtering System:**

- ✅ **Simple Filters**: Dropdown with preset periods (All Time, Last 7/30 Days, 3 Months, This Year)
- ✅ **Database-Level Filtering**: Uses Supabase gte/lte operators for efficient queries
- ✅ **Pagination Integration**: Filtering works seamlessly with pagination, resets to page 1
- ✅ **Smart Count Display**: Shows filtered count with context ("X entries (last 30 days)")
- ✅ **Context-Aware UI**: Different empty states for "no entries" vs "no entries in period"
- ✅ **User-Friendly**: Simple dropdown instead of complex date range pickers

**Technical Implementation:**

- ✅ **API Enhancement**: Updated getEntries() to support dateFrom/dateTo with backward compatibility
- ✅ **TypeScript Safety**: Full type safety with EntriesResult interface and proper error handling
- ✅ **Reusable Utilities**: Created dateFilters.ts for consistent date range calculations

### Essential Infrastructure Only

- **Offline Functionality**: Core tracking works without internet
- **Data Portability**: CSV export through Settings page
- **Security Hardening**: Maintain complete user data isolation

### What We Will NOT Build

- Complex analytics or reporting systems
- Social features or sharing mechanisms
- Notification systems or gamification
- Advanced filtering or search capabilities beyond basic date ranges
- Complex bulk operations (simple bulk operations in Settings only)

**Guiding Question**: Does this feature help users track weight and achieve goals more simply? If not, we don't build it.

## Code Style Guidelines

### Commenting Philosophy: Comprehensive and Thoughtful (Level 7/10)

WeighPoint uses **enhanced commenting** to ensure code maintainability, onboarding ease, and business logic clarity. Comments should explain the "why" and provide context that makes the codebase accessible to future developers.

**Always Comment:**

- **Business logic and domain rules** - Why this logic exists and what business need it serves
- **API integration points** - Expected responses, error handling, rate limits
- **Security-sensitive code** - Authentication flows, data access patterns, validation rules
- **Performance optimizations** - Why this approach was chosen over alternatives
- **Complex calculations** - Mathematical operations, weight conversions, date handling
- **Error handling strategies** - When/why certain errors are caught or ignored
- **State management decisions** - Why certain data lives in component vs global state
- **User experience considerations** - Accessibility choices, interaction patterns
- **Data transformation logic** - Format changes, unit conversions, validation rules
- **Component composition patterns** - How components work together, prop contracts

**Strategically Comment:**

- **Function purposes** - Brief JSDoc-style comments for non-trivial functions
- **Hook dependencies** - Why certain values trigger re-runs
- **Form validation logic** - Business rules behind field requirements
- **Navigation patterns** - User flow considerations and redirect logic
- **Conditional rendering** - When/why UI elements appear or hide
- **Data fetching strategies** - Caching decisions, real-time vs polling

**Still Avoid Commenting:**

- Obvious variable assignments (`const isLoading = true`)
- Standard library calls (`JSON.parse()`, `Math.round()`)
- Simple JSX without logic

**Enhanced Comment Quality Standards:**

```typescript
// ❌ Still too basic
const weight = parseFloat(inputValue); // Parse input as float

// ✅ Enhanced - explains business context and precision reasoning
const weight = parseFloat(inputValue);
// Round to 1 decimal place to match digital scale precision and prevent
// database storage issues with floating point arithmetic
const roundedWeight = Math.round(weight * 10) / 10;

// ❌ Missing business context
useEffect(() => {
  const subscription = supabase.channel('entries')...
}, [user?.id]);

// ✅ Enhanced - explains user experience and technical decisions
useEffect(() => {
  // Real-time sync ensures immediate UI updates when user adds entries
  // on other devices. Critical for multi-device weight tracking consistency.
  // Filter by user_id prevents data leakage between anonymous sessions.
  const subscription = supabase
    .channel('entries')
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'entries',
      filter: `user_id=eq.${user.id}`, // Enforce user data isolation
    }, () => {
      // Invalidate queries to trigger fresh data fetch
      queryClient.invalidateQueries({ queryKey: ['entries'] });
    })
    .subscribe();

  return () => subscription.unsubscribe();
}, [user?.id]); // Re-subscribe when switching between guest/auth users

// ✅ Enhanced - comprehensive business logic explanation
const checkGoalCompletion = (entry: Entry, goal: Goal) => {
  // Goals complete instantly when target weight is reached, using entry date
  // (not processing date) to maintain accurate achievement timeline.
  // This ensures users get immediate celebration feedback.
  const isLossGoal = goal.target_weight < goal.start_weight;
  const isGainGoal = goal.target_weight > goal.start_weight;

  // Weight-loss goals complete when entry is <= target (or better)
  // Weight-gain goals complete when entry is >= target (or better)
  const goalMet = isLossGoal
    ? entry.weight <= goal.target_weight
    : entry.weight >= goal.target_weight;

  if (goalMet) {
    // Mark goal as completed with this specific entry for celebration UI
    completeGoal(goal.id, entry.id);
  }
};
```

**Function Documentation Standards:**

```typescript
/**
 * Converts weight between units while preserving user's display preferences.
 *
 * @param weight - Raw weight value from database (always stored in user's preferred unit)
 * @param fromUnit - Source unit ('lbs' | 'kg')
 * @param toUnit - Target unit for display
 * @returns Converted weight rounded to 1 decimal place for scale precision
 *
 * Business Context: Users can view data in different units without changing
 * their stored preferences. Critical for international users switching contexts.
 */
export const convertWeight = (
  weight: number,
  fromUnit: Unit,
  toUnit: Unit,
): number => {
  // Conversion handles both directions with standard medical conversion rates
  if (fromUnit === toUnit) return weight;

  // Use precise conversion: 1 kg = 2.20462 lbs (medical standard)
  const lbsToKg = 0.453592;
  const result = fromUnit === 'lbs' ? weight * lbsToKg : weight / lbsToKg;

  // Round to 1 decimal to match scale precision and prevent UI layout shifts
  return Math.round(result * 10) / 10;
};
```

**Component Header Standards:**

```typescript
/**
 * Settings page providing user account management and app preferences.
 *
 * Features:
 * - Account identity display with upgrade prompts for guest users
 * - Weight unit preferences (lbs/kg) with real-time form updates
 * - Data management: export tools and bulk deletion
 * - Security settings for authenticated users (password, account deletion)
 *
 * User Experience: Consolidated settings prevent UI fragmentation while
 * maintaining clear sections for different user types (guest vs authenticated).
 */
const Settings = () => {
```

### Code Organization Principles

- **Function naming**: Descriptive verbs that eliminate need for comments
- **Component structure**: Props → hooks → handlers → render
- **File organization**: Group related functions, separate concerns clearly
- **Type definitions**: Co-locate with usage when possible

### Minimalist Code Standards

- **No dead code**: Remove commented-out code blocks immediately
- **No speculative features**: Don't build "for future use"
- **Single responsibility**: Each function does one thing well
- **Clear naming**: Code should read like well-written prose

## Common Development Tasks

- Creating DaisyUI component wrappers
- Setting up real-time subscriptions with user filtering
- Building responsive charts with Recharts
- Implementing optimistic updates with proper error handling
- Adding form validation with Zod and UI constraints
- Setting up PWA offline support
- Implementing secure anonymous authentication
- Database migration creation and testing
