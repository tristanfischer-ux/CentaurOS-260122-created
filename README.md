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
- **Financial Dashboard (Founder-Only)** - Comprehensive financial tracking and budget management
  - **Key Metrics**: Monthly Revenue, Monthly Gross Profit, Monthly Burn Rate, Runway - all clearly labeled as monthly
  - **Tappable Metric Cards**: Tap any financial metric card to see detailed breakdowns
  - **Tappable Cost Breakdown Cards**: Each cost category card (COGS, Team, AI Services, Other) is clickable
    - **COGS Breakdown**: Materials, Manufacturing, Shipping, Other with percentages
    - **Team Costs Breakdown**: Founders, Fractional Executives, Apprentices with headcount and percentages
    - **AI Services Breakdown**: OpenAI, Anthropic, Google, ElevenLabs, Other with percentages
    - **Other Costs Breakdown**: Office & Facilities, Software & Tools, Marketing, Legal & Compliance, Miscellaneous with percentages
  - **Revenue Breakdown Modal**: £45k current revenue with 15.5% growth
    - Product Sales breakdown with percentages
    - Services revenue tracking
    - Recurring revenue streams
    - Other revenue sources
  - **Profit Breakdown Modal**: Shows complete profit calculation
    - Monthly revenue sources
    - COGS/Bill of Materials (BOM) detailed breakdown (materials, manufacturing, shipping)
    - Gross profit calculation with margin percentage
  - **Burn Rate Breakdown Modal**: £57.7k monthly burn with detailed category analysis
    - **Bill of Materials (BOM)**: £18.5k (32.0% of burn) - Materials, Manufacturing, Shipping, Other
    - **People**: £28.6k (49.5% of burn) - Founders, Fractional Execs (4), Apprentices (7) with headcount
    - **AI Services**: £2.2k (3.8% of burn) - OpenAI, Anthropic, Google, ElevenLabs, Other
    - **Other Costs**: £8.5k (14.7% of burn) - Office, Software, Marketing, Legal, Other
  - **Runway Details Modal**: Cash balance and runway calculation
    - Current cash balance: £600k
    - Monthly burn rate: £57.7k
    - Runway: 10.4 months with actionable recommendations
  - **Interactive Scenario Planning**: Model different business scenarios with live calculations
    - **Revenue Slider**: Adjust revenue increase from 0% to 100% and see immediate impact
    - **Burn Reduction Slider**: Model burn rate reductions from 0% to 50%
    - **Combined Impact View**: See new monthly P&L with adjusted revenue and burn
    - **New Runway Calculation**: Real-time runway projections based on scenarios
    - **Visual Feedback**: Color-coded cards showing positive/negative impacts
  - **Budget Setting**: Interactive modal to set targets for revenue, costs, and burn rate
  - **Budget Variance**: Real-time comparison of actual vs budget with variance amounts
  - **Visual Progress Bars**: Each cost category shown as percentage of total monthly burn
  - **Board Pack Integration**: Financial metrics automatically included in board pack exports
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
- **AI Agents by Function** - 36 AI agents organized by business function (£7,334/month total)
  - **Finance (3 agents - £1,000/mo)**: Vic AI (invoice processing), Digits AI (bookkeeping), Gemini Pro (analysis)
  - **Sales (4 agents - £1,649/mo)**: 11x Alice (AI SDR), Gong AI (call analysis), Clay AI (lead enrichment), ElevenLabs (voiceovers)
  - **Marketing (6 agents - £890/mo)**: Jasper AI (content), Copy.ai (copy), Midjourney (imagery), DALL-E 3 (graphics), Perplexity (research), Runway (video)
  - **Ops (3 agents - £1,050/mo)**: Hebbia AI (document analysis), Zapier AI (automation), Harvey AI (legal)
  - **Engineering (4 agents - £270/mo)**: GitHub Copilot, Cursor AI, Replit Ghostwriter, Tabnine
  - **Admin (4 agents - £895/mo)**: ChatGPT Enterprise, Notion AI, Otter.ai (transcription), Grammarly
  - **Design & Manufacturing (6 agents - £1,580/mo)**: Autodesk Fusion AI (generative CAD design), Monolith AI (FEA simulation), Diagram AI (PCB design), Manufacturing GPT (DFM optimization), Spline AI (3D visualization), Quality AI Inspector (quality control)
  - **Function-Based Filtering**: Filter by Finance, Sales, Marketing, Ops, Engineering, Admin, or Design & Manufacturing
  - **Visual Organization**: Agents grouped by function with emoji icons (💰📈📣⚙️💻📋🏭) and color coding
  - **Agent Count Badges**: See how many agents available per function at a glance
  - **Team Member Usage Tracking**: See which team members (Founders, Executives, Apprentices) use each AI agent
  - **Website Links**: Direct access to each AI agent's official website for more information
  - **Workflow-Oriented**: "Need marketing? Select Marketing execs, apprentices, and AI agents together"
  - **Detailed Agent Profiles**: View capabilities, integrations, usage stats, and costs per agent
  - **Onboarding Flow**: Add new AI agents with custom monthly cost tracking
  - **Search & Filter**: Find agents by name, purpose, or capability across all functions
  - **Modal Views Fixed**: Tappable AI agent and supplier cards now display full details in properly positioned bottom-sheet modals
- **OKR Management** - Create, edit, and delete objectives with real-time progress tracking
  - **Full Objective Management (Founder-Only)**:
    - Create new objectives with title, description, and date ranges
    - Edit existing objectives by tapping the blue edit icon on each objective card
    - Delete objectives with confirmation (also removes all associated key results)
  - **Interactive Objective Cards**: Each objective displays edit and delete buttons for easy management
  - **Custom Date Ranges**: Set specific start and end dates for objectives (defaults to today and 90 days if not specified)
  - **Target Numbers**: Add numeric targets or metrics to objectives (e.g., "100 units", "£50k revenue") for reference tracking
  - **Key Result Updates**: Tap any key result to update its current value
  - **Health Status Indicators**: Visual indicators showing objective health (On Track, At Risk, Mixed)
  - **Link Tasks to Objectives**: Connect work directly to strategic goals when creating tasks
  - **Visual Task Integration**: See related tasks directly on objective cards with completion metrics
  - **Bidirectional Navigation**: Jump between tasks and objectives seamlessly
  - **Progress Tracking**: Task completion counts displayed on each objective (e.g., "5/12 tasks completed")
  - **Quick Access**: "View All" link to see all tasks for a specific objective in Work Hub
  - **Export to CSV**: Download all OKRs and key results for reporting
- **Work Hub** - All work subordinated to strategic objectives
  - **Comprehensive Task Editing**: Tap any task to edit all properties in one place
    - Title and Description
    - Status (To Do, In Progress, In Review, Done)
    - Priority (Low, Medium, High, Urgent)
    - Function (Finance, Sales, Marketing, Ops, Engineering, Admin)
    - Assignee selection (Executives and Apprentices displayed separately)
    - Link to Objective (with visual feedback if not linked)
    - Due Date
  - **Strategic Alignment Enforcement**: Prominent reminders that all work should support objectives
  - **Unlinked Task Warnings**: Alert banner showing tasks not linked to objectives with count
  - **Filter by Objective**: View tasks for specific objectives or see all unlinked tasks
  - **Objective-First Workflow**: Encouraged to create objectives before adding tasks
  - **Prominent Objective Badges**: Large, color-coded badges on each task showing linked objective
  - **Warning Badges**: Amber alert badges on tasks not linked to any objective
  - **Task Creation Guidance**: Blue notice in create modal reminding users to link to objectives
  - **Link to Objectives**: Recommended field in task creation with visual objective selector
  - **Task Assignment**: Assign tasks to workspace members (uses real user IDs from database)
  - **Task Reassignment**: Easily reassign existing tasks to different team members
  - **Status Management**: Update task status (todo, in_progress, in_review, done)
  - **Filter by Status**: Filter tasks by status to focus on what matters
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
  - **Financial Metrics in Board Pack**: Complete financial overview including revenue, costs, burn rate, and cash position
  - **Financial CSV Export**: Detailed financial data in CSV format with revenue breakdown, team headcount, and cost structure
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
  - **Interactive Map Visualization**: See event locations on interactive maps with markers
  - **Team Member Invitations**: Select and invite specific team members when creating events
  - **Invited Member Tracking**: View who was invited and who has joined in event details
  - **Address Geocoding Support**: Event locations stored with coordinates for map display
  - **Event Types**: Networking, Workshop, Demo Day, Office Hours, Social, and Webinar events
  - **Location Flexibility**: Support for in-person (with maps), virtual, and hybrid events
  - **RSVP Management**: Join or leave events with real-time attendee tracking
- **Weekly Pack Generator** - One-click generation of status reports with OKR progress
- **Templates Library** - Pre-built task templates by function (Finance, Sales, Marketing, Ops, Engineering)
- **Global Search** - Search across all data types from anywhere in the app
  - **One-Click Access**: Search button on home screen for instant access
  - **Search Everything**: Tasks, OKRs, Team Members, Suppliers, AI Agents in one place
  - **Live Results**: Real-time filtering as you type
  - **Categorized Results**: Results grouped by type (Tasks, OKRs, People, etc.)
  - **Result Counts**: Shows how many results found in each category
  - **Quick Navigation**: Tap any result to jump to the relevant screen
  - **Smart Filtering**: Searches across names, descriptions, emails, and more
  - **Top 5 per Category**: Shows most relevant 5 results per data type
- **Learning & Onboarding (Founder/Exec-Only)** - Track apprentice growth and development
  - **Skills Matrix**: Track proficiency levels across technical, soft, and domain skills
  - **Skill Levels**: Beginner, Intermediate, Advanced, Expert with progress tracking (0-100%)
  - **Skill Categories**: Technical (CAD, Python, etc.), Soft Skills (Communication, PM), Domain Knowledge (Hardware Design)
  - **Training Modules**: Assign and track completion of courses and certifications
  - **Training Categories**: Design, Engineering, Management courses
  - **Course Links**: Direct links to learning platforms (Autodesk, Python.org, etc.)
  - **Performance Reviews**: Quarterly reviews with 5-category ratings (Quality, Speed, Communication, Initiative, Learning)
  - **Review Components**: Strengths, Areas for Growth, Next Quarter Goals, Reviewer Notes
  - **Star Ratings**: 1-5 star ratings per category with overall average
  - **Progress Tracking**: Tasks completed, average rating, join date
  - **Career Development**: Visual skill progression and growth paths
  - **Multi-View Interface**: Toggle between Skills, Training, and Reviews
  - **Accessible from Team Tab**: Green "Learning" button for Founders and Executives
- **Data Management (Founder-Only)** - Bulk import and export with Google Sheets integration
  - **Google Sheets Sync**: Two-way synchronization with Google Sheets for automatic data updates
  - **CSV Import/Export**: Import and export all data types as CSV files
  - **Supported Data Types**: Tasks, OKRs, Team Members, Suppliers, AI Agents, Financial Data
  - **Template Downloads**: Download CSV templates with correct format for each data type
  - **Bulk Operations**: Import hundreds of records at once instead of manual entry
  - **Excel Compatible**: Works with Microsoft Excel, Google Sheets, and any CSV editor
  - **Automatic Sync**: Google Sheets sync runs automatically every hour
  - **Format Guidance**: Built-in tips for date formats, required fields, and data validation
  - **Update Existing Data**: Use IDs to update existing records during import
- **Dark/Light Mode** - Full theme support with system preference option
- **About Section** - Comprehensive in-app documentation explaining Centaur OS features
  - **What is Centaur OS**: Overview of the operating system for lean hardware startups
  - **Key Features Guide**: Detailed explanations of all 9 major features (Dashboard, OKRs, Work Hub, Team Directory, AI Agents, Supplier Management, Network, Financial Dashboard, Reports)
  - **Organizational Philosophy**: Decide • Evaluate • Do framework with role descriptions
  - **Version Information**: Current app version and technical stack details
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
  ├── okrs                  # Objectives & Key Results (now with custom dates and targets)
  ├── work                  # Work Hub (projects + tasks)
  ├── reviews               # Review Queue
  ├── copilot               # AI Copilot chat
  ├── network               # Network (Suppliers, Companies, Events)
  ├── organization          # Organization (Org Chart, AI Agents, Suppliers)
  └── settings              # Settings, About section, logout
```

### Home Dashboard Views

**Founder View:**
- **Interactive Header**
  - Tap search icon → Open global search
  - Tap role badge → Navigate to Settings/Profile
- **Tappable KPI Tiles** (Active Objectives, Completed Tasks, In Progress, Pending Reviews)
  - Tap "Active Objectives" → Navigate to OKRs tab
  - Tap "Completed This Week" → View detailed list of all tasks completed in the last 7 days
  - Tap "In Progress" → View all currently active tasks with full details
  - Tap "Pending Reviews" → Navigate to Reviews tab
- **Interactive Financial Dashboard**
  - Tap "Planning" button → Open scenario planning modal
  - Tap "Budget" button → Open budget targets modal
  - Tap any key metric card (Revenue, Profit, Burn, Runway) → View detailed breakdown
  - Tap any cost breakdown card (COGS, Team, AI Services, Other) → View detailed breakdown
  - Tap "Net Profit/Loss" card → View profit calculation details
- **Interactive Key Results**
  - Tap any Key Result card → Navigate to OKRs tab
  - View progress, health status, and completion percentage
- **Interactive Reports Section**
  - All report cards are clickable and navigate to report views
- **Interactive Quick Actions**
  - All quick action buttons navigate to their respective screens
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
