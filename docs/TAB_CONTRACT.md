# Tab Contract

Defines the purpose, responsibilities, and boundaries of each tab in CursorOS.

## Visible Tabs

### 1. Home (index.tsx)
**Purpose**: Executive command center - the founder's dashboard

**Owns**:
- Urgent Decisions widget
- Business Objectives overview
- Current & Upcoming Activities
- Team Capacity Dashboard
- Performance Dashboard Grid
- Supplier & Spend Overview
- Quick Access Tools (Functions Hub, Progress Tree, Startup Pack)

**Can**:
- Display summaries from all other domains
- Navigate to any feature via quick access
- Show role-specific views (Founder/Exec/Apprentice)

**Cannot**:
- Create or modify tasks (→ WHAT)
- Create or modify OKRs (→ WHY)
- Manage people (→ WHO)
- Manage suppliers (→ TOOLS)

**Entry Points To**:
- Founder Onboarding (→ WHY)
- Task details (→ WHAT)
- OKR details (→ WHY)
- Settings

---

### 2. Who (who.tsx)
**Purpose**: People management - recruit, manage, and organize team

**Owns**:
- Team member list (Founder, Exec, Apprentice)
- People Seeding & Sourcing System
- Squad organization
- Role assignments
- Invitation flows

**Can**:
- Add/remove team members
- Assign roles and functions
- Manage capacity allocation
- Access People Marketplace

**Cannot**:
- Assign tasks directly (→ WHAT)
- Create OKRs (→ WHY)
- Manage suppliers (→ TOOLS)

**Entry Points To**:
- Marketplace (People section)
- Task allocation (→ WHAT)

---

### 3. What (what.tsx)
**Purpose**: Task execution - plan, allocate, and track work

**Owns**:
- Task creation and management
- Task status lifecycle
- Gantt chart visualization
- Resource pool display
- Voice/text task capture
- Task draft extraction and review

**Can**:
- Create, edit, delete tasks
- Allocate tasks to team members
- Link tasks to OKRs
- Capture voice transcripts
- Extract tasks from text via AI

**Cannot**:
- Create OKRs (→ WHY)
- Add team members (→ WHO)
- Manage suppliers (→ TOOLS)

**Entry Points From**:
- Home (Activity widgets)
- WHY (linked OKR tasks)

---

### 4. Why (why.tsx)
**Purpose**: Strategic planning - define mission, objectives, and strategy

**Owns**:
- Company Aim (mission statement)
- OKRs (Objectives & Key Results)
- Business Improvements
- Strategic Health Dashboard
- Brainstorming sessions
- Founder Onboarding Checklist
- UK Startup Pack

**Can**:
- Create, edit, delete OKRs
- Set and update mission
- Run brainstorm sessions
- Synthesize objectives from conversations
- Track strategic health metrics
- Execute onboarding steps

**Cannot**:
- Create tasks directly (tasks generated from OKRs go to WHAT)
- Add team members (→ WHO)
- Manage suppliers (→ TOOLS)

**Entry Points From**:
- Home (Objectives widget)
- WHAT (OKR linkage)

---

### 5. Tools (tools.tsx)
**Purpose**: External resources - manage suppliers, AI tools, and advisors

**Owns**:
- Supplier engagements
- AI Agent/Tool management
- Equipment slots (Think, Create, Verify, Execute, Ops)
- Marketplace browsing (Suppliers, AI Tools, Advisors)

**Can**:
- Add/remove supplier engagements
- Configure AI tools
- Track supplier costs and delivery
- Browse and request marketplace items

**Cannot**:
- Create tasks (→ WHAT)
- Add team members directly (→ WHO)
- Create OKRs (→ WHY)

**Entry Points From**:
- Home (Supplier Overview)
- WHAT (supplier linkage on tasks)

---

### 6. Performance (performance.tsx)
**Purpose**: Analytics - measure productivity and financial health

**Owns**:
- Team utilization metrics
- Task velocity reports
- Financial dashboard (P&L, runway, ratios)
- Individual performance tracking

**Can**:
- Display all metrics (read-only)
- Generate reports
- Show trends and forecasts

**Cannot**:
- Modify any data (read-only tab)
- Create tasks, OKRs, or people

**Entry Points From**:
- Home (Performance Grid)

---

### 7. Settings (settings.tsx)
**Purpose**: Configuration - manage preferences and data

**Owns**:
- Theme switching
- Setup checklist
- Data import/export
- Google Sheets sync
- Company data reset

**Can**:
- Change user preferences
- Export/import data
- Reset data
- Configure integrations

**Cannot**:
- Create business objects (tasks, OKRs, etc.)

**Entry Points From**:
- All tabs via header

---

## Hidden Tabs (Accessible via Navigation)

### decide
**Purpose**: Resource allocation and strategic decision-making
**Access**: From Home, Settings checklist
**Note**: May be merged into WHAT in future

### do
**Purpose**: Apprentice-specific task execution
**Access**: Apprentice role only
**Note**: Role-based variant of WHAT

### evaluate
**Purpose**: OKR evaluation and refinement
**Access**: From Settings checklist
**Note**: May be merged into WHY in future

### make
**Purpose**: Supplier engagement management
**Access**: From TOOLS
**Note**: May be merged into TOOLS in future

### community
**Purpose**: Marketplace and invitations
**Access**: From WHO, TOOLS
**Note**: Cross-tab marketplace access

---

## Anti-Bloat Rules

1. **Single Responsibility**: Each tab owns specific domain objects
2. **No Duplication**: Features exist in exactly one tab
3. **Clear Boundaries**: Tabs don't create objects owned by other tabs
4. **Navigation Over Embedding**: Link to features, don't embed them
5. **Read vs Write**: Performance is read-only; others can modify

## Feature Request Checklist

Before adding a feature, answer:
1. Which tab owns this domain? → Add there
2. Does it cross domains? → Add to owner, link from others
3. Is it truly new? → Create new hidden tab if needed
4. Does it modify existing contract? → Update this document
