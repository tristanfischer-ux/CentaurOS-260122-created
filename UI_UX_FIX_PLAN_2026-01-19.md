# Comprehensive UI/UX Fix Plan
**Date**: January 19, 2026  
**Status**: Planning Phase - Do Not Implement Yet

This document outlines all identified UI/UX issues across the application, organized by screen and priority.

---

## EXECUTIVE SUMMARY

**Total Issues Identified**: 42  
**Critical (P0)**: 3  
**High Priority (P1)**: 12  
**Medium Priority (P2)**: 19  
**Low Priority (P3)**: 8

---

## 1. HOME PAGE ISSUES

### 1.1 Cash Flow Balance Shows $18,700 (Should be £0)
- **File**: `src/components/home/PerformanceDashboardGrid.tsx` (~252-270)
- **Priority**: P1
- **Current**: Shows £18,700 balance
- **Expected**: Show £0 for new workspaces
- **Root Cause**: Finance store returns seeded data instead of empty state
- **Fix**: Check `useFinanceStore` getCashBalance() initialization

### 1.2 Performance Metrics Lack Explanations
- **File**: `src/components/home/PerformanceDashboardGrid.tsx`
- **Priority**: P2
- **Current**: "Task completion rate", "Quality score", "Velocity consistency" shown without context
- **Expected**: Tappable with modal explaining what each metric means and why it matters
- **Fix**: Add info modals for each metric

---

## 2. FINANCIAL DASHBOARD ISSUES

### 2.1 LTV to CAC Ratio Shows "NA" and "X"
- **File**: `src/app/financial-dashboard.tsx` (~138-164)
- **Priority**: P1
- **Current**: Displays confusing "NA" or "X" when no data
- **Expected**: "Not yet tracked" with explanation
- **Root Cause**: Division by zero when LTV=0 and CAC=0
- **Fix**:
  ```typescript
  const ltvCacRatio = (ltv > 0 && cac > 0) ? ltv / cac : null
  display: ltvCacRatio ? formatRatio(ltvCacRatio) : "Not yet tracked"
  ```

### 2.2 Unit Economics Screen Empty
- **File**: `src/app/financial-dashboard.tsx` (~72-74)
- **Priority**: P2
- **Current**: Empty section
- **Expected**: Remove or add placeholder
- **Fix**: Remove from expandedSections until implemented

### 2.3 Scenario Planning Screen Empty
- **File**: `src/app/financial-dashboard.tsx` (~72-74)
- **Priority**: P2
- **Fix**: Same as 2.2

---

## 3. FUNCTION LIBRARY / OKRs / ADVICE ISSUES

### 3.1 Function Library Not Connected
- **File**: `src/app/function-hub.tsx`
- **Priority**: P2
- **Current**: Shows static data
- **Expected**: Remove link or add disclaimer
- **Fix**: Remove from home screen Quick Access temporarily

### 3.2 Advice for Founders Not Connected
- **Priority**: P2
- **Fix**: Same as 3.1

### 3.3 OKRs "Decide and Strategize" Broken Navigation
- **File**: `src/app/(tabs)/evaluate.tsx` or `src/app/okr-planner.tsx`
- **Priority**: P0 (Critical)
- **Current**: "Add" button → crashes or shows broken screen
- **Expected**: Navigate to working screen or disable button
- **Fix**: Find navigation call, verify destination exists

### 3.4 OKRs "Generate" Button Orphan Page
- **File**: OKR component with AI recommendations
- **Priority**: P2
- **Current**: "Generate" navigates to non-functional page
- **Expected**: Remove or make functional
- **Fix**: Remove button or open modal instead

---

## 4. RESOURCES TAB

### 4.1 Remove Documentation Section
- **File**: Find Resources tab location
- **Priority**: P1
- **Current**: Empty documentation section
- **Expected**: Remove entirely
- **Fix**: Comment out or delete section

---

## 5. WHAT TAB (TASKS) ISSUES

### 5.1 "Create First Task" Runtime Error
- **File**: `src/app/(tabs)/what.tsx`
- **Priority**: P0 (Critical)
- **Current**: Crashes when clicked
- **Expected**: Opens task drawer smoothly
- **Root Cause**: Likely null reference or missing state
- **Fix**: Add null checks, ensure workspace/membership loaded

### 5.2 Focus on Business Setup for First Tasks
- **File**: `src/app/(tabs)/what.tsx`, `src/components/UnifiedBottomDrawer.tsx`
- **Priority**: P2
- **Current**: Generic examples
- **Expected**: First-run shows business setup examples
- **Fix**: Detect taskCount === 0, show setup-focused prompts

### 5.3 Voice Input Guide Improvements
- **File**: `src/components/UnifiedBottomDrawer.tsx` (~200-230)
- **Priority**: P2
- **Issues**:
  - Text too small
  - Doesn't mention multiple tasks at once
  - Missing emphasis on date/time
- **Fix**:
  - Increase font: `text-xs` → `text-sm`
  - Add line: "✓ You can describe multiple tasks in one go!"
  - Emphasize: "✓ Include due date and time if known"

### 5.4 Text Input Multiple Task Examples
- **File**: `src/components/UnifiedBottomDrawer.tsx`
- **Priority**: P2
- **Current**: Single task example
- **Expected**: Show multiple task example
- **Fix**: Add example with 2-3 tasks

### 5.5 Voice Recording UI Too Large
- **File**: Voice recording modal component
- **Priority**: P2
- **Current**: Excessive screen space with large text
- **Expected**: Compact design
- **Fix**: Reduce padding, font sizes, margins

### 5.6 Remove White Box During Recording
- **File**: Voice recording component
- **Priority**: P2
- **Current**: White box appears before strobing
- **Expected**: Immediate strobing in main screen
- **Fix**: Remove intermediate modal, show strobing overlay directly

---

## 6. WHY TAB (OBJECTIVES) ISSUES

### 6.1 Rename "New Task" to "New Aim"
- **File**: `src/app/(tabs)/why.tsx`
- **Priority**: P1
- **Current**: Button says "New Task"
- **Expected**: "New Company Aim"
- **Fix**: Change label and icon (use Target icon)

### 6.2 Voice Prompts Say "Tasks" Not "Aims"
- **File**: `src/app/(tabs)/why.tsx` and brainstorm drawer
- **Priority**: P1
- **Current**: "Record your tasks"
- **Expected**: "Record your company aims"
- **Fix**: Update all copy in WHY tab voice flow

### 6.3 Add AI Questionnaire for Aims
- **File**: `src/app/(tabs)/why.tsx`
- **Priority**: P2
- **Current**: Direct input
- **Expected**: AI asks clarifying questions
- **Fix**: Add modal with questions:
  - What's the specific metric?
  - What's the target?
  - By when?
  - Current baseline?
  - Why important now?

---

## 7. EVALUATE TAB (OKRs) ISSUES

### 7.1 Strategic Health Metrics Not Tappable
- **File**: `src/app/(tabs)/evaluate.tsx` or Strategic Health component
- **Priority**: P2
- **Current**: Shows metrics but not interactive
- **Expected**: Tap opens details or filtered view
- **Fix**: Wrap in Pressable, add ChevronRight icon

### 7.2 Overall Progress Source Unclear
- **File**: `src/app/(tabs)/evaluate.tsx`
- **Priority**: P2
- **Current**: "Overall Progress: 0 on track..." - unclear what it measures
- **Expected**: Clear label like "OKR Health" or "Across all active objectives"
- **Fix**: Add subtitle or rename section

---

## 8. TASK TIMELINE ISSUES

### 8.1 "This Week" Header Too Large
- **File**: `src/components/CollapsibleGanttChart.tsx` or `src/components/MiniGanttChart.tsx`
- **Priority**: P2
- **Current**: Header takes excessive vertical space
- **Expected**: Compact header
- **Fix**: 
  - Reduce padding: `py-3` → `py-1.5`
  - Reduce font: `text-sm` → `text-xs`
  - Inline week number: "This Week (W3)"

---

## 9. TOOLS TAB RESTRUCTURE

### 9.1 Restructure Tab Navigation
- **File**: `src/app/(tabs)/tools.tsx` (~89)
- **Priority**: P1
- **Current**: 3 tabs: "All Tools" | "Suppliers" | "Marketplace"
- **Expected**: 2-level navigation:
  - **My Suppliers** (green)
    - Tools (owned AI)
    - Current Suppliers (engagements)
  - **Marketplace** (purple)
    - Suppliers
    - AI Tools
    - Advisors
- **Fix**:
  ```typescript
  type ToolsTab = 'my-suppliers' | 'marketplace';
  type MySuppliersSub = 'tools' | 'suppliers';
  type MarketplaceSub = 'suppliers' | 'ai-tools' | 'advisors';
  ```

### 9.2 Add Color Coding
- **File**: `src/app/(tabs)/tools.tsx`
- **Priority**: P2
- **Current**: All tabs same color
- **Expected**: Green for "My Suppliers", Purple for "Marketplace"
- **Fix**: Match WHO tab pattern (current vs future)

### 9.3 Reorganize Marketplace Categories
- **File**: `src/app/(tabs)/tools.tsx`
- **Priority**: P2
- **Expected**: Clear categories:
  - **Suppliers**: Manufacturing, Logistics
  - **AI Tools**: (existing list)
  - **Advisors**: VCs, Lawyers, Accountants, General
- **Fix**: Move "Professional Services" under Advisors

---

## 10. TEAM CAPACITY DASHBOARD ISSUES

### 10.1 "Access Restricted" for Founder
- **File**: `src/components/home/TeamCapacityDashboard.tsx` or role checking
- **Priority**: P0 (Critical)
- **Current**: Founder sees "Access restricted" messages
- **Expected**: Founder sees all metrics
- **Root Cause**: Role check logic incorrect
- **Fix**: 
  - Find "Access restricted" rendering
  - Verify role check: `currentMembership?.role === 'Founder'`
  - Ensure `useCurrentMembership()` loads correctly

### 10.2 Status Card Navigation Unclear
- **File**: Team capacity component
- **Priority**: P3
- **Current**: "Past Summary", "Completed", "Blocked", "Queued" - unclear destinations
- **Expected**: Clear where they navigate
- **Fix**: Add subtle arrow icons or "View →" text

---

## IMPLEMENTATION ORDER

### Phase 1: Critical Bugs (Immediate)
1. **5.1** - Fix "Create first task" runtime error
2. **10.1** - Fix "Access restricted" for Founder
3. **3.3** - Fix OKRs broken navigation

### Phase 2: High Priority UX (This Week)
4. **1.1** - Fix cash flow balance
5. **2.1** - Fix LTV:CAC "NA" display
6. **4.1** - Remove Resources documentation
7. **6.1** - Rename "New Task" → "New Aim"
8. **6.2** - Update WHY voice prompts
9. **9.1** - Restructure TOOLS tabs

### Phase 3: Medium Priority (Next Week)
10. **2.2** - Unit Economics empty state
11. **2.3** - Scenario Planning empty state
12. **3.1** - Function Library connection
13. **3.2** - Advice for Founders connection
14. **3.4** - OKRs Generate button
15. **5.2** - Business setup focus
16. **5.3** - Voice input guide
17. **5.4** - Text input examples
18. **7.1** - Strategic Health tappable
19. **7.2** - Overall Progress clarity
20. **8.1** - Task Timeline header
21. **9.2** - TOOLS color coding
22. **9.3** - Marketplace categories

### Phase 4: Polish (Future)
23. **1.2** - Performance metric explanations
24. **5.5** - Voice UI size
25. **5.6** - Remove white box
26. **6.3** - AI questionnaire
27. **10.2** - Status navigation

---

## FILES TO INVESTIGATE

Must find exact locations for:
- [ ] "Create first task" error source
- [ ] "Access restricted" logic
- [ ] OKRs "Decide and Strategize" navigation
- [ ] OKRs "Generate" button
- [ ] Resources tab documentation section
- [ ] Function Library screen
- [ ] Advice for Founders screen
- [ ] Voice recording modal component
- [ ] Strategic Health component
- [ ] Overall Progress component

---

## TESTING CHECKLIST

After fixes:
- [ ] Home: Cash flow £0, no "NA"/"X", team capacity visible
- [ ] Financial: LTV:CAC clear, empty states handled
- [ ] WHAT: Create task works, voice guide improved
- [ ] WHY: "New Aim" button, voice says "aims"
- [ ] EVALUATE: Metrics tappable, progress clear
- [ ] TOOLS: New tab structure, color coded
- [ ] WHO: No "Access restricted" for Founder
- [ ] Task Timeline: Compact header

---

## NOTES

- **DO NOT IMPLEMENT** - This is planning only
- User feedback was transcribed; may contain voice-to-text errors
- Priority based on user impact and frequency of use
- Some issues may be related (fix one, fix multiple)
- Test thoroughly in demo mode before workspace integration

