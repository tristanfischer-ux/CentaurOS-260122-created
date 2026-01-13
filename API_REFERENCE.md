# API Reference - Centaur OS

Complete reference for all stores, APIs, and utilities in Centaur OS.

---

## Table of Contents

1. [Zustand Stores](#zustand-stores)
2. [API Layer](#api-layer)
3. [Marketplace Data](#marketplace-data)
4. [Utilities](#utilities)
5. [TypeScript Types](#typescript-types)

---

## Zustand Stores

### App Store (`/src/lib/state/app-store.ts`)

Manages authentication, user data, and workspace context.

#### State

```typescript
interface AppState {
  // Auth
  currentUser: User | null;
  isAuthenticated: boolean;
  authToken: string | null;

  // Workspace context
  currentWorkspaceId: string | null;
  currentWorkspace: Workspace | null;
  currentMembership: Membership | null;

  // Cached data
  workspaces: Record<string, Workspace>;
  memberships: Record<string, Membership>;
  users: Record<string, User>;
}
```

#### Methods

**Authentication:**
```typescript
setCurrentUser(user: User | null): void
setAuthToken(token: string | null): void
signOut(): Promise<void>
initialize(): Promise<void>
```

**Workspace:**
```typescript
setCurrentWorkspace(workspaceId: string | null): void
```

**Data Management:**
```typescript
setWorkspaces(workspaces: Record<string, Workspace>): void
setMemberships(memberships: Record<string, Membership>): void
setUsers(users: Record<string, User>): void
```

#### Selectors (Hooks)

```typescript
useCurrentUser(): User | null
useIsAuthenticated(): boolean
useCurrentWorkspace(): Workspace | null
useCurrentMembership(): Membership | null
useCurrentRole(): Role | null
```

#### Example Usage

```typescript
import { useAppStore, useCurrentWorkspace, useCurrentRole } from '@/lib/state/app-store';

function MyComponent() {
  // Get current workspace
  const workspace = useCurrentWorkspace();

  // Get current user role
  const role = useCurrentRole();

  // Sign out
  const signOut = useAppStore(s => s.signOut);

  return (
    <View>
      <Text>Workspace: {workspace?.name}</Text>
      <Text>Role: {role}</Text>
      <Pressable onPress={signOut}>
        <Text>Sign Out</Text>
      </Pressable>
    </View>
  );
}
```

---

### OKR Store (`/src/lib/state/okr-store.ts`)

Manages Objectives and Key Results (OKRs).

#### State

```typescript
interface OKRState {
  okrs: OKR[];
  selectedOKR: OKR | null;
}
```

#### Methods

**Initialization:**
```typescript
initializeOKRs(): void  // Loads demo data
```

**CRUD Operations:**
```typescript
addOKR(okr: OKR): void
updateOKR(id: string, updates: Partial<OKR>): void
deleteOKR(id: string): void
setSelectedOKR(okr: OKR | null): void
toggleOKRExpanded(okrId: string): void
```

**Queries:**
```typescript
getOKRById(id: string): OKR | undefined
getCounts(): {
  total: number;
  onTrack: number;
  atRisk: number;
  offTrack: number;
}
```

**Multi-Tenancy:**
```typescript
getOKRsByWorkspace(workspaceId: string): OKR[]
getAllOKRs(): OKR[]  // For Government users only
getOKRsByWorkspaceAndFunction(workspaceId: string, func: BusinessFunction): OKR[]
getOKRsByWorkspaceAndStatus(workspaceId: string, status: 'on-track' | 'at-risk' | 'off-track'): OKR[]
```

**Objective Management:**
```typescript
addObjective(okrId: string, objective: Objective): void
updateObjective(okrId: string, objectiveId: string, updates: Partial<Objective>): void
deleteObjective(okrId: string, objectiveId: string): void
```

#### Example Usage

```typescript
import { useOKRStore } from '@/lib/state/okr-store';
import { useCurrentWorkspace } from '@/lib/state/app-store';

function OKRList() {
  const workspace = useCurrentWorkspace();

  // Get OKRs for current workspace
  const okrs = useOKRStore(s =>
    s.getOKRsByWorkspace(workspace?.id || '')
  );

  // Get counts
  const counts = useOKRStore(s => s.getCounts());

  // CRUD operations
  const addOKR = useOKRStore(s => s.addOKR);
  const updateOKR = useOKRStore(s => s.updateOKR);
  const deleteOKR = useOKRStore(s => s.deleteOKR);

  const handleCreate = () => {
    addOKR({
      id: `okr-${Date.now()}`,
      workspaceId: workspace?.id || '',
      function: 'Marketing',
      title: 'New OKR',
      description: 'Description',
      owner: 'John Doe',
      startDate: 'Q1 2026',
      endDate: 'Q4 2026',
      status: 'on-track',
      objectives: [],
    });
  };

  return (
    <View>
      <Text>Total: {counts.total}</Text>
      <Text>On Track: {counts.onTrack}</Text>
      {okrs.map(okr => (
        <View key={okr.id}>
          <Text>{okr.title}</Text>
        </View>
      ))}
    </View>
  );
}
```

---

### Work Plan Store (`/src/lib/state/work-plan-store.ts`)

Manages work plans and tasks.

#### State

```typescript
interface WorkPlanState {
  workPlans: WorkPlan[];
  selectedWorkPlan: WorkPlan | null;
}
```

#### Methods

**Initialization:**
```typescript
initializeWorkPlans(): void
```

**CRUD:**
```typescript
addWorkPlan(workPlan: WorkPlan): void
updateWorkPlan(id: string, updates: Partial<WorkPlan>): void
deleteWorkPlan(id: string): void
setSelectedWorkPlan(workPlan: WorkPlan | null): void
```

**Queries:**
```typescript
getWorkPlanById(id: string): WorkPlan | undefined
getWorkPlansByOKR(okrId: string): WorkPlan[]
getCounts(): {
  total: number;
  planning: number;
  inProgress: number;
  review: number;
  completed: number;
}
```

**Multi-Tenancy:**
```typescript
getWorkPlansByWorkspace(workspaceId: string): WorkPlan[]
getAllWorkPlans(): WorkPlan[]
getWorkPlansByWorkspaceAndFunction(workspaceId: string, func: BusinessFunction): WorkPlan[]
```

**Task Management:**
```typescript
addTask(workPlanId: string, task: Task): void
updateTask(workPlanId: string, taskId: string, updates: Partial<Task>): void
deleteTask(workPlanId: string, taskId: string): void
```

#### Example Usage

```typescript
import { useWorkPlanStore } from '@/lib/state/work-plan-store';

function WorkPlanList({ okrId }: { okrId: string }) {
  // Get work plans for specific OKR
  const workPlans = useWorkPlanStore(s => s.getWorkPlansByOKR(okrId));

  // Add task to work plan
  const addTask = useWorkPlanStore(s => s.addTask);

  const handleAddTask = (workPlanId: string) => {
    addTask(workPlanId, {
      id: `task-${Date.now()}`,
      workPlanId,
      title: 'New Task',
      description: 'Task description',
      assignee: 'Jane Doe',
      status: 'todo',
      priority: 'medium',
      estimatedHours: 4,
      dueDate: '2026-02-01',
    });
  };

  return (
    <View>
      {workPlans.map(wp => (
        <View key={wp.id}>
          <Text>{wp.title}</Text>
          <Text>Tasks: {wp.tasks.length}</Text>
        </View>
      ))}
    </View>
  );
}
```

---

### Organization Store (`/src/lib/state/organization-store.ts`)

Manages team members, AI agent subscriptions, and supplier engagements.

#### State

```typescript
interface OrganizationState {
  members: OrganizationMember[];
  aiAgents: AIAgentSubscription[];
  supplierEngagements: SupplierEngagement[];
}
```

#### Methods

**Members:**
```typescript
addMember(member: OrganizationMember): void
updateMember(id: string, updates: Partial<OrganizationMember>): void
removeMember(id: string): void
getMembersByWorkspace(workspaceId: string): OrganizationMember[]
getMembersByRole(role: Role): OrganizationMember[]
```

**AI Agents:**
```typescript
subscribeToAIAgent(subscription: AIAgentSubscription): void
unsubscribeFromAIAgent(id: string): void
getAIAgentsByWorkspace(workspaceId: string): AIAgentSubscription[]
getAIAgentsByFunction(func: BusinessFunction): AIAgentSubscription[]
```

**Suppliers:**
```typescript
engageSupplier(engagement: SupplierEngagement): void
updateEngagement(id: string, updates: Partial<SupplierEngagement>): void
endEngagement(id: string): void
getEngagementsByWorkspace(workspaceId: string): SupplierEngagement[]
getActiveEngagements(workspaceId: string): SupplierEngagement[]
```

**Counts:**
```typescript
getCounts(workspaceId: string): {
  totalMembers: number;
  executives: number;
  apprentices: number;
  activeAIAgents: number;
  activeEngagements: number;
}
```

#### Example Usage

```typescript
import { useOrganizationStore } from '@/lib/state/organization-store';

function TeamDirectory() {
  const workspace = useCurrentWorkspace();

  // Get team members
  const members = useOrganizationStore(s =>
    s.getMembersByWorkspace(workspace?.id || '')
  );

  // Get counts
  const counts = useOrganizationStore(s =>
    s.getCounts(workspace?.id || '')
  );

  // Add team member
  const addMember = useOrganizationStore(s => s.addMember);

  const handleHire = (executive: MarketplaceExecutive) => {
    addMember({
      id: `member-${Date.now()}`,
      workspaceId: workspace?.id || '',
      userId: executive.id,
      name: executive.name,
      role: executive.role,
      function: executive.function,
      startDate: new Date().toISOString(),
      status: 'active',
      costPerDay: executive.costPerDay,
    });
  };

  return (
    <View>
      <Text>Team: {counts.totalMembers}</Text>
      <Text>Executives: {counts.executives}</Text>
      <Text>Apprentices: {counts.apprentices}</Text>
      {members.map(member => (
        <View key={member.id}>
          <Text>{member.name}</Text>
          <Text>{member.role}</Text>
        </View>
      ))}
    </View>
  );
}
```

---

## API Layer

### User API (`/src/lib/api/index.ts`)

```typescript
export const userApi = {
  async getById(userId: string): Promise<User | null>
  async getByEmail(email: string): Promise<User | null>
  async create(data: { email: string; name: string; avatarUrl?: string }): Promise<User>
  async update(userId: string, data: Partial<User>): Promise<User | null>
}
```

### Workspace API

```typescript
export const workspaceApi = {
  async getById(workspaceId: string): Promise<Workspace | null>
  async create(data: { name: string; ownerId: string }): Promise<Workspace>
  async update(workspaceId: string, data: Partial<Workspace>): Promise<Workspace | null>
  async addMember(workspaceId: string, userId: string, role: Role): Promise<Membership>
}
```

### Auth API

```typescript
export const authApi = {
  async signIn(email: string, password: string): Promise<{ user: User; token: string } | null>
  async signUp(data: { email: string; password: string; name: string }): Promise<{ user: User; token: string }>
  async signOut(): Promise<void>
  async getCurrentUser(): Promise<User | null>
}
```

### RBAC Helper

```typescript
export function checkPermission(
  role: Role,
  action: string,
  resource: string
): boolean

// Example usage
const canCreateOKR = checkPermission('Founder', 'create', 'okr');  // true
const canApprove = checkPermission('Apprentice', 'approve', 'task');  // false
```

---

## Marketplace Data

### Suppliers (`/src/lib/marketplace-suppliers.ts`)

```typescript
export const MARKETPLACE_SUPPLIERS: Supplier[]  // 31 UK suppliers

export interface Supplier {
  id: string;
  name: string;
  type: 'Prototyping' | 'Low-Volume' | 'Mid-Volume' | 'High-Volume';
  location: {
    city: string;
    country: string;
    region?: string;
  };
  capabilities: string[];
  certifications: string[];
  pricing: {
    setup: string;
    perUnit: string;
    moq: string;
    leadTime: string;
  };
  caseStudies: CaseStudy[];
  contact: {
    email: string;
    phone: string;
    website: string;
  };
  reviews: {
    rating: number;
    totalReviews: number;
    pros: string[];
    cons: string[];
  };
}
```

### AI Tools (`/src/lib/marketplace-ai-tools.ts`)

Formerly `third-party-ai-tools.ts`

```typescript
export const MARKETPLACE_AI_TOOLS: ThirdPartyAITool[]  // 24 AI tools

export interface ThirdPartyAITool {
  id: string;
  name: string;
  provider: string;
  purpose: string;
  description: string;
  functions: BusinessFunction[];
  costPerMonth: number;
  website: string;
  capabilities: string[];
  integrations: string[];
  category: 'productivity' | 'sales' | 'marketing' | 'finance' | 'engineering' | 'operations';
  useCases: string[];
  keyFeatures: string[];
  pricing: {
    starter?: string;
    professional?: string;
    enterprise?: string;
    notes?: string;
  };
  setup: {
    difficulty: 'Easy' | 'Moderate' | 'Advanced';
    timeToValue: string;
    requirements: string[];
  };
  support: {
    documentation: string;
    community: string;
    email: boolean;
    phone: boolean;
  };
  reviews: {
    rating: number;
    totalReviews: number;
    pros: string[];
    cons: string[];
  };
}
```

### Executives (`/src/lib/marketplace-executives.ts`)

```typescript
export const MARKETPLACE_EXECUTIVES: MarketplaceExecutive[]  // 60 executives & apprentices

export interface MarketplaceExecutive {
  id: string;
  name: string;
  role: 'FractionalExec' | 'Apprentice';
  function: BusinessFunction;
  specialties: string[];
  experience: string;
  bio: string;
  costPerDay: number;
  availability: 'available' | 'limited' | 'unavailable';
  rating: number;
  reviewCount: number;
  previousClients: string[];
  skills: string[];
  certifications?: string[];
  education: string;
  linkedIn?: string;
  portfolio?: string[];
  location: {
    city: string;
    country: string;
    remote: boolean;
  };
}
```

---

## Utilities

### Financial Calculations (`/src/lib/financial-calculations.ts`)

```typescript
// Calculate monthly burn rate
export function calculateMonthlyBurn(
  costs: typeof FINANCIAL_DATA.costs
): number

// Calculate runway in months (rounded to 1 decimal)
export function calculateRunway(
  cashPosition: number,
  costs: typeof FINANCIAL_DATA.costs
): number

// Get all financial metrics
export function getFinancialMetrics(
  costs: typeof FINANCIAL_DATA.costs
): {
  cashPosition: number;
  monthlyRevenue: number;
  monthlyBurn: number;
  runway: number;
  netCashFlow: number;
  burnRate: number;
}

// Financial data structure
export const FINANCIAL_DATA: {
  cashPosition: number;
  monthlyRevenue: number;
  costs: {
    fractionalExecutives: { count: number; costPerDay: number; daysPerMonth: number };
    apprentices: { count: number; costPerDay: number; daysPerMonth: number };
    aiAgents: { count: number; costPerMonth: number };
    suppliers: { costPerMonth: number };
    overhead: { costPerMonth: number };
  };
}
```

### Storage (`/src/lib/storage.ts`)

```typescript
// Generic storage helpers (AsyncStorage)
export const storage = {
  async get<T>(key: string): Promise<T | null>
  async set<T>(key: string, value: T): Promise<void>
  async remove(key: string): Promise<void>
  async clear(): Promise<void>
}

// Fast key-value storage (MMKV)
export const mmkv: {
  set(key: string, value: string): void
  getString(key: string): string | undefined
  delete(key: string): void
  clearAll(): void
}

// Domain-specific storage
export const db = {
  // Users
  async getUsers(): Promise<Record<string, User>>
  async setUsers(users: Record<string, User>): Promise<void>

  // Workspaces
  async getWorkspaces(): Promise<Record<string, Workspace>>
  async setWorkspaces(workspaces: Record<string, Workspace>): Promise<void>

  // ... (similar methods for all domain entities)
}

// App-specific storage
export const appStorage = {
  async getCurrentUser(): Promise<User | null>
  async setCurrentUser(user: User): Promise<void>
  async removeCurrentUser(): Promise<void>

  async getAuthToken(): Promise<string | null>
  async setAuthToken(token: string): Promise<void>
  async removeAuthToken(): Promise<void>

  async getCurrentWorkspaceId(): Promise<string | null>
  async setCurrentWorkspaceId(workspaceId: string): Promise<void>
  async removeCurrentWorkspaceId(): Promise<void>
}
```

### ClassName Utility (`/src/lib/cn.ts`)

```typescript
import { cn } from '@/lib/cn';

// Merge TailwindCSS class names
<View className={cn(
  'px-4 py-2 rounded-lg',
  isActive && 'bg-blue-500',
  !isActive && 'bg-gray-200'
)} />

// With arrays
<View className={cn(
  'base-class',
  [condition1 && 'class1', condition2 && 'class2']
)} />
```

---

## TypeScript Types

All types are defined in `/src/types/index.ts`

### Core Types

```typescript
// User & Auth
export interface User {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
  createdAt: string;
}

export type Role = 'Founder' | 'Apprentice' | 'FractionalExec' | 'Government';

// Workspace
export interface Workspace {
  id: string;
  name: string;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Membership {
  id: string;
  workspaceId: string;
  userId: string;
  role: Role;
  joinedAt: string;
}

// Business Functions
export type Function =
  | 'Marketing'
  | 'Sales'
  | 'Engineering'
  | 'Ops'
  | 'Finance'
  | 'Admin';
```

### OKR Types

```typescript
export interface OKR {
  id: string;
  workspaceId: string;
  function: Function;
  title: string;
  description: string;
  owner: string;
  startDate: string;
  endDate: string;
  status: 'on-track' | 'at-risk' | 'off-track';
  objectives: Objective[];
  isExpanded?: boolean;
}

export interface Objective {
  id: string;
  title: string;
  target: string;
  current: string;
  progress: number;
  status: 'on-track' | 'at-risk' | 'off-track';
}
```

### Work Plan Types

```typescript
export interface WorkPlan {
  id: string;
  workspaceId: string;
  okrId: string;
  function: Function;
  title: string;
  description: string;
  owner: string;
  status: 'planning' | 'in-progress' | 'review' | 'completed';
  tasks: Task[];
  startDate: string;
  endDate: string;
}

export interface Task {
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

### Organization Types

```typescript
export interface OrganizationMember {
  id: string;
  workspaceId: string;
  userId: string;
  name: string;
  role: Role;
  function: Function;
  startDate: string;
  endDate?: string;
  status: 'active' | 'inactive';
  costPerDay: number;
}

export interface AIAgentSubscription {
  id: string;
  workspaceId: string;
  toolId: string;
  toolName: string;
  function: Function;
  costPerMonth: number;
  startDate: string;
  status: 'active' | 'inactive';
}

export interface SupplierEngagement {
  id: string;
  workspaceId: string;
  supplierId: string;
  supplierName: string;
  projectName: string;
  startDate: string;
  endDate?: string;
  status: 'active' | 'completed' | 'cancelled';
  totalCost: number;
}
```

---

## Constants

### Status Colors

```typescript
// OKR/Task Status
const STATUS_COLORS = {
  'on-track': '#10b981',   // Emerald
  'at-risk': '#f59e0b',    // Amber
  'off-track': '#ef4444',  // Red
};

// Function Colors
const FUNCTION_COLORS: Record<Function, string> = {
  Marketing: '#f59e0b',
  Sales: '#ec4899',
  Engineering: '#3b82f6',
  Ops: '#8b5cf6',
  Finance: '#10b981',
  Admin: '#64748b',
};
```

### Demo Data IDs

```typescript
const DEFAULT_WORKSPACE_ID = 'workspace-demo-company';
const DEMO_USER_ID = 'user-founder-demo';
```

---

## Migration Notes

### From Demo to Production

When migrating to production backend:

1. **Replace AsyncStorage calls with API calls:**
```typescript
// Demo (current)
const okrs = await storage.get(STORAGE_KEYS.OKRS);

// Production
const okrs = await fetch(`${API_URL}/okrs?workspaceId=${workspaceId}`)
  .then(res => res.json());
```

2. **Replace Zustand initialization:**
```typescript
// Demo (current)
if (useOKRStore.getState().okrs.length === 0) {
  useOKRStore.getState().initializeOKRs();
}

// Production
useEffect(() => {
  const loadOKRs = async () => {
    const data = await okrApi.getByWorkspace(workspaceId);
    useOKRStore.setState({ okrs: data });
  };
  loadOKRs();
}, [workspaceId]);
```

3. **Add React Query for caching:**
```typescript
import { useQuery } from '@tanstack/react-query';

function useOKRs(workspaceId: string) {
  return useQuery({
    queryKey: ['okrs', workspaceId],
    queryFn: () => okrApi.getByWorkspace(workspaceId),
  });
}
```

See `/PRODUCTION_READINESS_AUDIT_2026.md` for complete migration guide.

---

**This API reference is current as of January 13, 2026.**
