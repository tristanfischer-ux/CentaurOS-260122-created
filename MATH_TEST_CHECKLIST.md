# Math & Time Testing Checklist

**Manual Verification Guide**
**Version:** 1.0

---

## 1. Task Scheduling Tests

### Test 1.1: Sunday Night Task Creation
**Steps:**
1. Set system date to Sunday, 23:30 GMT (Europe/London)
2. Create a new task with start date "today"
3. Confirm the task
4. Check task allocation

**Expected:**
- Task allocated to current ISO week (ending tonight)
- Week boundary is Monday 00:00, not Sunday 00:00

**Pass/Fail:** ___________

---

### Test 1.2: Capacity Overflow
**Steps:**
1. Create user with 10 TU weekly capacity
2. Create task requiring 25 TUs
3. Confirm task
4. View schedule

**Expected:**
- Week 1: 10 TUs allocated
- Week 2: 10 TUs allocated
- Week 3: 5 TUs allocated
- Total: 3 weeks

**Pass/Fail:** ___________

---

### Test 1.3: Due Date Risk Flag
**Steps:**
1. Create task: 20 TUs, due in 1 week, user capacity 10/week
2. Confirm task
3. Check task details

**Expected:**
- Task shows risk flag ⚠️
- Task still scheduled (not blocked)
- Explanation: "May miss deadline"

**Pass/Fail:** ___________

---

### Test 1.4: DST Spring Forward (March 29, 2026)
**Steps:**
1. Set system date to March 28, 2026 (Friday before DST)
2. Create task scheduled for Sunday, March 29
3. Confirm task
4. Check week allocation

**Expected:**
- Task allocated to Week 13 (March 23-29)
- Week boundary still Monday March 23, 00:00
- No off-by-one errors

**Pass/Fail:** ___________

---

### Test 1.5: DST Fall Back (October 25, 2026)
**Steps:**
1. Set system date to October 23, 2026 (Friday before DST)
2. Create task scheduled for Sunday, October 25
3. Confirm task
4. Check week allocation

**Expected:**
- Task allocated to Week 43 (October 19-25)
- Week boundary still Monday October 19, 00:00
- No off-by-one errors

**Pass/Fail:** ___________

---

## 2. Finance Calculation Tests

### Test 2.1: Runway with Zero Burn
**Steps:**
1. Set cash balance to £50,000
2. Set monthly burn to £0 (no recurring costs)
3. View Performance dashboard

**Expected:**
- Runway displays: "∞" (infinite)
- Not "NaN" or "0mo"

**Pass/Fail:** ___________

---

### Test 2.2: Runway with High Burn
**Steps:**
1. Set cash balance to £18,700
2. Set monthly recurring costs to £18,700
3. View Performance dashboard

**Expected:**
- Runway displays: "1.0mo"
- Calculation: 18700 / 18700 = 1 month

**Pass/Fail:** ___________

---

### Test 2.3: Weekly Burn Conversion
**Steps:**
1. Set monthly recurring costs to £4,345
2. Check getWeeklyBurn() output

**Expected:**
- Weekly burn: £1,000
- Calculation: 4345 / 4.345 = 1000
- NOT 4345 / 4.33 = 1003.46

**Pass/Fail:** ___________

---

### Test 2.4: Last 3 Months Revenue (DST Crossing)
**Steps:**
1. Set date to April 15, 2026 (after March DST)
2. Add revenue transactions in Jan, Feb, Mar
3. Check getMonthlyRevenue() output

**Expected:**
- Includes revenue from Jan 1 - Mar 31
- No off-by-one errors from DST transition
- Calculation uses date-fns, not setMonth()

**Pass/Fail:** ___________

---

## 3. Dashboard Metrics Tests

### Test 3.1: Empty Task List
**Steps:**
1. Create workspace with no tasks
2. View Performance dashboard

**Expected:**
- Completion rate: "0%"
- NOT "NaN%", "undefined", or crash
- Progress: "0%"

**Pass/Fail:** ___________

---

### Test 3.2: Zero Total Capacity
**Steps:**
1. Create workspace with no active members
2. View Performance dashboard

**Expected:**
- Utilization: "0%"
- NOT "NaN%" or "Infinity%"
- Available capacity: 0

**Pass/Fail:** ___________

---

### Test 3.3: OKR Progress Calculation
**Setup:**
- OKR 1: 2 objectives, progress [50%, 80%] → avg 65%
- OKR 2: 1 objective, progress [100%] → avg 100%

**Steps:**
1. View Performance dashboard
2. Check overall OKR progress

**Expected:**
- Overall progress: 75.0%
- Calculation: (65 + 100) / 2 = 82.5%
- OR weighted by objectives: (50 + 80 + 100) / 3 = 76.7%
- Document which formula is used

**Pass/Fail:** ___________
**Formula used:** ___________

---

### Test 3.4: Completion Rate with 1 Task
**Steps:**
1. Create 1 task, mark as completed
2. View dashboard

**Expected:**
- Completion rate: "100%"
- NOT crash or show "NaN%"

**Pass/Fail:** ___________

---

## 4. Time Window Tests

### Test 4.1: "This Week" Boundary
**Steps:**
1. Set date to Wednesday, January 15, 2026
2. Filter tasks by "this week"

**Expected:**
- Includes: Monday Jan 13 - Sunday Jan 19
- Week starts Monday, not Sunday
- Week number: 3 (ISO week)

**Pass/Fail:** ___________

---

### Test 4.2: "This Month" in February (Leap Year)
**Steps:**
1. Set date to February 15, 2028 (leap year)
2. Filter transactions by "this month"

**Expected:**
- Includes: Feb 1 - Feb 29
- NOT Feb 1 - Feb 28 (leap year has 29 days)

**Pass/Fail:** ___________

---

### Test 4.3: "Last 7 Days" Across DST
**Steps:**
1. Set date to April 1, 2026 (3 days after spring DST)
2. Filter events by "last 7 days"

**Expected:**
- Includes: March 25 (Friday) - April 1 (Wed)
- Includes March 29 (DST Sunday)
- Total: 7 calendar days (not 167 hours)

**Pass/Fail:** ___________

---

### Test 4.4: Week Number at Year Boundary
**Steps:**
1. Set date to January 1, 2026 (Thursday)
2. Check current week number

**Expected:**
- Week number: 1 (first week with Thursday)
- Week year: 2026
- Week start: Monday, December 29, 2025

**Pass/Fail:** ___________

---

### Test 4.5: Week Number at Year Boundary (Dec 31)
**Steps:**
1. Set date to December 31, 2026 (Thursday)
2. Check current week number

**Expected:**
- Week number: 53
- Week year: 2026
- Week end: Sunday, January 3, 2027

**Pass/Fail:** ___________

---

## 5. Edge Case Tests

### Test 5.1: Division by Zero (Utilization)
**Steps:**
1. Calculate utilizationPercent with totalCapacity = 0
2. Check result

**Expected:**
- Result: 0
- NOT NaN, Infinity, or crash

**Pass/Fail:** ___________

---

### Test 5.2: Division by Zero (Completion Rate)
**Steps:**
1. Calculate completionRate with totalTasks = 0
2. Check result

**Expected:**
- Result: 0
- NOT NaN or crash

**Pass/Fail:** ___________

---

### Test 5.3: Negative Cash Balance
**Steps:**
1. Set revenue = £10,000
2. Set costs = £20,000
3. View cash balance

**Expected:**
- Cash balance: -£10,000 (negative is valid)
- Runway: "0mo" (can't have negative runway)

**Pass/Fail:** ___________

---

### Test 5.4: Weeks Since Founding (Across DST)
**Steps:**
1. Set founded date: March 1, 2026
2. Set current date: April 15, 2026
3. Check "weeks since founding"

**Expected:**
- Weeks: 6 (using differenceInWeeks)
- NOT 5.9 or 6.1 from millisecond math
- Crosses DST (March 29) correctly

**Pass/Fail:** ___________

---

## 6. Consistency Tests

### Test 6.1: Runway Calculation Consistency
**Steps:**
1. View Performance dashboard "Current Activities" card
2. View Performance dashboard "Financial" tab
3. Compare runway values

**Expected:**
- Both show same runway value
- No discrepancy between cards

**Pass/Fail:** ___________

---

### Test 6.2: Capacity Formula Consistency
**Steps:**
1. Check capacity calculation for Founder role
2. Check capacity calculation for Fractional Exec (2 days/week)
3. Verify against documented formula

**Expected:**
- Founder: 15 TUs
- Exec (2 days): ((2 * 2) + min((5-2)*2, 10)) = 4 + 6 = 10 TUs
- Formula documented in code or spec

**Pass/Fail:** ___________

---

## 7. Performance Tests

### Test 7.1: Large Dataset (100 Tasks)
**Steps:**
1. Create 100 tasks
2. Confirm all tasks
3. View Performance dashboard

**Expected:**
- Dashboard loads in < 2 seconds
- No "Maximum update depth" errors
- All metrics calculated correctly

**Pass/Fail:** ___________

---

### Test 7.2: Schedule 50 Tasks in Batch
**Steps:**
1. Create 50 task drafts
2. Confirm all at once (batch)
3. Check schedule

**Expected:**
- All tasks scheduled
- No infinite loops
- Allocations consistent

**Pass/Fail:** ___________

---

## 8. Format Tests

### Test 8.1: Runway Display Format
**Steps:**
1. Set runway to 14.234 months
2. View dashboard

**Expected:**
- Display: "14.2mo" (1 decimal place)
- NOT "14.234mo" or "14mo"

**Pass/Fail:** ___________

---

### Test 8.2: Percentage Format
**Steps:**
1. Set completion rate to 75.678%
2. View dashboard

**Expected:**
- Display: "76%" (rounded, no decimal)
- OR "75.7%" (1 decimal) if specified
- Document format used

**Pass/Fail:** ___________

---

## 9. Idempotency Tests

### Test 9.1: Double Confirm
**Steps:**
1. Create task draft
2. Confirm draft → task created
3. Try to confirm same draft again

**Expected:**
- No duplicate task created
- Returns existing task
- No error thrown

**Pass/Fail:** ___________

---

## 10. Regression Tests

### Test 10.1: Previous Bug - 231 Month Runway
**Steps:**
1. Set cash balance: £18,700
2. Set monthly burn: £81 (very low)
3. View runway

**Expected:**
- Runway: "∞" (infinite, since burn < £100)
- NOT "231mo" from 18700/81

**Pass/Fail:** ___________

---

### Test 10.2: Previous Bug - OKR Double Averaging
**Setup:**
- OKR with 3 objectives: [30%, 60%, 90%]

**Steps:**
1. View OKR progress

**Expected:**
- Progress: 60% (simple average)
- NOT 93% (double-averaged)
- Formula clearly documented

**Pass/Fail:** ___________

---

## Summary

**Total Tests:** 30
**Passed:** ___________
**Failed:** ___________
**Skipped:** ___________

**Critical Issues Found:** ___________

**Notes:**
_____________________________________________________________
_____________________________________________________________
_____________________________________________________________
_____________________________________________________________
