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

## Test 4: Browse Marketplace → Create Outreach Draft → Appears in Drafts

| Step | Action | Expected Result | Pass/Fail |
|------|--------|-----------------|-----------|
| 4.1 | Go to Marketplace tab | Marketplace screen loads | |
| 4.2 | Tap a People/Suppliers card | Action confirmation modal appears | |
| 4.3 | Tap "Contact" button | Draft created, navigates to Tasks | |
| 4.4 | Go to Tasks tab | **Drafts section visible at top** | |
| 4.5 | Verify draft in Drafts section | Draft visible with "Marketplace" source badge | |
| 4.6 | Select draft checkbox | Checkbox selected, "Confirm" button enabled | |
| 4.7 | Tap "Confirm" button | Draft becomes real task in Queued section | |

---

## Test 5: Voice/Text Draft Creation Flow

| Step | Action | Expected Result | Pass/Fail |
|------|--------|-----------------|-----------|
| 5.1 | Go to Tasks tab | Tasks screen loads | |
| 5.2 | Tap + button to open drawer | Bottom drawer opens | |
| 5.3 | Type task text and submit | Task extraction starts | |
| 5.4 | Wait for AI extraction | Draft(s) created, appear in Drafts section | |
| 5.5 | Verify source badge shows "AI" | AI extraction source badge visible | |
| 5.6 | Select and confirm draft | Draft becomes real task | |

---

## Test 6: People Pipeline Basic Flow

| Step | Action | Expected Result | Pass/Fail |
|------|--------|-----------------|-----------|
| 6.1 | Go to People tab | People screen loads | |
| 6.2 | Tap "Hiring" segment | Hiring pipeline view loads | |
| 6.3 | Verify pipeline stages | 5 stages visible: Identified → Engaged | |
| 6.4 | Tap "View Tasks" on a team member | Navigates to Tasks tab | |
| 6.5 | Tap "View Schedule" on a team member | Navigates to When tab | |

---

## Test 7: Old Routes Auto-Redirect Correctly

| Step | Action | Expected Result | Pass/Fail |
|------|--------|-----------------|-----------|
| 7.1 | Navigate to /(tabs)/who | **Auto-redirects to /people** | |
| 7.2 | Navigate to /(tabs)/what | **Auto-redirects to /tasks** | |
| 7.3 | Navigate to /(tabs)/why | **Auto-redirects to / (Home)** | |
| 7.4 | Navigate to /(tabs)/performance | **Auto-redirects to / (Home)** | |
| 7.5 | Navigate to /(tabs)/tools | **Auto-redirects to /resources** | |
| 7.6 | Navigate to /(tabs)/do | **Auto-redirects to /tasks** | |
| 7.7 | Navigate to /(tabs)/decide | **Auto-redirects to /tasks** | |
| 7.8 | Navigate to /(tabs)/make | **Auto-redirects to /resources** | |
| 7.9 | Navigate to /(tabs)/community | **Auto-redirects to /marketplace** | |

---

## Test 8: Home Drilldowns

| Step | Action | Expected Result | Pass/Fail |
|------|--------|-----------------|-----------|
| 8.1 | Go to Home tab | Home screen loads | |
| 8.2 | Scroll to Quick Access section | Plan and Analytics buttons visible | |
| 8.3 | Tap "Plan" button | Navigates to Why/Strategy screen | |
| 8.4 | Go back to Home | Home screen loads | |
| 8.5 | Tap "Analytics" button | Navigates to Performance screen | |

---

## Test 9: Resources Tab Shows Current Usage

| Step | Action | Expected Result | Pass/Fail |
|------|--------|-----------------|-----------|
| 9.1 | Go to Resources tab | Resources screen loads | |
| 9.2 | Verify AI Tools section | Shows configured AI tools | |
| 9.3 | Verify Suppliers section | Shows active supplier engagements | |
| 9.4 | Tap "Browse Marketplace" | Navigates to Marketplace tab | |

---

## Test Summary

| Category | Tests Passed | Tests Failed | Notes |
|----------|--------------|--------------|-------|
| Navigation | /7 | | |
| Task Creation | /5 | | |
| When Tab | /4 | | |
| Marketplace Drafts | /7 | | |
| Voice/Text Drafts | /6 | | |
| People | /5 | | |
| Auto-Redirects | /9 | | |
| Home Drilldowns | /5 | | |
| Resources | /4 | | |
| **TOTAL** | /52 | | |

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
