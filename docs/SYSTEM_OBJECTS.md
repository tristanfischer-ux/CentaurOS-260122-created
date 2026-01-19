# System Objects

Core data objects in CursorOS with their ownership, relationships, and lifecycle.

## Primary Objects

### 1. Task (WorkPlan)
**Owner Tab**: WHAT
**Store**: `work-plan`

```typescript
interface Task {
  id: string;
  title: string;
  description?: string;
  function: TaskFunction;
  status: 'not-started' | 'in-progress' | 'blocked' | 'completed' | 'abandoned';
  progress: number; // 0-100
  estimatedTimeUnits: number;
  allocations: TaskAllocation[];
  linkedOKRTitle?: string;
  linkedOKRId?: string;
  linkedWorkPlanIds?: string[];
  startDate?: string;
  dueDate?: string;
  assignedBy?: string;
  createdAt: string;
  updatedAt: string;
}
```

**Lifecycle**:
1. Created (not-started)
2. In Progress (allocations assigned)
3. Blocked (impediment)
4. Completed (100% progress)
5. Abandoned (cancelled)

**Relationships**:
- Many Tasks → One OKR (linked via linkedOKRId)
- Many Tasks → Many People (via allocations)
- Many Tasks → Many Suppliers (via linkedSupplierIds)

---

### 2. OKR (Objective & Key Results)
**Owner Tab**: WHY
**Store**: `okr`

```typescript
interface OKR {
  id: string;
  title: string;
  description?: string;
  function: TaskFunction;
  owner?: string; // Member ID
  status: 'on-track' | 'at-risk' | 'off-track';
  objectives: KeyResult[];
  startDate?: string;
  endDate?: string;
  queueStatus?: 'pending' | 'approved' | 'rejected';
  workspaceId: string;
  createdAt: string;
  updatedAt: string;
}

interface KeyResult {
  id: string;
  title: string;
  progress: number; // 0-100
  target?: number;
  current?: number;
}
```

**Lifecycle**:
1. Draft (created via brainstorm)
2. Pending Approval (queue)
3. Active (approved)
4. At Risk (tracking)
5. Completed (all KRs done)

**Relationships**:
- One OKR → Many Tasks
- One OKR → One Owner (Member)
- Many OKRs → One Company Aim

---

### 3. Organization Member
**Owner Tab**: WHO
**Store**: `organization`

```typescript
interface Member {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  function: TaskFunction;
  role: 'Founder' | 'FractionalExec' | 'Apprentice';
  status: 'active' | 'inactive' | 'invited';
  skills: string[];
  weeklyCapacityTU: number;
  startDate?: string;
  avatar?: string;
  workspaceId: string;
}
```

**Lifecycle**:
1. Invited (sent invitation)
2. Active (accepted, working)
3. Inactive (paused/left)

**Relationships**:
- One Member → Many Tasks (via allocations)
- One Member → Many OKRs (as owner)
- Many Members → One Squad

**TU Capacity Defaults**:
- Founder: 10 TU/week
- FractionalExec: 2 TU/day worked
- Apprentice: 10 TU/week

---

### 4. Supplier Engagement
**Owner Tab**: TOOLS
**Store**: `supplier`

```typescript
interface SupplierEngagement {
  id: string;
  supplierName: string;
  projectName: string;
  category: 'Manufacturing' | 'Materials' | 'Logistics' | 'Professional';
  status: 'planning' | 'in_progress' | 'delivered' | 'cancelled';
  totalCost: number;
  paidToDate: number;
  deliveryDate?: string;
  contactPerson?: string;
  contactPhone?: string;
  contactEmail?: string;
  linkedWorkPlanIds?: string[];
  assignedTo?: string; // Member ID
  workspaceId: string;
  createdAt: string;
}
```

**Lifecycle**:
1. Planning (scoping)
2. In Progress (executing)
3. Delivered (completed)
4. Cancelled (terminated)

**Relationships**:
- Many Suppliers → Many Tasks
- One Supplier → One Assigned Member

---

### 5. Decision
**Owner Tab**: HOME (displayed) / WHAT (created)
**Store**: `decisions`

```typescript
interface Decision {
  id: string;
  title: string;
  description?: string;
  status: 'pending' | 'decided' | 'implemented';
  options: DecisionOption[];
  decidedOption?: string;
  decidedAt?: string;
  decidedBy?: string;
  relatedTaskIds?: string[];
  workspaceId: string;
  createdAt: string;
}
```

**Lifecycle**:
1. Pending (needs decision)
2. Decided (option selected)
3. Implemented (action taken)

---

### 6. Company Aim
**Owner Tab**: WHY
**Store**: `company-aim`

```typescript
interface CompanyAim {
  aim: string;
  workspaceId: string;
  updatedAt: string;
}
```

Single instance per workspace - the company's mission statement.

---

### 7. Onboarding State
**Owner Tab**: WHY
**Store**: `onboarding` (Zustand)

```typescript
interface OnboardingState {
  currentModuleId?: string;
  currentStepId?: string;
  completedStepIds: string[];
  skippedStepIds: string[];
  progress: OnboardingProgress;
  status: 'active' | 'paused' | 'completed';
}
```

**Lifecycle**:
1. Active (in progress)
2. Paused (temporarily stopped)
3. Completed (all steps done/skipped)

---

## Secondary Objects

### Task Draft
**Owner**: WHAT
**Temporary object before confirmation**

```typescript
interface TaskDraft {
  title: string;
  notes?: string;
  assignee_default: string;
  due_date: string | null;
  units: number;
  confidence_assignee: number;
  confidence_due: number;
}
```

### Business Improvement
**Owner**: WHY
**AI-generated suggestions**

### AI Agent/Tool
**Owner**: TOOLS
**Equipment slots and automation agents**

### Squad
**Owner**: WHO
**Team grouping**

---

## Object Relationships Diagram

```
                    ┌─────────────┐
                    │ Company Aim │
                    └──────┬──────┘
                           │
              ┌────────────┴────────────┐
              ▼                         ▼
        ┌─────────┐               ┌───────────┐
        │   OKR   │◄──────────────│  Decision │
        └────┬────┘               └───────────┘
             │
     ┌───────┴───────┐
     ▼               ▼
┌─────────┐    ┌──────────┐
│  Task   │◄───│  Member  │
└────┬────┘    └──────────┘
     │
     ▼
┌──────────┐
│ Supplier │
└──────────┘
```

## Anti-Bloat Rules for Objects

1. **Single Store**: Each object type lives in exactly one store
2. **Clear Ownership**: Each object has one owner tab
3. **Explicit Relationships**: Use IDs for relationships, not embedded objects
4. **Lifecycle Clarity**: Every status transition is explicit
5. **Minimal Duplication**: Don't copy data between objects, reference instead

## Adding New Objects

Before adding a new object type:
1. Does it fit in an existing object? → Extend that object
2. Is it truly independent? → Create new store
3. Which tab owns it? → Document in TAB_CONTRACT.md
4. What are its relationships? → Update this document
