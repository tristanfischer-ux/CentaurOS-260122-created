# Reset Verification Guide

## What Was Implemented

A comprehensive reset system that clears ALL company/tenant data while preserving authentication.

### Files Changed

1. **`/src/lib/reset-system.ts`** (NEW)
   - Comprehensive reset module with full documentation
   - Clears all AsyncStorage company data (preserves auth)
   - Clears all MMKV persisted Zustand stores
   - Calls reset methods on all store instances
   - Dev-only debug instrumentation with detailed reports

2. **`/src/app/(tabs)/settings.tsx`** (MODIFIED)
   - Updated `handleClearAllData` to use new reset system
   - Added imports for all stores
   - Integrated debug reporting
   - Enhanced user messaging

### Persistence Layers Found & Cleared

#### 1. AsyncStorage Keys (Company Data)
- `db:users`
- `db:workspaces`
- `db:memberships`
- `db:objectives`
- `db:keyResults`
- `db:metricEvents`
- `db:projects`
- `db:tasks`
- `db:taskComments`
- `db:timeEntries`
- `db:reviews`
- `db:weeklyPacks`
- `db:templates`
- `db:workflowItems`
- `db:suppliers`
- `db:supplierRecommendations`
- `db:companyProfiles`
- `db:companyConnections`
- `db:communityEvents`
- `db:eventRSVPs`
- `db:auditLogs`
- `app:currentWorkspace`

#### 2. Store-Specific AsyncStorage Keys
- `@centaur-os:armory-v1` (loadouts, squads)
- `@centaur-os:finance-snapshots`
- `@centaur-os:okr-queue`
- `@centaur-os:squads`
- `@centaur-os:okr-planner`
- `@role-storage`

#### 3. MMKV Persisted Zustand Stores
- `tech-tree-storage` (progress, XP, unlocks)
- `allocation-request-storage` (allocation requests)
- `notification-storage` (notifications)
- `marketplace-requests-storage` (marketplace requests)
- `invitation-storage` (team invitations)
- `resource-storage` (people, tasks, AI tools)
- `company-aim-storage` (company vision/mission)
- `resource-ownership-storage` (resource ownership)
- `recommendation-storage` (AI recommendations)
- `dashboard-layout-storage` (widget layouts)
- `build-queue-storage` (build queue)

#### 4. Store Reset Methods Called
- Armory Store
- Finance Store
- Organization Store
- Supplier Store
- Decisions Store
- Objectives Store
- Work Plan Store
- OKR Store
- Queue Store
- Request Store
- Messages Store
- Calendar Store
- Capacity Store
- Squad Store
- Business Improvements Store
- Integrations Store
- Leaderboard Store
- OKR Planner Store
- Tech Tree Store

### What IS Preserved (NOT Cleared)
- ✅ Supabase authentication session
- ✅ User auth token
- ✅ User profile (in Supabase)

### What is CLEARED (Company Data)
- ❌ All workspace/company data
- ❌ All team members
- ❌ All objectives, key results, tasks
- ❌ All decisions
- ❌ All work plans and allocations
- ❌ All squads and loadouts
- ❌ All notifications
- ❌ Tech tree progress and XP
- ❌ Build queue
- ❌ Financial snapshots
- ❌ Dashboard layouts
- ❌ Messages and calendar events
- ❌ All capacity data

---

## Manual Verification Steps

### Before Reset - Check Current Data

1. **Home Tab (Mission Control)**
   - Note: Number of "Urgent Decisions" cards
   - Note: Number of "Business Objectives" cards
   - Note: Number of "Current Activities" entries
   - Note: Team capacity numbers

2. **What Tab**
   - Note: Count of active/queued/blocked/done tasks

3. **Why Tab (Decide)**
   - Note: Count of objectives in list

4. **Performance Tab**
   - Note: Task summary totals (time tracked)

5. **Tools Tab (Make)**
   - Note: Total spend amount (£X or $X)
   - Note: "this period" value

### Execute Reset

1. Navigate to **Settings tab**
2. Scroll to **Data Management** section
3. Tap **"Clear All Data"** (or similar button)
4. Confirm the destructive action
5. App should sign you out and navigate to sign-in screen

### After Reset - Verify Everything is Empty

1. **Sign back in** with same credentials

2. **Home Tab - Should show:**
   - ✅ Urgent decisions count = 0
   - ✅ Business objectives count = 0 (or only explicitly created after reset)
   - ✅ Current activities = empty
   - ✅ Team capacity = 0 or default state

3. **What Tab - Should show:**
   - ✅ Active tasks = 0
   - ✅ Queued tasks = 0
   - ✅ Blocked tasks = 0
   - ✅ Done tasks = 0

4. **Why Tab - Should show:**
   - ✅ Objectives list = empty (or 0 count)

5. **Performance Tab - Should show:**
   - ✅ Task summary = 0s (or all zeros)

6. **Tools Tab - Should show:**
   - ✅ Total spend = £0 or $0
   - ✅ "this period" = clearly defined but zero

7. **Settings Tab - Should show:**
   - ✅ Same user profile (name, email)
   - ✅ Theme settings preserved (if user-level)
   - ✅ All company-specific setup steps reset

### Check Console Logs (Dev Mode Only)

If running in development mode, you should see detailed logs:

```
[Settings] 🔄 Starting comprehensive reset...
[Settings] 📊 Before reset: { asyncStorageKeys: X, mmkvKeys: Y }

[Reset] 🔄 Starting comprehensive company data reset...
[Reset] Step 1: Clearing persisted Zustand stores...
[Reset] ✅ Cleared MMKV store: tech-tree-storage
[Reset] ✅ Cleared MMKV store: allocation-request-storage
... (more stores)

[Reset] Step 2: Clearing AsyncStorage company data...
[Reset] ✅ Cleared AsyncStorage key: db:users
[Reset] ✅ Cleared AsyncStorage key: db:workspaces
... (more keys)

[Reset] Step 3: Resetting store instances...
[Reset] ✅ Reset complete!
[Reset] 📊 Summary:
  - AsyncStorage keys cleared: X
  - MMKV stores cleared: Y
  - Total items cleared: Z

🔄 RESET DEBUG REPORT
⏰ [timestamp]

📦 AsyncStorage Keys Cleared:
  ✅ db:users
  ✅ db:workspaces
  ... (all keys)

💾 MMKV Stores Cleared:
  ✅ tech-tree-storage
  ✅ allocation-request-storage
  ... (all stores)

📊 Total Items Cleared: Z

[Settings] 📊 Data Counts After Reset:
  - Urgent Decisions: 0
  - Objectives: 0
  - Tasks/Activities: 0
  - Team Members: 0
  - AI Agents: 0
  - Squads: 0
  - Tech Tree Nodes: 0

[Settings] ✅ Reset complete! Signing out...
```

---

## Potential Issues & Debugging

### If data STILL appears after reset:

1. **Check if demo/seed data is auto-loading:**
   - Look for `autoSeedDemoDataIfNeeded()` calls in code
   - Check if any stores have default initial data
   - Verify `INITIAL_STATE` constants in stores are empty

2. **Check for missed persistence layers:**
   - Run `mmkv.getAllKeys()` in console
   - Run `AsyncStorage.getAllKeys()` in console
   - Compare against the lists in `reset-system.ts`

3. **Check Supabase data:**
   - Reset only clears LOCAL data
   - If data is fetched from Supabase on login, it will reappear
   - This is EXPECTED for user profile data
   - This is NOT expected for company/workspace data (if RLS is working)

4. **Check for cached React Query data:**
   - React Query may cache server data
   - This is separate from local storage
   - May need to clear React Query cache explicitly

---

## Dev-Only Debug Tools

### Get Current Data Counts
```typescript
import { getDataCounts } from '@/lib/reset-system';

const counts = await getDataCounts();
console.log('Current data counts:', counts);
// { asyncStorageKeys: X, mmkvKeys: Y }
```

### Format Debug Report
```typescript
import { formatDebugReport } from '@/lib/reset-system';

console.log(formatDebugReport(resetReport));
```

### Manual Reset (in code)
```typescript
import { resetAllCompanyData } from '@/lib/reset-system';

const report = await resetAllCompanyData();
console.log('Reset complete:', report);
```

---

## Suspicious Data Sources to Investigate

If data STILL appears after reset, check these locations:

1. **Seed/Demo Data Functions**
   - `autoSeedDemoDataIfNeeded()` in `/src/lib/seed-demo-data.ts`
   - `seedAllocationRequests()` in stores
   - Any `INITIAL_*` constants in stores

2. **Store Initialization**
   - Look for `useEffect` hooks that load demo data on mount
   - Check `initialize()` methods in stores
   - Look for hardcoded sample data in store initial state

3. **Supabase Fetch on Login**
   - Check `loadUserData()` in app-store
   - Check if RLS policies are loading "demo" data
   - Verify workspace/company data is truly tenant-isolated

4. **React Navigation State**
   - Navigation state may cache route params
   - May need to reset navigation state

5. **React Query Cache**
   - Server state cached by React Query
   - Not cleared by reset system
   - May need explicit `queryClient.clear()`

---

## Success Criteria

Reset is successful if ALL of the following are true:

- ✅ Home tab shows 0 urgent decisions
- ✅ Home tab shows 0 business objectives
- ✅ Home tab shows empty current activities
- ✅ What tab shows 0 tasks in all statuses
- ✅ Why tab shows 0 objectives
- ✅ Performance tab shows 0s for all task summaries
- ✅ Tools tab shows £0 or $0 total spend
- ✅ Console logs show detailed debug report (dev mode)
- ✅ No errors in console
- ✅ User can sign back in with same credentials
- ✅ After sign-in, workspace is empty (no ghost data)

---

## Next Steps After Verification

1. If data still appears, identify the source using debug tools above
2. Add any missed persistence layers to `ASYNC_STORAGE_COMPANY_KEYS` or `PERSISTED_STORE_KEYS`
3. Update `StoreResetHandlers` if new stores are found
4. Test again until all criteria are met
