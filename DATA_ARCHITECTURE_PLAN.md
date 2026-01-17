# Data Architecture Plan: Supabase as Source of Truth

## Overview

This plan outlines how to re-introduce data into the app with Supabase as the single source of truth, with clear separation between universal, company, and user data tiers.

## 1. Data Tier Definitions

### Universal Data (Shared Across All Companies/Users)
Data that is the same for everyone, regardless of company or user. This is reference/template data.

**Examples:**
- AI tools catalog (OpenAI, Anthropic, Midjourney, ElevenLabs capabilities)
- Function templates (Engineering, Marketing, Finance, etc.)
- Industry benchmarks and best practices
- Default OKR templates
- Default work plan templates
- Role definitions (Founder, FractionalExec, Apprentice)
- Skill taxonomies
- Supplier categories

**Characteristics:**
- Read-only for most users
- Managed by platform administrators
- Same data returned for all queries
- Cached aggressively (rarely changes)

### Company Data (Workspace-Specific)
Data that belongs to a specific company/workspace. This is the core business data.

**Examples:**
- Workspaces (companies)
- Members (people in the workspace)
- Work plans (tasks/projects)
- OKRs (objectives and key results)
- Supplier engagements
- Financial transactions
- Revenue streams
- Cost items
- Budget targets
- Decisions and decision logs
- Team allocations

**Characteristics:**
- Isolated by `workspace_id` foreign key
- Row-level security (RLS) enforces access control
- Only accessible to workspace members
- Primary data tier for app functionality

### User Data (Individual User-Specific)
Data that belongs to an individual user, persists across workspaces.

**Examples:**
- User profile (name, email, avatar)
- Notification preferences
- UI preferences (dark mode, default workspace)
- Favorite suppliers
- Personal notes
- Recently viewed items
- Personal dashboard configurations

**Characteristics:**
- Isolated by `user_id` foreign key
- May reference multiple workspaces
- Personal preferences and settings
- Not shared with other users

## 2. Supabase Table Structure

### Universal Data Tables

```sql
-- ai_tools (catalog of AI services)
CREATE TABLE ai_tools (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  provider TEXT NOT NULL, -- 'openai', 'anthropic', 'midjourney', etc.
  category TEXT NOT NULL, -- 'text', 'image', 'voice', etc.
  description TEXT,
  typical_monthly_cost DECIMAL(10,2),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- function_templates (engineering, marketing, etc.)
CREATE TABLE function_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  typical_cost_per_day DECIMAL(10,2),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- role_definitions
CREATE TABLE role_definitions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL, -- 'Founder', 'FractionalExec', 'Apprentice'
  description TEXT,
  permissions JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Company Data Tables (Multi-Tenant)

All company tables have `workspace_id` with RLS policies.

```sql
-- workspaces (companies)
CREATE TABLE workspaces (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- members (people in workspace)
CREATE TABLE members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id), -- nullable for external members
  name TEXT NOT NULL,
  role TEXT NOT NULL, -- 'Founder', 'FractionalExec', 'Apprentice'
  function TEXT, -- 'Engineering', 'Marketing', etc.
  status TEXT NOT NULL DEFAULT 'active', -- 'active', 'inactive'
  days_per_week DECIMAL(3,1),
  cost_per_day DECIMAL(10,2),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(workspace_id, user_id)
);

-- Enable RLS
ALTER TABLE members ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see members of workspaces they belong to
CREATE POLICY members_workspace_isolation ON members
  FOR SELECT
  USING (
    workspace_id IN (
      SELECT workspace_id FROM members WHERE user_id = auth.uid()
    )
  );

-- work_plans (tasks/projects)
CREATE TABLE work_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'planning', -- 'planning', 'in-progress', 'blocked', 'completed', 'abandoned'
  priority TEXT, -- 'low', 'medium', 'high', 'critical'
  progress INTEGER DEFAULT 0,
  start_date DATE,
  end_date DATE,
  created_by UUID REFERENCES members(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE work_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY work_plans_workspace_isolation ON work_plans
  FOR SELECT
  USING (
    workspace_id IN (
      SELECT workspace_id FROM members WHERE user_id = auth.uid()
    )
  );

-- work_plan_allocations (member assignments)
CREATE TABLE work_plan_allocations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  work_plan_id UUID REFERENCES work_plans(id) ON DELETE CASCADE,
  member_id UUID REFERENCES members(id) ON DELETE CASCADE,
  squares_per_week DECIMAL(4,1), -- time units (1 square = 0.5 days)
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(work_plan_id, member_id)
);

-- work_plan_audit_records (completion tracking)
CREATE TABLE work_plan_audit_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  work_plan_id UUID REFERENCES work_plans(id) ON DELETE CASCADE,
  completed_at TIMESTAMPTZ,
  completed_by UUID REFERENCES members(id),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- okrs (objectives and key results)
CREATE TABLE okrs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'on-track', -- 'on-track', 'at-risk', 'off-track'
  quarter TEXT, -- 'Q1 2026', etc.
  owner_id UUID REFERENCES members(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE okrs ENABLE ROW LEVEL SECURITY;

CREATE POLICY okrs_workspace_isolation ON okrs
  FOR SELECT
  USING (
    workspace_id IN (
      SELECT workspace_id FROM members WHERE user_id = auth.uid()
    )
  );

-- okr_objectives (sub-objectives within OKR)
CREATE TABLE okr_objectives (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  okr_id UUID REFERENCES okrs(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  progress INTEGER DEFAULT 0, -- 0-100
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- suppliers (external vendors)
CREATE TABLE suppliers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT, -- 'Manufacturing', 'AI Tools', 'Infrastructure', etc.
  description TEXT,
  website TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;

CREATE POLICY suppliers_workspace_isolation ON suppliers
  FOR SELECT
  USING (
    workspace_id IN (
      SELECT workspace_id FROM members WHERE user_id = auth.uid()
    )
  );

-- supplier_engagements (active contracts/work)
CREATE TABLE supplier_engagements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  supplier_id UUID REFERENCES suppliers(id),
  category TEXT, -- 'Manufacturing', 'AI Tools', etc.
  status TEXT NOT NULL DEFAULT 'planning', -- 'planning', 'in_progress', 'completed'
  contract_value DECIMAL(12,2),
  paid_to_date DECIMAL(12,2) DEFAULT 0,
  start_date DATE,
  end_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE supplier_engagements ENABLE ROW LEVEL SECURITY;

CREATE POLICY supplier_engagements_workspace_isolation ON supplier_engagements
  FOR SELECT
  USING (
    workspace_id IN (
      SELECT workspace_id FROM members WHERE user_id = auth.uid()
    )
  );

-- financial_transactions (revenue and costs)
CREATE TABLE financial_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- 'revenue', 'cost'
  category TEXT NOT NULL, -- 'product_sales', 'services', 'team', 'ai_tools', 'manufacturing', etc.
  subcategory TEXT, -- more specific breakdown
  amount DECIMAL(12,2) NOT NULL,
  transaction_date DATE NOT NULL,
  description TEXT,
  recurring BOOLEAN DEFAULT FALSE, -- is this a recurring transaction?
  recurrence_period TEXT, -- 'monthly', 'quarterly', 'annual'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE financial_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY financial_transactions_workspace_isolation ON financial_transactions
  FOR SELECT
  USING (
    workspace_id IN (
      SELECT workspace_id FROM members WHERE user_id = auth.uid()
    )
  );

-- budget_targets (financial goals)
CREATE TABLE budget_targets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  month DATE NOT NULL, -- first day of month
  category TEXT NOT NULL, -- 'revenue', 'team_cost', 'ai_cost', 'cogs', 'other'
  target_amount DECIMAL(12,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(workspace_id, month, category)
);

ALTER TABLE budget_targets ENABLE ROW LEVEL SECURITY;

CREATE POLICY budget_targets_workspace_isolation ON budget_targets
  FOR SELECT
  USING (
    workspace_id IN (
      SELECT workspace_id FROM members WHERE user_id = auth.uid()
    )
  );
```

### User Data Tables

```sql
-- user_preferences (personal settings)
CREATE TABLE user_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  default_workspace_id UUID REFERENCES workspaces(id) ON DELETE SET NULL,
  theme TEXT DEFAULT 'system', -- 'light', 'dark', 'system'
  notification_enabled BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY user_preferences_own_data ON user_preferences
  FOR ALL
  USING (user_id = auth.uid());

-- user_favorite_suppliers (personal bookmarks)
CREATE TABLE user_favorite_suppliers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  supplier_id UUID REFERENCES suppliers(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, supplier_id)
);

ALTER TABLE user_favorite_suppliers ENABLE ROW LEVEL SECURITY;

CREATE POLICY user_favorite_suppliers_own_data ON user_favorite_suppliers
  FOR ALL
  USING (user_id = auth.uid());
```

## 3. Data Loading Patterns

### Universal Data Loading

**When:** App initialization (once per session)
**Where:** Top-level component (before workspace selection)
**Caching:** Long-term (24 hours or until app restart)

```typescript
// Load universal data once at app start
useEffect(() => {
  async function loadUniversalData() {
    const [aiTools, functionTemplates, roleDefs] = await Promise.all([
      supabase.from('ai_tools').select('*'),
      supabase.from('function_templates').select('*'),
      supabase.from('role_definitions').select('*')
    ]);

    // Store in universal data store (separate from workspace store)
    useUniversalStore.setState({
      aiTools: aiTools.data,
      functionTemplates: functionTemplates.data,
      roleDefinitions: roleDefs.data
    });
  }

  loadUniversalData();
}, []);
```

### Company Data Loading

**When:** Workspace selection/change
**Where:** After user selects workspace
**Caching:** Medium-term (session-based, cleared on workspace change)

```typescript
// Load workspace data when workspace changes
useEffect(() => {
  if (!currentWorkspace) return;

  async function loadWorkspaceData() {
    const workspaceId = currentWorkspace.id;

    // Parallel load all workspace data
    const [members, workPlans, okrs, suppliers, engagements, transactions] = await Promise.all([
      supabase.from('members').select('*').eq('workspace_id', workspaceId),
      supabase.from('work_plans').select('*, allocations(*), audit_record(*)').eq('workspace_id', workspaceId),
      supabase.from('okrs').select('*, objectives(*)').eq('workspace_id', workspaceId),
      supabase.from('suppliers').select('*').eq('workspace_id', workspaceId),
      supabase.from('supplier_engagements').select('*').eq('workspace_id', workspaceId),
      supabase.from('financial_transactions').select('*').eq('workspace_id', workspaceId)
    ]);

    // Update respective stores
    useOrganizationStore.setState({
      members: members.data,
      supplierEngagements: engagements.data
    });

    useWorkPlanStore.setState({
      workPlans: workPlans.data
    });

    useOKRStore.setState({
      okrs: okrs.data
    });

    useSupplierStore.setState({
      suppliers: suppliers.data
    });

    useFinanceStore.setState({
      transactions: transactions.data
    });
  }

  loadWorkspaceData();
}, [currentWorkspace?.id]);
```

### User Data Loading

**When:** User login/session start
**Where:** After authentication
**Caching:** Session-based (cleared on logout)

```typescript
// Load user data on authentication
useEffect(() => {
  if (!user) return;

  async function loadUserData() {
    const [preferences, favoriteSuppliers] = await Promise.all([
      supabase.from('user_preferences').select('*').eq('user_id', user.id).single(),
      supabase.from('user_favorite_suppliers').select('*, supplier(*)').eq('user_id', user.id)
    ]);

    useUserStore.setState({
      preferences: preferences.data,
      favoriteSuppliers: favoriteSuppliers.data
    });
  }

  loadUserData();
}, [user?.id]);
```

## 4. Store Architecture

### Store Hierarchy

```
UniversalStore (global reference data)
  ├─ aiTools[]
  ├─ functionTemplates[]
  └─ roleDefinitions[]

AppStore (session/user data)
  ├─ currentUser
  ├─ currentWorkspace
  └─ workspaces[]

UserStore (user preferences)
  ├─ preferences
  └─ favoriteSuppliers[]

OrganizationStore (workspace members & engagements)
  ├─ members[]
  ├─ supplierEngagements[]
  └─ getEngagementsByWorkspace(workspaceId)

WorkPlanStore (workspace work plans)
  ├─ workPlans[]
  └─ getWorkPlanById(id)

OKRStore (workspace objectives)
  ├─ okrs[]
  └─ getActiveOKRs()

SupplierStore (workspace suppliers)
  ├─ suppliers[]
  └─ getSupplierById(id)

FinanceStore (workspace financial data)
  ├─ transactions[]
  ├─ getCashBalance(workspaceId)
  ├─ getWeeklyBurn(workspaceId)
  └─ getMonthlyRevenue(workspaceId)
```

### Store-Supabase Integration

Each store should have:
1. **State** - In-memory data cache
2. **Actions** - CRUD operations that sync with Supabase
3. **Selectors** - Computed values/filters

**Example: FinanceStore**

```typescript
interface FinanceStore {
  // State
  transactions: FinancialTransaction[];
  budgetTargets: BudgetTarget[];

  // Actions (sync with Supabase)
  loadTransactions: (workspaceId: string) => Promise<void>;
  addTransaction: (transaction: Omit<FinancialTransaction, 'id'>) => Promise<void>;
  updateTransaction: (id: string, updates: Partial<FinancialTransaction>) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;

  // Selectors (computed from state)
  getCashBalance: (workspaceId: string) => number;
  getWeeklyBurn: (workspaceId: string) => number;
  getMonthlyRevenue: (workspaceId: string) => number;
  getRunway: (workspaceId: string) => number;
}

export const useFinanceStore = create<FinanceStore>((set, get) => ({
  transactions: [],
  budgetTargets: [],

  loadTransactions: async (workspaceId: string) => {
    const { data } = await supabase
      .from('financial_transactions')
      .select('*')
      .eq('workspace_id', workspaceId);

    set({ transactions: data || [] });
  },

  addTransaction: async (transaction) => {
    const { data, error } = await supabase
      .from('financial_transactions')
      .insert(transaction)
      .select()
      .single();

    if (error) throw error;

    set(state => ({
      transactions: [...state.transactions, data]
    }));
  },

  getCashBalance: (workspaceId: string) => {
    const txs = get().transactions.filter(t => t.workspace_id === workspaceId);

    const revenue = txs
      .filter(t => t.type === 'revenue')
      .reduce((sum, t) => sum + t.amount, 0);

    const costs = txs
      .filter(t => t.type === 'cost')
      .reduce((sum, t) => sum + t.amount, 0);

    return revenue - costs;
  },

  // ... other selectors
}));
```

## 5. Implementation Strategy

### Phase 1: Universal Data (Week 1)
**Priority:** Low (nice-to-have for templates)

1. Create universal data tables in Supabase
2. Seed with initial data (AI tools, function templates, roles)
3. Create `UniversalStore` with read-only access
4. Update components to reference universal data where applicable

**Files to update:**
- Create: `src/lib/state/universal-store.ts`
- Update: `src/app/_layout.tsx` (load universal data on app start)

### Phase 2: User Data (Week 1)
**Priority:** Medium (user preferences)

1. Create user data tables in Supabase
2. Create `UserStore` with CRUD operations
3. Implement user preferences loading on auth
4. Add favorite suppliers functionality

**Files to update:**
- Create: `src/lib/state/user-store.ts`
- Update: `src/app/_layout.tsx` (load user data on auth)

### Phase 3: Company Core Data (Week 2-3)
**Priority:** HIGH (app won't function without this)

**Phase 3a: Members & Organization**
1. Create `members` table with RLS
2. Update `OrganizationStore` to load from Supabase
3. Implement member CRUD operations
4. Test workspace isolation

**Files to update:**
- Update: `src/lib/state/organization-store.ts`
- Update: All components using `useOrganizationStore`

**Phase 3b: Work Plans**
1. Create `work_plans`, `work_plan_allocations`, `work_plan_audit_records` tables
2. Update `WorkPlanStore` to load from Supabase
3. Implement work plan CRUD operations
4. Update completion tracking to use `audit_records`

**Files to update:**
- Update: `src/lib/state/work-plan-store.ts`
- Update: `src/components/home/PerformanceDashboardGrid.tsx` (team productivity)
- Update: All work plan management screens

**Phase 3c: OKRs**
1. Create `okrs` and `okr_objectives` tables
2. Update `OKRStore` to load from Supabase
3. Implement OKR CRUD operations

**Files to update:**
- Update: `src/lib/state/okr-store.ts`
- Update: `src/components/home/PerformanceDashboardGrid.tsx` (OKR progress)

### Phase 4: Suppliers & Financial Data (Week 3-4)
**Priority:** HIGH (financial dashboard needs this)

**Phase 4a: Suppliers**
1. Create `suppliers` and `supplier_engagements` tables
2. Update `SupplierStore` and `OrganizationStore`
3. Implement supplier engagement tracking

**Files to update:**
- Update: `src/lib/state/supplier-store.ts`
- Update: `src/lib/state/organization-store.ts`
- Update: `src/components/home/SupplierSpendDashboard.tsx`
- Update: `src/components/home/PerformanceDashboardGrid.tsx` (supplier performance)

**Phase 4b: Financial Transactions**
1. Create `financial_transactions` and `budget_targets` tables
2. Update `FinanceStore` to load from Supabase
3. Implement transaction CRUD operations
4. Update financial calculations to use real data

**Files to update:**
- Update: `src/lib/state/finance-store.ts`
- Update: `src/lib/financial-calculations.ts` (remove zeros, use store)
- Update: `src/app/financial-dashboard.tsx`
- Update: `src/components/home/PerformanceDashboardGrid.tsx` (cash flow)

### Phase 5: Real-time Subscriptions (Week 5)
**Priority:** Medium (enhances UX)

1. Add Supabase real-time subscriptions for live updates
2. Update stores to handle real-time events
3. Implement optimistic updates for better UX

**Example:**
```typescript
// Subscribe to work plan changes
useEffect(() => {
  if (!currentWorkspace) return;

  const subscription = supabase
    .channel('work_plans')
    .on('postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'work_plans',
        filter: `workspace_id=eq.${currentWorkspace.id}`
      },
      (payload) => {
        // Update store based on event type
        if (payload.eventType === 'INSERT') {
          useWorkPlanStore.setState(state => ({
            workPlans: [...state.workPlans, payload.new]
          }));
        }
        // ... handle UPDATE, DELETE
      }
    )
    .subscribe();

  return () => {
    subscription.unsubscribe();
  };
}, [currentWorkspace?.id]);
```

## 6. Testing Approach

### Data Isolation Testing
**Verify workspace isolation:**
1. Create 2 test workspaces with different data
2. Switch between workspaces
3. Verify each workspace only sees its own data
4. Test RLS policies prevent cross-workspace access

### Source of Truth Testing
**Verify Supabase is source of truth:**
1. Clear all local stores
2. Load data from Supabase
3. Verify all components show correct data
4. Make change in Supabase directly
5. Refresh app, verify change appears

### Multi-User Testing
**Verify real-time updates:**
1. Login as 2 different users in same workspace
2. User A makes a change
3. Verify User B sees the change in real-time

## 7. Migration Path from Current State

### Current State
- All stores have hardcoded seed data
- All financial calculations return zeros
- Components expect data to be in memory

### Migration Steps

1. **Create Supabase tables** (run SQL migrations)
2. **Seed initial data** for existing workspace
3. **Update one store at a time** (start with WorkPlanStore)
4. **Test each store** before moving to next
5. **Remove seed files** once all stores migrated
6. **Clean up unused code** (financial-seed.ts, etc.)

### Backward Compatibility
Keep seed files during migration but mark as deprecated:

```typescript
// src/lib/organization-seed.ts
/**
 * @deprecated This seed data is for backward compatibility only.
 * All data should be loaded from Supabase via OrganizationStore.
 * This file will be removed once migration is complete.
 */
export const ORGANIZATION_MEMBERS = []; // Empty or minimal data
```

## 8. Key Principles

1. **Supabase is the ONLY source of truth** - Never create data in seed files
2. **RLS enforces security** - All workspace data protected by row-level security
3. **Stores are caches** - In-memory stores cache Supabase data for performance
4. **Explicit data loading** - Components trigger data loads, don't assume data exists
5. **Clear data boundaries** - Universal vs Company vs User data never mix
6. **Optimistic updates** - Update UI immediately, sync with Supabase in background
7. **Real-time when possible** - Subscribe to changes for live collaboration

## Summary

This architecture ensures:
- **Single source of truth**: All data in Supabase
- **Clear separation**: Universal, company, and user data tiers
- **Security**: RLS policies enforce workspace isolation
- **Performance**: In-memory caching with Zustand stores
- **Scalability**: Multi-tenant architecture supports unlimited workspaces
- **Real-time**: Live updates via Supabase subscriptions
