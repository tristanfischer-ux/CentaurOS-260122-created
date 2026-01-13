# Centaur OS - Software Engineering Guide
**Technical Documentation for Engineers**

Last Updated: 2026-01-13

---

## Table of Contents

1. [System Overview](#system-overview)
2. [Architecture](#architecture)
3. [Tech Stack](#tech-stack)
4. [Project Structure](#project-structure)
5. [Data Model & State Management](#data-model--state-management)
6. [Authentication & Authorization](#authentication--authorization)
7. [Navigation System](#navigation-system)
8. [Key Features Implementation](#key-features-implementation)
9. [UI/UX Patterns](#uiux-patterns)
10. [Development Workflow](#development-workflow)
11. [Testing & Debugging](#testing--debugging)
12. [Deployment](#deployment)

---

## System Overview

### What is Centaur OS?

Centaur OS is a React Native mobile application built with Expo that helps lean hardware startups operate efficiently with small teams. It's essentially an "Operating System" for startups that:

- Manages OKRs (Objectives & Key Results)
- Tracks work execution (tasks, projects, time)
- Facilitates team collaboration (Founder, Executives, Apprentices)
- Provides AI assistance for automation
- Connects to suppliers and manufacturing partners

### Core Philosophy: Decide → Evaluate → Do

The app is organized around three pillars:
- **Decide**: Strategic decisions (OKRs, approvals, at-risk objectives)
- **Evaluate**: Review completed work (submissions, approvals)
- **Do**: Execute tasks (active work plans, in-progress items)

### User Roles

1. **Founder** - Full access, strategic decisions, financial oversight
2. **Fractional Executive** - Review & approve work, manage function-specific tasks
3. **Apprentice** - Execute tasks, request reviews, track time
4. **Government** (NEW) - Read-only across all workspaces for regulatory oversight

---

## Architecture

### High-Level Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                     Mobile App (React Native)                │
├─────────────────────────────────────────────────────────────┤
│  Expo Router Navigation  │  React Query Cache  │  Zustand   │
├─────────────────────────────────────────────────────────────┤
│                       API Layer (RBAC)                       │
├─────────────────────────────────────────────────────────────┤
│              AsyncStorage (Simulated Backend)                │
└─────────────────────────────────────────────────────────────┘
```

### Two-Layer Data Architecture

#### Layer 1: Public Marketplace (No workspaceId)
Global resources available to all users:
- 31 UK Suppliers (`/src/lib/marketplace-suppliers.ts`)
- 24 AI Tools (`/src/lib/marketplace-ai-tools.ts`)
- 60 Fractional Executives & Apprentices (`/src/lib/candidates-seed.ts`)

#### Layer 2: Private Company Data (With workspaceId)
Company-specific operational data:
- OKRs (`/src/lib/state/okr-store.ts`)
- Work Plans (`/src/lib/state/work-plan-store.ts`)
- Organization Members (`/src/lib/state/organization-store.ts`)
- Financial Data (`/src/lib/financial-calculations.ts`)

**Key Principle**: Every company record includes `workspaceId` for multi-tenant isolation.

---

## Tech Stack

### Frontend
- **Framework**: Expo SDK 53 + React Native 0.76.7
- **Language**: TypeScript 5.8 (strict mode enabled)
- **Navigation**: Expo Router (file-based routing)
- **Styling**: NativeWind (TailwindCSS for React Native)
- **Animations**: react-native-reanimated v3
- **Icons**: lucide-react-native

### State Management
- **Global State**: Zustand (auth, workspace, user preferences)
- **Server State**: React Query (data fetching, caching, mutations)
- **Local Storage**: AsyncStorage (persistent data)

### Build System
- **Package Manager**: Bun (faster than npm)
- **Bundler**: Metro (default React Native bundler)
- **Dev Server**: Expo Dev Client (running on port 8081)

### Key Dependencies
```json
{
  "expo": "~53.0.0",
  "react-native": "0.76.7",
  "expo-router": "~4.0.0",
  "zustand": "^4.5.5",
  "@tanstack/react-query": "^5.59.16",
  "nativewind": "^4.1.23",
  "react-native-reanimated": "~3.16.1",
  "lucide-react-native": "^0.468.0"
}
```

---

## Project Structure

```
/home/user/workspace/
├── src/
│   ├── app/                          # Expo Router screens
│   │   ├── _layout.tsx               # Root layout with auth guard
│   │   ├── welcome.tsx               # Role selection splash
│   │   ├── tutorial.tsx              # Interactive onboarding
│   │   ├── onboarding.tsx            # Profile setup
│   │   ├── sign-in.tsx               # Authentication
│   │   ├── sign-up.tsx               # Registration
│   │   └── (tabs)/                   # Main app (authenticated)
│   │       ├── _layout.tsx           # Tab navigation
│   │       ├── index.tsx             # Home dashboard
│   │       ├── decide.tsx            # Strategic decisions
│   │       ├── do.tsx                # Active work
│   │       ├── evaluate.tsx          # Review queue
│   │       ├── make.tsx              # AI tools & suppliers
│   │       ├── community.tsx         # Marketplace
│   │       └── settings.tsx          # Settings
│   ├── components/                   # Reusable UI components
│   │   ├── HapticPressable.tsx      # Button with haptic feedback
│   │   ├── EmptyState.tsx           # Empty state patterns
│   │   └── RefreshableScrollView.tsx # Pull-to-refresh
│   ├── lib/
│   │   ├── api/                      # API layer (RBAC enforced)
│   │   │   ├── index.ts              # User, Workspace, OKR, Task APIs
│   │   │   └── seed.ts               # Demo data initialization
│   │   ├── state/                    # Centralized Zustand stores
│   │   │   ├── app-store.ts          # Auth, workspace, theme
│   │   │   ├── okr-store.ts          # OKRs with workspace filtering
│   │   │   ├── work-plan-store.ts    # Work plans
│   │   │   ├── organization-store.ts # Team, AI agents, suppliers
│   │   │   └── supplier-store.ts     # Supplier marketplace
│   │   ├── financial-calculations.ts # Single source for financial data
│   │   ├── storage.ts                # AsyncStorage wrapper
│   │   ├── cn.ts                     # Tailwind className utility
│   │   └── design-system.ts          # Design tokens
│   └── types/
│       └── index.ts                  # TypeScript type definitions
├── CLAUDE.md                         # AI agent instructions
├── README.md                         # Feature overview & status
├── DEVELOPER_ONBOARDING.md           # Developer quick start
└── API_REFERENCE.md                  # Complete API docs
```

---

## Data Model & State Management

### Zustand Stores (Global State)

#### 1. App Store (`/src/lib/state/app-store.ts`)
```typescript
interface AppState {
  // Auth
  currentUser: User | null;
  authToken: string | null;
  setCurrentUser: (user: User | null) => void;
  setAuthToken: (token: string | null) => void;

  // Workspace
  workspaces: Workspace[];
  currentWorkspaceId: string | null;
  setCurrentWorkspace: (id: string) => void;

  // Theme
  theme: 'light' | 'dark' | 'off-white' | 'system';
  setTheme: (theme: Theme) => void;
}
```

**Usage Pattern**:
```typescript
// Subscribe to specific slice (prevents re-renders)
const currentUser = useAppStore(s => s.currentUser);
const setTheme = useAppStore(s => s.setTheme);

// Access without subscription (for actions only)
const logout = () => {
  useAppStore.getState().setCurrentUser(null);
  useAppStore.getState().setAuthToken(null);
};
```

#### 2. OKR Store (`/src/lib/state/okr-store.ts`)
```typescript
interface OKRState {
  okrs: OKR[];

  // Initialization
  initializeOKRs: () => void;

  // Getters (workspace-filtered)
  getOKRsByWorkspace: (workspaceId: string) => OKR[];
  getOKRsByFunction: (func: BusinessFunction) => OKR[];
  getOKRsNeedingDecisions: () => OKR[];

  // CRUD
  addOKR: (okr: OKR) => void;
  updateOKR: (id: string, updates: Partial<OKR>) => void;
  deleteOKR: (id: string) => void;
  toggleOKRExpanded: (id: string) => void;
}
```

**Key Points**:
- All OKRs have `workspaceId` for multi-tenancy
- Selectors use Zustand's shallow equality by default
- Store initialized once on app launch

#### 3. Work Plan Store (`/src/lib/state/work-plan-store.ts`)
Similar pattern to OKR Store, manages tasks and work plans.

#### 4. Organization Store (`/src/lib/state/organization-store.ts`)
Manages team members, AI agents, and supplier engagements.

#### 5. Supplier Store (`/src/lib/state/supplier-store.ts`)
Marketplace catalog for suppliers (no workspaceId).

### React Query (Server State)

Used for async data fetching with automatic caching:

```typescript
// Example: Fetch OKRs
const { data: okrs, isLoading, error, refetch } = useQuery({
  queryKey: ['okrs', workspaceId],
  queryFn: () => okrApi.getByWorkspace(workspaceId),
  staleTime: 5 * 60 * 1000, // 5 minutes
});

// Example: Create OKR
const createOKR = useMutation({
  mutationFn: (newOKR: OKR) => okrApi.create(newOKR),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['okrs'] });
  },
});
```

**Benefits**:
- Automatic caching and cache invalidation
- Background refetching
- Optimistic updates
- Loading/error states out of the box

---

## Authentication & Authorization

### Authentication Flow

```
User → Sign In Screen → Enter Email
     → API: userApi.getByEmail()
     → Store user + token in Zustand
     → Check onboarding status
     → Navigate to /(tabs) or /onboarding
```

**Files**:
- `/src/app/sign-in.tsx` - Login UI
- `/src/app/sign-up.tsx` - Registration UI
- `/src/lib/api/index.ts` - `userApi.getByEmail()`

### Demo Accounts

| Role | Email | Password |
|------|-------|----------|
| Founder | `founder@fractional.com` | None (mock auth) |
| Executive | `exec@fractional.com` | None (mock auth) |
| Apprentice | `apprentice@fractional.com` | None (mock auth) |

### Authorization (RBAC)

**Permission Matrix** (`/src/lib/api/index.ts`):

```typescript
const permissions: Record<Role, Record<string, string[]>> = {
  Founder: { '*': ['*'] }, // Full access
  FractionalExec: {
    okr: ['read', 'update'],
    workPlan: ['read', 'update', 'approve'],
    task: ['read', 'update', 'assign'],
  },
  Apprentice: {
    task: ['read', 'create', 'update_own'],
    workPlan: ['read', 'request_review'],
  },
  Government: {
    '*': ['read', 'view_all_workspaces'], // Read-only, all workspaces
  },
};
```

**Permission Check**:
```typescript
function checkPermission(
  role: Role,
  action: string,
  resource: string
): boolean {
  const rolePerms = permissions[role];
  if (rolePerms['*']?.includes('*')) return true; // Founder
  return rolePerms[resource]?.includes(action) ?? false;
}
```

**Usage in API**:
```typescript
export const okrApi = {
  create: async (okr: OKR, actorRole: Role): Promise<OKR> => {
    if (!checkPermission(actorRole, 'create', 'okr')) {
      throw new Error('Permission denied');
    }
    // ... create logic
  },
};
```

---

## Navigation System

### Expo Router File-Based Routing

Expo Router uses file structure to define routes:

```
src/app/
├── _layout.tsx          → Root layout (checks auth)
├── welcome.tsx          → /welcome
├── sign-in.tsx          → /sign-in
└── (tabs)/              → Authenticated routes
    ├── _layout.tsx      → Tab navigator
    ├── index.tsx        → /(tabs)  (Home)
    ├── decide.tsx       → /(tabs)/decide
    └── do.tsx           → /(tabs)/do
```

### Navigation Patterns

**1. Programmatic Navigation**:
```typescript
import { router } from 'expo-router';

// Navigate to route
router.push('/decide');

// Navigate with params
router.push({
  pathname: '/make',
  params: { tab: 'ai' },
});

// Replace (no back button)
router.replace('/(tabs)');

// Go back
router.back();
```

**2. Tab Navigation** (`/src/app/(tabs)/_layout.tsx`):
```typescript
<Tabs screenOptions={{ headerShown: false }}>
  <Tabs.Screen
    name="index"
    options={{
      title: 'Home',
      tabBarIcon: ({ color }) => <Home size={24} color={color} />,
    }}
  />
  <Tabs.Screen name="decide" options={{ title: 'Decide' }} />
  {/* ... more tabs */}
</Tabs>
```

**3. Auth Guard** (`/src/app/_layout.tsx`):
```typescript
export default function RootLayout() {
  const currentUser = useAppStore(s => s.currentUser);

  useEffect(() => {
    if (!currentUser) {
      router.replace('/welcome');
    }
  }, [currentUser]);

  return <Stack />;
}
```

---

## Key Features Implementation

### 1. OKR Management

**Location**: `/src/app/(tabs)/decide.tsx`, `/src/lib/state/okr-store.ts`

**Data Structure**:
```typescript
interface OKR {
  id: string;
  workspaceId: string;
  function: BusinessFunction;
  title: string;
  description: string;
  owner: string;
  startDate: string;
  endDate: string;
  status: 'on-track' | 'at-risk' | 'off-track';
  objectives: Objective[];
  isExpanded: boolean;
}

interface Objective {
  id: string;
  title: string;
  target: string;
  current: string;
  progress: number; // 0-100
  status: 'on-track' | 'at-risk' | 'off-track';
}
```

**Key Features**:
- OKR Ideas library with 40+ templates
- Team member assignment with dropdown
- Initial work plan creation
- Progress tracking with visual indicators

**Code Example**:
```typescript
// Create OKR
const handleCreateOKR = () => {
  const newOKR: OKR = {
    id: `okr-${Date.now()}`,
    workspaceId: currentWorkspace?.id || '',
    function: 'Marketing',
    title: 'Achieve Product-Market Fit',
    description: 'Validate product with 100 paying customers',
    owner: 'Sarah Chen',
    startDate: 'Q1 2026',
    endDate: 'Q4 2026',
    status: 'on-track',
    objectives: [],
    isExpanded: false,
  };

  addOKR(newOKR);
};
```

### 2. Work Management (Do Tab)

**Location**: `/src/app/(tabs)/do.tsx`, `/src/lib/state/work-plan-store.ts`

**Data Structure**:
```typescript
interface WorkPlan {
  id: string;
  workspaceId: string;
  title: string;
  description: string;
  status: 'not-started' | 'in-progress' | 'blocked' | 'completed';
  assignedTo: string;
  assignedRole: 'Founder' | 'FractionalExec' | 'Apprentice';
  function: BusinessFunction;
  dueDate: string;
  linkedOKR?: string;
}
```

**Role-Specific Views**:
```typescript
// Apprentices see only their work
const apprenticeWork = useWorkPlanStore(s =>
  s.getApprenticeWorkPlans(currentUser.id)
);

// Founders see all work by function
const founderWork = useWorkPlanStore(s =>
  s.getWorkPlansByFunction('Marketing')
);

// Executives see their assigned work
const execWork = useWorkPlanStore(s =>
  s.getExecutiveWorkPlans(currentUser.id)
);
```

### 3. Financial Dashboard (Founder-Only)

**Location**: `/src/lib/financial-calculations.ts`

**Single Source of Truth**:
```typescript
export const FINANCIAL_DATA = {
  revenue: {
    monthly: 45000,
    breakdown: {
      productSales: 30000,
      services: 10000,
      recurring: 5000,
    },
  },
  costs: {
    bom: {
      materials: 12000,
      manufacturing: 4500,
      shipping: 2000,
    },
    team: {
      founders: 10000,
      executives: 12800,
      apprentices: 5800,
    },
    aiServices: 2200,
    other: 8500,
  },
  cash: 600000,
};
```

**Calculations**:
```typescript
export function getFinancialMetrics() {
  const monthlyRevenue = FINANCIAL_DATA.revenue.monthly;
  const grossProfit = monthlyRevenue - getTotalBOM();
  const monthlyBurn = calculateMonthlyBurn();
  const runway = calculateRunway();

  return {
    revenue: monthlyRevenue,
    grossProfit,
    burn: monthlyBurn,
    runway,
    cash: FINANCIAL_DATA.cash,
  };
}
```

**Usage**:
```typescript
const metrics = getFinancialMetrics();
// All tabs use this function → consistent data everywhere
```

### 4. Team Directory & Organization Chart

**Location**: `/src/app/org-diagram.tsx`, `/src/lib/state/organization-store.ts`

**Hierarchy**:
```
Founders (Blue)
    ↓
Fractional Executives (Violet)
    ↓
Apprentices (Emerald)
```

**Data Structure**:
```typescript
interface OrganizationMember {
  id: string;
  workspaceId: string;
  name: string;
  role: 'Founder' | 'FractionalExec' | 'Apprentice';
  function: BusinessFunction;
  email: string;
  phone?: string;
  dailyRate?: number;
  reportsTo?: string; // ID of manager
}
```

### 5. Marketplace (Community Tab)

**Location**: `/src/app/(tabs)/community.tsx`

**Components**:
- **Executives**: Browse fractional executives by function
- **Apprentices**: Discover junior talent
- **Suppliers**: 31 UK manufacturers
- **AI Agents**: 24 third-party AI tools

**Data Sources**:
- `/src/lib/candidates-seed.ts` (Executives & Apprentices)
- `/src/lib/state/supplier-store.ts` (Suppliers)
- `/src/lib/marketplace-ai-tools.ts` (AI Tools)

---

## UI/UX Patterns

### Design System

**Location**: `/src/lib/design-system.ts`

**Key Tokens**:
```typescript
export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
};

export const colors = {
  primary: '#3b82f6',
  success: '#10b981',
  warning: '#eab308',
  danger: '#ef4444',
};

export const typography = {
  heading1: 'text-4xl font-bold',
  heading2: 'text-2xl font-bold',
  body: 'text-base',
  caption: 'text-sm',
};
```

### Common Components

**1. HapticPressable** (`/src/components/HapticPressable.tsx`):
```typescript
<HapticPressable
  onPress={handlePress}
  hapticType="light" // light, medium, heavy, success, error
  className="bg-blue-500 rounded-xl p-4"
>
  <Text className="text-white font-bold">Tap Me</Text>
</HapticPressable>
```

**2. EmptyState** (`/src/components/EmptyState.tsx`):
```typescript
<EmptyState
  icon={<Target size={48} color="#94a3b8" />}
  title="No OKRs Yet"
  description="Create your first OKR to get started"
  primaryAction={{
    label: "Create OKR",
    onPress: () => setShowModal(true),
  }}
/>
```

**3. RefreshableScrollView** (`/src/components/RefreshableScrollView.tsx`):
```typescript
<RefreshableScrollView onRefresh={refetch}>
  {data.map(item => <ItemCard key={item.id} item={item} />)}
</RefreshableScrollView>
```

### Animation Patterns

**Using react-native-reanimated**:
```typescript
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';

function AnimatedButton() {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={animatedStyle}>
      <Pressable
        onPressIn={() => { scale.value = withTiming(0.95); }}
        onPressOut={() => { scale.value = withTiming(1); }}
      >
        <Text>Press Me</Text>
      </Pressable>
    </Animated.View>
  );
}
```

---

## Development Workflow

### 1. Running the App

```bash
# The app is already running in Vibecode on port 8081
# Just view it in the Vibecode mobile app
```

### 2. Type Checking

```bash
bun run typecheck
```

**Expected Output**:
```
✓ No TypeScript errors found (89 files checked)
```

### 3. Linting

```bash
bun run lint
```

### 4. Adding a New Feature

**Step-by-Step Example**: Adding a "Notes" feature

1. **Define Types** (`/src/types/index.ts`):
```typescript
export interface Note {
  id: string;
  workspaceId: string;
  title: string;
  content: string;
  createdBy: string;
  createdAt: string;
}
```

2. **Create Store** (`/src/lib/state/note-store.ts`):
```typescript
import { create } from 'zustand';

interface NoteState {
  notes: Note[];
  initializeNotes: () => void;
  addNote: (note: Note) => void;
  updateNote: (id: string, updates: Partial<Note>) => void;
  deleteNote: (id: string) => void;
}

export const useNoteStore = create<NoteState>((set, get) => ({
  notes: [],

  initializeNotes: () => {
    const seedNotes: Note[] = [
      {
        id: 'note-1',
        workspaceId: 'workspace-demo',
        title: 'First Note',
        content: 'This is a note',
        createdBy: 'user-1',
        createdAt: '2026-01-13',
      },
    ];
    set({ notes: seedNotes });
  },

  addNote: (note) => set(state => ({
    notes: [...state.notes, note],
  })),

  updateNote: (id, updates) => set(state => ({
    notes: state.notes.map(n => n.id === id ? { ...n, ...updates } : n),
  })),

  deleteNote: (id) => set(state => ({
    notes: state.notes.filter(n => n.id !== id),
  })),
}));
```

3. **Create Screen** (`/src/app/(tabs)/notes.tsx`):
```typescript
import { View, Text, ScrollView, Pressable } from 'react-native';
import { useNoteStore } from '@/lib/state/note-store';

export default function NotesScreen() {
  const notes = useNoteStore(s => s.notes);
  const addNote = useNoteStore(s => s.addNote);

  return (
    <View className="flex-1 bg-white dark:bg-slate-950">
      <ScrollView className="flex-1 px-6 py-4">
        {notes.map(note => (
          <View key={note.id} className="bg-gray-100 rounded-xl p-4 mb-3">
            <Text className="text-gray-900 font-bold text-lg">{note.title}</Text>
            <Text className="text-gray-600 mt-2">{note.content}</Text>
          </View>
        ))}
      </ScrollView>

      <Pressable
        onPress={() => addNote({
          id: `note-${Date.now()}`,
          workspaceId: 'workspace-demo',
          title: 'New Note',
          content: 'Note content',
          createdBy: 'user-1',
          createdAt: new Date().toISOString(),
        })}
        className="bg-blue-500 rounded-xl py-4 mx-6 mb-6"
      >
        <Text className="text-white text-center font-bold">Add Note</Text>
      </Pressable>
    </View>
  );
}
```

4. **Register Route** (`/src/app/(tabs)/_layout.tsx`):
```typescript
<Tabs.Screen
  name="notes"
  options={{
    title: 'Notes',
    tabBarIcon: ({ color }) => <FileText size={24} color={color} />,
  }}
/>
```

5. **Initialize Store** (`/src/app/_layout.tsx`):
```typescript
import { useNoteStore } from '@/lib/state/note-store';

useEffect(() => {
  useNoteStore.getState().initializeNotes();
}, []);
```

---

## Testing & Debugging

### Debugging Tools

**1. Console Logs**:
```typescript
console.log('Debug:', data);
console.error('Error:', error);
```

**2. React Native Debugger**:
- Press `j` in terminal to open debugger
- Use Chrome DevTools

**3. Zustand DevTools**:
```typescript
import { devtools } from 'zustand/middleware';

export const useAppStore = create(
  devtools((set) => ({
    // ... state
  }), { name: 'AppStore' })
);
```

**4. React Query DevTools**:
```typescript
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

<ReactQueryDevtools initialIsOpen={false} />
```

### Common Issues & Solutions

**Issue 1**: "Cannot read property of undefined"
```typescript
// ❌ Bad
const name = user.name;

// ✅ Good
const name = user?.name ?? 'Unknown';
```

**Issue 2**: "Maximum update depth exceeded"
```typescript
// ❌ Bad - creates infinite loop
useEffect(() => {
  setCount(count + 1);
});

// ✅ Good - add dependency
useEffect(() => {
  setCount(count + 1);
}, []);
```

**Issue 3**: TypeScript error "Type X is not assignable to type Y"
```typescript
// ❌ Bad
const status: 'pending' | 'approved' = someVariable;

// ✅ Good - use type assertion or validation
const status = someVariable as 'pending' | 'approved';
```

---

## Deployment

### Vibecode Deployment

Since this app runs in Vibecode:

1. **Tap "Share"** in Vibecode app (top right)
2. **Select "Submit to App Store"**
3. **Follow guided submission process**

**Note**: Vibecode handles `app.json`, `eas.json`, and build configuration.

### Manual Deployment (Outside Vibecode)

If deploying independently:

**1. Install EAS CLI**:
```bash
npm install -g eas-cli
eas login
```

**2. Configure** (`eas.json`):
```json
{
  "cli": {
    "version": ">= 5.0.0"
  },
  "build": {
    "production": {
      "ios": {
        "buildType": "release"
      }
    }
  },
  "submit": {
    "production": {
      "ios": {
        "appleId": "your-apple-id@example.com"
      }
    }
  }
}
```

**3. Build**:
```bash
eas build --platform ios --profile production
```

**4. Submit**:
```bash
eas submit --platform ios --profile production
```

### Environment Variables

**Development** (`.env.local`):
```
API_URL=http://localhost:3000
COPILOT_MODE=stub
```

**Production** (`.env.production`):
```
API_URL=https://api.centauros.com
COPILOT_MODE=api
OPENAI_API_KEY=sk-...
```

---

## Performance Optimization

### 1. Zustand Selectors

**❌ Bad** (causes unnecessary re-renders):
```typescript
const store = useAppStore(); // subscribes to entire store
const userName = store.currentUser?.name;
```

**✅ Good** (subscribes only to specific data):
```typescript
const userName = useAppStore(s => s.currentUser?.name);
```

### 2. React Query Optimization

**Stale Time**:
```typescript
useQuery({
  queryKey: ['okrs'],
  queryFn: fetchOKRs,
  staleTime: 5 * 60 * 1000, // 5 minutes - reduces refetches
});
```

**Prefetching**:
```typescript
const queryClient = useQueryClient();

// Prefetch on mount
useEffect(() => {
  queryClient.prefetchQuery({
    queryKey: ['team'],
    queryFn: fetchTeam,
  });
}, []);
```

### 3. List Optimization

**Use FlatList for long lists**:
```typescript
<FlatList
  data={items}
  renderItem={({ item }) => <ItemCard item={item} />}
  keyExtractor={item => item.id}
  removeClippedSubviews={true} // Performance boost
  maxToRenderPerBatch={10}
  windowSize={5}
/>
```

### 4. Image Optimization

```typescript
<Image
  source={{ uri: imageUrl }}
  style={{ width: 100, height: 100 }}
  resizeMode="cover"
  // Add cache control
  cachePolicy="memory-disk"
/>
```

---

## Security Best Practices

### 1. Input Validation

```typescript
function validateEmail(email: string): boolean {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
}

// Use in forms
if (!validateEmail(email)) {
  setError('Invalid email format');
  return;
}
```

### 2. RBAC Enforcement

**Always check permissions in API layer**:
```typescript
export const taskApi = {
  update: async (id: string, updates: Partial<Task>, actorRole: Role) => {
    if (!checkPermission(actorRole, 'update', 'task')) {
      throw new Error('Permission denied');
    }
    // ... update logic
  },
};
```

### 3. Audit Logging

```typescript
function logAction(
  workspaceId: string,
  actorId: string,
  action: string,
  objectType: string,
  objectId: string
) {
  const log: AuditLog = {
    id: `log-${Date.now()}`,
    workspaceId,
    actorId,
    action,
    objectType,
    objectId,
    timestamp: new Date().toISOString(),
  };

  // Store in database
  auditLogApi.create(log);
}
```

### 4. Sensitive Data

**Never log sensitive data**:
```typescript
// ❌ Bad
console.log('User data:', user);

// ✅ Good
console.log('User ID:', user.id);
```

---

## Troubleshooting Guide

### Common Errors

**Error 1**: "Invariant Violation: requireNativeComponent"
```
Solution: Clear cache and restart
bun expo start -c
```

**Error 2**: "Unable to resolve module"
```
Solution: Reinstall dependencies
bun install
```

**Error 3**: "Metro bundler has encountered an error"
```
Solution: Reset Metro
bun expo start --reset-cache
```

**Error 4**: TypeScript errors after adding new types
```
Solution: Restart TypeScript server in VS Code
Cmd+Shift+P → "TypeScript: Restart TS Server"
```

---

## Additional Resources

### Official Documentation
- [Expo Docs](https://docs.expo.dev/)
- [React Native Docs](https://reactnative.dev/)
- [Zustand Docs](https://zustand-demo.pmnd.rs/)
- [React Query Docs](https://tanstack.com/query/latest)
- [NativeWind Docs](https://www.nativewind.dev/)

### Internal Documentation
- `README.md` - Feature overview & status
- `DEVELOPER_ONBOARDING.md` - Quick start guide
- `API_REFERENCE.md` - Complete API documentation
- `CLAUDE.md` - AI agent instructions

### Code Examples
- Check `/src/lib/api/seed.ts` for data seeding examples
- Check `/src/types/index.ts` for all type definitions
- Check `/src/lib/state/*.ts` for Zustand store patterns

---

## Contact & Support

For questions about the codebase:
- Review inline TSDoc comments in code
- Check type definitions in `/src/types/index.ts`
- Explore seed data in `/src/lib/api/seed.ts`

**Built with Vibecode** - AI-powered app builder requiring no coding skills.

---

## Version History

- **v1.0.0** (2026-01-13) - Initial release
  - Complete OKR management system
  - Work plan execution
  - Team directory & org chart
  - Financial dashboard
  - Marketplace (Suppliers, Executives, AI Tools)
  - Multi-tenant architecture
  - RBAC with 4 roles
  - 7 main tabs, 89 TypeScript files, 0 errors

---

**Last Updated**: 2026-01-13
**Maintained By**: Centaur OS Engineering Team
**License**: Proprietary
