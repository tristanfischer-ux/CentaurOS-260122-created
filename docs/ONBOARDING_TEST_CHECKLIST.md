# Founder Onboarding - Manual Test Checklist

## Prerequisites

- [ ] User logged in as Founder role
- [ ] Workspace created with company profile
- [ ] Europe/London timezone set

## Test Suite 1: Onboarding Initialization

### T1.1 - Start Onboarding (Fresh State)
1. Navigate to WHY tab
2. Verify "Start Founder Onboarding" card is visible
3. Tap card
4. **Expected**: Onboarding screen opens with Module A > Step 1 selected
5. **Expected**: Progress rail shows all modules, A1 is unlocked, rest locked

### T1.2 - Resume Onboarding
1. Complete step A1
2. Close app / navigate away
3. Return to WHY tab
4. Tap onboarding card
5. **Expected**: Returns to last active step (A2)
6. **Expected**: A1 shows as completed in rail

### T1.3 - Stage-Aware Initialization
1. Set company stage to "Series A" (S3)
2. Start fresh onboarding
3. **Expected**: Foundation module is condensed/skipped
4. **Expected**: Market module is first active module

## Test Suite 2: Step Completion Flow

### T2.1 - Input and Generate Drafts
1. Go to Step A1 (Define mission & constraints)
2. Enter text: "We help hardware startups ship faster. Constraints: 1) No VC funding initially, 2) UK-first, 3) Remote team only"
3. Tap "Generate Drafts"
4. **Expected**: Loading indicator appears
5. **Expected**: Objective and task drafts appear in Outputs panel
6. **Expected**: Drafts are editable inline

### T2.2 - Edit Drafts Inline
1. After generating drafts
2. Tap on objective title
3. Edit text
4. Tap outside / confirm
5. **Expected**: Title updated without modal

### T2.3 - Send Drafts to WHAT
1. With drafts generated
2. Tap "Send to WHAT"
3. **Expected**: Success feedback
4. Navigate to WHAT tab
5. **Expected**: Drafts appear in pending/draft section

### T2.4 - Attach Evidence
1. Return to onboarding step
2. In Evidence panel, enter text evidence
3. **Expected**: Evidence checklist item marked as satisfied
4. **Expected**: "Mark Complete" button becomes enabled

### T2.5 - Complete Step
1. All evidence satisfied
2. Tap "Mark Complete"
3. **Expected**: Step status changes to completed (✓)
4. **Expected**: Next step auto-unlocks and selects
5. **Expected**: Progress bar updates

## Test Suite 3: Skip Flow

### T3.1 - Skip Step (Invalid)
1. Go to any unlocked step
2. Tap "Skip this step..."
3. Enter reason less than 20 chars
4. **Expected**: "Confirm Skip" button disabled

### T3.2 - Skip Step (Valid)
1. Enter reason 20+ chars: "Already have this documented elsewhere in Notion"
2. Tap "Confirm Skip"
3. **Expected**: Step marked as skipped (⊘)
4. **Expected**: Next step unlocks
5. **Expected**: Skip reason stored

## Test Suite 4: Gating Rules

### T4.1 - Step Remains Locked
1. Go to Module A with A1 incomplete
2. Try to tap A2 in progress rail
3. **Expected**: Cannot select A2
4. **Expected**: Lock icon visible
5. **Expected**: Tooltip/message: "Complete previous step first"

### T4.2 - Module Gating
1. Complete all Foundation steps (A1-A3)
2. **Expected**: Module A shows as completed
3. **Expected**: Module B first step unlocks

### T4.3 - No Progress Without Evidence
1. Go to incomplete step
2. Generate drafts
3. Send to WHAT
4. Try to tap "Mark Complete" without evidence
5. **Expected**: Button disabled
6. **Expected**: Evidence requirements highlighted

## Test Suite 5: Task Draft Integration

### T5.1 - Draft Creation in WHAT
1. Generate drafts in onboarding
2. Send to WHAT
3. Go to WHAT tab
4. **Expected**: Drafts visible with "pending confirmation" status
5. **Expected**: Each draft shows source: "Onboarding: [Step Name]"

### T5.2 - Draft Confirmation in WHAT
1. With pending drafts in WHAT
2. Confirm a draft
3. **Expected**: Task created with proper fields
4. **Expected**: Link to onboarding step maintained

### T5.3 - Draft Traceability
1. Complete an onboarding step
2. View the step in onboarding
3. **Expected**: Shows linked objectives and tasks
4. **Expected**: Can navigate to linked items

## Test Suite 6: LLM Integration (if available)

### T6.1 - AI-Generated Outputs
1. Enter detailed transcript: "Our mission is to democratize hardware development by giving founders access to manufacturing expertise without hiring. Constraints: we're bootstrapped so can't burn more than 5k/month, we're all in the UK so timezone needs to work, and we're 100% remote. My 30-day goal is to get 10 paying customers."
2. Tap "Generate Drafts"
3. **Expected**: AI extracts:
   - Mission statement as objective
   - 3 constraints as notes
   - 30-day target as task draft

### T6.2 - Fallback to Templates
1. Set `OPENAI_API_KEY` to invalid/empty
2. Enter text and generate drafts
3. **Expected**: Falls back to deterministic templates
4. **Expected**: Still generates reasonable outputs

## Test Suite 7: Edge Cases

### T7.1 - Empty Input
1. Leave input field empty
2. Tap "Generate Drafts"
3. **Expected**: Error message: "Please provide input first"

### T7.2 - Very Long Input
1. Paste 2000+ character transcript
2. Generate drafts
3. **Expected**: Handles gracefully
4. **Expected**: Truncates or summarizes as needed

### T7.3 - Network Error During Generation
1. Disconnect network
2. Generate drafts
3. **Expected**: Error message with retry option
4. **Expected**: Input preserved

### T7.4 - Concurrent Sessions (Future)
1. Open onboarding on two devices
2. Complete step on device 1
3. Refresh device 2
4. **Expected**: Device 2 shows updated state

## Test Suite 8: Completion

### T8.1 - Program Completion
1. Complete all required steps across all modules
2. **Expected**: Completion celebration screen
3. **Expected**: Summary of all created objectives/tasks
4. **Expected**: "Finish" button

### T8.2 - Post-Completion State
1. Finish onboarding
2. Return to WHY tab
3. **Expected**: Onboarding card hidden or shows "Completed"
4. **Expected**: Can still access onboarding for reference

## Test Results Log

| Test ID | Date | Tester | Result | Notes |
|---------|------|--------|--------|-------|
| T1.1    |      |        |        |       |
| T1.2    |      |        |        |       |
| ...     |      |        |        |       |
