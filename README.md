# Centaur OS - Mobile Edition

**The Operating System for Lean Hardware Startups**

Centaur OS is a production-ready iOS mobile application that helps lean hardware startups operate efficiently with a small team: 2 founders, apprentices (doers), and fractional executives (reviewers).

![Platform](https://img.shields.io/badge/platform-iOS-blue)
![React Native](https://img.shields.io/badge/React%20Native-0.76.7-61DAFB?logo=react)
![Expo](https://img.shields.io/badge/Expo-SDK%2053-000020?logo=expo)
![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?logo=typescript)

---

## 🎯 What It Does

Centaur OS turns OKRs into work, tracks execution, enables review workflows, and provides an AI copilot that summarizes status and proposes next actions with human approval gates.

### Key Features

- **Multi-Tenant Workspaces** - Users can belong to multiple workspaces with role-based access
- **Role-Based Dashboards** - Customized views for Founders, Apprentices, and Fractional Execs
- **OKR Management** - Create objectives, track key results with real-time progress
- **Work Hub** - Manage projects and tasks with rich metadata (priority, function, status)
- **Review Queue** - Apprentices request reviews, Fractional Execs approve/reject with audit trails
- **Weekly Pack Generator** - One-click generation of status reports with OKR progress
- **AI Copilot (Stub Mode)** - Chat interface with deterministic AI that proposes actions (human approval required)
- **Templates Library** - Pre-built task templates by function (Finance, Sales, Marketing, Ops, Engineering)
- **Audit Logging** - Full audit trail of all actions across the workspace

---

## 🏗️ Architecture

### Tech Stack

- **Framework**: Expo SDK 53 + React Native 0.76.7
- **Language**: TypeScript (strict mode)
- **Navigation**: Expo Router (file-based routing)
- **State**: Zustand + React Query
- **Storage**: AsyncStorage + MMKV (for fast key-value)
- **Styling**: NativeWind (TailwindCSS for React Native)
- **UI**: Lucide icons, LinearGradient, custom components
- **Package Manager**: Bun

### Data Model

The app simulates a backend using AsyncStorage as a local database. All entities are stored as normalized records:

**Core Entities:**
- `User` - Email, name, avatar
- `Workspace` - Multi-tenant workspaces
- `Membership` - Role (Founder/Apprentice/FractionalExec), Function (Finance/Sales/etc)
- `Objective` - Time-bound objectives with owners
- `KeyResult` - Measurable KRs with target/current/unit
- `MetricEvent` - Historical KR updates
- `Project` - Linked to objectives, track status
- `Task` - Assignee, priority, function, status, due date
- `TaskComment` - Comments on tasks
- `Review` - Review workflow (pending/approved/changes_requested)
- `WeeklyPack` - Generated HTML status reports
- `Template` - Task templates by function
- `AuditLog` - Full audit trail

### RBAC (Role-Based Access Control)

All CRUD operations enforce permissions based on role:

- **Founder**: Full access to everything
- **Apprentice**: Create/update own tasks, request reviews, use templates
- **FractionalExec**: Read all, update OKRs/projects, approve reviews, generate weekly packs

Permissions are checked server-side (in the API layer) on every mutation.

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and Bun
- Expo Go app on your iOS device (or iOS Simulator on Mac)
- Vibecode environment (already configured)

### Installation

The app is already set up in your Vibecode workspace! The dependencies are pre-installed.

### Running the App

The app is already running on port 8081 in your Vibecode environment. Just preview it in the Vibecode app viewer.

**Demo Accounts:**

| Role | Email | Name |
|------|-------|------|
| Founder | `founder@fractional.com` | Sarah Chen |
| Apprentice | `apprentice@fractional.com` | Alex Rivera |
| Fractional Exec | `exec@fractional.com` | Jordan Martinez |

Simply tap any demo account on the sign-in screen to log in instantly.

---

## 📱 App Structure

### Navigation

```
/sign-in                    # Authentication screen
/(tabs)/
  ├── index                 # Home dashboard (role-based)
  ├── okrs                  # Objectives & Key Results
  ├── work                  # Work Hub (projects + tasks)
  ├── reviews               # Review Queue
  ├── copilot               # AI Copilot chat
  └── settings              # Settings & logout
```

### Home Dashboard Views

**Founder View:**
- KPI tiles (Active Objectives, Completed Tasks, In Progress, Pending Reviews)
- Key Results progress with health indicators
- Quick actions to OKRs and Work Hub

**Apprentice View:**
- Personal KPI tiles
- Key Results assigned to them
- **Your Tasks** section with today's work
- Quick access to templates

**Fractional Exec View:**
- Workspace-wide KPIs
- Key Results health overview
- **Review Queue** with pending approvals
- Quick action to generate Weekly Pack

---

## 🤖 AI Copilot

The AI Copilot runs in **stub mode** by default (no API key required). It provides deterministic responses based on your workspace data.

### Capabilities

**What you can ask:**
- "What's the state of the business?"
- "What should I focus on next?"
- "Generate a weekly pack narrative"
- "What are the biggest risks?"

**Action Proposals:**
The Copilot can propose tasks to create, but **requires human approval** before executing. This ensures the AI never takes autonomous actions without oversight.

### Switching to API Mode

To use a real LLM (future feature):

1. Set environment variable: `COPILOT_MODE=api`
2. Provide an API key (implementation is modular and ready)

Currently, stub mode is production-ready and provides intelligent, context-aware responses.

---

## 🔐 Security & RBAC

### Permission Enforcement

Every mutation checks permissions:

```typescript
// Example: Creating a task
if (!checkPermission(actorRole, 'create', 'task')) {
  throw new Error('Permission denied');
}
```

Permissions are defined in `/src/lib/api/index.ts`.

### Audit Logging

Every significant action is logged:

```typescript
{
  id: string;
  workspaceId: string;
  actorId: string;
  action: "task.created" | "review.approved" | etc;
  objectType: "task" | "review" | etc;
  objectId: string;
  timestamp: string;
  payloadSummary?: string;
}
```

Audit logs are stored in AsyncStorage and can be viewed by Founders.

---

## 📊 Weekly Pack Generator

Founders and Fractional Execs can generate a "Weekly Pack" with one tap:

**Includes:**
- OKR/KR status (green/yellow/red based on progress)
- What changed this week (completed tasks, key comments)
- Risks & blockers
- Decisions needed
- Next week priorities

The pack is generated as HTML and stored in the database. Future: export as PDF.

---

## 🎨 Design System

### Color Palette

- **Background**: Slate 950 (#0f172a)
- **Cards**: Slate 900 (#0f172a)
- **Borders**: Slate 800 (#1e293b)
- **Primary**: Blue 500 (#3b82f6)
- **Success**: Green 500 (#10b981)
- **Warning**: Yellow 500 (#eab308)
- **Error**: Red 500 (#ef4444)

### Components

All UI uses:
- **Lucide Icons** for consistency
- **LinearGradient** for depth and visual interest
- **NativeWind** classes for styling
- **Role-based conditional rendering**

---

## 📂 Project Structure

```
src/
├── app/                      # Expo Router screens
│   ├── _layout.tsx           # Root layout with auth
│   ├── sign-in.tsx           # Authentication
│   └── (tabs)/               # Main app tabs
│       ├── _layout.tsx       # Tab navigation
│       ├── index.tsx         # Home dashboard
│       ├── okrs.tsx          # OKRs screen
│       ├── work.tsx          # Work Hub
│       ├── reviews.tsx       # Review Queue
│       ├── copilot.tsx       # AI Copilot
│       └── settings.tsx      # Settings
├── components/               # Reusable components
├── lib/
│   ├── api/                  # API layer with RBAC
│   │   ├── index.ts          # User, Workspace, Membership, Objective, KR APIs
│   │   ├── operations.ts     # Project, Task, Review, WeeklyPack, Template APIs
│   │   └── seed.ts           # Demo data seeding
│   ├── copilot/              # AI Copilot service
│   │   └── index.ts          # Stub & API providers
│   ├── hooks/                # React hooks
│   │   ├── queries.ts        # React Query hooks
│   │   └── useInitializeApp.ts  # App initialization
│   ├── state/                # State management
│   │   └── app-store.ts      # Zustand store
│   ├── storage.ts            # AsyncStorage & MMKV wrappers
│   ├── cn.ts                 # className utility
│   └── useColorScheme.ts     # Theme detection
└── types/
    └── index.ts              # TypeScript types
```

---

## 🧪 Data Seeding

On first launch, the app automatically seeds a demo workspace with:

- 3 users (Founder, Apprentice, Fractional Exec)
- 1 workspace ("Fractional Foundry")
- 2 objectives with 4 key results
- 2 projects (engineering + sales)
- 8 tasks across functions
- 8 system templates
- Full membership and permission setup

**To reset data**: Clear app data or reinstall.

---

## 🚢 Deployment Notes

### Running in Vibecode

The app is already running! Just view it in the Vibecode mobile app preview.

### Building for Production

Since this is a Vibecode project, use the Vibecode publish flow:

1. Tap "Share" in the top right of the Vibecode app
2. Select "Submit to App Store"
3. Follow Vibecode's guided submission process

**Note**: This app does NOT include App Store configuration (`app.json`, `eas.json`) as that is managed by Vibecode.

---

## 🔧 Development

### Adding a New Screen

1. Create file in `src/app/(tabs)/new-screen.tsx`
2. Register in `src/app/(tabs)/_layout.tsx`
3. Add icon and title

### Adding a New Entity Type

1. Define type in `src/types/index.ts`
2. Add storage methods in `src/lib/storage.ts`
3. Create API functions in `src/lib/api/operations.ts`
4. Add React Query hooks in `src/lib/hooks/queries.ts`
5. Update seed data in `src/lib/api/seed.ts`

### TypeScript & Linting

The project uses strict TypeScript and ESLint:

```bash
bun run typecheck  # Check types
bun run lint       # Check linting
```

Both run automatically via hooks when you save files.

---

## 📝 Key Design Decisions

### Why AsyncStorage Instead of a Real Backend?

For this MVP, AsyncStorage simulates a backend database. This allows:
- Instant setup with zero external dependencies
- Full offline support
- Easy demo and testing
- Clear separation of concerns (API layer is ready for real backend)

**Migration Path**: Replace `src/lib/storage.ts` and `src/lib/api/*` with REST/GraphQL calls.

### Why Zustand + React Query?

- **Zustand**: Simple global state (auth, current workspace)
- **React Query**: Server state with caching, refetching, optimistic updates

This combination avoids prop drilling while keeping server state separate from client state.

### Why Role-Based Everything?

Hardware startups have **clear role separation**:
- Founders make strategic decisions
- Apprentices execute
- Fractional Execs review and approve

The app enforces this structure to prevent chaos and maintain accountability.

---

## 🎯 What's Next

The core MVP is complete! Here are natural extensions:

- **OKRs Screen**: Full objective/KR management with inline editing
- **Work Hub**: Kanban board + list view, drag-and-drop, task creation
- **Review Queue**: Full approval workflow UI with notes
- **Copilot**: Enhanced conversation UI with action approval flow
- **Weekly Pack Viewer**: Render HTML packs with styling
- **Templates**: Template browser and quick-create flows
- **Real Backend**: Migrate to Next.js API routes or separate backend

---

## 📄 License

This is a demo project created for Fractional Foundry.

---

## 💬 Support

For questions about this codebase:
- Check inline code comments (TSDoc format)
- Review the type definitions in `src/types/index.ts`
- Explore the seed data in `src/lib/api/seed.ts` for examples

**Built with Vibecode** - The best AI app builder that requires no coding skills.

---

## 🙏 Acknowledgments

- Design inspiration: Linear, Notion, Height
- Icons: Lucide
- Framework: Expo Team
- Built by: Claude (Anthropic) via Vibecode

---

**Ready to operate your lean startup like a pro.** 🚀
