# Domain Rules - Task & Scheduling

## Task Creation Rules

### 1. Draft → Confirmation Flow
- **All tasks start as drafts** (status: `pending_confirmation`)
- User must explicitly confirm before task creation
- Drafts can be edited, discarded, or merged
- Confirming same draft twice → no duplicate (idempotent via draft→task mapping)

### 2. Task Fields
- **title** (required): Clear, actionable description
- **notes** (optional): Additional context
- **assignee** (default: speaker/creator if not specified)
- **start_iso** (default: today)
- **due_iso** (optional): Deadline
- **units** (default: 1, minimum: 1): Time units required
- **source**: "what_voice" | "what_text" | "why_brainstorm" | "manual"

### 3. Confidence Scores (Draft Extraction)
When LLM extracts drafts, it provides confidence scores:
- **confidence_assignee**: 0-100 (did user explicitly mention who?)
- **confidence_due**: 0-100 (was due date clear?)
- Low confidence (<50) → highlight for user review

### 4. Non-Task Content
If input contains non-task content (questions, notes, context), extract as:
- **non_task_notes**: Preserved but not turned into tasks
- **clarifying_questions**: LLM can suggest questions to user

## Scheduling Rules

### 1. Weekly Capacity Model
- Each user has **weekly capacity** (default: 10 TUs)
- Stored in `user_capacity` table (row per user per week)
- Week starts Monday (ISO week)
- If no capacity record → create with default

### 2. Allocation Algorithm
```
For each confirmed task:
  1. Calculate total TUs needed
  2. Get assignee's weekly availability
  3. Allocate TUs starting from start_date, week by week
  4. If week full → overflow to next week
  5. If due_date exists and allocation exceeds it → set risk_flag=true
  6. Create task_allocations records (task_id, user_id, week_start_iso, units)
```

### 3. Overflow Behavior
- Never fail task creation due to capacity
- Always allocate to earliest available weeks
- Set **risk_flag** if deadline will be missed
- Show risk indicator to user (e.g., "⚠️ May miss deadline")

### 4. Deterministic Scheduling
- Same inputs → same schedule
- No randomness in allocation
- Weeks processed in chronological order
- Tasks within a week processed by priority (explicit > start_date > created_at)

## Timezone Rules
- **Default timezone**: Europe/London
- All ISO dates stored in UTC
- Week start calculation uses Europe/London timezone
- UI displays in user's local time (if different)

## WHY-Specific Rules

### 1. Brainstorm Turn Generation
- LLM asks **one high-leverage question at a time**
- Do not name frameworks (avoid "SWOT", "Porter's Five Forces" jargon)
- Questions should be practical, actionable
- Track conversation state (topics covered, depth achieved)

### 2. Synthesis Rules
- **Max 7 objectives** per session (quality over quantity)
- **Max 15 task drafts** per session
- Each objective should have:
  - Clear title
  - Optional horizon (30d, 90d, 1y)
  - Optional metric/KPI
- Tasks linked to objectives for traceability

### 3. Objective → Task Linking
- `objective_task_links` table maintains relationships
- Tasks show "from session X / objective Y" badge
- If task deleted, link remains (audit trail)
- Confidence score on link (how strongly related?)

## Validation Rules

### Input Validation
- Title: 1-200 characters
- Notes: max 2000 characters
- Units: integer >= 1
- Dates: valid ISO 8601
- Assignee: valid user ID in workspace

### Business Logic Validation
- User must be member of workspace
- Assignee must be active member
- Can't confirm draft that's already confirmed
- Can't allocate to deactivated users

## Audit Trail
All significant events logged to `task_events`:
- Draft created (from what source)
- Draft edited (what changed)
- Draft confirmed → task created
- Task status changed
- Task allocated to user
- Brainstorm session started
- Objectives synthesized

Event payload includes:
- User who triggered event
- Timestamp (ISO 8601)
- Before/after state (for edits)
- Context (session_id for WHY tasks)
