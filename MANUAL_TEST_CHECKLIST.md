# MANUAL TEST CHECKLIST - 7-Tab Restructure

## Pre-Test Setup
- [ ] App is running on device/simulator
- [ ] User is logged in
- [ ] Demo data is seeded

---

## Test 1: Navigate All Tabs

| Step | Action | Expected Result | Pass/Fail |
|------|--------|-----------------|-----------|
| 1.1 | Tap Home tab | Home screen loads with Mission Control header | |
| 1.2 | Tap People tab | People screen loads with team list | |
| 1.3 | Tap Tasks tab | Tasks screen loads with status groups | |
| 1.4 | Tap When tab | When screen loads with week grid | |
| 1.5 | Tap Resources tab | Resources screen loads with AI tools/suppliers | |
| 1.6 | Tap Market tab | Marketplace screen loads with discovery UI | |
| 1.7 | Tap Settings tab | Settings screen loads | |

---

## Test 2: Create Task Draft → Confirm → Appears in Tasks

| Step | Action | Expected Result | Pass/Fail |
|------|--------|-----------------|-----------|
| 2.1 | Go to Tasks tab | Tasks screen loads | |
| 2.2 | Tap + button to open drawer | Bottom drawer opens | |
| 2.3 | Type task text and submit | Task extraction starts | |
| 2.4 | Review draft in modal | Draft review modal appears | |
| 2.5 | Confirm draft | Task created, appears in Tasks list | |

---

## Test 3: See Allocation in When

| Step | Action | Expected Result | Pass/Fail |
|------|--------|-----------------|-----------|
| 3.1 | Go to When tab | Week grid loads | |
| 3.2 | Verify team members shown | Rows show team members | |
| 3.3 | Check allocated tasks | Colored blocks appear for allocated tasks | |
| 3.4 | Tap a task block | Navigates to Tasks tab | |

---

## Test 4: Browse Marketplace → Create Outreach Draft → Appears in Tasks

| Step | Action | Expected Result | Pass/Fail |
|------|--------|-----------------|-----------|
| 4.1 | Go to Marketplace tab | Marketplace screen loads | |
| 4.2 | Tap a People/Suppliers card | Action confirmation modal appears | |
| 4.3 | Tap "Create Task Draft" | Draft created, navigates to Tasks | |
| 4.4 | Go to Tasks tab | New draft task visible with [DRAFT] prefix | |

---

## Test 5: People Pipeline Basic Flow

| Step | Action | Expected Result | Pass/Fail |
|------|--------|-----------------|-----------|
| 5.1 | Go to People tab | People screen loads | |
| 5.2 | Tap "Hiring" segment | Hiring pipeline view loads | |
| 5.3 | Verify pipeline stages | 5 stages visible: Identified → Engaged | |
| 5.4 | Tap "View Tasks" on a team member | Navigates to Tasks tab | |
| 5.5 | Tap "View Schedule" on a team member | Navigates to When tab | |

---

## Test 6: Old Routes Redirect Correctly

| Step | Action | Expected Result | Pass/Fail |
|------|--------|-----------------|-----------|
| 6.1 | Navigate to /(tabs)/who | Who screen loads (backward compatible) | |
| 6.2 | Navigate to /(tabs)/what | What screen loads (backward compatible) | |
| 6.3 | Navigate to /(tabs)/why | Why screen loads (backward compatible) | |
| 6.4 | Navigate to /(tabs)/performance | Performance screen loads (backward compatible) | |
| 6.5 | Navigate to /(tabs)/tools | Tools screen loads (backward compatible) | |

---

## Test 7: Home Drilldowns

| Step | Action | Expected Result | Pass/Fail |
|------|--------|-----------------|-----------|
| 7.1 | Go to Home tab | Home screen loads | |
| 7.2 | Scroll to Quick Access section | Plan and Analytics buttons visible | |
| 7.3 | Tap "Plan" button | Navigates to Why/Strategy screen | |
| 7.4 | Go back to Home | Home screen loads | |
| 7.5 | Tap "Analytics" button | Navigates to Performance screen | |

---

## Test 8: Resources Tab Shows Current Usage

| Step | Action | Expected Result | Pass/Fail |
|------|--------|-----------------|-----------|
| 8.1 | Go to Resources tab | Resources screen loads | |
| 8.2 | Verify AI Tools section | Shows configured AI tools | |
| 8.3 | Verify Suppliers section | Shows active supplier engagements | |
| 8.4 | Tap "Browse Marketplace" | Navigates to Marketplace tab | |

---

## Test Summary

| Category | Tests Passed | Tests Failed | Notes |
|----------|--------------|--------------|-------|
| Navigation | /7 | | |
| Task Creation | /5 | | |
| When Tab | /4 | | |
| Marketplace | /4 | | |
| People | /5 | | |
| Redirects | /5 | | |
| Home Drilldowns | /5 | | |
| Resources | /4 | | |
| **TOTAL** | /39 | | |

---

## Issues Found

| # | Description | Severity | Status |
|---|-------------|----------|--------|
| | | | |

---

## Sign-off

- Tester: _______________
- Date: _______________
- Version: _______________
