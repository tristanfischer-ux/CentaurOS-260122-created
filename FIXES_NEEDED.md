# Critical Fixes Needed - January 18, 2026

## 🏠 Home Screen Issues

### 1. Cash Flow Display
- **Issue:** Shows £18,700 balance - verify this is correct or needs recalculation
- **Location:** Home screen performance dashboard

### 2. Supplier/Vendor Spend Widget
- **Issue:** Shows incorrect data:
  - Total spend: £15,000
  - Budget: £63,600
  - Remaining: £48,600
- **Action:** Remove this widget or fix the data source
- **Location:** Home screen

---

## 👥 WHO Tab Issues

### 3. Tab Labels Clarity
- **Current:** "Team" and "Squads" tabs are confusing
- **Fix:** Change to "My Team" and "Squads"
- **Location:** WHO tab navigation

### 4. Tab Layout & Order
- **Current Order:** Team, Squads, Hire, Resources (drifts off screen)
- **New Order:**
  1. My Team
  2. Squads
  3. Hire Execs & Apprentices (combine hire tabs)
  4. Resources (far right)
- **Issue:** Current layout drifts off screen edge

### 5. Resources - Broken Links
- **Issue:** Quick links go to wrong places:
  - "People Management Guide" → wrong destination
  - "Hiring Best Practices" → wrong destination
  - "Squad Formation Guide" → wrong destination
- **Fix:** Create proper content or remove links

### 6. Team Templates - Nothing to Click
- **Issue:** Shows template names but no interaction:
  - "Start-up Team Pre-Seed Template"
  - "Growth Team Series A Template"
- **Fix:** Make these clickable with actual content/actions

---

## ✅ WHAT Tab Issues

### 7. Bottom Drawer - Empty Space
- **Issue:** Large white space below "New Task" with minimal content
- **Current:** "What to include, who should do it, when it's done"
- **Fix:** Make this area highly informative with detailed guidance

### 8. Input Method Labels
- **Current:**
  - Voice: "Speak naturally"
  - Type: "Describe tasks"
- **Fix:**
  - Voice: "Speak naturally to describe your task"
  - Type: "Describe task"

### 9. Type Input - Extract Tasks Button Broken
- **Issue:** "Extract Tasks" button doesn't do anything
- **Fix:** Wire up the button to call the task extraction API

### 10. Voice Input - Layout Issues
- **Issue:** "Tap to record your task" in small box above microphone
- **Issue:** Microphone button at very bottom (above white tab)
- **Fix:** Use the large white space for detailed instructions

### 11. Voice Recording Modal - UX Issues
- **Current:** Separate modal pops up during recording
- **Fix Desired:**
  - Keep recording in the drawer (no modal)
  - Microphone button moves up and pulses
  - Show recording duration
  - Display all prompts (WHO/WHAT/WHEN/HOW LONG) in the drawer space
  - User can see instructions while recording

---

## 💡 WHY Tab Issues

### 12. Overall Progress - Unclear Labels
- **Issue:** "On track / At risk / Off track" - unclear what this refers to
- **Fix:** Add clarifying labels or context

### 13. AI Recommendations - Wrong Navigation
- **Issue:** Clicking goes to strange report tab
- **Fix:** Remove this navigation or fix destination

### 14. New Task Drawer
- **Issue:** Same layout problems as WHAT tab
- **Fix:** Apply same fixes as WHAT tab (#7-11)

---

## 🔧 TOOLS Tab Issues

### 15. Tab Structure Needed
- **Current:** Unclear structure
- **Fix:** Create tabs:
  1. All Tools
  2. Current Suppliers
  3. Marketplace

### 16. Marketplace - Search Functionality
- **Fix:** Add:
  - Generic search bar
  - AI-assisted search option
  - Directory below with: Suppliers, AI Tools, Advisors

### 17. Advisors Section
- **Issue:** Nothing to click on
- **Fix:** Add clickable advisor cards/content

### 18. AI Tools Section - Inconsistent UI
- **Issue:** Smaller popup/drawer than Suppliers
- **Current:** Just "Find New AI Tools"
- **Fix:** Match the Suppliers UI pattern:
  - "Find New AI Tools"
  - "Connect with AI Tools for your projects"
  - Make it visually consistent

### 19. Advisors - Needs Content
- **Issue:** Less meaningful than other sections
- **Fix:** Create proper advisor cards/content matching Suppliers pattern

---

## 📊 PERFORMANCE Tab Issues

### 20. Team Capacity - Access Restricted Bug
- **Issue:** Shows "Access restricted - Only fractional executives"
- **Context:** User is logged in as Founder
- **Fix:** Check privacy/role logic - Founders should have access

### 21. Allocated - Access Restricted Bug
- **Same issue as #20**

### 22. Available - Access Restricted Bug
- **Same issue as #20**

### 23. Navigation Links (Working Correctly ✅)
- Task Summary → WHAT tab ✅
- Completed → WHAT tab ✅
- Blocked → WHAT tab ✅
- Queued → WHAT tab ✅

---

## Implementation Priority

### 🔴 Critical (P0) - Fix Immediately
1. **Voice recording errors** (already being worked on)
2. **Type input "Extract Tasks" button broken** (#9)
3. **Performance tab access restrictions** (#20, #21, #22)
4. **Broken resource links** (#5)

### 🟡 High Priority (P1) - Fix Soon
1. **WHO tab layout and labeling** (#3, #4)
2. **WHAT/WHY tab drawer empty space** (#7, #14)
3. **Voice recording UX redesign** (#11)
4. **TOOLS tab restructure** (#15, #16)

### 🟢 Medium Priority (P2) - Next Phase
1. **Home screen supplier spend widget** (#2)
2. **Team templates clickable** (#6)
3. **AI Tools/Advisors consistency** (#17, #18, #19)
4. **Input method label improvements** (#8)

### 🔵 Low Priority (P3) - Polish
1. **WHY tab progress clarity** (#12)
2. **AI Recommendations navigation** (#13)
3. **Cash flow display verification** (#1)

---

## Files That Need Changes

### Home Screen
- `src/app/(tabs)/index.tsx`
- `src/components/home/SupplierSpendDashboard.tsx`

### WHO Tab
- `src/app/(tabs)/who.tsx`
- WHO tab sub-screens (team, squads, hire, resources)

### WHAT Tab
- `src/app/(tabs)/what.tsx`
- `src/components/CollapsibleTaskCreator.tsx`
- `src/components/VoiceInputButton.tsx` (already in progress)

### WHY Tab
- `src/app/(tabs)/why.tsx`
- `src/components/CollapsibleBrainstormStarter.tsx`

### TOOLS Tab
- `src/app/(tabs)/tools.tsx`
- Marketplace components

### PERFORMANCE Tab
- `src/app/(tabs)/performance.tsx`
- Privacy/access control logic in `src/lib/permissions.ts` or similar

---

## Next Steps

1. **Confirm priorities with user**
2. **Start with P0 critical fixes**
3. **Move through P1, P2, P3 systematically**
4. **Test each section thoroughly after fixes**

---

**Status:** Documented - Ready for implementation planning
**Date:** January 18, 2026
