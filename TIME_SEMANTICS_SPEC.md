# Time Semantics Specification

**Version:** 1.0
**Last Updated:** January 18, 2026
**Canonical Timezone:** Europe/London (GMT/BST)

---

## 1. Core Definitions

### 1.1 Timezone

**All time calculations use Europe/London timezone semantics.**

- **Winter (GMT):** UTC+0 (late October to late March)
- **Summer (BST):** UTC+1 (late March to late October)
- **DST Transitions:**
  - Spring forward: Last Sunday in March, 01:00 → 02:00 (23-hour day)
  - Fall back: Last Sunday in October, 02:00 → 01:00 (25-hour day)

### 1.2 Week Definition

**ISO 8601 Week:**
- Week starts: **Monday 00:00:00.000**
- Week ends: **Sunday 23:59:59.999**
- Week 1 definition: First week containing a Thursday
- Weeks numbered 1-53
- Week year may differ from calendar year (Dec 29-31, Jan 1-3)

### 1.3 Month Definition

- Starts: 1st day of month, 00:00:00.000
- Ends: Last day of month, 23:59:59.999
- Length: Variable (28-31 days)

### 1.4 Year Definition

- Starts: January 1, 00:00:00.000
- Ends: December 31, 23:59:59.999
- Length: 365 or 366 days (leap years)

---

## 2. Period Semantics by Context

### 2.1 Task Scheduling

**"Start Date":**
- Inclusive: Task can be worked on from start of this day
- Default: Today if not specified
- Granularity: Day (ignores time component)

**"Due Date":**
- Inclusive: Task must be completed by end of this day (23:59:59.999)
- Default: None (no deadline)
- Granularity: Day (end of day)
- Risk Flag: Set if scheduled completion > due date

**"This Week" (scheduling context):**
- Start: Monday 00:00 of current ISO week
- End: Sunday 23:59:59.999 of current ISO week
- Inclusive: [Monday, Sunday]

**"Next Week":**
- Start: Monday 00:00 of next ISO week
- End: Sunday 23:59:59.999 of next ISO week

### 2.2 Finance Metrics

**"Weekly Burn":**
- Period: 7-day rolling window
- Calculation: Monthly recurring costs / WEEKS_PER_MONTH
- Constant: WEEKS_PER_MONTH = 4.345 (365.25/12/7)

**"Monthly Revenue":**
- Period: Calendar month boundaries
- Calculation: Recurring monthly + (recent 3 months non-recurring / 3)
- Boundary: [Start of month, End of month]

**"Runway":**
- Unit: Months
- Calculation: Cash balance / Monthly burn
- Infinite: Monthly burn < £100 or net positive cash flow
- Zero: Cash balance ≤ 0

**"This Period" (finance dashboards):**
- Context-dependent:
  - Overview: Current month
  - Cash flow: Last 30 days
  - Burn rate: Last 7 days annualized

### 2.3 Performance Metrics

**"Overall Progress":**
- Calculation: Weighted average of all objectives across all OKRs
- Formula: SUM(objective.progress * objective.weight) / SUM(weights)
- Default weight: 1.0 if not specified
- Empty state: 0% (not NaN)

**"Completion Rate":**
- Calculation: (Completed tasks / Total tasks) * 100
- Empty state: 0% (not "N/A" or NaN)

**"Utilization %":**
- Calculation: (Allocated capacity / Total capacity) * 100
- Empty state: 0% if no capacity defined

**"On Track" / "At Risk" / "Off Track":**
- On track: Progress ≥ 90% of expected progress for time elapsed
- At risk: Progress between 70-90% of expected
- Off track: Progress < 70% of expected

### 2.4 Time Windows

**"Last 7 Days":**
- Start: 7 days ago, start of day (00:00:00.000)
- End: Now
- Inclusive: [7 days ago, now]

**"Last 30 Days":**
- Start: 30 days ago, start of day
- End: Now
- Inclusive: [30 days ago, now]

**"Last 3 Months":**
- Start: 3 months ago, start of month
- End: End of current month
- Inclusive: [3 months ago start, current month end]

**"This Month":**
- Start: 1st of current month, 00:00:00.000
- End: Last day of current month, 23:59:59.999

**"This Year":**
- Start: January 1, 00:00:00.000
- End: December 31, 23:59:59.999

**"Week to Date":**
- Start: Monday of current ISO week, 00:00:00.000
- End: Now

**"Month to Date":**
- Start: 1st of current month, 00:00:00.000
- End: Now

**"Year to Date":**
- Start: January 1 of current year, 00:00:00.000
- End: Now

---

## 3. Conversion Factors

### 3.1 Time Unit Conversions

```
Days per week: 7 (DST-safe: use date-fns, not multiplication)
Weeks per month (average): 4.345 (365.25 / 12 / 7)
Weeks per year (average): 52.18 (365.25 / 7)
Days per year (average): 365.25 (accounts for leap years)
Months per year: 12
```

### 3.2 Never Use These Unsafe Conversions

❌ **DO NOT:**
- `oneWeek = 7 * 24 * 60 * 60 * 1000` (ignores DST)
- `oneMonth = 30 * 24 * 60 * 60 * 1000` (months vary)
- `date.setMonth(date.getMonth() - 3)` (DST-unsafe)
- `weekOfYear = Math.ceil(daysSinceYearStart / 7)` (wrong ISO week)

✅ **USE:**
- `addWeeks(date, 1)` from date-fns
- `differenceInWeeks(end, start)` from date-fns
- `getISOWeek(date)` for week number
- Canonical periods module (`src/lib/time/periods.ts`)

---

## 4. Inclusivity Rules

### 4.1 Time Ranges

**Default: Inclusive start, inclusive end `[start, end]`**

Examples:
- "This week": [Monday 00:00, Sunday 23:59:59.999]
- "Last 7 days": [7 days ago 00:00, now]
- Task due date: Must complete by end of day (inclusive)

**Exceptions (Exclusive end):**
- Database queries with `<` operators: Use `[start, end)` pattern
- Iteration loops: `for (i = start; i < end; i++)`

### 4.2 Edge Cases

**Week containing Jan 1:**
- May be week 52/53 of previous year (ISO 8601)
- Use `getWeekYear()` not `getYear()`

**Week containing Dec 31:**
- May be week 1 of next year (ISO 8601)
- Use `getWeekYear()` not `getYear()`

**DST transition weeks:**
- Spring: 23-hour week (168 - 1 = 167 hours)
- Fall: 25-hour week (168 + 1 = 169 hours)
- Use date-fns for all calculations (handles DST)

**Leap years:**
- Feb has 29 days
- Year has 366 days
- Affects "days since" calculations

---

## 5. Display Format Standards

### 5.1 Dates

- **Full date:** "15 January 2026" or "2026-01-15" (ISO)
- **Short date:** "15 Jan 2026"
- **Week label:** "Week 3, 2026"
- **Month label:** "January 2026"

### 5.2 Durations

- **Runway:** "14.2mo" or "∞" for infinite
- **Time ago:** "3 weeks ago", "2 months ago"
- **Time until:** "in 5 days", "in 2 weeks"

### 5.3 Percentages

- **Progress:** "75.0%" (1 decimal)
- **Utilization:** "85%" (integer, no decimal)
- **Change:** "+12.5%" or "-3.2%" (1 decimal, with sign)

---

## 6. Empty State Handling

### 6.1 Division by Zero

**When denominator is 0:**
- Percentages: Return 0% (not NaN, not Infinity)
- Ratios: Return 0 (or specified fallback)
- Averages: Return 0 for empty arrays

**Examples:**
```typescript
// Wrong
const pct = (completed / total) * 100; // NaN if total = 0

// Correct
const pct = total > 0 ? (completed / total) * 100 : 0;

// Best (using safeDiv)
const pct = safeDiv(completed, total, 0) * 100;
```

### 6.2 Empty Datasets

**When no data exists:**
- Progress: Show "0%" (not "N/A")
- Completion rate: Show "0%" (not undefined)
- OKR progress: Show "No objectives yet" (not NaN)
- Runway: Show "∞" if no burn, "0mo" if no cash

---

## 7. DST Handling Requirements

### 7.1 Spring Forward (Late March)

**Sunday at 01:00 → clocks jump to 02:00**

**Affected calculations:**
- Week has 167 hours (not 168)
- Day has 23 hours
- "Weeks since" must use date-fns, not millisecond math

**Test case:**
- Date: 2026-03-29 (last Sunday in March)
- Task scheduled for Sunday: Should allocate to correct week
- Week boundaries: Must remain Monday 00:00

### 7.2 Fall Back (Late October)

**Sunday at 02:00 → clocks jump to 01:00**

**Affected calculations:**
- Week has 169 hours (not 168)
- Day has 25 hours
- Ambiguous time: 01:00-02:00 occurs twice

**Test case:**
- Date: 2026-10-25 (last Sunday in October)
- Task scheduled for Sunday: Should allocate to correct week
- Week boundaries: Must remain Monday 00:00

### 7.3 Implementation

**Required:**
- Use `date-fns` for all date arithmetic
- Never use `Date.prototype.setMonth()` or `setDate()`
- Never multiply by milliseconds per day/week
- Test with explicit DST transition dates

---

## 8. Validation Rules

### 8.1 Task Scheduling

**Start date:**
- Required: Yes
- Format: ISO 8601 string
- Validation: Must be valid date

**Due date:**
- Required: No (optional)
- Format: ISO 8601 string
- Validation: Must be ≥ start date

**Units:**
- Required: Yes
- Minimum: 1
- Type: Positive integer

### 8.2 Finance Calculations

**Cash balance:**
- Type: Number (can be negative)
- Units: GBP (pence as integer, or pounds as float)

**Burn rate:**
- Type: Positive number (or 0)
- Units: GBP per week or per month (specify)

**Runway:**
- Type: Number (months)
- Special: Infinity if no burn, 0 if no cash

---

## 9. Testing Requirements

### 9.1 Required Test Cases

**Week boundaries:**
- Task scheduled on Sunday 23:59 → Week N or N+1?
- Task scheduled on Monday 00:00 → Week N
- Week calculation during DST transitions

**Month boundaries:**
- Task due on last day of month
- Month with 28, 29, 30, 31 days
- Leap year February

**Empty states:**
- 0 tasks, 0% completion (not NaN)
- 0 capacity, 0% utilization (not NaN)
- 0 burn, infinite runway (not NaN)

**DST transitions:**
- Schedule task on spring forward Sunday
- Schedule task on fall back Sunday
- Calculate "weeks since" across DST boundary

### 9.2 Property-Based Tests

**Invariants:**
- Week start is always Monday
- Sum of allocations ≤ capacity
- Runway calculation is deterministic
- Division by zero returns fallback

---

## 10. Migration Checklist

**All time calculations must:**
- [ ] Use `src/lib/time/periods.ts` functions
- [ ] Document timezone assumptions
- [ ] Handle DST transitions
- [ ] Avoid raw Date arithmetic
- [ ] Test with Europe/London timezone

**All math calculations must:**
- [ ] Use `src/lib/math/index.ts` helpers
- [ ] Guard division by zero with `safeDiv()`
- [ ] Handle empty arrays/datasets
- [ ] Return sensible defaults (0, not NaN)
- [ ] Document units (weeks vs months, GBP vs pence)

---

## 11. Appendix: Europe/London DST Dates

**2026:**
- Spring forward: March 29, 01:00 → 02:00
- Fall back: October 25, 02:00 → 01:00

**2027:**
- Spring forward: March 28, 01:00 → 02:00
- Fall back: October 31, 02:00 → 01:00

**2028:**
- Spring forward: March 26, 01:00 → 02:00
- Fall back: October 29, 02:00 → 01:00
