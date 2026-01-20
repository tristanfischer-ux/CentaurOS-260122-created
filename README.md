# Centaur OS - Mobile Edition

**Task Management for Small Teams**

A mobile app for lean companies to manage tasks, track team capacity, and coordinate work. Built for founders, fractional executives, and apprentices.

![Platform](https://img.shields.io/badge/platform-iOS-blue)
![React Native](https://img.shields.io/badge/React%20Native-0.76.7-61DAFB?logo=react)
![Expo](https://img.shields.io/badge/Expo-SDK%2053-000020?logo=expo)
![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?logo=typescript)
![Status](https://img.shields.io/badge/Status-Beta-yellow)

---

## Beta Status

**This app is in active development.** Core functionality works, but some features are incomplete.

### What Works (Jan 20, 2026)

- **Authentication**: Sign up/sign in with email via Supabase
- **Task Management**: Create, edit, assign tasks with time unit allocations
- **Task Display System**: New standardized 3-tier task cards (Compact, Medium, Full)
- **Coordination Cost Calculation**: Automatic overhead penalties based on team size
- **Capacity Warnings**: Real-time member overallocation indicators
- **Team Roster**: View team members and their capacity
- **Timeline View**: See tasks on a Gantt-style chart
- **Multi-tenant**: Workspace-based data isolation
- **Themes**: Light, dark, and off-white modes

### Recent Updates (Jan 20, 2026)

**People Tab - FULLY COMPLETED**:
- ✅ Three-tier progressive disclosure (Compact → Medium → Full)
- ✅ Avatar initials fixed (first name + last name initials)
- ✅ Fixed all nested ScrollView issues - smooth single-scroll experience
- ✅ Fixed "Text strings must be rendered within a <Text> component" error (numeric conditional rendering)
- ✅ Quick Assign button with capacity-aware modal
- ✅ Clickable avatars with MemberQuickView popover
- ✅ Capacity impact display in PendingAssignmentsModal
- ✅ Bidirectional navigation (People ↔ Tasks tabs)
- ✅ Unified CapacityIndicator component (3 variants: dot, bar, full)
- ✅ What-If capacity calculator (shows impact of adding 2/4/6/8 TU)
- ✅ Capacity-focused header stats (Available, At Capacity, Overallocated)
- ✅ Removed Personal Timeline (prevented scroll conflicts)

**Implementation Details**:
- **Scrolling**: Single parent ScrollView for entire full view - no nested scroll zones
- **Header Stats**: Changed from role-based (Founders/Execs/Apprentices) to capacity-based (Available/At Capacity/Overallocated)
- **What-If Calculator**: Interactive scenarios with color-coded warnings (green/amber/red)
- **CapacityIndicator**: Reusable component provides consistent visualization across all tabs
- **Navigation**: "View in Tasks" and "View Profile" links enable quick context switching
- **Quick Actions**: Tap avatars anywhere to see capacity and assign tasks

**Task Display Standardization - COMPLETED**:
- ✅ New unified task card system implemented throughout the app
- ✅ Compact view: Single line with status, title, avatars, due date, progress
- ✅ Medium view: Expanded card with quick actions (status, progress, reschedule)
- ✅ Full view: Complete editing with coordination cost breakdown
- ✅ Tasks tab now uses tier system (Compact → Medium → Full)
- ✅ Coordination cost calculation: 5% (2 people), 10% (3), 15% (4), 20% (5+)
- ✅ Due date format: "Due Tue 3 Feb" with overdue indicators
- ✅ Removed old CompactTaskCard component
- ✅ Demo tab removed, Marketplace tab restored

**Implementation Details**:
- `TaskCardCompact` replaces old CompactTaskCard throughout app
- Clicking a compact card opens `TaskCardMedium` for quick actions
- "View Full Details" button in Medium view opens `TaskCardFull` for complete editing
- All task views show avatars (including dummy avatars for missing members)
- Inline editing for title and description with tap-to-edit functionality

See `TASK_DISPLAY_PLAN.md` for full specification.

### Known Limitations

- **Financial Dashboard**: Shows £0 until you add financial data in Supabase
- **Marketplace**: Discovery features are placeholder - no real supplier data
- **AI Features**: Voice-to-task works but AI priority scoring uses mock data
- **No Offline Support**: Requires internet connection
- **No Push Notifications**: Task assignments don't send alerts

### Not Ready for Production

- Error handling is minimal - errors log to console
- No onboarding flow for new users
- Empty states need improvement
- Performance not optimized for large datasets

---

## 6-Tab Structure

| Tab | Status | Description |
|-----|--------|-------------|
| **Home** | ✅ Working | Dashboard with tasks, team capacity, performance cards |
| **People** | ✅ Working | Team roster and capacity visualization |
| **Tasks** | ✅ Working | Task list with create/edit functionality |
| **When** | ✅ Working | Timeline/Gantt view of all tasks |
| **Marketplace** | ⚠️ Limited | Discovery UI exists but no real data |
| **Settings** | ✅ Working | Theme, workspace, and account settings |

---

## Tech Stack

- **Frontend**: React Native 0.76.7, Expo SDK 53
- **Navigation**: Expo Router (file-based)
- **Styling**: NativeWind (Tailwind for React Native)
- **State**: Zustand stores
- **Database**: Supabase (PostgreSQL with RLS)
- **TypeScript**: Strict mode enabled

---

## Getting Started

### Prerequisites
- Node.js 18+ and bun
- Expo CLI
- Supabase project

### Setup

1. **Install dependencies:**
   ```bash
   bun install
   ```

2. **Configure Supabase:**
   Add to `.env`:
   ```
   EXPO_PUBLIC_SUPABASE_URL=your-project-url
   EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   ```

3. **Run migrations:**
   In Supabase SQL Editor, run files from `supabase/migrations/` in order.

4. **Start app:**
   ```bash
   bun start
   ```

---

## Project Structure

```
src/
├── app/                    # Expo Router pages
│   ├── (tabs)/            # Main tab screens
│   ├── _layout.tsx        # Root layout
│   └── ...                # Standalone screens
├── components/            # Reusable UI components
├── lib/
│   ├── state/            # Zustand stores
│   ├── supabase.ts       # Database client
│   └── ...
└── types/                # TypeScript definitions

supabase/
└── migrations/           # Database schema
```

---

## Data Architecture

### Tables
- `workspaces` - Companies/organizations
- `memberships` - User-workspace relationships
- `members` - Team members with roles and capacity
- `work_plans` - Tasks with status and allocations
- `work_plan_allocations` - Per-person task assignments
- `financial_transactions` - Revenue and costs (optional)

### Row-Level Security
All company tables use `workspace_id` with RLS policies. Users only see data from workspaces they belong to.

---

## For Beta Testers

### What to Test
1. Sign up and create your profile
2. Create tasks and assign them to yourself
3. Track progress on the timeline
4. Add team members and allocate work
5. Report bugs and UX issues

### Providing Feedback
- Note the screen name and what you were trying to do
- Describe what happened vs what you expected
- Include any error messages

---

## Documentation

- `CLAUDE.md` - Development instructions
- `STYLE_GUIDE.md` - UI component standards
- `supabase/migrations/` - Database schema

---

## License

Proprietary - Vibecode Company
