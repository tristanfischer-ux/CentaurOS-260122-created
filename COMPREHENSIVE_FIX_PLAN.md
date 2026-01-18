# Comprehensive Fix Implementation Plan

**Created:** 2026-01-18
**Status:** IN PROGRESS

## Summary
This document outlines all fixes needed based on user feedback. All issues will be resolved systematically.

---

## ✅ PHASE 1: DATA AUDIT (COMPLETED)

### Findings:
1. **Urgent Decisions** - Phantom data from persisted AsyncStorage (decisions-store key)
2. **Allocation Requests** - Phantom data from persisted MMKV storage (allocation-request-storage)
3. **Business Objectives** - Phantom data from persisted AsyncStorage (objectives-store key)
4. **Financial Data** - Real data from Supabase (correct)
5. **Supplier Spend** - Needs to calculate from financial transactions properly

### Root Cause:
- Stores initialize empty, but old persisted data remains in storage
- Store keys were not in reset system

---

## ⏳ PHASE 2: FIX DATA ISSUES

### 2.1 Clear Phantom Data ✅
- [x] Added 'decisions-store' and 'objectives-store' to reset-system.ts
- [ ] User needs to reset app data (or implement auto-clear on next load)

### 2.2 Fix "2 more urgent items" Button
**File:** `src/components/home/UrgentDecisionsSection.tsx` (line 756)
**Issue:** Button does nothing when clicked
**Fix:** Navigate to a decisions page or expand to show all items

### 2.3 Fix Supplier Spend Calculation
**File:** `src/components/home/SupplierSpendDashboard.tsx`
**Issue:** Shows budget £85,000, remaining £85,000 - doesn't reflect actual spending
**Fix:** Calculate from financial_transactions table properly

### 2.4 Verify Revenue Calculation
**File:** `src/lib/state/finance-store.ts`
**Current:** £18,333/month from Supabase
**Action:** Verify calculation is correct and matches expectations

---

## 🎯 PHASE 3: WHO TAB IMPROVEMENTS

### 3.1 Rename "Executive..." Label
**File:** Find WHO tab component
**Change:** "Executive..." → "Team and Squads"

### 3.2 Add Better Team Visualization
**Action:** Create org chart or better team cards

### 3.3 Add Resources Section
**Action:** Add same Resources section as What/Why tabs

### 3.4 Add AI Search Capability
**Action:** Add voice + text search for finding people

### 3.5 Optimize Bottom Space Usage
**Action:** Add team metrics, capacity visualization, or other useful content

---

## 🎤 PHASE 4: VOICE INPUT & TASK CREATION OVERHAUL

### 4.1 Redesign Voice Input Prompts
**File:** `src/components/VoiceInputButton.tsx`

**Current:** "Record your task" (generic)

**New Prompts:**
- WHO needs to do this task?
- WHAT needs to be done?
- WHEN should they start?
- HOW LONG will it take?

### 4.2 Improve Recording Screen
**File:** `src/components/VoiceInputButton.tsx` (line 295-356)

**Current:** Just says "Recording..." with timer

**New Design:**
- Show current question being asked
- Visual guides for what to say
- Keep timer
- Progressive prompts

### 4.3 Fix Processing Functionality
**Current:** Processing screen doesn't work properly
**Fix:** Debug and implement proper processing with feedback

### 4.4 Enhance Task Creation Form
**Add Fields:**
- Assignee selector
- Start date picker
- Duration/time estimate
- Dependencies
- Priority

**Add Reminders:** Show what information is required as user types

---

## 🛠️ PHASE 5: TOOLS TAB REORGANIZATION

### 5.1 Split into Two Sections
**Structure:**
```
TOOLS WE'RE USING
  - Currently active tools
  - Can manage/configure

MARKETPLACE
  - Suppliers
  - Devices
  - AI Tools
  - Available to add
```

### 5.2 Add Categories to Marketplace
- Suppliers
- Devices/Hardware
- AI Tools
- Software Tools

### 5.3 Add AI Search
- Voice search
- Text search
- "Find me a tool for..."

---

## 📊 PHASE 6: PERFORMANCE TAB ENHANCEMENTS

### 6.1 Make Team Capacity Numbers Clickable
**File:** Find TeamCapacityDashboard component
**Action:** All numbers should navigate to detail views

### 6.2 Make Task Summary Numbers Clickable
**Action:** Navigate to filtered task lists

### 6.3 Make Financial Metrics Clickable
**Action:** Navigate to financial details

### 6.4 Add Drill-Down Navigation
**Action:** Implement navigation for all metrics

---

## 📝 PHASE 7: NAMING & CONSISTENCY

### 7.1 Update Tab Labels
- What tab: Button should say "New Task"
- Why tab: Button should say "New Objective"
- Consistent "objective" vs "why" terminology

### 7.2 Consistency Audit
- Review all labels across app
- Ensure consistent terminology
- Update any confusing labels

---

## 🔧 IMPLEMENTATION PROGRESS

### Completed:
- [x] Phase 1: Data Audit
- [x] Added missing keys to reset system

### In Progress:
- [ ] Phase 2: Fix Data Issues
  - [x] 2.1 Clear phantom data keys
  - [ ] 2.2 Fix urgent items button
  - [ ] 2.3 Fix supplier spend
  - [ ] 2.4 Verify revenue

### Not Started:
- [ ] Phase 3: Who Tab
- [ ] Phase 4: Voice Input
- [ ] Phase 5: Tools Tab
- [ ] Phase 6: Performance Tab
- [ ] Phase 7: Naming

---

## 📌 NOTES

- All Supabase financial data is CORRECT and should remain
- Reset system now includes all necessary keys
- User can reset via Settings or we can implement auto-clear
- Some changes are UX improvements, others are bug fixes
