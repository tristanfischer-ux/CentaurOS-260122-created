# Voice Input UX Improvements & Backend Integration Plan

**Created:** 2026-01-18
**Status:** DRAFT - Awaiting User Approval

---

## Executive Summary

This plan addresses two critical areas:

1. **UI/UX Improvements:** Replace floating voice buttons with collapsible drawer components that integrate naturally into the WHAT and WHY tabs
2. **Backend Integration:** Connect voice/text input flows to existing backend APIs for task extraction and brainstorming

---

## Part 1: UI/UX Improvements

### Current Issues
- ❌ Floating voice button obstructs content and gets in the way
- ❌ Unclear that users can create tasks via voice OR text
- ❌ No clear indication of what information is needed when creating a task
- ❌ Voice input feels disconnected from the main task creation flow

### Proposed Solution: Collapsible "New Task" Drawer

**Pattern:** Similar to `CollapsibleResourcePool` and `CollapsibleGanttChart`

#### WHAT Tab - Task Creation Drawer

**Visual Design:**
```
┌─────────────────────────────────┐
│  🎯 New Task        ⬆️ [Chevron]│  ← Collapsed Tab (always visible at bottom)
└─────────────────────────────────┘
```

When tapped, slides up to reveal:
```
┌─────────────────────────────────┐
│  🎯 New Task        ⬇️ [Chevron]│
├─────────────────────────────────┤
│                                 │
│  Choose input method:           │
│  ┌──────────┐  ┌──────────┐   │
│  │ 🎤 Voice  │  │ ⌨️ Type   │   │
│  └──────────┘  └──────────┘   │
│                                 │
│  [Currently selected method]    │
│  ┌─────────────────────────┐  │
│  │ [Voice recording UI]    │  │
│  │ OR                       │  │
│  │ [Text input fields]     │  │
│  └─────────────────────────┘  │
│                                 │
│  Required fields:               │
│  • Title (auto-extracted)       │
│  • Function (your choice)       │
│  • Time estimate (TU)           │
│                                 │
│  [Create Task Button]           │
│                                 │
└─────────────────────────────────┘
```

**Key Features:**
1. **Tab header shows:** "New Task" with a badge if there are pending drafts
2. **Collapsed state:** Just the tab header, tappable to expand
3. **Expanded state:**
   - Two large buttons: "🎤 Voice" and "⌨️ Type"
   - Active method shows its UI
   - Clear labels for required fields
   - Help text explaining what happens next

**Voice Mode UI:**
```
┌─────────────────────────────────┐
│ 🎤 Recording...         [00:15] │
│ ┌─────────────────────────────┐ │
│ │ 🔴 [Animated pulse]         │ │
│ │                             │ │
│ │ "Create a task to fix the   │ │
│ │  login bug and assign it    │ │
│ │  to engineering..."         │ │
│ │                             │ │
│ └─────────────────────────────┘ │
│                                 │
│ [Cancel]         [Done]         │
└─────────────────────────────────┘
```

**Text Mode UI:**
```
┌─────────────────────────────────┐
│ ⌨️ Describe your task            │
│ ┌─────────────────────────────┐ │
│ │ What needs to be done?      │ │
│ │                             │ │
│ │ [Text area - multi-line]    │ │
│ │                             │ │
│ └─────────────────────────────┘ │
│                                 │
│ 💡 Tip: Mention who should do   │
│    it and when it's due         │
│                                 │
│ [Extract Tasks]                 │
└─────────────────────────────────┘
```

#### WHY Tab - Brainstorm Drawer

**Visual Design (similar pattern):**
```
┌─────────────────────────────────┐
│ 💡 Start Brainstorm  ⬆️ [Chevron]│  ← Collapsed
└─────────────────────────────────┘
```

Expanded:
```
┌─────────────────────────────────┐
│ 💡 Start Brainstorm  ⬇️ [Chevron]│
├─────────────────────────────────┤
│                                 │
│  Choose input method:           │
│  ┌──────────┐  ┌──────────┐   │
│  │ 🎤 Voice  │  │ ⌨️ Type   │   │
│  └──────────┘  └──────────┘   │
│                                 │
│  Share your ideas:              │
│  ┌─────────────────────────┐  │
│  │ [Voice or text input]   │  │
│  └─────────────────────────┘  │
│                                 │
│  💡 The AI will ask questions   │
│     to help define objectives   │
│     and create tasks            │
│                                 │
│  [Start Session]                │
│                                 │
└─────────────────────────────────┘
```

### Implementation Details

#### New Components to Create

1. **`CollapsibleTaskCreator.tsx`** (WHAT tab)
   - Collapsible drawer using `react-native-reanimated`
   - Two modes: Voice and Text (toggle buttons)
   - Integrates `VoiceInputButton` component
   - Text input with helper text
   - Shows required field labels
   - Calls `/api/what/extract-drafts` when user submits

2. **`CollapsibleBrainstormStarter.tsx`** (WHY tab)
   - Similar pattern to TaskCreator
   - Voice/Text toggle
   - Calls `/api/why/session` when user starts
   - Different styling (purple theme vs green)

#### Changes to Existing Files

**`src/app/(tabs)/what.tsx`:**
- Remove floating voice button
- Remove voice transcript modal (handled in drawer)
- Add `<CollapsibleTaskCreator />` at bottom of screen
- Pass handlers for task creation

**`src/app/(tabs)/why.tsx`:**
- Remove floating voice button
- Remove voice brainstorm modal (handled in drawer)
- Add `<CollapsibleBrainstormStarter />` at bottom
- Pass handlers for session creation

**`src/components/VoiceInputButton.tsx`:**
- No changes needed - reused inside drawer components

---

## Part 2: Backend Integration

### Current Status

#### Backend APIs (COMPLETE ✅)
- ✅ `/api/what/extract-drafts` - Extract tasks from voice/text
- ✅ `/api/what/drafts` - GET/PUT/DELETE draft management
- ✅ `/api/what/confirm` - Confirm drafts → create tasks
- ✅ `/api/why/session` - Create brainstorm session
- ✅ `/api/why/turn` - Conversation turn (AI asks questions)
- ✅ `/api/why/synthesize` - Generate objectives + tasks

#### Frontend Integration (NOT STARTED ❌)
- ❌ Call extract-drafts API from WHAT tab
- ❌ Display task drafts for user review
- ❌ Allow editing drafts before confirmation
- ❌ Call confirm API to create actual tasks
- ❌ Call brainstorm session API from WHY tab
- ❌ Handle turn-by-turn conversation UI
- ❌ Display synthesized objectives and tasks

### Integration Steps

#### Phase 1: WHAT Flow Integration

**Step 1: Voice/Text → Draft Extraction**
- User records voice OR types text in drawer
- Call `POST /api/what/extract-drafts`:
  ```typescript
  {
    inputText: string,      // transcript or typed text
    source: 'voice' | 'text',
    workspaceId: string,
    userId: string
  }
  ```
- Response returns array of draft tasks
- Show drafts in a review modal

**Step 2: Draft Review Modal**
- Create `TaskDraftsReviewModal.tsx`
- Display all extracted drafts as cards
- Each draft shows:
  - Title (editable)
  - Assignee (editable dropdown)
  - Due date (editable date picker)
  - Time units (editable number)
  - Confidence scores (visual indicator)
- User can:
  - Edit any field
  - Remove drafts
  - Confirm all or individually

**Step 3: Confirmation → Task Creation**
- Call `POST /api/what/confirm`:
  ```typescript
  {
    draftIds: string[],     // array of draft IDs to confirm
    workspaceId: string,
    userId: string
  }
  ```
- Backend creates actual tasks in `tasks` table
- Frontend receives task IDs
- Refresh task list to show new tasks
- Close modal and collapse drawer

#### Phase 2: WHY Flow Integration

**Step 1: Voice/Text → Session Start**
- User inputs initial brainstorm idea
- Call `POST /api/why/session`:
  ```typescript
  {
    workspaceId: string,
    userId: string,
    initialPrompt: string   // user's input
  }
  ```
- Response returns `sessionId`
- Open conversation modal

**Step 2: Conversation Modal**
- Create `BrainstormConversationModal.tsx`
- Chat-like interface (similar to messaging apps)
- User messages on right, AI on left
- AI asks clarifying questions one at a time
- User responds to each question
- For each response, call `POST /api/why/turn`:
  ```typescript
  {
    sessionId: string,
    userMessage: string
  }
  ```
- Display AI response
- Continue until AI determines it has enough info (usually 3-5 turns)

**Step 3: Synthesis → Objectives + Tasks**
- User taps "Generate Plan" button
- Call `POST /api/why/synthesize`:
  ```typescript
  {
    sessionId: string,
    workspaceId: string,
    userId: string
  }
  ```
- Response returns:
  - Array of objectives (max 7)
  - Array of task drafts (max 15)
  - Objectives linked to tasks
  - Risks and assumptions
- Show synthesis results modal

**Step 4: Synthesis Review**
- Create `SynthesisReviewModal.tsx`
- Display objectives with linked tasks
- User can:
  - Edit objective titles
  - Edit task details
  - Remove items
  - Confirm all
- On confirm, objectives saved to `objectives` table
- Tasks go through draft → confirm flow (same as WHAT)

---

## Part 3: Implementation Phases

### Phase 1: UI Refactor (2-3 hours)
1. Create `CollapsibleTaskCreator.tsx` with voice/text toggle
2. Create `CollapsibleBrainstormStarter.tsx` (similar pattern)
3. Replace floating buttons in both tabs
4. Test drawer animations and interactions

### Phase 2: WHAT Flow Integration (3-4 hours)
1. Wire up extract-drafts API call
2. Create `TaskDraftsReviewModal.tsx`
3. Implement draft editing UI
4. Wire up confirm API call
5. Test end-to-end: voice → drafts → edit → confirm → tasks appear

### Phase 3: WHY Flow Integration (4-5 hours)
1. Wire up session API call
2. Create `BrainstormConversationModal.tsx`
3. Implement turn-by-turn conversation
4. Wire up synthesize API call
5. Create `SynthesisReviewModal.tsx`
6. Test end-to-end: idea → conversation → synthesis → objectives + tasks

### Phase 4: Polish & Edge Cases (2-3 hours)
1. Loading states and error handling
2. Empty states (no drafts, no ideas, etc.)
3. Haptic feedback
4. Accessibility labels
5. Dark mode styling
6. Animation polish

**Total Estimated Time:** 11-15 hours

---

## Part 4: Open Questions for User

### Question 1: Drawer Default State
Should the drawer start **collapsed** or **expanded** when user first opens the tab?
- **Option A:** Collapsed (cleaner, less overwhelming)
- **Option B:** Expanded on first visit (discoverability)

### Question 2: Draft Persistence
If user creates drafts but doesn't confirm them, should they persist?
- **Option A:** Save to database, show on next visit (backend already supports this)
- **Option B:** Discard on tab switch (simpler, less clutter)

### Question 3: Voice Transcript Editing
After voice recording, should user be able to edit the transcript before extraction?
- **Option A:** Yes, show editable transcript (more control)
- **Option B:** No, trust the transcript (faster flow)

### Question 4: Brainstorm Turn Limit
How many conversation turns before synthesis?
- **Option A:** Fixed limit (e.g., 5 turns max)
- **Option B:** AI decides when it has enough info
- **Option C:** User decides ("I'm done, synthesize now")

### Question 5: Notification Badge
Should the drawer tab show a badge when there are pending drafts?
- **Option A:** Yes, show count (e.g., "New Task (3)")
- **Option B:** No, keep it clean

---

## Summary

This plan proposes a comprehensive solution that:

1. **Improves UX** by replacing obstructive floating buttons with integrated drawer components
2. **Clarifies functionality** by showing voice AND text options clearly
3. **Connects to backend** by wiring up all existing APIs
4. **Maintains consistency** by following existing collapsible drawer patterns

The implementation is broken into 4 phases totaling 11-15 hours of work. All backend APIs are already complete and ready to integrate.
