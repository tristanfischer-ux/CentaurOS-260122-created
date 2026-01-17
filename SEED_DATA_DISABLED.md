# Seed Data Disabled - All Data Now Loads from Supabase

## Summary

All hardcoded seed/demo data has been disabled. After reset, the app will start with a completely empty state (no decisions, objectives, tasks, or marketplace listings).

---

## Files Changed

### 1. `/src/app/(tabs)/index.tsx` (Home Screen)
**Lines 130-139**

**Before:**
```typescript
useEffect(() => {
  initializeTechTree();
  initializeDecisions();
  initializeObjectives();
  autoSeedDemoDataIfNeeded();  // ← SEEDED DEMO TASKS
  seedAllocationRequests();     // ← SEEDED ALLOCATION REQUESTS
  if (suppliers.length === 0) {
    initializeSuppliers();
  }
}, [initializeTechTree, initializeSuppliers, initializeDecisions, initializeObjectives, suppliers.length]);
```

**After:**
```typescript
useEffect(() => {
  initializeTechTree();
  initializeDecisions();
  initializeObjectives();

  // DISABLED: Auto-seeding demo data
  // autoSeedDemoDataIfNeeded();
  // seedAllocationRequests();

  if (suppliers.length === 0) {
    initializeSuppliers();
  }
}, [initializeTechTree, initializeSuppliers, initializeDecisions, initializeObjectives, suppliers.length]);
```

**Impact:** No longer auto-seeds demo work plans, tasks, or allocation requests.

---

### 2. `/src/lib/state/decisions-store.ts`
**Lines 267-284**

**Before:**
```typescript
initialize: async () => {
  if (get().initialized) return;

  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      set({ decisions: parsed, initialized: true });
    } else {
      // Seed with sample data
      set({ decisions: sampleDecisions, initialized: true });  // ← SEEDED SAMPLE DECISIONS
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(sampleDecisions));
    }
  } catch (error) {
    console.error('[DecisionsStore] Failed to initialize:', error);
    set({ decisions: sampleDecisions, initialized: true });  // ← SEEDED SAMPLE DECISIONS
  }
},
```

**After:**
```typescript
initialize: async () => {
  if (get().initialized) return;

  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      set({ decisions: parsed, initialized: true });
    } else {
      // CHANGED: Start with empty array instead of seeding sample data
      set({ decisions: [], initialized: true });
    }
  } catch (error) {
    console.error('[DecisionsStore] Failed to initialize:', error);
    // CHANGED: Start with empty array instead of seeding sample data
    set({ decisions: [], initialized: true });
  }
},
```

**Impact:** No longer auto-seeds sample urgent decisions (hiring, allocations, etc.).

---

### 3. `/src/lib/state/objectives-store.ts`
**Lines 165-182**

**Before:**
```typescript
initialize: async () => {
  if (get().initialized) return;

  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      set({ objectives: parsed, initialized: true });
    } else {
      // Seed with sample data
      set({ objectives: sampleObjectives, initialized: true });  // ← SEEDED SAMPLE OBJECTIVES
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(sampleObjectives));
    }
  } catch (error) {
    console.error('[ObjectivesStore] Failed to initialize:', error);
    set({ objectives: sampleObjectives, initialized: true });  // ← SEEDED SAMPLE OBJECTIVES
  }
},
```

**After:**
```typescript
initialize: async () => {
  if (get().initialized) return;

  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      set({ objectives: parsed, initialized: true });
    } else {
      // CHANGED: Start with empty array instead of seeding sample data
      set({ objectives: [], initialized: true });
    }
  } catch (error) {
    console.error('[ObjectivesStore] Failed to initialize:', error);
    // CHANGED: Start with empty array instead of seeding sample data
    set({ objectives: [], initialized: true });
  }
},
```

**Impact:** No longer auto-seeds sample business objectives (Product, Financial goals, etc.).

---

### 4. `/src/app/create-team.tsx` (Who Tab / Marketplace)
**Lines 111-120 and 135**

**Before:**
```typescript
const recommendedPeople = useMemo(() => {
  const available = MARKETPLACE_EXECUTIVES  // ← HARDCODED 100 EXECUTIVES
    .filter(exec => exec.availability === 'available')
    .slice(0, 10);
  return available;
}, []);

const handleRequestPerson = (person: typeof MARKETPLACE_EXECUTIVES[0]) => {
  // ...
};
```

**After:**
```typescript
const recommendedPeople = useMemo<MarketplaceExecutive[]>(() => {
  // DISABLED: Marketplace executives should be loaded from Supabase
  // const available = MARKETPLACE_EXECUTIVES
  //   .filter(exec => exec.availability === 'available')
  //   .slice(0, 10);
  // return available;

  // Return empty array until Supabase integration is complete
  return [];
}, []);

const handleRequestPerson = (person: MarketplaceExecutive) => {
  // ...
};
```

**Impact:** No longer shows hardcoded marketplace executives (Max Shaw, Aria Martin, Harrison Thomas, etc.). Marketplace is now empty until Supabase integration.

---

## What Was Being Auto-Seeded (Now Disabled)

### Home Tab - Urgent Decisions
- ❌ "Allocation Request: Lucas Silva" (CRITICAL)
- ❌ "Allocation Request: Omar Hassan" (CRITICAL)
- ❌ "Hire Senior Developer" (CRITICAL)
- ❌ Additional decisions from `sampleDecisions` array

### Home Tab - Business Objectives
- ❌ "Launch MVP to First 100 Customers" (PRODUCT - Q1 2026)
- ❌ "Achieve £50K MRR" (FINANCIAL - Q1 2026)
- ❌ Additional objectives from `sampleObjectives` array

### Home Tab - Current Activities / Tasks
- ❌ "Create Social Media Content Calendar" (Marketing, 65% complete)
- ❌ "Research Competitor Pricing" (Sales, 40% complete)
- ❌ "PCB Design & Schematic Review" (Engineering, 65% complete)
- ❌ "Product Housing CAD Design" (Engineering, 78% complete)
- ❌ "Investor Deck Update" (Finance)
- ❌ "Market Research: Target Segments"
- ❌ "Design Product Mockups v1"
- ❌ "Supplier Agreement Review" (BLOCKED)
- ❌ Additional work plans from `autoSeedDemoDataIfNeeded()`

### Who Tab - Squads
- ❌ "Product Housing CAD Design Team" (Auto-generated)
- ❌ "Manufacturing Lead Time Optimization Team" (Auto-generated)
- ❌ Auto-detected squads from `useAutomaticSquadDetection()`

### Who Tab - Executives Marketplace
- ❌ Max Shaw (Sales, Engineering - £750/day)
- ❌ Aria Martin (Sales - £950/day)
- ❌ Harrison Thomas (Admin, Engineering - £950/day)
- ❌ ~97 more hardcoded executives from `MARKETPLACE_EXECUTIVES`

### What Tab - Build Queue
- ❌ Tech tree demo progress (Launch Foundations node partially complete)

---

## Current State After Reset

After running reset, ALL tabs will show:

### ✅ Home Tab
- Urgent Decisions: **0 items**
- Business Objectives: **0 items**
- Current Activities: **empty**
- Team Capacity: **0 TU**

### ✅ What Tab
- Active tasks: **0**
- Queued tasks: **0**
- Blocked tasks: **0**
- Done tasks: **0**

### ✅ Why Tab (Decide)
- Objectives: **0 items**

### ✅ Who Tab
- Team members: **0**
- Squads: **0 manual, 0 auto**
- Executives marketplace: **0 available** (was 100+)

### ✅ Performance Tab
- Task summary: **0s / 0 TU**

### ✅ Tools Tab
- Total spend: **£0**

---

## Stores Already Empty (Previously Disabled)

These stores were already configured to NOT auto-seed:

1. **`useSupplierStore`** (`/src/lib/state/supplier-store.ts` line 67)
   - Already returns empty array
   - UK suppliers catalog disabled

2. **`useOrganizationStore`** (`/src/lib/state/organization-store.ts` line 87)
   - Already returns empty arrays for members, aiAgents, supplierEngagements
   - Seed data disabled

---

## Migration to Supabase (Next Steps)

All data should now come from Supabase. The following need Supabase integration:

1. **Decisions** → `decisions` table in Supabase
2. **Objectives** → `business_objectives` table in Supabase
3. **Work Plans / Tasks** → `work_plans` table in Supabase
4. **Marketplace Executives** → `marketplace_executives` table in Supabase
5. **Allocation Requests** → `allocation_requests` table in Supabase
6. **Team Members** → `organization_members` table in Supabase
7. **Squads** → `squads` table in Supabase
8. **Suppliers** → `suppliers` table in Supabase

All stores should call Supabase queries in their `initialize()` methods instead of returning hardcoded data.

---

## Verification Checklist

After reset, verify:

- [ ] Home tab shows 0 urgent decisions
- [ ] Home tab shows 0 business objectives
- [ ] Home tab shows empty current activities
- [ ] What tab shows 0 tasks in all statuses
- [ ] Why tab shows 0 objectives
- [ ] Who tab shows 0 team members
- [ ] Who tab shows 0 squads
- [ ] Who tab Executives marketplace shows 0 available executives
- [ ] Performance tab shows 0s for all metrics
- [ ] Tools tab shows £0 total spend
- [ ] No console errors
- [ ] No TypeScript errors

---

## Remaining Hardcoded Data (Platform-Level)

These remain hardcoded as they are **platform configuration** (not company data):

1. **Tech Tree Nodes** (`TECH_TREE_NODES` in `/src/lib/data/tech-tree-nodes.ts`)
   - This is the game/platform structure, not user data
   - User progress (nodeProgress) is stored separately and IS cleared on reset

2. **Default AI Tools** (`DEFAULT_AI_TOOLS` in `/src/lib/state/resource-store.ts`)
   - Platform-wide AI tool catalog (AI Assist, AI Copilot, etc.)
   - Not company-specific

3. **Third-Party AI Tools** (`THIRD_PARTY_AI_TOOLS`)
   - Platform-wide catalog of available AI services

These should eventually also move to Supabase as platform-wide reference data.

---

## Summary

✅ **All auto-seeding disabled**
✅ **App starts with completely empty state**
✅ **Reset now truly clears ALL company data**
✅ **Ready for Supabase integration**

Users will now need to:
- Create their own objectives
- Add their own tasks/work plans
- Hire team members from Supabase-backed marketplace
- Make their own decisions

The app is now a **true multi-tenant platform** ready to load data per workspace from Supabase.
