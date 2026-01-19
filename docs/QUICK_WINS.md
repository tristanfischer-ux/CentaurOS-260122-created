# Quick Wins

Low-risk, high-impact improvements that can be done quickly.

## Safe to Implement Now

### QW-001: Add Offline Banner to App Root ✅
**Effort**: 5 min
**Impact**: Users see offline status
**Location**: `src/app/_layout.tsx`
**Action**: Import and add `<OfflineBanner />` component

```typescript
import { OfflineBanner } from '@/components/OfflineBanner';

// In the layout component, add after providers:
<OfflineBanner />
```

### QW-002: Initialize Offline Module at Startup ✅
**Effort**: 5 min
**Impact**: Enables offline features
**Location**: `src/app/_layout.tsx`
**Action**: Add initialization in useEffect

```typescript
import { startNetworkMonitoring, initializeSyncManager, startAutoSync } from '@/lib/offline';

useEffect(() => {
  startNetworkMonitoring();
  initializeSyncManager();
  startAutoSync(30000);
}, []);
```

### QW-003: Add PendingAIIndicator to WHAT Tab Header
**Effort**: 10 min
**Impact**: Users see when AI jobs are pending
**Location**: `src/app/(tabs)/what.tsx`
**Action**: Add indicator next to voice button

### QW-004: Add Loading Skeleton to Task List
**Effort**: 15 min
**Impact**: Better perceived performance
**Location**: `src/app/(tabs)/what.tsx`
**Action**: Show skeleton while tasks loading

### QW-005: Add Empty State to OKR List
**Effort**: 15 min
**Impact**: Better UX when no OKRs
**Location**: `src/app/(tabs)/why.tsx`
**Action**: Show "Create your first OKR" when empty

### QW-006: Standardize Button Press Feedback
**Effort**: 20 min
**Impact**: Consistent tactile feedback
**Location**: Global
**Action**: Create shared PressableButton with opacity + haptic

### QW-007: Add Timestamps to Task Cards
**Effort**: 10 min
**Impact**: Users see when tasks were updated
**Location**: `src/components/TaskCard.tsx`
**Action**: Add "Updated 2h ago" text

### QW-008: Improve Voice Recording Duration Display
**Effort**: 5 min
**Impact**: Clearer recording progress
**Location**: `src/components/VoiceInputButton.tsx`
**Action**: Add max duration indicator (e.g., "0:45 / 2:00")

---

## Requires Careful Testing

### QW-101: Cache Marketplace Data
**Effort**: 30 min
**Impact**: Faster marketplace loading
**Risk**: Stale data if cache invalidation wrong
**Action**: Add React Query cache with TTL

### QW-102: Batch Task Status Updates
**Effort**: 30 min
**Impact**: Fewer API calls
**Risk**: UI might lag behind
**Action**: Debounce status updates

### QW-103: Lazy Load Performance Tab
**Effort**: 20 min
**Impact**: Faster initial load
**Risk**: Flash of loading state
**Action**: Use React.lazy for Performance tab

---

## Blocked / Needs Decision

### QW-B01: Remove Demo Mode Code
**Blocked By**: Decision on demo mode future
**Action**: Consult with Tristan

### QW-B02: Consolidate Hidden Tabs
**Blocked By**: Decision on tab architecture
**Action**: See PRODUCT_REFACTOR_BACKLOG.md CR-001

### QW-B03: Standardize Error Messages
**Blocked By**: UX copy guidelines
**Action**: Need error message style guide

---

## Implementation Tracker

| ID | Status | Date | Notes |
|----|--------|------|-------|
| QW-001 | Done | 2026-01-19 | OfflineBanner component created |
| QW-002 | Pending | | Need to add to _layout.tsx |
| QW-003 | Pending | | |
| QW-004 | Pending | | |
| QW-005 | Pending | | |
| QW-006 | Pending | | |
| QW-007 | Pending | | |
| QW-008 | Pending | | |

---

## Adding Quick Wins

When adding:
1. Estimate effort (< 30 min = quick win)
2. Assess risk (low risk = safe, higher = needs testing)
3. Add to appropriate section
4. Update tracker when implemented
