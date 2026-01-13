# Developer Onboarding Guide - Centaur OS

**Welcome to Centaur OS!** This guide will help you understand the codebase, architecture, and development workflow.

---

## Table of Contents

1. [What is Centaur OS?](#what-is-centaur-os)
2. [Quick Start](#quick-start)
3. [Project Structure](#project-structure)
4. [Core Concepts](#core-concepts)
5. [Architecture Deep Dive](#architecture-deep-dive)
6. [Key Features Implementation](#key-features-implementation)
7. [State Management](#state-management)
8. [Navigation & Routing](#navigation--routing)
9. [Styling System](#styling-system)
10. [Common Patterns](#common-patterns)
11. [Adding New Features](#adding-new-features)
12. [Debugging Tips](#debugging-tips)
13. [Testing Strategy](#testing-strategy)

---

## What is Centaur OS?

**Centaur OS** is an operating system for lean hardware startups that combines:
- **Human Workers**: Fractional executives and apprentices
- **AI Agents**: Specialized AI tools for each business function
- **UK Manufacturing Network**: 31+ suppliers and partners

### The Core Philosophy: Decide • Evaluate • Do

1. **Decide** → Founders set strategic OKRs
2. **Evaluate** → Review progress and make adjustments
3. **Do** → Executives and apprentices execute work plans

### User Roles (RBAC System)

- **Founder**: Full access, strategic decision-making
- **Fractional Executive**: Manages their function, reviews work
- **Apprentice**: Executes tasks, learns from executives
- **Government**: Read-only oversight across all companies

---

## Quick Start

### Prerequisites

```bash
# Required
node >= 18.x
bun >= 1.0.0  # We use bun instead of npm

# Recommended
Expo Go app on your phone
VS Code with TypeScript extension
```

### Installation

```bash
# Clone the repo
git clone <repo-url>
cd centaur-os

# Install dependencies
bun install

# Start the development server
bun run start

# Scan QR code with Expo Go app to view on your phone
```

### First Run

The app will:
1. Initialize demo data (OKRs, work plans, marketplace)
2. Show welcome screen with role selection
3. Guide you through role-specific onboarding

**Demo Credentials:** Any email/password will work (simulated auth)

---

## Project Structure

```
centaur-os/
├── src/
│   ├── app/                    # 🚀 Expo Router screens (file-based routing)
│   │   ├── _layout.tsx         # Root layout with providers
│   │   ├── index.tsx           # Redirect to welcome
│   │   ├── welcome.tsx         # Role selection screen
│   │   ├── sign-in.tsx         # Authentication
│   │   ├── sign-up.tsx
│   │   ├── (tabs)/             # Main app tabs
│   │   │   ├── _layout.tsx     # Tab bar configuration
│   │   │   ├── index.tsx       # Home dashboard (role-specific)
│   │   │   ├── decide.tsx      # OKR management
│   │   │   ├── do.tsx          # Work execution
│   │   │   ├── evaluate.tsx    # Progress reviews
│   │   │   ├── community.tsx   # Marketplace (suppliers, AI tools, executives)
│   │   │   └── settings.tsx    # User settings & help
│   │   ├── onboarding-*.tsx    # Role-specific onboarding flows
│   │   ├── tutorial.tsx        # Interactive feature tutorial
│   │   └── guilds.tsx          # Cross-company communities
│   │
│   ├── components/             # 🧩 Reusable UI components
│   │   ├── EngagementSections.tsx  # Role-specific dashboard sections
│   │   └── [other components]
│   │
│   ├── lib/                    # 🔧 Business logic & utilities
│   │   ├── state/              # Zustand stores (global state)
│   │   │   ├── app-store.ts    # Auth, user, workspace
│   │   │   ├── okr-store.ts    # OKRs (strategic objectives)
│   │   │   ├── work-plan-store.ts  # Work plans & tasks
│   │   │   └── organization-store.ts  # Team members, AI agents, suppliers
│   │   │
│   │   ├── api/                # API layer (currently simulated with AsyncStorage)
│   │   │   ├── index.ts        # Main API with RBAC
│   │   │   ├── operations.ts   # CRUD operations
│   │   │   └── seed.ts         # Demo data seeding
│   │   │
│   │   ├── storage.ts          # AsyncStorage abstraction (MMKV + AsyncStorage)
│   │   ├── financial-calculations.ts  # Runway, burn rate calculations
│   │   │
│   │   ├── marketplace-*.ts    # 📦 Marketplace catalogs (Layer 1)
│   │   │   ├── marketplace-suppliers.ts     # 31 UK suppliers
│   │   │   ├── marketplace-ai-tools.ts      # 24 AI tools (was third-party-ai-tools.ts)
│   │   │   └── marketplace-executives.ts    # 60 executives & apprentices
│   │   │
│   │   └── cn.ts               # TailwindCSS className merger
│   │
│   ├── types/                  # 📝 TypeScript type definitions
│   │   └── index.ts            # All app types (User, OKR, Task, etc.)
│   │
│   └── ...
│
├── .claude/                    # Claude AI skills & commands
├── patches/                    # React Native patches
├── CLAUDE.md                   # System instructions for Claude
├── README.md                   # User-facing documentation
├── DEVELOPER_ONBOARDING.md     # This file
├── PRODUCTION_READINESS_AUDIT_2026.md  # Production migration guide
└── package.json
```

---

## Core Concepts

### 1. Multi-Tenancy Architecture

**Two-Layer Data Model:**

#### Layer 1: Public Marketplace (No `workspaceId`)
Global catalogs available to everyone:
- **31 Suppliers**: UK manufacturers (`/src/lib/marketplace-suppliers.ts`)
- **24 AI Tools**: Third-party services (`/src/lib/marketplace-ai-tools.ts`)
- **60 Executives**: Fractional execs & apprentices (`/src/lib/marketplace-executives.ts`)

#### Layer 2: Private Company Data (With `workspaceId`)
Company-specific operational data:
- **OKRs**: Strategic objectives (`/src/lib/state/okr-store.ts`)
- **Work Plans**: Tasks & execution (`/src/lib/state/work-plan-store.ts`)
- **Organization**: Hired team members (`/src/lib/state/organization-store.ts`)

**Key Principle:** Every company data record has a `workspaceId` for isolation.

```typescript
// Example: OKR with workspace isolation
interface OKR {
  id: string;
  workspaceId: string;  // 🔑 Multi-tenancy key
  function: BusinessFunction;
  title: string;
  description: string;
  owner: string;
  status: 'on-track' | 'at-risk' | 'off-track';
  objectives: Objective[];
}

// Filtering by workspace
const companyOKRs = okrs.filter(okr => okr.workspaceId === currentWorkspaceId);
```

### 2. Role-Based Access Control (RBAC)

**4 Roles with different permissions:**

| Role | Permissions | Use Case |
|------|------------|----------|
| **Founder** | Full access to everything | Strategic decisions, hiring |
| **Fractional Executive** | Read + Update + Approve | Manage their function |
| **Apprentice** | Execute tasks | Complete assigned work |
| **Government** | Read-only across all workspaces | Regulatory oversight |

**Implementation:** `/src/lib/api/index.ts` - `checkPermission()` function

```typescript
export function checkPermission(
  role: Role,
  action: string,
  resource: string
): boolean {
  const permissions: Record<Role, Record<string, string[]>> = {
    Founder: { '*': ['*'] }, // Can do anything
    Apprentice: {
      task: ['read', 'create', 'update_own', 'request_review'],
    },
    FractionalExec: {
      task: ['read', 'update', 'approve'],
      okr: ['read', 'update'],
    },
    Government: {
      '*': ['read', 'view_all_workspaces'], // Read-only everywhere
    },
  };

  // Permission checking logic...
}
```

### 3. Business Functions

Every work item is organized by function:

- **Marketing**: Brand, demand generation, content
- **Sales**: Pipeline, deals, revenue
- **Engineering**: Product development, R&D
- **Ops**: Manufacturing, supply chain, logistics
- **Finance**: Cash, fundraising, unit economics
- **Admin**: Legal, HR, compliance

**Type Definition:**
```typescript
export type Function =
  | 'Marketing'
  | 'Sales'
  | 'Engineering'
  | 'Ops'
  | 'Finance'
  | 'Admin';
```

---

## Architecture Deep Dive

### Authentication Flow

```
┌─────────────┐
│  App Start  │
└──────┬──────┘
       │
       ├─ First Time?
       │  └─> Welcome → Role Selection → Onboarding → Main App
       │
       └─ Returning User?
          └─> Check Auth → Load Workspace → Main App
```

**Files:**
- `/src/app/sign-in.tsx` - Sign in screen
- `/src/app/sign-up.tsx` - Sign up screen
- `/src/app/welcome.tsx` - Role selection
- `/src/app/onboarding-*.tsx` - Role-specific onboarding
- `/src/lib/state/app-store.ts` - Auth state management

**Current Implementation:** Simulated authentication with AsyncStorage
**Production:** Will use Supabase Auth (see `PRODUCTION_READINESS_AUDIT_2026.md`)

### Data Flow

```
User Action → Component → Zustand Store → AsyncStorage (demo)
                              ↓
                       UI Auto-Updates
```

**Example: Creating an OKR**

```typescript
// 1. User fills form in /src/app/(tabs)/decide.tsx
const handleCreateOKR = () => {
  const newOKR: OKR = {
    id: `okr-${Date.now()}`,
    workspaceId: currentWorkspace?.id || 'workspace-demo-company',
    function: newOKRFunction,
    title: newOKRTitle,
    // ... other fields
  };

  // 2. Add to Zustand store
  addOKR(newOKR);  // From useOKRStore

  // 3. Store automatically updates AsyncStorage (in store definition)
  // 4. UI re-renders automatically (Zustand subscription)
};
```

### Navigation Structure

Using **Expo Router** (file-based routing like Next.js):

```
/                          → index.tsx (redirects to /welcome)
/welcome                   → welcome.tsx
/sign-in                   → sign-in.tsx
/sign-up                   → sign-up.tsx
/tutorial                  → tutorial.tsx

/(tabs)/                   → Tab navigation
  ├─ index                 → Home dashboard
  ├─ decide                → OKRs
  ├─ do                    → Work execution
  ├─ evaluate              → Progress reviews
  ├─ community             → Marketplace
  └─ settings              → User settings

/guilds                    → Cross-company communities (modal)
/onboarding-founder        → Founder onboarding
/onboarding-executive      → Executive onboarding
/onboarding-apprentice     → Apprentice onboarding
```

**Navigation Commands:**
```typescript
import { router } from 'expo-router';

// Navigate to a screen
router.push('/decide');
router.push('/(tabs)/community');

// Go back
router.back();

// Replace (no back)
router.replace('/welcome');

// With params
router.push({
  pathname: '/decide',
  params: { function: 'Marketing' }
});
```

---

## Key Features Implementation

### Feature 1: OKRs (Objectives & Key Results)

**Location:** `/src/app/(tabs)/decide.tsx`

**What it does:**
- Founders create strategic objectives (OKRs)
- Each OKR has 3-5 measurable Key Results
- Status tracking: on-track, at-risk, off-track
- Organized by business function

**Data Model:**
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
  objectives: Objective[];  // Key Results
  isExpanded?: boolean;
}

interface Objective {
  id: string;
  title: string;
  target: string;
  current: string;
  progress: number;  // 0-100
  status: 'on-track' | 'at-risk' | 'off-track';
}
```

**Store:** `/src/lib/state/okr-store.ts`

**Key Methods:**
```typescript
const useOKRStore = create<OKRState>((set, get) => ({
  okrs: [],

  // Initialization
  initializeOKRs: () => { /* Load demo data */ },

  // CRUD
  addOKR: (okr: OKR) => { /* ... */ },
  updateOKR: (id: string, updates: Partial<OKR>) => { /* ... */ },
  deleteOKR: (id: string) => { /* ... */ },

  // Multi-tenancy
  getOKRsByWorkspace: (workspaceId: string) => {
    return get().okrs.filter(okr => okr.workspaceId === workspaceId);
  },

  getAllOKRs: () => get().okrs,  // For Government users
}));
```

**UI Flow:**
1. **List View**: Shows all OKRs for current workspace
2. **Filter**: By function (Marketing, Sales, etc.)
3. **Expand/Collapse**: Click to show Key Results
4. **Create**: Blue "+" button opens modal with form
5. **Status Colors**: Green (on-track), Amber (at-risk), Red (off-track)

---

### Feature 2: Work Plans & Tasks

**Location:** `/src/app/(tabs)/do.tsx`

**What it does:**
- Executives create work plans from OKRs
- Break down into tasks assigned to apprentices
- Track time, progress, and reviews

**Data Model:**
```typescript
interface WorkPlan {
  id: string;
  workspaceId: string;
  okrId: string;  // Links to OKR
  function: BusinessFunction;
  title: string;
  description: string;
  owner: string;
  status: 'planning' | 'in-progress' | 'review' | 'completed';
  tasks: Task[];
  startDate: string;
  endDate: string;
}

interface Task {
  id: string;
  workPlanId: string;
  title: string;
  description: string;
  assignee: string;
  status: 'todo' | 'in-progress' | 'review' | 'done';
  priority: 'low' | 'medium' | 'high';
  estimatedHours: number;
  actualHours?: number;
  dueDate: string;
}
```

**Store:** `/src/lib/state/work-plan-store.ts`

**UI Components:**
- **Kanban Board**: Drag tasks between columns (todo, in-progress, review, done)
- **Task Cards**: Show title, assignee, due date, priority
- **Time Tracking**: Apprentices log hours worked
- **Review System**: Executives review and approve completed work

---

### Feature 3: Community Marketplace

**Location:** `/src/app/(tabs)/community.tsx`

**What it does:**
- Browse 31 UK suppliers, 24 AI tools, 60 executives
- View detailed profiles with pricing, capabilities, reviews
- Request to hire/onboard
- Filter by function, role, location

**Three Tabs:**
1. **Suppliers**: Manufacturing partners (Proto Labs, Tharsus, etc.)
2. **AI Agents**: Third-party tools (Gong, Jasper, 11x Alice, etc.)
3. **Talent**: Fractional executives and apprentices

**Supplier Card Example:**
```typescript
interface Supplier {
  id: string;
  name: string;
  type: 'Prototyping' | 'Low-Volume' | 'Mid-Volume' | 'High-Volume';
  location: { city: string; country: string };
  capabilities: string[];
  certifications: string[];
  pricing: {
    setup: string;
    perUnit: string;
    moq: string;
    leadTime: string;
  };
  caseStudies: CaseStudy[];
  reviews: {
    rating: number;
    totalReviews: number;
    pros: string[];
    cons: string[];
  };
}
```

**Data Files:**
- `/src/lib/marketplace-suppliers.ts` - 31 suppliers
- `/src/lib/marketplace-ai-tools.ts` - 24 AI tools
- `/src/lib/marketplace-executives.ts` - 60 executives

**UI Pattern:**
1. **List View**: Cards with key info (name, location, 3 capabilities)
2. **Search**: Real-time filter by name/capabilities
3. **Function Filter**: Show only relevant to selected function
4. **Detail Modal**: Full-screen scrollable modal with 10+ sections
5. **Action Button**: "Request Quote" or "View Profile"

---

### Feature 4: Financial Dashboard

**Location:** `/src/app/(tabs)/index.tsx` (Founder dashboard)

**What it does:**
- Track cash runway, burn rate, revenue
- Monitor unit economics (COGS, CAC, LTV)
- Compare costs: Traditional team vs Centaur OS

**Calculations:** `/src/lib/financial-calculations.ts`

```typescript
// Financial metrics
export function getFinancialMetrics() {
  const monthlyBurn = calculateMonthlyBurn(FINANCIAL_DATA.costs);
  const runway = calculateRunway(FINANCIAL_DATA.cashPosition, FINANCIAL_DATA.costs);

  return {
    cashPosition: FINANCIAL_DATA.cashPosition,
    monthlyRevenue: FINANCIAL_DATA.monthlyRevenue,
    monthlyBurn,
    runway: Math.round(runway * 10) / 10,  // Rounded to 1 decimal
    netCashFlow: FINANCIAL_DATA.monthlyRevenue - monthlyBurn,
  };
}

// Runway calculation
export function calculateRunway(
  cashPosition: number,
  costs: typeof FINANCIAL_DATA.costs
): number {
  const monthlyBurn = calculateMonthlyBurn(costs);
  return cashPosition / monthlyBurn;
}
```

**UI Components:**
- **Runway Card**: Large purple card showing months remaining
- **Burn Rate**: Monthly spend breakdown
- **Cost Comparison**: Traditional vs Centaur OS savings
- **Charts**: Revenue, expenses, runway over time

---

## State Management

### Zustand Stores

**Why Zustand?**
- Simple, no boilerplate
- Great TypeScript support
- Excellent performance with selectors
- No context providers needed

**Pattern:**

```typescript
// Define interface
interface MyStore {
  // State
  items: Item[];
  selectedItem: Item | null;

  // Actions
  addItem: (item: Item) => void;
  updateItem: (id: string, updates: Partial<Item>) => void;
  deleteItem: (id: string) => void;
  setSelectedItem: (item: Item | null) => void;
}

// Create store
export const useMyStore = create<MyStore>((set, get) => ({
  // Initial state
  items: [],
  selectedItem: null,

  // Actions
  addItem: (item) => set((state) => ({
    items: [...state.items, item]
  })),

  updateItem: (id, updates) => set((state) => ({
    items: state.items.map(item =>
      item.id === id ? { ...item, ...updates } : item
    )
  })),

  deleteItem: (id) => set((state) => ({
    items: state.items.filter(item => item.id !== id)
  })),

  setSelectedItem: (item) => set({ selectedItem: item }),
}));
```

**Using in Components:**

```typescript
import { useMyStore } from '@/lib/state/my-store';

function MyComponent() {
  // ✅ Good: Use selector (only re-renders when items change)
  const items = useMyStore(s => s.items);
  const addItem = useMyStore(s => s.addItem);

  // ❌ Bad: Subscribes to entire store (re-renders on any change)
  const store = useMyStore();

  // ✅ Good: Select primitive value
  const itemCount = useMyStore(s => s.items.length);

  // ❌ Bad: Select derived object (creates new object every render)
  const stats = useMyStore(s => ({
    count: s.items.length,
    total: s.items.reduce((sum, item) => sum + item.value, 0)
  }));

  // ✅ Good: Use useMemo for derived values
  const stats = useMemo(() => ({
    count: items.length,
    total: items.reduce((sum, item) => sum + item.value, 0)
  }), [items]);
}
```

### Current Stores

| Store | Purpose | File |
|-------|---------|------|
| **appStore** | Auth, user, workspace | `/src/lib/state/app-store.ts` |
| **okrStore** | OKRs & objectives | `/src/lib/state/okr-store.ts` |
| **workPlanStore** | Work plans & tasks | `/src/lib/state/work-plan-store.ts` |
| **organizationStore** | Team, AI agents, suppliers | `/src/lib/state/organization-store.ts` |

---

## Navigation & Routing

### Expo Router Basics

**File → Route Mapping:**

```
src/app/
  index.tsx          →  /
  welcome.tsx        →  /welcome
  sign-in.tsx        →  /sign-in

  (tabs)/            →  Tab navigation
    index.tsx        →  /(tabs)/
    decide.tsx       →  /(tabs)/decide

  guilds.tsx         →  /guilds
```

**Dynamic Routes:**

```typescript
// src/app/user/[id].tsx  →  /user/123

import { useLocalSearchParams } from 'expo-router';

export default function UserScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  return <Text>User ID: {id}</Text>;
}
```

**Layouts:**

```typescript
// src/app/_layout.tsx - Root layout
export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="welcome" />
        <Stack.Screen name="(tabs)" />
      </Stack>
    </QueryClientProvider>
  );
}

// src/app/(tabs)/_layout.tsx - Tab layout
export default function TabLayout() {
  return (
    <Tabs screenOptions={{ headerShown: false }}>
      <Tabs.Screen name="index" options={{ title: 'Home', tabBarIcon: Home }} />
      <Tabs.Screen name="decide" options={{ title: 'Decide', tabBarIcon: Target }} />
      <Tabs.Screen name="do" options={{ title: 'Do', tabBarIcon: CheckSquare }} />
    </Tabs>
  );
}
```

---

## Styling System

### NativeWind (TailwindCSS for React Native)

**How it works:**
- Write TailwindCSS classes in `className` prop
- NativeWind converts to React Native styles

**Basic Usage:**

```typescript
import { View, Text } from 'react-native';

export default function Example() {
  return (
    <View className="flex-1 bg-white dark:bg-slate-950 px-6 py-4">
      <Text className="text-gray-900 dark:text-white text-2xl font-bold mb-4">
        Hello World
      </Text>

      <View className="bg-blue-500 rounded-xl p-4">
        <Text className="text-white text-center">Button</Text>
      </View>
    </View>
  );
}
```

**Conditional Classes:**

```typescript
import { cn } from '@/lib/cn';

function Button({ variant, children }) {
  return (
    <Pressable
      className={cn(
        'px-4 py-2 rounded-lg',
        variant === 'primary' && 'bg-blue-500',
        variant === 'secondary' && 'bg-gray-200'
      )}
    >
      <Text className="text-white">{children}</Text>
    </Pressable>
  );
}
```

**Important Limitations:**

```typescript
// ❌ className doesn't work on these components:
<LinearGradient className="..." />  // Use style prop
<CameraView className="..." />      // Use style prop
<Animated.View className="..." />   // Use style prop

// ✅ Use inline styles instead:
<LinearGradient
  colors={['#3b82f6', '#8b5cf6']}
  style={{ borderRadius: 16, padding: 20 }}
>
  {/* content */}
</LinearGradient>
```

**Common Patterns:**

```typescript
// Container
<View className="flex-1 bg-white dark:bg-slate-950 px-6 py-4">

// Card
<View className="bg-gray-100 dark:bg-slate-900 rounded-2xl p-4 mb-3">

// Text
<Text className="text-gray-900 dark:text-white text-base font-semibold">

// Button
<Pressable className="bg-blue-500 rounded-xl py-4 active:opacity-70">
  <Text className="text-white text-center font-bold">Button</Text>
</Pressable>

// Horizontal layout
<View className="flex-row items-center justify-between">

// Gap between items
<View className="flex-row gap-3">  // 12px gap
<View className="flex-col gap-2">  // 8px gap
```

---

## Common Patterns

### Pattern 1: Modal with Form

```typescript
import { Modal, View, Text, TextInput, Pressable } from 'react-native';
import { useState } from 'react';
import { X } from 'lucide-react-native';

function MyModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const [value, setValue] = useState('');

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View className="flex-1 bg-black/70 justify-center items-center px-6">
        <View className="bg-white dark:bg-slate-900 rounded-3xl w-full">
          {/* Header */}
          <View className="px-6 pt-6 pb-4 border-b border-gray-300 dark:border-slate-800">
            <View className="flex-row items-center justify-between">
              <Text className="text-gray-900 dark:text-white text-xl font-bold">
                Modal Title
              </Text>
              <Pressable onPress={onClose}>
                <X size={24} color="#94a3b8" />
              </Pressable>
            </View>
          </View>

          {/* Content */}
          <View className="px-6 py-4">
            <Text className="text-gray-900 dark:text-white font-semibold mb-2">
              Label
            </Text>
            <TextInput
              value={value}
              onChangeText={setValue}
              placeholder="Enter value..."
              placeholderTextColor="#94a3b8"
              className="bg-gray-200 dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-xl px-4 py-3 text-gray-900 dark:text-white"
            />

            <Pressable
              onPress={() => {
                // Handle submit
                onClose();
              }}
              className="bg-blue-500 py-4 rounded-xl mt-4 active:opacity-70"
            >
              <Text className="text-white text-center font-bold">Submit</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}
```

### Pattern 2: List with Search & Filter

```typescript
import { View, Text, ScrollView, TextInput, Pressable } from 'react-native';
import { useState, useMemo } from 'react';
import { Search } from 'lucide-react-native';

function ItemList({ items }: { items: Item[] }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const filteredItems = useMemo(() => {
    return items.filter(item => {
      const matchesSearch = searchQuery === '' ||
        item.name.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCategory = selectedCategory === 'all' ||
        item.category === selectedCategory;

      return matchesSearch && matchesCategory;
    });
  }, [items, searchQuery, selectedCategory]);

  return (
    <View className="flex-1">
      {/* Search */}
      <View className="px-6 mb-3">
        <View className="flex-row items-center bg-gray-100 dark:bg-slate-900 rounded-xl px-4 py-3">
          <Search size={18} color="#64748b" />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search..."
            placeholderTextColor="#94a3b8"
            className="flex-1 ml-2 text-gray-900 dark:text-white"
          />
        </View>
      </View>

      {/* Category Filter */}
      <View className="flex-row gap-2 px-6 mb-3">
        {['all', 'category1', 'category2'].map(cat => (
          <Pressable
            key={cat}
            onPress={() => setSelectedCategory(cat)}
            className={`px-3 py-2 rounded-lg ${
              selectedCategory === cat
                ? 'bg-blue-500'
                : 'bg-gray-200 dark:bg-slate-800'
            }`}
          >
            <Text className={`text-sm font-semibold ${
              selectedCategory === cat
                ? 'text-white'
                : 'text-gray-700 dark:text-slate-300'
            }`}>
              {cat}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* List */}
      <ScrollView className="flex-1 px-6">
        {filteredItems.map(item => (
          <View key={item.id} className="bg-gray-100 dark:bg-slate-900 rounded-2xl p-4 mb-3">
            <Text className="text-gray-900 dark:text-white font-bold">
              {item.name}
            </Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}
```

### Pattern 3: Expandable Card

```typescript
import { View, Text, Pressable } from 'react-native';
import { ChevronDown, ChevronRight } from 'lucide-react-native';

function ExpandableCard({ item }: { item: OKR }) {
  const toggleExpanded = useOKRStore(s => s.toggleOKRExpanded);
  const isExpanded = item.isExpanded || false;

  return (
    <View className="mb-3">
      {/* Card Header */}
      <Pressable
        onPress={() => toggleExpanded(item.id)}
        className="bg-gray-100 dark:bg-slate-900 rounded-2xl p-4"
      >
        <View className="flex-row items-center justify-between">
          <View className="flex-1">
            <Text className="text-gray-900 dark:text-white font-bold text-base">
              {item.title}
            </Text>
            <Text className="text-gray-600 dark:text-slate-400 text-sm">
              {item.description}
            </Text>
          </View>

          {isExpanded ? (
            <ChevronDown size={20} color="#64748b" />
          ) : (
            <ChevronRight size={20} color="#64748b" />
          )}
        </View>
      </Pressable>

      {/* Expanded Content */}
      {isExpanded && (
        <View className="mt-2 ml-4">
          {item.objectives.map(obj => (
            <View
              key={obj.id}
              className="bg-gray-50 dark:bg-slate-800 rounded-xl p-3 mb-2"
            >
              <Text className="text-gray-900 dark:text-white font-semibold">
                {obj.title}
              </Text>
              <View className="flex-row items-center mt-2">
                <View className="flex-1 bg-gray-200 dark:bg-slate-700 rounded-full h-2">
                  <View
                    className="bg-emerald-500 rounded-full h-2"
                    style={{ width: `${obj.progress}%` }}
                  />
                </View>
                <Text className="text-gray-600 dark:text-slate-400 text-xs ml-2">
                  {obj.progress}%
                </Text>
              </View>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}
```

---

## Adding New Features

### Step-by-Step Guide

#### 1. Define Data Model

```typescript
// /src/types/index.ts

export interface MyFeature {
  id: string;
  workspaceId: string;  // For multi-tenancy
  title: string;
  description: string;
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
}
```

#### 2. Create Zustand Store

```typescript
// /src/lib/state/my-feature-store.ts

import { create } from 'zustand';
import type { MyFeature } from '@/types';

interface MyFeatureState {
  items: MyFeature[];

  // Initialization
  initializeItems: () => void;

  // CRUD
  addItem: (item: MyFeature) => void;
  updateItem: (id: string, updates: Partial<MyFeature>) => void;
  deleteItem: (id: string) => void;

  // Multi-tenancy
  getItemsByWorkspace: (workspaceId: string) => MyFeature[];
}

export const useMyFeatureStore = create<MyFeatureState>((set, get) => ({
  items: [],

  initializeItems: () => {
    const initialItems: MyFeature[] = [
      // Demo data
    ];
    set({ items: initialItems });
  },

  addItem: (item) => set((state) => ({
    items: [...state.items, item]
  })),

  updateItem: (id, updates) => set((state) => ({
    items: state.items.map(item =>
      item.id === id ? { ...item, ...updates } : item
    )
  })),

  deleteItem: (id) => set((state) => ({
    items: state.items.filter(item => item.id !== id)
  })),

  getItemsByWorkspace: (workspaceId) => {
    return get().items.filter(item => item.workspaceId === workspaceId);
  },
}));
```

#### 3. Create Screen

```typescript
// /src/app/my-feature.tsx

import { View, Text, ScrollView, Pressable } from 'react-native';
import { Plus } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useMyFeatureStore } from '@/lib/state/my-feature-store';
import { useCurrentWorkspace } from '@/lib/state/app-store';

export default function MyFeatureScreen() {
  const insets = useSafeAreaInsets();
  const currentWorkspace = useCurrentWorkspace();

  const items = useMyFeatureStore(s =>
    s.getItemsByWorkspace(currentWorkspace?.id || '')
  );

  return (
    <View
      className="flex-1 bg-white dark:bg-slate-950"
      style={{ paddingTop: insets.top }}
    >
      {/* Header */}
      <View className="px-6 py-4 border-b border-gray-300 dark:border-slate-800">
        <View className="flex-row items-center justify-between">
          <Text className="text-gray-900 dark:text-white text-2xl font-bold">
            My Feature
          </Text>
          <Pressable className="bg-blue-500 rounded-xl p-2">
            <Plus size={24} color="#fff" />
          </Pressable>
        </View>
      </View>

      {/* Content */}
      <ScrollView className="flex-1 px-6 py-4">
        {items.map(item => (
          <View
            key={item.id}
            className="bg-gray-100 dark:bg-slate-900 rounded-2xl p-4 mb-3"
          >
            <Text className="text-gray-900 dark:text-white font-bold">
              {item.title}
            </Text>
            <Text className="text-gray-600 dark:text-slate-400 text-sm">
              {item.description}
            </Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}
```

#### 4. Add to Navigation

```typescript
// /src/app/(tabs)/_layout.tsx

import { Tabs } from 'expo-router';
import { MyIcon } from 'lucide-react-native';

export default function TabLayout() {
  return (
    <Tabs>
      {/* ... other tabs */}

      <Tabs.Screen
        name="my-feature"
        options={{
          title: 'My Feature',
          tabBarIcon: ({ color, size }) => <MyIcon size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}
```

#### 5. Update README

Document the new feature in `/README.md` under the Features section.

---

## Debugging Tips

### 1. Check Expo Logs

```bash
# View live logs in terminal
bun run start

# Or read log file
cat /home/user/workspace/expo.log
```

### 2. Console Logging

```typescript
// Debug store state
console.log('OKRs:', useOKRStore.getState().okrs);

// Debug component props
console.log('Props:', JSON.stringify(props, null, 2));

// Debug renders
useEffect(() => {
  console.log('Component rendered');
}, []);
```

### 3. React DevTools

```bash
# Install React DevTools
bun add -D react-devtools

# Start DevTools
bunx react-devtools
```

### 4. Common Issues

**Issue: "White screen on app start"**
- Check for TypeScript errors: `bun run tsc`
- Check for syntax errors in recently modified files
- Clear cache: `bun run start --clear`

**Issue: "Component not re-rendering"**
- Check Zustand selector returns primitive value
- Use `useMemo` for derived state
- Verify state is actually changing

**Issue: "Navigation not working"**
- Ensure screen is registered in layout
- Check file naming (must match route)
- Verify `expo-router` is installed

**Issue: "Styles not applying"**
- NativeWind doesn't work on LinearGradient, CameraView, Animated
- Use inline `style` prop for these components
- Check for typos in class names

### 5. TypeScript Errors

```bash
# Check all TypeScript errors
bun run tsc --noEmit

# Watch mode
bun run tsc --noEmit --watch
```

### 6. Performance Profiling

```typescript
// Measure render time
import { Profiler } from 'react';

<Profiler
  id="MyComponent"
  onRender={(id, phase, actualDuration) => {
    console.log(`${id} (${phase}): ${actualDuration}ms`);
  }}
>
  <MyComponent />
</Profiler>
```

---

## Testing Strategy

### Unit Tests (Coming Soon)

```typescript
// Example: OKR store test
import { renderHook, act } from '@testing-library/react-hooks';
import { useOKRStore } from '@/lib/state/okr-store';

describe('OKR Store', () => {
  it('should add OKR', () => {
    const { result } = renderHook(() => useOKRStore());

    act(() => {
      result.current.addOKR({
        id: 'test-1',
        workspaceId: 'workspace-1',
        title: 'Test OKR',
        // ... other fields
      });
    });

    expect(result.current.okrs).toHaveLength(1);
    expect(result.current.okrs[0].title).toBe('Test OKR');
  });

  it('should filter by workspace', () => {
    const { result } = renderHook(() => useOKRStore());

    const filtered = result.current.getOKRsByWorkspace('workspace-1');

    expect(filtered.every(okr => okr.workspaceId === 'workspace-1')).toBe(true);
  });
});
```

### Integration Tests

```typescript
// Example: Authentication flow test
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import SignInScreen from '@/app/sign-in';

describe('Sign In Flow', () => {
  it('should sign in successfully', async () => {
    const { getByPlaceholderText, getByText } = render(<SignInScreen />);

    fireEvent.changeText(
      getByPlaceholderText('Email'),
      'test@example.com'
    );

    fireEvent.changeText(
      getByPlaceholderText('Password'),
      'password123'
    );

    fireEvent.press(getByText('Sign In'));

    await waitFor(() => {
      expect(mockRouter.push).toHaveBeenCalledWith('/welcome');
    });
  });
});
```

### Manual Testing Checklist

**Before committing:**
- [ ] App starts without errors
- [ ] No TypeScript errors (`bun run tsc`)
- [ ] Navigation works (all tabs accessible)
- [ ] Forms validate properly
- [ ] Data persists across app restarts
- [ ] Dark mode works
- [ ] Safe area respected (no content under notch/home indicator)
- [ ] Keyboard doesn't obscure inputs
- [ ] Buttons have active states
- [ ] Loading states shown for async operations

---

## Quick Reference

### Important Commands

```bash
# Development
bun install              # Install dependencies
bun run start            # Start dev server
bun run start --clear    # Start with cache clear
bun run tsc              # Check TypeScript errors

# Code Quality
bun run lint             # Run ESLint
bun run format           # Run Prettier
```

### Useful Hooks

```typescript
// Routing
import { router, useLocalSearchParams } from 'expo-router';

// State
import { useOKRStore } from '@/lib/state/okr-store';
import { useCurrentWorkspace, useCurrentRole } from '@/lib/state/app-store';

// UI
import { useSafeAreaInsets } from 'react-native-safe-area-context';
```

### Color Palette

```typescript
// Brand colors
const colors = {
  blue: '#3b82f6',
  purple: '#8b5cf6',
  emerald: '#10b981',
  amber: '#f59e0b',
  red: '#ef4444',

  // Status colors
  onTrack: '#10b981',
  atRisk: '#f59e0b',
  offTrack: '#ef4444',

  // Function colors
  Marketing: '#f59e0b',
  Sales: '#ec4899',
  Engineering: '#3b82f6',
  Ops: '#8b5cf6',
  Finance: '#10b981',
  Admin: '#64748b',
};
```

---

## Need Help?

- **Code Questions**: Check this guide and `/README.md`
- **Production Deployment**: See `/PRODUCTION_READINESS_AUDIT_2026.md`
- **Architecture**: See Multi-Tenancy Architecture section above
- **Bugs**: Check `/home/user/workspace/expo.log` for errors

**Welcome to the team! Start by:**
1. Reading this guide
2. Running the app: `bun run start`
3. Exploring the code in `/src/app/(tabs)/`
4. Making a small change to see the hot reload

Happy coding! 🚀
