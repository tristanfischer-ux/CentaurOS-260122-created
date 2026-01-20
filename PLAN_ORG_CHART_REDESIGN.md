# Organization Chart Redesign Plan

## Current State Analysis

### What Works
- Header with summary stats (Executives, Apprentices, AI Agents count)
- Business function grouping (Marketing, Sales, Engineering, Ops, Finance, Admin)
- Member detail modal showing info
- Dark/light theme support
- Role-based visual indicators (icons, colors)

### Problems with Current Org-Diagram
1. **Redundant with Company Settings** - Shows same team member info without edit capability
2. **View-Only** - Cannot perform any actions (remove, invite, change roles)
3. **Hardcoded Business Functions** - Only shows 6 fixed functions, not flexible to user's org structure
4. **No Reporting Lines** - Doesn't show who reports to whom (despite `reportsTo` field existing)
5. **No Capacity/Availability Info** - Doesn't show working days/week or current workload
6. **No Quick Actions** - Can't do anything useful from this screen
7. **Seed Data Only** - Doesn't reflect real Supabase data or active memberships
8. **No AI Tool Assignments** - Shows AI agents but not which team members have which tools

## Proposed Solution: Transform into Operational Dashboard

Instead of a read-only org chart, make it a **Team Performance & Capacity Dashboard** with:

### 1. **Quick Stats Bar** (Keep + Enhance)
- Team members (active/inactive)
- Current capacity utilization (% of team actively working)
- Total monthly cost
- Open invitations count

### 2. **Team Health Indicators**
- Busy/Available status indicators
- Workload distribution across team
- Skills match to current tasks (if tasks are assigned)
- Time-to-hire: Show recruiting pipeline (pending invitations)

### 3. **Reporting Lines View** (NEW)
- Hierarchical tree view showing who reports to whom
- Founders at top → Executives → Apprentices
- Click to see direct reports and reporting relationships
- Highlight team members and their chain of command

### 4. **Capacity Planning** (NEW)
- Team members with their availability (days/week)
- Current utilization rate
- Who has bandwidth for new work
- Suggested next hire if team is bottlenecked

### 5. **Skills Matrix** (NEW)
- Show team skills by function
- Identify skill gaps
- Show cross-functional expertise
- Highlight single points of failure (critical skills with 1 person)

### 6. **Quick Actions from Dashboard**
- Long-press to invite someone to this function
- Tap member card to edit role/function
- Send message to team
- View team capacity forecast

### 7. **Better Integration with Existing Flows**
- Link to Company Settings for edits
- Show pending invitations with accept/reject buttons
- Show applicants/candidates for open roles

## Implementation Approach

### Option A: Enhance Existing org-diagram.tsx (RECOMMENDED)
**Pros:**
- Keeps existing route structure
- Minimal navigation changes
- Reuses current header

**Cons:**
- File will become larger
- May need refactoring for performance

**Steps:**
1. Keep current header with enhanced stats (add capacity %)
2. Replace function grouping with reporting lines tree view
3. Add tabs or toggle: "By Function" / "By Reporting" / "Capacity"
4. Add quick action buttons when tapping members
5. Connect to real data from useOrganizationStore instead of seed data

### Option B: Create New Screen (Not Recommended)
**Why Not:**
- Adds complexity to settings navigation
- User already has to go through multiple screens
- Settings.tsx would need another link

## Critical Changes Required

### Data Changes
- Use `useOrganizationStore()` instead of hardcoded ORGANIZATION_MEMBERS
- Leverage `reportsTo` and `manages` fields
- Pull real availability (days/week, status: active/inactive)
- Calculate capacity: (team.length × daysPerWeek × 8 hours) / week

### UI Changes
1. **Reporting Tree Component** - Visual hierarchy of reporting lines
2. **Member Card Enhancement** - Add availability badge, quick action menu
3. **Tabs/Filters** - Switch between organizational views
4. **Quick Action Popover** - What happens when you tap a member

### Navigation Changes
- Keep `/org-diagram` route
- NO changes to settings.tsx navigation
- Connect to company-settings for team edits

## Recommended Quick Wins (If Full Redesign Too Much)

1. **Minimal Fix:** Show real data instead of seed data (+ 10 min)
2. **Add Capacity:** Show team member availability and workload (+ 20 min)
3. **Show Reporting Lines:** Add reportsTo visualization (+ 30 min)
4. **Add Quick Actions:** "Edit Role" → links to company-settings (+ 15 min)

## Risks & Considerations

- **Performance:** If team is large (100+ people), tree visualization could be slow
- **Deep Hierarchies:** App designed for flat/matrix orgs; deep hierarchies may not display well
- **Real-time Data:** Switching from seed data to Zustand store requires real data population
- **User Expectations:** If users expect to edit from here, need clear "Edit" affordance

## Success Criteria

After redesign, users should be able to:
✓ See team structure and reporting lines at a glance
✓ Understand team capacity and availability
✓ Identify skill gaps and hiring needs
✓ Quickly navigate to manage team (edit/invite/remove)
✓ See pending invitations and action items
✓ No reason to visit both org-diagram AND company-settings

---

## Next Steps

1. **Confirm approach:** Option A (Enhance existing screen) or Option B (New screen)?
2. **Prioritize features:** Full redesign or quick wins?
3. **Data readiness:** Is organization store populated with real data?
4. **Timeline:** How comprehensive should the redesign be?
