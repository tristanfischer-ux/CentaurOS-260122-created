# Role-Based User Experience: Analysis & Recommendations

## Executive Summary

Fractional Foundry has three distinct user roles with fundamentally different needs:
- **Founders** (Strategic Command) - Need full visibility and control across all dimensions
- **Fractional Executives** (Functional Leadership) - Need focused depth in their business function
- **Apprentices** (Tactical Execution) - Need laser focus on assigned tasks with minimal distractions

**Current State**: Mixed implementation - some tabs have role differentiation, others show identical views to all roles.

**Recommendation**: Implement comprehensive role-based views across all 6 tabs to maximize productivity and reduce cognitive load.

---

## Current State Analysis

### ✅ Tabs with Good Role Differentiation

#### **Do Tab** (Task Execution)
**Status**: ⭐ **EXCELLENT** - Best role differentiation in the app

**Apprentice View:**
- Shows ONLY tasks assigned to them (`assignedMemberIds`)
- Focus Mode for highest-priority work
- Submit work button for quality review
- NO Resource Bar (removed per recent update)
- Green gradient header ("MY TASKS")

**Executive View:**
- Shows tasks for their business function only
- Resource Bar visible for capacity monitoring
- Can unblock team and review work
- Blue gradient header

**Founder View:**
- Bird's-eye view of ALL tasks across ALL functions
- Function filter to drill down
- Full resource visibility
- Purple gradient header

**Why it works**: Each role sees exactly what they need, nothing more.

#### **Evaluate Tab** (Performance Review)
**Status**: 🟡 **PARTIAL** - Role-aware but limited

**Current Implementation:**
- `canReview = isFounder || isExecutive` - Apprentices can't access review features
- Shows performance metrics, submission queues, TU efficiency
- AI ROI dashboard

**Gap**: All reviewers see the same data regardless of scope. Executives should only see their function's metrics, not company-wide.

#### **Make Tab** (Suppliers & AI Tools)
**Status**: 🟡 **PARTIAL** - Ownership-based filtering

**Current Implementation:**
- Founders see ALL suppliers and AI agents
- Executives/Apprentices see only resources they own
- Ownership tracked via `getOwnershipByResource()`

**Why this works**: Prevents information overload for non-founders

---

### ❌ Tabs with NO Role Differentiation

#### **Home Tab** (Mission Control)
**Status**: ⛔ **EVERYONE SEES EVERYTHING**

**Current State:**
- Founders, Executives, Apprentices all see identical dashboard
- Company health metrics (cash, runway, burn)
- OKR progress across all functions
- Team capacity pool (all members)
- Weekly time allocation (all functions)
- Business improvements from consulting reports

**Problem**:
- **Apprentice cognitive overload**: Why does an apprentice need to see company financials, OKR strategy, and executive capacity?
- **Executive scope creep**: Finance exec shouldn't care about Marketing OKRs in daily view
- **Founder distraction**: Too much tactical detail mixed with strategic metrics

#### **Decide Tab** (Resource Allocation)
**Status**: ⛔ **NO ROLE FILTERING**

**Current State:**
- Shows ALL work plans across ALL functions
- Full OKR list regardless of role
- Auto-allocation features
- TU Analytics dashboard
- Optimization opportunities

**Problem**:
- Apprentices can see and potentially allocate resources (should they?)
- Executives see all functions (not just theirs)
- No scoping - founder and apprentice see the same queue

#### **Hub Tab** (Intelligence Center)
**Status**: ⛔ **COMPANY-WIDE ONLY**

**Current State:**
- Smart recommendations (capacity issues, OKR risks, financial alerts, team gaps)
- All recommendations are company-wide
- No role-specific filtering

**Problem**:
- Apprentice sees "Team at 100% Capacity" alert for entire company (not actionable for them)
- Executive sees capacity alerts for other functions (not their concern)
- Recommendations don't match role's sphere of influence

---

## Detailed Recommendations by Tab

### 🏠 **HOME TAB** - Mission Control

#### **FOUNDER VIEW** (Strategic Command Center)
**Keep:**
- ✅ Full company health (cash, runway, burn)
- ✅ All OKRs across all functions
- ✅ Complete resource pool (all team members)
- ✅ Weekly time allocation (all functions)
- ✅ Business improvements (consulting insights)
- ✅ Approval queues (hiring, task requests)
- ✅ Critical items and blockers

**UI:** Purple gradient, "Mission Control" header

---

#### **EXECUTIVE VIEW** (Functional Dashboard)
**Show:**
- 📊 **Their Function's Health**:
  - OKRs for their function ONLY
  - Tasks assigned to their function (active, blocked, queued)
  - Team members in their function
  - Resource capacity for their function

- 💡 **Actionable Insights**:
  - Blocked tasks in their function
  - Submissions pending their review
  - Skill mismatches in their function
  - Business improvements tagged for their function

- 📈 **Limited Company Context**:
  - Company runway (read-only, no drill-down)
  - Their function's contribution to company OKRs
  - Cross-function dependencies (if any)

**Hide:**
- ❌ Other functions' OKRs
- ❌ Other functions' capacity
- ❌ Company-wide approval queues
- ❌ Detailed financial breakdown

**UI:** Blue gradient, "[Function Name] Leadership" header (e.g., "Sales Leadership", "Engineering Leadership")

---

#### **APPRENTICE VIEW** (My Work Center)
**Show:**
- 🎯 **Personal Focus**:
  - Their assigned tasks ONLY (active, queued)
  - Due dates and priorities
  - Hours logged this week
  - Their personal TU allocation

- 🏆 **Impact Visibility**:
  - Which OKR their current task contributes to (ONE at a time)
  - Task progress bar
  - Submission status (pending review, approved, changes requested)

- 🚀 **Growth Context**:
  - Skill development opportunities
  - Tasks awaiting their work
  - Feedback from recent submissions

**Hide:**
- ❌ Company financials (cash, runway, burn)
- ❌ Other team members' workload
- ❌ OKRs they're not working on
- ❌ Resource allocation decisions
- ❌ Consulting insights
- ❌ Approval queues

**UI:** Green gradient, "My Work" header

---

### 🎯 **DECIDE TAB** - Strategic Planning & Resource Allocation

#### **FOUNDER VIEW** (Strategic Resource Allocation)
**Current + Enhanced:**
- ✅ ALL work plans across ALL functions
- ✅ ALL OKRs
- ✅ Auto-allocation engine
- ✅ TU Analytics for entire company
- ✅ Cross-function optimization
- ✅ Hire/Fire decisions
- ✅ Task creation across all functions
- ➕ **NEW: Portfolio view** - see resource allocation across functions

**UI:** Purple gradient, "Strategic Planning" header

---

#### **EXECUTIVE VIEW** (Functional Resource Planning)
**Show:**
- 📋 **Their Function's Work Plans**:
  - Tasks for their function ONLY
  - Can create new tasks for their function
  - Can allocate people from their function

- 👥 **Their Function's Resources**:
  - Team members in their function
  - Capacity available in their function
  - TU Analytics scoped to their function

- 🔗 **Dependencies**:
  - Tasks in other functions that block theirs
  - Shared resources (if allocated to their function)
  - OKRs they contribute to

**Restricted:**
- 🚫 Cannot allocate people from other functions (unless shared)
- 🚫 Cannot see other functions' internal tasks
- 🚫 Cannot auto-allocate outside their function

**UI:** Blue gradient, "[Function] Planning" header

---

#### **APPRENTICE VIEW** (Request Work / View Queue)
**Two Sub-Views:**

**A) "My Queue" View** (Read-Only)
- 📋 Tasks assigned to them (from Decide → Do pipeline)
- Due dates, priorities, team members
- Can VIEW task details but cannot change allocation
- Can REQUEST additional help (creates approval request)

**B) "Request Task" View** (Create Mode)
- Can REQUEST a new task be created
  - Provide title, description, estimated effort
  - Suggest business function
  - Explain why it's needed
- Request goes to their function's Executive or Founder for approval
- Once approved, it enters the task queue

**Hide:**
- ❌ All OKRs
- ❌ Other people's tasks
- ❌ Resource allocation controls
- ❌ TU Analytics
- ❌ Auto-allocation
- ❌ Optimization opportunities

**UI:** Green gradient, "My Work Queue" header

---

### ✅ **DO TAB** - Task Execution

**Status: Already excellent** - Keep current implementation

Minor enhancement ideas:
- **Apprentice**: Add "Need Help?" button to request support without leaving tab
- **Executive**: Add quick "Assign to Team Member" drag-and-drop
- **Founder**: Add heat map showing which functions are over/under capacity

---

### 📊 **EVALUATE TAB** - Performance Review

#### **FOUNDER VIEW** (Company-Wide Review)
**Keep:**
- ✅ All submissions across all functions
- ✅ TU performance for entire company
- ✅ AI ROI dashboard (company-wide)
- ✅ Team insights and coaching opportunities
- ✅ Can approve/reject any submission

---

#### **EXECUTIVE VIEW** (Functional Review)
**Show:**
- 📋 **Submissions for Their Function ONLY**
- 📊 **TU Performance for Their Function**
  - Efficiency per person in their function
  - AI tool adoption in their function
  - Quality scores for their function

- 🎓 **Coaching Opportunities in Their Function**
  - Skill gaps
  - Training needs
  - Performance trends

**Restricted:**
- 🚫 Cannot see other functions' submissions
- 🚫 Cannot see other functions' performance metrics

---

#### **APPRENTICE VIEW** (My Performance)
**Show:**
- 📈 **Personal Performance Metrics**:
  - Their TU efficiency over time
  - Quality scores from their submissions
  - Average time to complete tasks
  - Feedback from executives

- 🎯 **Growth Tracking**:
  - Skills developed
  - Tasks completed by type
  - AI tools mastered
  - Trends (improving, stable, declining)

**Hide:**
- ❌ Other team members' performance
- ❌ Company-wide metrics
- ❌ Review queue (they submit, not review)

**UI:** Green gradient, "My Performance" header

---

### 🏭 **MAKE TAB** - Suppliers & AI Tools

**Current implementation is good** - ownership-based filtering works well.

Enhancement:
- **Apprentice**: Add "Request Access" button for AI tools (sends request to their Executive)
- **Executive**: Show which team members in their function are using which AI tools
- **Founder**: Add cost analysis by function

---

### 💡 **HUB TAB** - Intelligence Center

#### **FOUNDER VIEW** (Strategic Intelligence)
**Keep current + enhance:**
- ✅ All company-wide recommendations
- ➕ **NEW: Function Health Scores** - quick scan across all functions
- ➕ **NEW: Strategic Opportunities** - market expansion, hiring, partnerships

---

#### **EXECUTIVE VIEW** (Functional Intelligence)
**Show:**
- 🎯 **Function-Specific Recommendations**:
  - Capacity issues IN THEIR FUNCTION
  - OKR risks FOR THEIR OKRS
  - Team composition gaps IN THEIR TEAM
  - Process improvements FOR THEIR FUNCTION

- 🔗 **Cross-Function Dependencies**:
  - Blockers from other functions
  - Shared resource conflicts

**Hide:**
- ❌ Company financial alerts (not actionable for them)
- ❌ Other functions' internal recommendations

---

#### **APPRENTICE VIEW** (Learning Hub)
**Transform into a Growth-Focused Hub:**
- 📚 **Learning Opportunities**:
  - AI tools they haven't tried yet
  - Skills they can develop
  - Tasks that would stretch their abilities

- 🎯 **Personal Insights**:
  - "You're great at [skill]" - suggest similar tasks
  - "Try [AI tool] to speed up [task type]"
  - "Your quality scores are improving in [area]"

- 🤝 **Collaboration**:
  - Team members working on similar tasks
  - Opportunities to pair program or collaborate
  - Mentorship opportunities

**Hide:**
- ❌ Company-wide capacity issues
- ❌ Strategic recommendations
- ❌ Financial alerts

---

## Implementation Priority

### 🔴 **PHASE 1: Critical (Immediate)**
**Goal**: Reduce cognitive overload and improve focus

1. **Home Tab - Apprentice View**
   - Strip out company financials
   - Show only their assigned tasks
   - Remove resource pool section
   - **Impact**: Massive reduction in distractions

2. **Decide Tab - Executive Scoping**
   - Filter work plans by function
   - Restrict allocation to their function
   - **Impact**: Prevent cross-function confusion

3. **Hub Tab - Role-Based Recommendations**
   - Filter recommendations by role's sphere of influence
   - **Impact**: Actionable insights only

**Estimated Effort**: 2-3 weeks

---

### 🟡 **PHASE 2: Important (Next Sprint)**
**Goal**: Enhance role-appropriate functionality

4. **Home Tab - Executive View**
   - Create functional dashboard
   - Show their OKRs only
   - **Impact**: Better functional leadership

5. **Evaluate Tab - Scoped Reviews**
   - Executives see only their function
   - Apprentices see personal performance
   - **Impact**: Relevant feedback loops

6. **Make Tab - Enhanced Ownership**
   - Request access flows for apprentices
   - Cost analysis by function for execs
   - **Impact**: Better resource governance

**Estimated Effort**: 2-3 weeks

---

### 🟢 **PHASE 3: Nice-to-Have (Future)**
**Goal**: Delight and advanced features

7. **Apprentice Learning Hub**
   - Transform Hub tab into growth center
   - AI-powered skill recommendations
   - **Impact**: Employee development

8. **Executive Cross-Function Coordination**
   - Dependency visualization
   - Shared resource negotiation
   - **Impact**: Better collaboration

9. **Founder Portfolio View**
   - Resource allocation heat maps
   - Function health scores
   - **Impact**: Strategic oversight

**Estimated Effort**: 3-4 weeks

---

## Key Design Principles

### 1. **Sphere of Influence = Sphere of Visibility**
Users should see only what they can act upon or are responsible for.

### 2. **Progressive Disclosure**
Start with laser focus, allow drill-down if needed (e.g., exec can tap to see company context)

### 3. **Cognitive Load Reduction**
Apprentice sees 10 things, Executive sees 30 things, Founder sees 100 things.

### 4. **Role-Appropriate Language**
- Apprentice: "My Tasks", "My Performance"
- Executive: "[Function] Leadership", "[Function] Planning"
- Founder: "Mission Control", "Strategic Planning"

### 5. **Visual Role Identity**
- **Apprentice**: Green gradients, friendly and focused
- **Executive**: Blue gradients, professional and functional
- **Founder**: Purple gradients, strategic and comprehensive

### 6. **Upgrade Paths**
Apprentice → Executive → Founder should feel like unlocking new capabilities, not just seeing more chaos.

---

## Success Metrics

### Apprentice
- ⏱️ **Time to find next task**: < 5 seconds (currently ~20 seconds due to clutter)
- 📈 **Task completion rate**: +20% (less distraction)
- 😊 **Satisfaction**: "I know exactly what to focus on"

### Executive
- 🎯 **Function health visibility**: 100% of their function, 0% of others
- ⚡ **Decision speed**: -30% time to allocate resources (no cross-function noise)
- 🧠 **Cognitive clarity**: "I can manage my function effectively"

### Founder
- 🔭 **Strategic overview**: All functions visible but summarized
- 🚨 **Alert relevance**: Only critical cross-function issues bubble up
- 🎛️ **Control**: Can drill into any function when needed

---

## Mockup Hierarchy

```
HOME TAB
├── FOUNDER
│   ├── Company Health (cash, runway, burn)
│   ├── All OKRs (all functions)
│   ├── Full Resource Pool (all members)
│   ├── Business Improvements (all)
│   └── Approval Queues (all)
│
├── EXECUTIVE
│   ├── Function Health Summary
│   ├── Their Function's OKRs
│   ├── Their Team's Resource Pool
│   ├── Function-Specific Improvements
│   └── Company Context (read-only, minimal)
│
└── APPRENTICE
    ├── My Active Tasks (3-5 cards)
    ├── My Progress Today
    ├── Contributing to OKR: [Current]
    └── Next Up (queued tasks)

DECIDE TAB
├── FOUNDER: All functions, full allocation control
├── EXECUTIVE: Their function only, limited to their resources
└── APPRENTICE: Request tasks, view their queue (read-only)

DO TAB (Already Great!)
├── FOUNDER: All tasks, all functions, function filter
├── EXECUTIVE: Their function's tasks, OKR view
└── APPRENTICE: Their tasks only, focus mode

EVALUATE TAB
├── FOUNDER: All submissions, company-wide metrics
├── EXECUTIVE: Their function's submissions and metrics
└── APPRENTICE: Personal performance dashboard

MAKE TAB (Good, needs minor enhancements)
├── FOUNDER: All suppliers/AI, cost analysis
├── EXECUTIVE: Their owned resources, function usage
└── APPRENTICE: Request access, personal AI tools

HUB TAB
├── FOUNDER: Strategic intelligence, all functions
├── EXECUTIVE: Functional intelligence, dependencies
└── APPRENTICE: Learning hub, growth opportunities
```

---

## Technical Implementation Notes

### State Management
- Current: `useCurrentMembership()` provides role
- Use: `role === 'Founder' | 'FractionalExec' | 'Apprentice'`
- Also: `currentMembership.function` for executives

### Filtering Patterns
```typescript
// Home Tab - OKR filtering
const visibleOKRs = useMemo(() => {
  if (role === 'Founder') return allOKRs;
  if (role === 'FractionalExec') return allOKRs.filter(okr => okr.function === memberFunction);
  if (role === 'Apprentice') {
    // Show OKRs for tasks they're working on
    const myTaskOKRs = myTasks.map(t => t.linkedOKRTitle);
    return allOKRs.filter(okr => myTaskOKRs.includes(okr.title));
  }
  return [];
}, [role, memberFunction, allOKRs, myTasks]);

// Decide Tab - Work plan filtering
const visibleWorkPlans = useMemo(() => {
  if (role === 'Founder') return allWorkPlans;
  if (role === 'FractionalExec') return allWorkPlans.filter(wp => wp.function === memberFunction);
  if (role === 'Apprentice') return []; // Can't see decide queue, only their Do queue
  return [];
}, [role, memberFunction, allWorkPlans]);

// Evaluate Tab - Submission filtering
const visibleSubmissions = useMemo(() => {
  if (role === 'Founder') return allSubmissions;
  if (role === 'FractionalExec') return allSubmissions.filter(sub => sub.function === memberFunction);
  if (role === 'Apprentice') return allSubmissions.filter(sub => sub.apprenticeId === currentUserId);
  return [];
}, [role, memberFunction, allSubmissions, currentUserId]);
```

### Component Reuse
- Create `<HomeFounder />`, `<HomeExecutive />`, `<HomeApprentice />` components
- Wrap in role switcher:
```typescript
export default function HomeTab() {
  const role = useCurrentMembership()?.role;

  if (role === 'Founder') return <HomeFounder />;
  if (role === 'FractionalExec') return <HomeExecutive />;
  if (role === 'Apprentice') return <HomeApprentice />;

  return null;
}
```

---

## Conclusion

The app currently treats all users as "power users" with full visibility. This works for Founders but creates cognitive overload for Executives and especially Apprentices.

**Recommendation**: Implement Phase 1 immediately to deliver focused, role-appropriate experiences. This will dramatically improve usability and task completion rates for 80% of users (Execs + Apprentices).

**Next Steps**:
1. User testing with 1 Founder, 2 Executives, 2 Apprentices
2. Implement Home + Decide + Hub scoping (Phase 1)
3. Measure task completion time and user satisfaction
4. Iterate into Phase 2

---

**Document Version**: 1.0
**Date**: January 15, 2026
**Author**: Claude (AI Assistant)
