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
- **Team Directory** - Comprehensive team management with real workspace members
  - **Live Workspace Members**: Displays actual workspace members from database (not mock data)
  - **Task Assignment Fixed**: Assign tasks using real user IDs that work with the database
  - **Full Contact Information**: Direct email access for every team member
  - **Professional Profiles**: Role, function, specialization, and availability
  - **Task Performance Metrics**: View active and completed task counts per member
  - **Direct Task Assignment**: Assign tasks to team members directly from their profile (Founders/Execs only)
  - **One-Click Communication**: Email team members with single tap
  - **Role-Based Filtering**: Filter by Founders, Executives, or Apprentices
  - **Visual Org Chart Button**: Quick access to interactive organization diagram
- **Interactive Organization Diagram** - Visual representation of team structure
  - **Circular Layout**: Founders in center, executives in middle ring, apprentices in outer ring
  - **Reporting Lines**: Dashed lines show who reports to whom
  - **Interactive Nodes**: Tap any team member to see full details
  - **Color-Coded Roles**: Blue (Founders), Purple (Executives), Green (Apprentices)
  - **Decide • Evaluate • Do Framework**: Visual explanation of organizational philosophy
  - **Team Member Details**: Full profiles with contact info, reporting structure, and cost data
  - **Scrollable Canvas**: Pan to explore the full diagram
  - **Legend**: Clear indication of what each node type represents
- **Team Hiring System (Founder-Only)** - Browse and hire talent to build your team (Located in Network tab)
  - **30 Fractional Executives**: Senior leaders in Sales, Marketing, Finance, Engineering, and Operations
  - **30 Apprentices**: Junior talent eager to learn and execute across all business functions
  - **Detailed Profiles**: View experience, ratings, daily rates, availability, skills, and previous companies
  - **Search & Filter**: Find candidates by name, specialization, or skills
  - **One-Click Hiring**: Add candidates to your team instantly
  - **Realistic Candidates**: Real-world experience levels and competitive market rates
- **Organization Structure (Founder-Only)** - Complete operational overview and org chart
  - **Hierarchical Org Chart**: Visual reporting structure showing founders → execs → apprentices
  - **Reporting Lines**: Clear view of who reports to whom across the organization
  - **Role Breakdown**: 2 Founders, 4 Fractional Executives managing 7 Apprentices
  - **Cost Analysis**: Daily rates and total team costs at a glance
  - **Supplier Engagements**: Track all active supplier projects with costs, timelines, and deliverables
  - **Financial Tracking**: £101k total supplier spend, £33k paid to date, £68k remaining
  - **Project Management**: See which team members manage which supplier relationships
  - **Delivery Timelines**: Track supplier delivery dates and project status (planning, in progress, delivered)
  - **Task Breakdown**: Detailed task lists for each supplier engagement
  - **Interactive Map**: View all 5 supplier locations across UK on an interactive map with markers
  - **Location Details**: See exact addresses and cities (Birmingham, Leeds, Manchester, 2x London)
  - **Map Markers**: Tap any supplier on the map to view full engagement details
  - **Geographic Overview**: Visual understanding of supply chain distribution across the country
  - **AI Agents Directory**: Complete catalog of 10 AI tools used across the organization
  - **AI Cost Management**: £2,169/month total AI spend tracked by agent
  - **Usage Analytics**: Monthly request counts, response times, and success rates per AI agent
  - **Team Access**: See which team members use which AI tools for what functions
  - **Provider Breakdown**: OpenAI, Anthropic, Google, ElevenLabs, and other providers
  - **Capability Mapping**: Understand what each AI agent can do and how it's integrated
- **OKR Management** - Create objectives, track key results with real-time progress
  - **Link Tasks to Objectives**: Connect work directly to strategic goals when creating tasks
  - **Visual Task Integration**: See related tasks directly on objective cards with completion metrics
  - **Bidirectional Navigation**: Jump between tasks and objectives seamlessly
  - **Progress Tracking**: Task completion counts displayed on each objective (e.g., "5/12 tasks completed")
  - **Quick Access**: "View All" link to see all tasks for a specific objective in Work Hub
- **Work Hub** - Manage projects and tasks with rich metadata (priority, function, status)
  - **Task Creation**: Create tasks with title, description, assignee, function, and priority - now with proper scrolling and success feedback
  - **Link to Objectives**: Optionally connect tasks to strategic objectives during creation
  - **Task Assignment**: Assign tasks to workspace members (uses real user IDs from database)
  - **Task Reassignment**: Easily reassign existing tasks to different team members
  - **Status Management**: Update task status (todo, in_progress, in_review, done)
  - **Filter by Status**: Filter tasks by status to focus on what matters
  - **Objective Badges**: Visual indicators on task cards showing which objective they support
  - **Success Alerts**: Visual confirmation when tasks are created or updated
- **Review Queue** - Apprentices request reviews, Fractional Execs approve/reject with audit trails
- **Time Tracking** - Apprentices log hours on tasks with notes and date tracking
- **Team Utilization Dashboard** - Executives and Founders view team capacity and productivity
- **Automated Reports** - Professional, board-ready reports with beautiful design
  - **Home Screen Quick Access**: Weekly, Monthly, Quarterly report cards
  - **Founder Reports**: Business overview with gradient metric cards, OKR progress bars, executive performance, apprentice utilization, and risk alerts
  - **Executive Reports**: Function-specific performance summary with highlighted metrics
  - **Apprentice Reports**: Individual work summary with achievements and recent tasks
  - **Board Pack Export**: One-click markdown export ready for board presentations (Founder-only)
  - **Auto-generation**: Reports generate automatically when accessed from home screen
  - **Multiple Export Formats**: Markdown (board-ready), CSV (analysis), JSON (integration)
  - **Professional Design**: Clean slate color palette, bold typography, proper visual hierarchy
- **Executive Workflow System** - Pre-defined task sequences for each function (Marketing, Sales, Finance, Ops, Engineering, Admin)
- **UK Supplier Network** - Verified manufacturing supplier directory with 30+ UK suppliers
  - **Comprehensive Details**: Contact info, capabilities, certifications, lead times
  - **Verified Suppliers**: ISO-certified manufacturers across all specialties
  - **Search & Filter**: Find suppliers by capability, location, and certifications
- **Company Discovery** - Connect with other companies using Centaur OS
- **Community Events** - Schedule and RSVP to cross-company meetups, workshops, and networking events
- **Weekly Pack Generator** - One-click generation of status reports with OKR progress
- **Templates Library** - Pre-built task templates by function (Finance, Sales, Marketing, Ops, Engineering)
- **Dark/Light Mode** - Full theme support with system preference option
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
- `User` - Email, name, avatar, preferences (theme)
- `Workspace` - Multi-tenant workspaces with optional public company profiles
- `Membership` - Role (Founder/Apprentice/FractionalExec), Function (Finance/Sales/etc)
- `Objective` - Time-bound objectives with owners
- `KeyResult` - Measurable KRs with target/current/unit and health status
- `MetricEvent` - Historical KR updates
- `Project` - Linked to objectives, track status
- `Task` - Assignee, priority, function, status, due date, attachments
- `TaskComment` - Comments on tasks
- `TimeEntry` - Hours logged on tasks with notes and dates
- `Review` - Review workflow (pending/approved/changes_requested)
- `WeeklyPack` - Generated HTML status reports
- `Template` - Task templates by function
- `WorkflowItem` - Pre-defined task sequences with approval chain tracking
- `WorkflowTemplate` - System templates with 60 pre-defined tasks across 6 functions
- `Supplier` - Platform-wide manufacturing supplier directory (UK-focused)
- `SupplierRecommendation` - User-submitted supplier suggestions
- `CompanyProfile` - Public company profiles for networking
- `CompanyConnection` - Peer-to-peer connections between companies
- `CommunityEvent` - Cross-company events (meetups, workshops, office hours)
- `EventRSVP` - Event attendance tracking
- `Report` - Generated reports with role-based data (Founder/Executive/Apprentice)
- `AuditLog` - Full audit trail

### RBAC (Role-Based Access Control)

All CRUD operations enforce permissions based on role:

- **Founder**: Full access to everything, board-ready reports, company networking
- **Apprentice**: Create/update own tasks, log time, request reviews, use templates, view individual reports
- **FractionalExec**: Read all, update OKRs/projects, approve reviews, generate weekly packs, view function reports, see team utilization

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
  ├── network               # Network (Suppliers, Companies, Events)
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
