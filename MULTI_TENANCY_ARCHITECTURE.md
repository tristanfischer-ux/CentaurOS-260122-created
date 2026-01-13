# Multi-Tenancy Architecture for Centaur OS

## The Problem

**Government/Public User** sees the entire marketplace across all companies:
- All suppliers in the UK
- All AI tools available
- All fractional executives available for hire
- All apprentices looking for work

**Individual Company User** sees:
- Same global marketplace (to browse and hire from)
- PLUS their own company-specific data (their hired people, active suppliers, internal OKRs, work plans)

---

## Solution: Hybrid Data Model

### 1. **Global Marketplace Data** (Public - Visible to All)

These entities are **shared across all companies** and represent the marketplace:

```typescript
// Global marketplace entities - NOT company-specific

interface MarketplaceSupplier {
  id: string;
  name: string;
  // All the supplier details from supplier-store.ts
  // This is the "catalog" that everyone can browse
}

interface MarketplaceExecutive {
  id: string;
  name: string;
  specialization: string;
  dayRate: number;
  availability: string;
  // All the executive profile data from candidates-seed.ts
  // This is the "talent pool" that companies can hire from
}

interface MarketplaceApprentice {
  id: string;
  name: string;
  skills: string[];
  hourlyRate: number;
  // All apprentice profile data
  // This is the "apprentice pool" for companies to hire
}

interface MarketplaceAITool {
  id: string;
  name: string;
  provider: string;
  // All AI tool data from third-party-ai-tools.ts
  // This is the "AI tool catalog" everyone can browse
}
```

**Location**: These stay in existing files:
- `/src/lib/suppliers-seed.ts` - Marketplace suppliers
- `/src/lib/candidates-seed.ts` - Available executives & apprentices
- `/src/lib/third-party-ai-tools.ts` - Available AI tools

**Who Sees This**: Everyone (government user, all companies)

---

### 2. **Company-Specific Data** (Private - Per Company)

These entities are **scoped to individual companies** and represent what they've actually hired/purchased:

```typescript
// Company-specific entities - filtered by workspaceId

interface CompanySupplierEngagement {
  id: string;
  workspaceId: string; // 🔑 KEY: Links to specific company
  supplierId: string; // References MarketplaceSupplier.id
  contractStartDate: string;
  contractEndDate: string;
  monthlySpend: number;
  status: 'active' | 'paused' | 'ended';
  assignedTo: string; // Which team member manages this supplier
  projectDetails: string;
}

interface CompanyTeamMember {
  id: string;
  workspaceId: string; // 🔑 KEY: Links to specific company
  personId: string; // References MarketplaceExecutive.id or MarketplaceApprentice.id
  role: 'Founder' | 'FractionalExec' | 'Apprentice';
  function: BusinessFunction;
  hiredDate: string;
  status: 'active' | 'inactive';
  monthlyCost: number;
}

interface CompanyAISubscription {
  id: string;
  workspaceId: string; // 🔑 KEY: Links to specific company
  aiToolId: string; // References MarketplaceAITool.id
  subscribedDate: string;
  monthlySpend: number;
  status: 'active' | 'trial' | 'cancelled';
  usageStats: {
    requestsThisMonth: number;
    primaryUsers: string[];
  };
}

interface CompanyOKR {
  id: string;
  workspaceId: string; // 🔑 KEY: Links to specific company
  // All OKR fields from okr-store.ts
}

interface CompanyWorkPlan {
  id: string;
  workspaceId: string; // 🔑 KEY: Links to specific company
  // All work plan fields from work-plan-store.ts
}
```

**Location**:
- `/src/lib/state/organization-store.ts` - Company team members and engagements
- `/src/lib/state/okr-store.ts` - Company OKRs
- `/src/lib/state/work-plan-store.ts` - Company work plans

**Who Sees This**:
- Government user sees ALL companies' data aggregated
- Individual company sees ONLY their workspaceId data

---

## 3. **Data Flow Examples**

### Example 1: Hiring a Fractional Executive

**Step 1: Browse Marketplace** (Community Tab)
```typescript
// User browses the global marketplace
const availableExecutives = getMarketplaceExecutives(); // All 30 executives
// Shows: "Priya Sharma - Marketing Expert - £800/day - Available Now"
```

**Step 2: Company Hires Executive**
```typescript
// When company clicks "Hire"
const engagement = {
  id: 'eng-123',
  workspaceId: 'company-abc', // 🔑 Scoped to this company
  personId: 'exec-priya-1', // References marketplace executive
  role: 'FractionalExec',
  function: 'Marketing',
  hiredDate: '2026-01-13',
  status: 'active',
  monthlyCost: 24000, // £800/day * 30 days
};

// Now this executive appears in:
// - Company ABC's Team Directory
// - Company ABC's Org Chart
// - Company ABC's Financial Dashboard (as a cost)
```

**Step 3: Government User View**
```typescript
// Government user sees:
const allEngagements = getCompanyTeamMembers(); // No workspaceId filter
// Shows all companies' hired executives across the entire platform

// They can see:
// - Company ABC hired Priya Sharma (Marketing)
// - Company XYZ hired Marcus Rodriguez (Engineering)
// - Company 123 hired Sarah Mitchell (Sales)
```

---

### Example 2: Contracting with a Supplier

**Step 1: Browse Marketplace** (Community Tab)
```typescript
// User browses suppliers
const suppliers = getMarketplaceSuppliers(); // All 31 UK suppliers
// Shows: "Proto Labs - Rapid Manufacturing - ISO 9001"
```

**Step 2: Company Contracts Supplier**
```typescript
const supplierEngagement = {
  id: 'sup-eng-456',
  workspaceId: 'company-abc', // 🔑 Scoped to this company
  supplierId: 'supplier-protolabs', // References marketplace supplier
  contractStartDate: '2026-01-01',
  contractEndDate: '2026-12-31',
  monthlySpend: 12000,
  status: 'active',
  assignedTo: 'exec-marcus-1', // Their engineering exec manages it
  projectDetails: 'PCB Manufacturing for Product V2',
};

// Now appears in:
// - Company ABC's Make Tab (active suppliers)
// - Company ABC's Financial Dashboard (as manufacturing cost)
// - Company ABC's Organization Structure (supplier relationships)
```

**Step 3: Government User View**
```typescript
// Government sees aggregated data:
const allSupplierEngagements = getCompanySupplierEngagements(); // No filter
// Shows:
// - Proto Labs is working with 12 companies
// - Average contract size: £15,000/month
// - Most popular for: PCB Assembly, CNC Machining
```

---

### Example 3: Subscribing to AI Tools

**Step 1: Browse AI Tool Catalog** (Community Tab)
```typescript
const aiTools = getMarketplaceAITools(); // All 24 AI tools
// Shows: "Jasper AI - £200/month - Content Creation"
```

**Step 2: Company Subscribes**
```typescript
const subscription = {
  id: 'ai-sub-789',
  workspaceId: 'company-abc', // 🔑 Scoped to this company
  aiToolId: 'ai-marketing-1', // Jasper AI
  subscribedDate: '2026-01-13',
  monthlySpend: 200,
  status: 'active',
  usageStats: {
    requestsThisMonth: 1200,
    primaryUsers: ['exec-priya-1', 'apprentice-1'],
  },
};

// Now appears in:
// - Company ABC's Make Tab (AI Tools section)
// - Company ABC's Financial Dashboard (as AI spend)
```

---

## 4. **Store Architecture Updates**

### Current State (Single Company)
```typescript
// okr-store.ts - Current
export const useOKRStore = create<OKRState>((set, get) => ({
  okrs: [], // All OKRs for one company
  initializeOKRs: () => set({ okrs: INITIAL_OKRS }),
}));
```

### Updated State (Multi-Tenant)
```typescript
// okr-store.ts - Multi-tenant
export const useOKRStore = create<OKRState>((set, get) => ({
  okrs: [], // All OKRs across ALL companies

  initializeOKRs: () => set({ okrs: INITIAL_OKRS }),

  // NEW: Filter by company
  getOKRsByWorkspace: (workspaceId: string) => {
    return get().okrs.filter(okr => okr.workspaceId === workspaceId);
  },

  // Government user: See all companies
  getAllOKRs: () => {
    return get().okrs; // No filter
  },
}));

// Usage in components
const currentWorkspace = useCurrentWorkspace();
const myOKRs = useOKRStore(s => s.getOKRsByWorkspace(currentWorkspace.id));
```

---

## 5. **Database Schema (When You Add Backend)**

```sql
-- Global Marketplace Tables (Public)
CREATE TABLE marketplace_suppliers (
  id UUID PRIMARY KEY,
  name VARCHAR(255),
  description TEXT,
  -- All supplier details
);

CREATE TABLE marketplace_executives (
  id UUID PRIMARY KEY,
  name VARCHAR(255),
  specialization VARCHAR(100),
  day_rate INTEGER,
  -- All executive profile data
);

CREATE TABLE marketplace_ai_tools (
  id UUID PRIMARY KEY,
  name VARCHAR(255),
  provider VARCHAR(255),
  cost_per_month INTEGER,
  -- All AI tool details
);

-- Company-Specific Tables (Private, filtered by workspace_id)
CREATE TABLE company_supplier_engagements (
  id UUID PRIMARY KEY,
  workspace_id UUID NOT NULL, -- 🔑 Multi-tenancy key
  supplier_id UUID REFERENCES marketplace_suppliers(id),
  contract_start_date DATE,
  monthly_spend INTEGER,
  status VARCHAR(50),
  -- Engagement details
);

CREATE TABLE company_team_members (
  id UUID PRIMARY KEY,
  workspace_id UUID NOT NULL, -- 🔑 Multi-tenancy key
  person_id UUID, -- References marketplace_executives or marketplace_apprentices
  role VARCHAR(50),
  function VARCHAR(50),
  hired_date DATE,
  -- Member details
);

CREATE TABLE company_okrs (
  id UUID PRIMARY KEY,
  workspace_id UUID NOT NULL, -- 🔑 Multi-tenancy key
  title VARCHAR(255),
  status VARCHAR(50),
  -- OKR details
);

-- Row-Level Security (RLS) in PostgreSQL
-- Ensures users only see their company's data
ALTER TABLE company_okrs ENABLE ROW LEVEL SECURITY;

CREATE POLICY company_okrs_isolation ON company_okrs
  USING (workspace_id = current_setting('app.current_workspace')::uuid);

-- Government users bypass RLS
CREATE POLICY government_full_access ON company_okrs
  USING (current_setting('app.user_role') = 'government');
```

---

## 6. **UI: Government Dashboard**

Government users need a special dashboard to see aggregated data:

```typescript
// /src/app/government-dashboard.tsx

export default function GovernmentDashboard() {
  // See ALL companies' data
  const allWorkspaces = useWorkspaces(); // All companies
  const allOKRs = useOKRStore(s => s.getAllOKRs());
  const allEngagements = useOrganizationStore(s => s.getAllEngagements());

  return (
    <ScrollView>
      {/* Platform-Wide Stats */}
      <View>
        <Text>Total Companies: {allWorkspaces.length}</Text>
        <Text>Total Active OKRs: {allOKRs.length}</Text>
        <Text>Total Supplier Engagements: {allEngagements.length}</Text>
      </View>

      {/* Company Breakdown */}
      {allWorkspaces.map(company => (
        <View key={company.id}>
          <Text>{company.name}</Text>
          <Text>OKRs: {getOKRsByWorkspace(company.id).length}</Text>
          <Text>Team Size: {getTeamMembersByWorkspace(company.id).length}</Text>
          <Text>Monthly Burn: £{getMonthlyBurnByWorkspace(company.id)}</Text>
        </View>
      ))}
    </ScrollView>
  );
}
```

---

## 7. **Implementation Steps**

### Phase 1: Add `workspaceId` to Existing Stores (Immediate)

1. **Update OKR Store**:
```typescript
export interface OKR {
  id: string;
  workspaceId: string; // 🆕 ADD THIS
  function: BusinessFunction;
  title: string;
  // ... rest of fields
}
```

2. **Update Work Plan Store**:
```typescript
export interface WorkPlan {
  id: string;
  workspaceId: string; // 🆕 ADD THIS
  title: string;
  // ... rest of fields
}
```

3. **Update Organization Store**:
```typescript
export interface CompanyTeamMember {
  id: string;
  workspaceId: string; // 🆕 ADD THIS
  personId: string; // References marketplace person
  role: 'Founder' | 'FractionalExec' | 'Apprentice';
  // ... rest of fields
}
```

### Phase 2: Separate Marketplace from Company Data

1. Keep marketplace data as-is (suppliers-seed.ts, candidates-seed.ts, third-party-ai-tools.ts)
2. Create engagement/subscription entities that link companies to marketplace items
3. Filter data by `workspaceId` in all store selectors

### Phase 3: Add Government User Role

```typescript
// app-store.ts
export type UserRole = 'Founder' | 'FractionalExec' | 'Apprentice' | 'Government';

// Add government-specific permissions
export const canViewAllCompanies = (role: UserRole) => role === 'Government';
```

---

## 8. **Key Principles**

1. **Marketplace = Public** - Everyone sees the same catalog of suppliers, executives, AI tools
2. **Engagements = Private** - Only your company sees who you've hired and what you're spending
3. **Government = Observer** - Sees aggregated data across all companies but doesn't belong to any one company
4. **workspaceId = Filter** - Every company-specific entity has a workspaceId field to scope data

---

## 9. **Visual Example**

```
┌─────────────────────────────────────────────────────────────┐
│  MARKETPLACE (Public - Everyone Sees)                       │
├─────────────────────────────────────────────────────────────┤
│  Suppliers: Proto Labs, TechFab, UK Electronics (31 total)  │
│  Executives: Priya Sharma, Marcus Rodriguez (30 total)      │
│  AI Tools: Jasper AI, Gong AI, Clay AI (24 total)           │
└─────────────────────────────────────────────────────────────┘
                          ↓ Browse & Select
┌─────────────────────────────────────────────────────────────┐
│  COMPANY ABC (Private - Only Company ABC Sees)              │
├─────────────────────────────────────────────────────────────┤
│  Hired: Priya Sharma, Marcus Rodriguez, 2 Apprentices       │
│  Contracted: Proto Labs, TechFab                             │
│  Subscribed: Jasper AI, Gong AI, Clay AI                    │
│  OKRs: 8 objectives                                          │
│  Monthly Burn: £87,950                                       │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  GOVERNMENT USER (Sees All Companies Aggregated)             │
├─────────────────────────────────────────────────────────────┤
│  Company ABC: 4 team members, £87K burn, 8 OKRs             │
│  Company XYZ: 7 team members, £120K burn, 12 OKRs           │
│  Company 123: 3 team members, £45K burn, 5 OKRs             │
│  ────────────────────────────────────────────────────────── │
│  Platform Total: 14 companies, 152 team members             │
│  Most Used Supplier: Proto Labs (12 companies)              │
│  Most Popular AI Tool: ChatGPT Enterprise (14 companies)    │
└─────────────────────────────────────────────────────────────┘
```

---

## Summary

**The Answer**: Use a **hybrid data model**:

1. **Global marketplace entities** (suppliers, executives, AI tools) - visible to everyone
2. **Company-specific engagements** (who you hired, what you're paying) - scoped by `workspaceId`
3. **Government user** - special role that bypasses workspace filtering to see aggregated data

This architecture allows:
- ✅ Companies browse the same marketplace
- ✅ Companies only see their own internal data
- ✅ Government sees everything across all companies
- ✅ Clean separation of public catalog vs private usage

**Next Step**: Add `workspaceId` field to all company-specific entities (OKRs, work plans, team members, supplier engagements).
