# People Tab Improvements Plan V2

## Executive Summary
The People tab has excellent progressive disclosure UI (compact → medium → full) but is **information-rich and action-poor**. This plan transforms it into a true **team management hub** with cross-tab integration and actionable workflows.

---

## Critical Issues Found

### 1. Avatar Initials Bug ✅ ALREADY FIXED
**Status:** Already correct in `Avatar.tsx` line 22-40
- ✅ Uses `getInitials()` function correctly
- ✅ Returns first letter of first name + first letter of last name
- ✅ Example: "Tom Fisher" → "TF" (not just "T")

### 2. People Tab is Information-Only (Not Action-Oriented)
**Problem:** Can see everything about a person but can't DO anything
- ✅ Can view their tasks
- ✅ Can see capacity
- ❌ Can't assign them to new tasks
- ❌ Can't do capacity planning ("what-if" scenarios)
- ❌ Can't suggest tasks based on skills

**Comparison to Tasks Tab:**
| Tier | Tasks Tab Actions | People Tab Actions | Gap |
|------|------------------|-------------------|-----|
| Medium | Change status, reschedule | None | Missing quick actions |
| Full | Add resource, split task, escalate | Task management only | Missing assignment/planning |

### 3. Cross-Tab Integration is One-Way
**Current Flow (Broken):**
```
Tasks Tab → See member avatars → Can't view profile
People Tab → See member tasks → Can't navigate to task
Home Tab → Assignment badge → Modal (no context)
```

**No bidirectional linking between:**
- Tasks ↔ People
- People ↔ When (timeline)
- Assignment Modal ↔ People (capacity context)

### 4. Inconsistent Capacity Visualization
Each tab shows capacity differently:
- **People:** "6/15 TU" + percentage bar + color dot
- **When:** "Load: 12 TU allocated"
- **Tasks (resource allocation):** Breakdown by member
- **Home:** Health indicator (green/yellow/red)

**Result:** Confusion about what's "normal" vs "overallocated"

---

## Improvement Plan: Tiered Approach

### TIER 1: QUICK WINS (High Impact, Low Effort)

#### 1.1 Add "Quick Assign" Button to People Full View
**Where:** PersonCardNew, Full tier, top of tasks section
**What:** Button that opens task picker to assign person to a task
**How:**
```tsx
// In Full View, above "All Tasks" section
<View className="flex-row items-center justify-between mb-2">
  <Text>All Tasks ({memberWorkload.tasks.length})</Text>
  <Pressable className="bg-blue-500 px-3 py-1.5 rounded-lg">
    <Text className="text-white font-bold text-xs">Assign to Task</Text>
  </Pressable>
</View>

// Modal shows:
// - List of unassigned/in-progress tasks
// - Capacity impact: "Adding this would bring them to 85%"
// - Default allocation: 2 TU/week (adjustable)
```

**Benefit:** Can assign people to tasks from People tab (not just from Tasks tab)

---

#### 1.2 Make Member Avatars Clickable in Tasks Tab
**Where:** TaskCardExpansion, avatar section
**What:** Tap avatar → quick profile popover OR navigate to People tab
**How:**
```tsx
// Option A: Quick Popover (Preferred)
<Pressable onPress={() => setShowMemberQuickView(memberId)}>
  <Avatar name={member.name} role={member.role} />
</Pressable>

// Popover shows:
// - Name, role, function
// - Current capacity: 12/15 TU (80%)
// - Available: 3 TU
// - "View Full Profile" button → People tab

// Option B: Direct Navigation
<Pressable onPress={() => router.push('/(tabs)/people')}>
  <Avatar ... />
</Pressable>
```

**Benefit:** Can see assignee context without leaving Tasks tab

---

#### 1.3 Add Capacity Impact to Assignment Modal
**Where:** PendingAssignmentsModal (Home tab)
**What:** Show assignee's current capacity + impact of accepting
**How:**
```tsx
// In PendingAssignmentsModal, for each assignment:
<View className="mb-4">
  {/* Task Info */}
  <Text className="font-bold">{task.title}</Text>
  <Text>Effort: {allocation} TU/week</Text>

  {/* NEW: Capacity Impact */}
  <View className="mt-2 bg-amber-50 p-2 rounded-lg">
    <Text className="text-xs text-amber-700">
      Your current capacity: 12/15 TU (80%)
    </Text>
    <Text className="text-xs text-amber-700 font-bold">
      After accepting: 14/15 TU (93%) ⚠️
    </Text>
  </View>

  {/* Actions */}
  <View className="flex-row gap-2 mt-2">
    <Button>Accept</Button>
    <Button>Reject</Button>
    <Button>Suggest Alternative</Button> {/* NEW */}
  </View>
</View>
```

**Benefit:** Better decision-making when accepting assignments

---

#### 1.4 Add Navigation Links Between Tabs
**Where:** Multiple locations
**What:**

**A) In PersonCardNew Full View → Tasks Tab**
```tsx
// When showing a task in "All Tasks" section
<Pressable onPress={() => router.push({
  pathname: '/(tabs)/tasks',
  params: { selectedTaskId: task.id }
})}>
  <Text className="text-blue-500 text-xs">View in Tasks →</Text>
</Pressable>
```

**B) In TaskCardExpansion → People Tab**
```tsx
// In resource allocation section
<Pressable onPress={() => router.push('/(tabs)/people')}>
  <Text className="text-blue-500 text-xs">View {member.name}'s Profile →</Text>
</Pressable>
```

**C) In People Tab Header → Quick Filters**
```tsx
// Add filter badges in header
<View className="flex-row gap-2">
  <FilterBadge label="Overallocated" count={3} color="red" />
  <FilterBadge label="Available" count={5} color="green" />
  <FilterBadge label="At Capacity" count={2} color="amber" />
</View>
```

**Benefit:** Seamless navigation across tabs

---

### TIER 2: STRATEGIC ENHANCEMENTS (High Impact, Medium Effort)

#### 2.1 Unified Capacity Indicator System
**Goal:** Consistent visualization across all tabs

**Standard Format:**
```tsx
// Component: CapacityIndicator.tsx
interface CapacityIndicatorProps {
  allocated: number;
  total: number;
  variant: 'compact' | 'bar' | 'full';
}

// Visual:
Compact:  [●] 12/15 TU (green dot)
Bar:      [████████░░░░░░░░] 12/15 TU (80%)
Full:     [████████░░░░░░░░] 12/15 TU
          Available: 3 TU (Good) ✓
```

**Color System:**
- 0-70%: Blue (available for work)
- 71-85%: Green (healthy utilization)
- 86-100%: Amber (at capacity)
- 101%+: Red (overallocated)

**Apply Everywhere:**
- People tab (all tiers)
- Tasks tab (resource allocation)
- When tab (timeline view)
- Home tab (capacity metrics)

---

#### 2.2 "What-If" Capacity Calculator
**Where:** PersonCardNew, Full tier, in capacity section
**What:** Interactive slider to see impact of adding/removing TU

**Design:**
```tsx
<View className="mb-4">
  <Text className="font-bold mb-2">Capacity What-If</Text>

  {/* Current State */}
  <View className="mb-2">
    <Text className="text-xs text-slate-500">Current</Text>
    <CapacityIndicator allocated={12} total={15} variant="bar" />
  </View>

  {/* Slider */}
  <Text className="text-xs mb-1">What if we added:</Text>
  <Slider
    min={-5}
    max={10}
    step={1}
    value={whatIfTU}
    onChange={setWhatIfTU}
  />
  <Text className="text-xs text-center">{whatIfTU > 0 ? '+' : ''}{whatIfTU} TU/week</Text>

  {/* Projected State */}
  <View className="mt-2">
    <Text className="text-xs text-slate-500">Projected</Text>
    <CapacityIndicator
      allocated={12 + whatIfTU}
      total={15}
      variant="bar"
    />
  </View>

  {/* Impact Analysis */}
  <View className="mt-2 bg-blue-50 p-2 rounded-lg">
    <Text className="text-xs text-blue-700">
      {whatIfTU > 0
        ? `Could help with: ${getSuggestedTasks(whatIfTU).length} additional tasks`
        : `Would free up ${Math.abs(whatIfTU)} TU for reassignment`
      }
    </Text>
  </View>
</View>
```

**Benefit:** Capacity planning without mental math

---

#### 2.3 AI Task Suggestions (Based on Skills)
**Where:** PersonCardNew, Full tier, after tasks section
**What:** Show recommended tasks this person could help with

**Design:**
```tsx
<View className="mb-4">
  <Text className="font-bold mb-2">Suggested Tasks</Text>
  <Text className="text-xs text-slate-500 mb-2">
    Based on {member.name}'s skills and current capacity
  </Text>

  {suggestedTasks.map(task => (
    <View key={task.id} className="bg-purple-50 rounded-lg p-3 mb-2">
      <View className="flex-row items-start justify-between">
        <View className="flex-1">
          <Text className="font-semibold text-sm">{task.title}</Text>
          <Text className="text-xs text-slate-600">{task.function}</Text>
          <Text className="text-xs text-purple-600 mt-1">
            Match: {task.matchScore}% • Need: {task.estimatedTU} TU
          </Text>
        </View>
        <Pressable className="bg-purple-500 px-3 py-1 rounded-lg">
          <Text className="text-white text-xs font-bold">Assign</Text>
        </Pressable>
      </View>
    </View>
  ))}
</View>
```

**Algorithm:**
```typescript
// Scoring factors:
// 1. Function match (Engineering task → Engineering person)
// 2. Available capacity (prefer people with TU available)
// 3. Past performance on similar tasks
// 4. Current workload balance (avoid overallocating same person)
// 5. Collaboration multiplier (team synergy)

function getSuggestedTasks(member: OrganizationMember, tasks: WorkPlan[]) {
  return tasks
    .filter(t => t.status === 'not-started' || t.status === 'queued')
    .map(task => ({
      ...task,
      matchScore: calculateMatchScore(member, task)
    }))
    .filter(t => t.matchScore >= 60)
    .sort((a, b) => b.matchScore - a.matchScore)
    .slice(0, 3);
}
```

**Benefit:** Proactive task suggestions, better resource utilization

---

#### 2.4 Enhanced Assignment Context Modal
**Where:** PendingAssignmentsModal (Home tab)
**What:** Transform from simple list to context-rich decision interface

**Current:** Just task title + accept/reject
**New:** Split-pane with task AND person context

**Design:**
```tsx
<Modal visible={showAssignments}>
  <ScrollView>
    {pendingAssignments.map(assignment => (
      <View className="mb-6">
        {/* Header */}
        <Text className="font-bold text-lg mb-3">
          New Assignment from {assignment.assignerName}
        </Text>

        {/* Split Pane Layout */}
        <View className="flex-row gap-3">
          {/* Left: Task Context */}
          <View className="flex-1 bg-blue-50 rounded-xl p-3">
            <Text className="font-bold mb-1">{assignment.task.title}</Text>
            <Text className="text-xs text-slate-600 mb-2">
              {assignment.task.description}
            </Text>
            <View className="flex-row gap-2">
              <View className="bg-blue-500/20 px-2 py-1 rounded">
                <Text className="text-xs text-blue-700">
                  {assignment.allocation} TU/week
                </Text>
              </View>
              <View className="bg-blue-500/20 px-2 py-1 rounded">
                <Text className="text-xs text-blue-700">
                  Due {formatDate(assignment.task.dueDate)}
                </Text>
              </View>
            </View>
            <Pressable className="mt-2">
              <Text className="text-blue-500 text-xs">View full task →</Text>
            </Pressable>
          </View>

          {/* Right: Your Context */}
          <View className="flex-1 bg-slate-50 rounded-xl p-3">
            <Text className="font-bold mb-1">Your Current Load</Text>
            <CapacityIndicator
              allocated={yourCapacity.allocated}
              total={yourCapacity.total}
              variant="bar"
            />
            <Text className="text-xs text-slate-600 mt-2">
              You have {yourCapacity.tasks.length} active tasks
            </Text>
            <Text className="text-xs text-amber-600 font-bold mt-1">
              Adding this: {yourCapacity.allocated + assignment.allocation}/{yourCapacity.total} TU ({getUtilization(yourCapacity.allocated + assignment.allocation, yourCapacity.total)}%)
            </Text>

            {/* Warning if overallocated */}
            {(yourCapacity.allocated + assignment.allocation) > yourCapacity.total && (
              <View className="bg-red-100 p-2 rounded mt-2">
                <Text className="text-xs text-red-700 font-bold">
                  ⚠️ This would overallocate you by {(yourCapacity.allocated + assignment.allocation) - yourCapacity.total} TU
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Actions */}
        <View className="flex-row gap-2 mt-3">
          <Pressable className="flex-1 bg-emerald-500 py-3 rounded-xl">
            <Text className="text-white text-center font-bold">Accept</Text>
          </Pressable>
          <Pressable className="flex-1 bg-red-500 py-3 rounded-xl">
            <Text className="text-white text-center font-bold">Reject</Text>
          </Pressable>
          <Pressable className="flex-1 bg-purple-500 py-3 rounded-xl">
            <Text className="text-white text-center font-bold">Suggest Alternative</Text>
          </Pressable>
        </View>

        {/* NEW: Suggest Alternative Flow */}
        {showAlternatives && (
          <View className="mt-3 bg-slate-50 rounded-xl p-3">
            <Text className="font-bold mb-2">Suggest Alternative Assignee</Text>
            {getAlternativeMembers(assignment.task).map(alt => (
              <Pressable key={alt.id} className="flex-row items-center justify-between p-2 mb-1 bg-white rounded-lg">
                <View className="flex-row items-center">
                  <Avatar name={alt.name} role={alt.role} size="sm" />
                  <View className="ml-2">
                    <Text className="font-semibold text-sm">{alt.name}</Text>
                    <Text className="text-xs text-slate-500">
                      {alt.available} TU available • {alt.matchScore}% match
                    </Text>
                  </View>
                </View>
                <Pressable className="bg-blue-500 px-3 py-1 rounded-lg">
                  <Text className="text-white text-xs font-bold">Suggest</Text>
                </Pressable>
              </Pressable>
            ))}
          </View>
        )}
      </View>
    ))}
  </ScrollView>
</Modal>
```

**Benefit:** Context-aware assignment decisions

---

### TIER 3: POLISH & UX REFINEMENTS (Medium Impact, Low Effort)

#### 3.1 Member Quick View Popover
**Where:** Triggered from Tasks tab, When tab, anywhere avatars appear
**What:** Lightweight popover showing key member info

**Design:**
```tsx
// Appears on tap of any member avatar
<Popover visible={showQuickView} anchor={avatarRef}>
  <View className="bg-white rounded-xl p-4 shadow-xl" style={{ width: 280 }}>
    {/* Header */}
    <View className="flex-row items-center mb-3">
      <Avatar name={member.name} role={member.role} size="lg" />
      <View className="ml-3 flex-1">
        <Text className="font-bold text-base">{member.name}</Text>
        <Text className="text-xs text-slate-500">{member.role} • {member.function}</Text>
      </View>
    </View>

    {/* Capacity */}
    <View className="mb-3">
      <Text className="text-xs text-slate-500 mb-1">Capacity This Week</Text>
      <CapacityIndicator
        allocated={member.allocated}
        total={member.total}
        variant="bar"
      />
    </View>

    {/* Current Focus */}
    <View className="mb-3">
      <Text className="text-xs text-slate-500 mb-1">Current Focus</Text>
      {member.topTasks.slice(0, 2).map(task => (
        <View key={task.id} className="flex-row items-center mb-1">
          <View className="w-1.5 h-1.5 rounded-full bg-blue-500 mr-2" />
          <Text className="text-xs flex-1" numberOfLines={1}>{task.title}</Text>
        </View>
      ))}
    </View>

    {/* Actions */}
    <View className="flex-row gap-2">
      <Pressable className="flex-1 bg-blue-500 py-2 rounded-lg">
        <Text className="text-white text-xs font-bold text-center">
          View Profile
        </Text>
      </Pressable>
      <Pressable className="flex-1 bg-slate-200 py-2 rounded-lg">
        <Text className="text-slate-700 text-xs font-bold text-center">
          Assign Task
        </Text>
      </Pressable>
    </View>
  </View>
</Popover>
```

**Benefit:** Quick context without full navigation

---

#### 3.2 People Tab Filter Badges
**Where:** People tab header (below stats)
**What:** Quick filters to show subsets of team

**Design:**
```tsx
// In People tab header, after stats row
<ScrollView horizontal showsHorizontalScrollIndicator={false}>
  <View className="flex-row gap-2 px-5 py-2">
    <FilterBadge
      active={filter === 'all'}
      onPress={() => setFilter('all')}
      label="All"
      count={members.length}
    />
    <FilterBadge
      active={filter === 'available'}
      onPress={() => setFilter('available')}
      label="Available"
      count={availableMembers.length}
      color="emerald"
    />
    <FilterBadge
      active={filter === 'overallocated'}
      onPress={() => setFilter('overallocated')}
      label="Overallocated"
      count={overallocatedMembers.length}
      color="red"
    />
    <FilterBadge
      active={filter === 'at-capacity'}
      onPress={() => setFilter('at-capacity')}
      label="At Capacity"
      count={atCapacityMembers.length}
      color="amber"
    />
    <FilterBadge
      active={filter === 'on-leave'}
      onPress={() => setFilter('on-leave')}
      label="On Leave"
      count={onLeaveMembers.length}
      color="slate"
    />
  </View>
</ScrollView>
```

**Benefit:** Quick filtering for capacity planning

---

#### 3.3 Improved Header Stats (Status-First)
**Current:** Total | Founders | Execs | Apprentices
**Problem:** Role-based stats don't help with capacity planning

**New:** Capacity-focused stats
```tsx
<View className="flex-row justify-between bg-white/10 rounded-xl p-3">
  <StatItem label="Total" value={members.length} />
  <StatItem label="Available" value={availableCount} color="emerald" />
  <StatItem label="At Capacity" value={atCapacityCount} color="amber" />
  <StatItem label="Overallocated" value={overallocatedCount} color="red" />
</View>
```

**Benefit:** Header shows what matters for resource planning

---

#### 3.4 Breadcrumb Navigation After Assignment
**Where:** After accepting/rejecting assignment
**What:** Clear next steps with navigation options

**Design:**
```tsx
// After successful accept
<View className="bg-emerald-50 rounded-xl p-4 mb-3">
  <View className="flex-row items-center mb-2">
    <CheckCircle size={20} color="#10b981" />
    <Text className="ml-2 font-bold text-emerald-700">
      Assignment Accepted!
    </Text>
  </View>
  <Text className="text-sm text-emerald-600 mb-3">
    "{task.title}" has been added to your task list
  </Text>

  {/* Navigation Options */}
  <View className="flex-row gap-2">
    <Pressable
      onPress={() => router.push('/(tabs)/tasks')}
      className="flex-1 bg-emerald-500 py-2 rounded-lg"
    >
      <Text className="text-white text-xs font-bold text-center">
        View in Tasks
      </Text>
    </Pressable>
    <Pressable
      onPress={() => router.push('/(tabs)/when')}
      className="flex-1 bg-white border border-emerald-500 py-2 rounded-lg"
    >
      <Text className="text-emerald-700 text-xs font-bold text-center">
        Check Schedule
      </Text>
    </Pressable>
  </View>
</View>
```

**Benefit:** Clear next steps after actions

---

## Implementation Priority & Timeline

### Phase 1: Quick Wins (Week 1)
**Goal:** Add actionability to People tab
1. ✅ Fix avatar initials (already done)
2. Add "Quick Assign" button to PersonCardNew full view
3. Add navigation links between Tasks ↔ People
4. Add capacity impact to PendingAssignmentsModal

**Effort:** ~8-10 hours
**Impact:** People tab becomes action-oriented

---

### Phase 2: Strategic Enhancements (Week 2)
**Goal:** Unified capacity system + smart suggestions
1. Create unified CapacityIndicator component
2. Apply across all tabs (People, Tasks, When, Home)
3. Add "What-If" capacity calculator
4. Add AI task suggestions

**Effort:** ~12-15 hours
**Impact:** Consistent UX + proactive recommendations

---

### Phase 3: Polish (Week 3)
**Goal:** Refinements and UX polish
1. Member quick view popover
2. People tab filter badges
3. Improved header stats
4. Breadcrumb navigation

**Effort:** ~6-8 hours
**Impact:** Smoother workflows

---

## Success Metrics

### Before (Current State)
- People tab is **view-only** (can't assign tasks)
- Average clicks to assign person to task: **7-9 clicks**
  1. Go to Tasks tab
  2. Find task
  3. Tap to expand
  4. Tap again for full view
  5. Tap "Add Resource"
  6. Search for person
  7. Assign

- **No capacity context** during assignment acceptance
- **One-way navigation** (can't go from task to person profile)

### After (Improved State)
- People tab is **action-oriented** (can assign tasks)
- Average clicks to assign person to task: **3-4 clicks**
  1. Go to People tab
  2. Expand person to full view
  3. Tap "Assign to Task"
  4. Select task

- **Full capacity context** during assignment (know impact before accepting)
- **Bidirectional navigation** (Tasks ↔ People, seamless)
- **Proactive suggestions** (AI recommends tasks for people)
- **Unified capacity visualization** (consistent across all tabs)

---

## Key Takeaways

1. **People tab should mirror Tasks tab** in terms of progressive actions
   - Compact: Info only
   - Medium: Quick actions (assign, filter)
   - Full: Deep actions (what-if, suggestions, management)

2. **Integration over isolation**
   - Every tab should link to People when showing member info
   - People should link to Tasks when showing task info
   - Assignment flows should show both task AND person context

3. **Capacity is king**
   - Standardize capacity visualization everywhere
   - Always show impact of changes (what-if scenarios)
   - Prevent overallocation with visual warnings

4. **Make it bidirectional**
   - Tasks → People (view assignee profile)
   - People → Tasks (assign to new task)
   - Home → Both (assignment context)

---

## Next Steps

1. Review this plan with user
2. Prioritize which tier to implement first
3. Create feature branch: `feature/people-tab-improvements`
4. Implement Phase 1 (Quick Wins)
5. Test and iterate
6. Move to Phase 2 and 3
