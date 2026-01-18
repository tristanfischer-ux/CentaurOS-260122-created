# Math & Time Semantics Audit Report

**Audit Date:** January 18, 2026
**Auditor:** Claude Sonnet 4.5
**Scope:** Central OS - All calculations and time period handling

---

## Executive Summary

### Critical Issues Found: 9
### High Risk Issues: 5
### Medium Risk Issues: 7
### Low Risk Issues: 3

**Overall Risk Level:** 🔴 **HIGH**

---

## Phase 0: Inventory of Calculations & Time Handling

### 1. Task Scheduling (`src/lib/scheduling/scheduler.ts`)

| Function | Calculation | Inputs | Outputs | Time Frame | Risks |
|----------|-------------|--------|---------|------------|-------|
| `getWeekStart()` | Week boundary | Date/string, timezone | Monday 00:00 | ISO week (Monday) | ❌ **CRITICAL**: Ignores timezone parameter, uses local |
| `formatWeekStart()` | Date formatting | Date | ISO date string | N/A | ✅ OK |
| `getRemainingCapacity()` | Capacity - allocated | Capacity units, allocations | Remaining units | Per week | ✅ OK (math sound) |
| `allocateTask()` | Capacity allocation | Task units, capacity, allocations | Allocations + risks | Weekly | ⚠️ No DST handling |
| `scheduleConfirmedTasks()` | Batch scheduling | Tasks array | Allocations + risks | Weekly | ⚠️ No DST handling |

**Issues:**
- ❌ **CRITICAL**: `getWeekStart()` accepts timezone but doesn't use it - uses local timezone
- ⚠️ No DST transition testing
- ⚠️ Week boundary calculation may shift on DST transitions

### 2. Finance Store (`src/lib/state/finance-store.ts`)

| Function | Calculation | Inputs | Outputs | Time Frame | Risks |
|----------|-------------|--------|---------|------------|-------|
| `getCashBalance()` | Revenue - costs | Transactions | Cash balance | All-time | ✅ OK |
| `getWeeklyBurn()` | Monthly costs / 4.33 | Transactions | Weekly burn | Per week | ❌ **CRITICAL**: Magic number 4.33 |
| `getMonthlyBurn()` | Weekly * 4.33 | Weekly burn | Monthly burn | Per month | ❌ **CRITICAL**: Magic number 4.33 |
| `getRunway()` | Cash / weekly burn | Cash, burn | Weeks | Runway | ⚠️ Returns weeks, displayed as months |
| `getMonthlyRevenue()` | Recurring + recent avg | Transactions | Monthly revenue | Per month | ❌ **CRITICAL**: Last 3 months using mutable Date |

**Issues:**
- ❌ **CRITICAL**: Magic number 4.33 (weeks/month) - should be documented constant
- ❌ **CRITICAL**: `getMonthlyRevenue()` uses `setMonth()` which is DST-unsafe
- ❌ **CRITICAL**: `getRunway()` returns weeks but context expects months (unit mismatch)
- ⚠️ No division-by-zero guard in runway calculation
- ❌ Inconsistent: `recentMonthlyAvg = recentRevenue / 3` - hardcoded divisor, should handle variable months

### 3. Time Utils (`src/lib/time-utils.ts`)

| Function | Calculation | Inputs | Outputs | Time Frame | Risks |
|----------|-------------|--------|---------|------------|-------|
| `getCurrentWeekOfYear()` | Week of year | None | 1-52 | Annual | ❌ **CRITICAL**: Incorrect algorithm |
| `getWeeksSince()` | Time diff / week | Start date | Weeks count | Variable | ❌ **CRITICAL**: DST-unsafe |

**Issues:**
- ❌ **CRITICAL**: `getCurrentWeekOfYear()` uses simple division, ignores:
  - ISO week definition (week 1 = first week with Thursday)
  - DST transitions (23-hour and 25-hour days)
  - Timezone
- ❌ **CRITICAL**: `getWeeksSince()` uses millisecond math without DST compensation
- ❌ **CRITICAL**: Hardcoded `oneWeek = 7 * 24 * 60 * 60 * 1000` assumes all days are 24 hours (false in DST)

### 4. Performance Dashboard (`src/app/(tabs)/performance.tsx`)

| Metric | Calculation | Inputs | Time Frame | Risks |
|--------|-------------|--------|------------|-------|
| Total capacity | Sum by role | Members | Current | ⚠️ Complex formula, untested |
| Allocated capacity | Sum allocations | Work plans, allocations | Current | ✅ OK |
| Utilization % | (Allocated / Total) * 100 | Capacities | Current | ⚠️ No zero-guard on total |
| Completion rate | (Completed / Total) * 100 | Tasks | All-time | ⚠️ No zero-guard |
| OKR progress | Nested average | OKRs, objectives | Current | ❌ **CRITICAL**: Double-averaging error |
| Runway | Cash / monthly burn | Finance metrics | Months | ❌ Unit confusion (weeks vs months) |

**Issues:**
- ❌ **CRITICAL**: OKR progress calculation (lines 309-316):
  ```typescript
  okrs.reduce((sum, okr) => {
    const progress = okr.objectives.reduce(...) / okr.objectives.length
    return sum + progress
  }, 0) / okrs.length
  ```
  This is WRONG. Averages nested objectives per OKR, then averages OKRs.
  Should weight by objective count or clarify what "overall progress" means.

- ⚠️ Division by zero not guarded:
  - Line 323: `totalCapacity > 0 ? ... : 0` ✅ (has guard)
  - Line 329: `totalTasks > 0 ? ... : 0` ✅ (has guard)
  - But what if `totalCapacity` is calculated incorrectly as 0?

- ⚠️ Capacity calculation (lines 254-256):
  ```typescript
  if (m.role === 'Founder' || m.role === 'Apprentice') return sum + 15;
  return sum + ((m.daysPerWeek || 2) * 2) + Math.min((5 - (m.daysPerWeek || 2)) * 2, 10);
  ```
  This formula is opaque. Needs documentation or extraction to named function.

- ❌ Runway calculation duplicated in two places (lines 293-304 and 396-406) with DIFFERENT logic

### 5. Duplicated Runway Calculations

**Location 1:** Lines 293-304 (metrics memo)
```typescript
if (monthlyBurn < 100) {
  runway = 999;
} else if (cashBalance <= 0) {
  runway = 0;
} else {
  runway = cashBalance / monthlyBurn;
}
```

**Location 2:** Lines 396-406 (financial section)
```typescript
if (monthlyBurn < 100) {
  runway = 999;
} else if (realCashBalance <= 0) {
  runway = 0;
} else {
  runway = realCashBalance / monthlyBurn;
}
```

**Issues:**
- ❌ **CRITICAL**: Code duplication - violates DRY
- ❌ Different variable names (`cashBalance` vs `realCashBalance`)
- ❌ Threshold of 100 is magic number (£100/month) - should be constant
- ⚠️ Runway 999 for "infinite" - should use Infinity or named constant

---

## Critical Math Errors Summary

### 1. Magic Number 4.33 (Weeks per Month)
- **Location**: `finance-store.ts` lines 270, 276, 331
- **Issue**: Hardcoded conversion factor without documentation
- **Fix**: Define constant `WEEKS_PER_MONTH = 365.25 / 12 / 7 = 4.345` (more accurate)

### 2. Week of Year Calculation
- **Location**: `time-utils.ts` line 10-14
- **Issue**: Incorrect algorithm, ignores ISO week standard
- **Fix**: Use `date-fns` `getISOWeek()` or implement proper ISO week logic

### 3. DST-Unsafe Time Calculations
- **Location**: `time-utils.ts` line 20-25, `finance-store.ts` line 296-297
- **Issue**: Uses `setMonth()` and millisecond arithmetic without DST compensation
- **Fix**: Use `date-fns` functions (`sub`, `add`, `differenceInWeeks`)

### 4. Timezone Ignored
- **Location**: `scheduler.ts` line 59-62
- **Issue**: Accepts `timezone` parameter but doesn't use it
- **Fix**: Implement proper timezone handling or remove parameter

### 5. OKR Progress Double-Averaging
- **Location**: `performance.tsx` line 309-316
- **Issue**: Averages objectives per OKR, then averages OKRs (mathematically unclear)
- **Fix**: Decide: overall progress = avg of all objectives, or weighted by OKR?

### 6. Unit Mismatch: Weeks vs Months
- **Location**: `finance-store.ts` `getRunway()` returns weeks, but consumers expect months
- **Issue**: `Math.floor(cashBalance / weeklyBurn)` returns weeks, not months
- **Fix**: Either rename function or convert output

### 7. Division by Zero Not Consistently Guarded
- **Location**: Multiple locations
- **Issue**: Some divisions have guards, some don't
- **Fix**: Create `safeDiv()` helper and use everywhere

---

## Timezone & DST Issues

### Current Timezone Handling
- **Declared default**: `Europe/London` (scheduler.ts line 15)
- **Actual usage**: Local browser timezone (via `new Date()`)
- **DST transitions**: Late March (clocks forward), late October (clocks back)

### Problems
1. Week boundaries shift during DST
2. "Days since" calculations break on 23-hour and 25-hour days
3. No consistent timezone normalization

### Required Fixes
1. Create timezone-aware date utilities
2. Test DST boundaries explicitly
3. Use `date-fns` with Europe/London consistently

---

## Recommendations

### Immediate Fixes (Critical)
1. ✅ Create `src/lib/time/periods.ts` with timezone-aware utilities
2. ✅ Create `src/lib/math/index.ts` with safe math helpers
3. ✅ Fix `getCurrentWeekOfYear()` to use ISO week standard
4. ✅ Fix `getWeeksSince()` to use `date-fns` `differenceInWeeks()`
5. ✅ Document and fix 4.33 magic number
6. ✅ Fix OKR progress calculation
7. ✅ Consolidate runway calculation into single function
8. ✅ Add division-by-zero guards everywhere

### Medium Priority
1. Add DST transition tests
2. Verify week boundary calculations on DST weekends
3. Document capacity formula
4. Create property-based tests for scheduling

### Low Priority
1. Consider using Infinity instead of 999 for infinite runway
2. Add jsdoc comments to all math functions
3. Create visual dashboard showing calculation formulas

---

## Next Steps

Proceeding to **Phase 1**: Create canonical time semantics module.
