# Test Checklist - WHAT/WHY Flows

## Prerequisites
- Supabase migrations applied (`004_what_why_flows.sql`)
- Environment variables configured (see ENV_CONFIG_PLAN.md)
- Dev mode: `LLM_PROVIDER=mock` for testing without API key

## Manual Testing - WHAT Flow (Text Input)

### Test 1: Basic Text Extraction
1. Navigate to WHAT tab
2. Enter text: "Create task to update landing page and review analytics. Both due next Friday."
3. Click "Extract Tasks" button
4. **Expected**: 2 draft cards appear with:
   - Title: "Update landing page" and "Review analytics"
   - Due date: Next Friday (parsed)
   - Confidence badges showing extraction quality
5. Edit first draft: Change title to "Redesign landing page"
6. Click "Confirm Selected" (both checked)
7. **Expected**: Tasks appear in task list, scheduled across weeks based on capacity

### Test 2: Single Quick Task
1. Enter: "Fix checkout bug by tomorrow"
2. Extract → should show 1 draft with tomorrow's date
3. Confirm
4. **Expected**: Task created, allocated to current week if capacity available

### Test 3: No Tasks (Non-task Content)
1. Enter: "What's the status of Q1 goals? I'm curious about our progress."
2. Extract
3. **Expected**: No tasks extracted, `non_task_notes` shown to user

## Manual Testing - WHAT Flow (Voice/Transcript)

### Test 4: Paste Transcript
1. Click "Paste Transcript" button
2. Paste: "Hey team, we need to finish the Q1 marketing campaign. Sarah should handle the social media posts, should take about 3 days. John can work on the email templates."
3. Edit transcript if needed
4. Click "Extract Tasks"
5. **Expected**: 2 drafts:
   - "Handle social media posts" (assignee: Sarah, units: 3)
   - "Work on email templates" (assignee: John)
   - Confidence scores reflect explicit vs implicit info

### Test 5: Dev Mock Transcript
1. Click "Use Mock Transcript" button (dev mode only)
2. Mock transcript auto-fills
3. Extract → should process successfully with mock LLM provider

## Manual Testing - WHY Flow (Brainstorm)

### Test 6: Start Brainstorm Session
1. Navigate to WHY tab
2. Click "New Brainstorm" button
3. Enter: "I want to think through our go-to-market strategy for Q2"
4. Send message
5. **Expected**: Assistant asks ONE strategic question (not multiple)
6. Answer the question with details
7. **Expected**: Assistant asks follow-up question, building depth

### Test 7: Synthesize Objectives + Tasks
1. Continue brainstorm for 3-5 turns
2. Click "Generate Plan" button
3. **Expected**:
   - Max 7 objectives appear (editable)
   - Max 15 task drafts (editable)
   - Each task shows which objective it supports
   - "from session X / objective Y" badge visible
4. Edit objective title and task details
5. Confirm tasks
6. **Expected**: Tasks created and scheduled, linked to objectives

## Edge Cases

### Test 8: Capacity Overflow
1. Create user with 10 TU weekly capacity
2. Create task requiring 25 TUs
3. Confirm
4. **Expected**: Task allocated across 3 weeks (10 + 10 + 5)

### Test 9: Due Date Risk
1. Create task: 20 TUs, due in 1 week, user capacity 10/week
2. Confirm
3. **Expected**: Task shows risk flag ⚠️, still scheduled (won't block)

### Test 10: Idempotent Confirm
1. Create draft
2. Confirm (task created)
3. Try to confirm same draft again
4. **Expected**: No duplicate task, returns existing task

### Test 11: Empty Input
1. Enter empty string or only whitespace
2. Try to extract
3. **Expected**: Validation error, no API call

## Scheduling Verification

### Test 12: Schedule Preview
1. Create 3 tasks totaling 15 TUs
2. Before confirming, view schedule preview
3. **Expected**: Shows week-by-week allocation:
   - Week 1: 10 TUs
   - Week 2: 5 TUs

### Test 13: Multiple Users
1. Create task assigned to User A (10 TU capacity)
2. Create task assigned to User B (10 TU capacity)
3. Confirm both
4. **Expected**: Both scheduled in same week (different users)

## Database Integrity

### Test 14: Audit Trail
1. Create draft → Edit draft → Confirm draft
2. Query `task_events` table
3. **Expected**: 3 events:
   - `draft_created`
   - `draft_edited`
   - `draft_confirmed`

### Test 15: Objective Linkage
1. Complete WHY brainstorm session
2. Synthesize and confirm tasks
3. Query `objective_task_links` table
4. **Expected**: Each task linked to parent objective

## Error Handling

### Test 16: LLM Timeout/Error
1. Set invalid API key (if using real Anthropic)
2. Try to extract tasks
3. **Expected**: Graceful fallback to mock or error message

### Test 17: Database Constraint Violation
1. Try to create task with units = 0
2. **Expected**: Validation error before DB insert

### Test 18: Missing Workspace ID
1. API call without workspaceId
2. **Expected**: 400 Bad Request

## Performance

### Test 19: Batch Confirm
1. Create 10 drafts
2. Confirm all at once
3. **Expected**: All tasks created and scheduled in <5 seconds

### Test 20: Large Transcript
1. Paste transcript with 500+ words
2. Extract
3. **Expected**: LLM handles gracefully, extracts reasonable number of tasks (not all sentences)

## Success Criteria
- [ ] All WHAT text tests pass
- [ ] Voice/transcript input works end-to-end
- [ ] WHY brainstorm generates coherent questions
- [ ] Synthesis produces max 7 objectives, max 15 tasks
- [ ] Scheduling respects capacity limits
- [ ] Overflow and risk flags work correctly
- [ ] Idempotency prevents duplicates
- [ ] Mock provider works without API keys
- [ ] Audit trail complete
- [ ] No TypeScript errors
- [ ] No console errors in production build
