# CentaurOS Technical Analysis
**For AI Systems: Complete Application Understanding & Improvement Recommendations**

*Last Updated: January 19, 2026*

---

## SECTION 1: EXECUTIVE OVERVIEW

### 1.1 What is CentaurOS?

CentaurOS is a mobile-first operating system for lean companies that enables small teams (2-5 people) to achieve the output of traditionally-sized teams (15-20 people). The name comes from the "Centaur" concept in chess—human + AI working together to beat either humans or AI alone.

**Core Philosophy**: A lean company isn't about doing less—it's about orchestrating maximum output with minimum fixed costs through:
1. Strategic human roles (Founders, Fractional Executives, Apprentices)
2. Per-person AI tool augmentation (5 slots per person)
3. Supply chain orchestration (don't own factories, orchestrate suppliers)
4. Standardized work measurement (Time Units = 4 hours of focused work)

**Target Value Proposition**: Build a £10M company with £95K/year team cost instead of £500K+ (81% savings).

### 1.2 Technology Stack

| Layer | Technology |
|-------|------------|
| Platform | React Native 0.76.7 + Expo SDK 53 |
| Routing | Expo Router (file-based) |
| State Management | Zustand (local) + React Query (server) |
| Styling | NativeWind (TailwindCSS for RN) |
| Animations | react-native-reanimated v3 |
| Backend | Supabase (PostgreSQL + Auth + Realtime) |
| Storage | MMKV (local), AsyncStorage (legacy) |
| AI APIs | OpenAI (GPT-4o-mini), Google (Speech-to-Text), Whisper |

### 1.3 Current State Summary

| Aspect | Status | Notes |
|--------|--------|-------|
| Core Features | ✅ Implemented | Tasks, People, Timeline, Settings |
| AI Integration | ✅ Basic | Voice transcription, task extraction |
| Cost Protection | ✅ Implemented | Rate limiting, budget controls, circuit breaker |
| Multi-tenancy | ✅ Implemented | Workspace-based isolation |
| Onboarding | ✅ Implemented | Role-specific tutorials |
| Marketplace | 🔶 Partial | UI exists, no real transactions |
| Payments | ❌ Not Connected | RevenueCat integration pending |
| Analytics | 🔶 Partial | Basic dashboards, no real data pipeline |

---

## SECTION 2: DATA MODEL ARCHITECTURE

### 2.1 Core Entities

#### OrganizationMember
```typescript
interface OrganizationMember {
  id: string;
  workspaceId: string;           // Multi-tenancy key
  userId?: string;               // Link to auth user (optional)
  name: string;
  role: 'Founder' | 'CoFounder' | 'FractionalExec' | 'Apprentice';
  function: string;              // Marketing, Sales, Engineering, etc.
  reportsTo?: string;            // Hierarchy
  email: string;
  costPerDay?: number;           // £/day rate
  daysPerWeek?: number;          // 1-5 for fractional
  status: 'active' | 'inactive';

  // Performance Modifiers
  teamLeadershipMultiplier?: number;   // 0.8-1.2
  collaborationMultiplier?: number;    // 0.9-1.15
  aiProficiencyMultiplier?: number;    // 0.7-1.5

  // AI Equipment
  aiReadiness?: AIReadiness;           // Assessed comfort level
  aiLoadout?: PersonLoadout;           // 5 equipped tool slots
  skills?: Skill[];                    // Affects task speed
}
```

#### WorkPlan (Task)
```typescript
interface WorkPlan {
  id: string;
  workspaceId: string;           // Multi-tenancy key
  title: string;
  description: string;
  function: BusinessFunction;
  startDate: string;
  dueDate: string;
  status: 'not-started' | 'in-progress' | 'completed' | 'blocked' | 'abandoned';
  progress: number;              // 0-100%

  // TU Allocation System
  estimatedTimeUnits: number;    // Total TUs for task
  allocations: TUAllocation[];   // Per-person contributions
  appliedAITools: AppliedAITool[];
  tusExpended: number;           // TUs spent so far

  // Timeline Tracking
  originalDueDate?: string;      // For delay detection
  timelineExtensions?: TimelineExtension[];

  // Privacy/Access
  visibility: TaskVisibility;
  restrictedCategory?: RestrictedCategory;
}
```

#### TUAllocation (Per-Person Task Contribution)
```typescript
interface TUAllocation {
  memberId: string;
  memberName: string;
  squaresPerWeek: number;        // TUs this person contributes
  costPerSquare: number;         // £ per TU
}
```

### 2.2 Role Capacities

| Role | Normal TU/Week | Overtime TU/Week | Cost/TU |
|------|----------------|------------------|---------|
| Founder | 10 | +5 | £960 |
| Fractional Exec | 2/day × days | +2/day | £400-475 |
| Apprentice | 10 | +5 | £70 |

**TU Definition**: 1 TU = 4 hours of focused work

### 2.3 AI Tools System (5 Slots Per Person)

```typescript
type AIToolSlot = 'Think' | 'Create' | 'Verify' | 'Execute' | 'Ops';

interface AITool {
  id: string;
  name: string;
  slot: AIToolSlot;
  multiplier: number;            // 2x, 5x, 10x, 20x
  costPerTU: number;             // Additional AI cost
  constraints: string[];         // Usage restrictions
}

interface PersonLoadout {
  Think?: AITool;     // Research, analysis, strategy
  Create?: AITool;    // Content generation, design
  Verify?: AITool;    // QA, testing, validation
  Execute?: AITool;   // Automation, coding
  Ops?: AITool;       // Workflow, project management
}
```

**Effective Output Formula**:
```
Effective TUs = Raw TUs × Speed Multiplier × Quality Multiplier × Flow Multiplier
```

### 2.4 Squad System (Team Collaboration)

```typescript
interface Squad {
  id: string;
  name: string;
  type: 'automatic' | 'manual';  // Auto-formed or explicitly created
  memberIds: string[];
  function?: string;
  taskIds?: string[];
  objectiveIds?: string[];
  color?: string;
}
```

**Automatic Squads**: Form implicitly when 2+ people work on the same task
**Manual Squads**: Created by founders with named functions

---

## SECTION 3: FEATURE INVENTORY

### 3.1 Main Navigation (6 Tabs + Center FAB)

| Tab | Route | Purpose | Implementation Status |
|-----|-------|---------|----------------------|
| Home | `/(tabs)/index` | Mission Control dashboard | ✅ Complete |
| People | `/(tabs)/people` | Team roster, capacity view | ✅ Complete |
| Tasks | `/(tabs)/tasks` | Task management, drafts | ✅ Complete |
| When | `/(tabs)/when` | Timeline/Gantt chart | ✅ Complete |
| Market | `/(tabs)/marketplace` | Service discovery | 🔶 UI Only |
| Settings | `/(tabs)/settings` | Preferences, integrations | ✅ Complete |
| **FAB** | Opens Tasks drawer | Quick task creation | ✅ Complete |

### 3.2 Key Screens & Components

#### Mission Control (Home Tab)
- **Stats Bar**: Active tasks, doing count, blocked count, team load
- **Focus Today**: Priority tasks requiring attention
- **Filing Cabinet Drawers**: Team capacity (left) + Timeline (right)
- **Interactive Stats**: Tap to filter/navigate

#### People Tab
- **Team Roster**: All members with role-colored avatars
- **Capacity Visualization**: TU allocation squares (red=allocated, orange=overtime, green=available)
- **Person Details Modal**: Full profile, skills, workload, squad memberships
- **Collapsible Resource Pool**: Bottom drawer showing team availability

#### Tasks Tab
- **Task List**: Grouped by status (Doing, Queued, Blocked, Done)
- **Draft System**: AI-extracted tasks awaiting confirmation
- **Task Cards**: Show assignees, TU allocation, due dates, progress
- **Bottom Drawer**: Voice/text input for AI task extraction

#### When Tab (Timeline)
- **Gantt Chart**: Visual timeline with task bars
- **View Modes**: Day, Week, Month, Year
- **Delay Tracking**: Visual indicators for overdue tasks
- **Avatar Overlays**: Show assigned team members on task bars
- **Cost Display**: Per-task cost estimates

### 3.3 AI-Powered Features

| Feature | Implementation | API Used |
|---------|----------------|----------|
| Voice-to-Task | ✅ Working | Google Speech-to-Text or Whisper |
| Task Extraction | ✅ Working | OpenAI GPT-4o-mini |
| AI Guardrails | ✅ Working | Custom rate limiting + budgets |
| AI Tool Equipping | 🔶 UI Only | No actual API integration |
| AI Recommendations | ❌ Not Implemented | - |

#### AI Guardrails System (`src/lib/ai-guardrails.ts`)
```typescript
const DEFAULT_GUARDRAILS_CONFIG = {
  maxRequestsPerMinute: 10,
  maxRequestsPerHour: 100,
  maxRequestsPerDay: 500,
  maxTokensPerDay: 100000,
  maxTokensPerMonth: 2000000,
  dailyBudgetCents: 500,       // $5/day
  monthlyBudgetCents: 5000,    // $50/month
  alertThresholdPercent: 80,
  costSpikeFactor: 5,          // Circuit breaker trigger
  circuitBreakerCooldownMinutes: 30,
  maxRequestsPerUserPerDay: 50,
  maxTokensPerUserPerDay: 20000,
};
```

### 3.4 State Management Architecture

| Store | Purpose | Persistence |
|-------|---------|-------------|
| `app-store` | Auth, current user, workspaces | Supabase |
| `organization-store` | Members, AI agents, suppliers | Supabase |
| `work-plan-store` | Tasks, allocations, progress | Supabase |
| `finance-store` | Transactions, budgets, metrics | Supabase |
| `squad-store` | Teams, automatic groupings | MMKV |
| `ui-store` | UI preferences, collapsed states | MMKV |
| `draft-store` | AI-extracted task drafts | MMKV |

---

## SECTION 4: CURRENT LIMITATIONS & GAPS

### 4.1 Critical Gaps

| Gap | Impact | Effort to Fix |
|-----|--------|---------------|
| No real payments | Can't monetize | High (RevenueCat setup) |
| No push notifications | Low engagement | Medium (Expo notifications) |
| No offline mode | Poor UX without internet | High (sync queue) |
| No real marketplace | Fractional exec matching broken | High (backend + matching algo) |
| No analytics pipeline | No business intelligence | Medium (Supabase + visualization) |

### 4.2 UX Issues Identified

| Issue | Location | Severity |
|-------|----------|----------|
| Thumb reach for Voice/Type buttons | UnifiedBottomDrawer | ✅ Fixed |
| Avatar initials inconsistent | Multiple components | ✅ Fixed |
| Capacity squares missing on home | FilingCabinetDrawers | ✅ Fixed |
| Theme colors inconsistent | Various | Medium |
| Long scrolls on mobile | Several modals | Medium |

### 4.3 Technical Debt

1. **Duplicate ROLE_COLORS definitions** - Should be centralized in Avatar.tsx
2. **Mixed storage (MMKV vs AsyncStorage)** - Standardize on MMKV
3. **Large component files** - Some exceed 1000 lines
4. **Missing TypeScript strict null checks** - Optional chaining inconsistent
5. **No error boundaries per route** - Single global boundary

---

## SECTION 5: IMPROVEMENT OPPORTUNITIES

### 5.1 High-Impact, Low-Effort

| Improvement | Effort | Impact | Description |
|-------------|--------|--------|-------------|
| Push notifications | 2 days | High | Remind users of blocked tasks, due dates |
| Haptic feedback | 1 day | Medium | Better tactile response on actions |
| Skeleton loaders | 1 day | Medium | Better perceived performance |
| Pull-to-refresh | 0.5 days | Medium | Standard mobile pattern |
| Keyboard shortcuts | 1 day | Low | For Bluetooth keyboard users |

### 5.2 High-Impact, High-Effort

| Improvement | Effort | Impact | Description |
|-------------|--------|--------|-------------|
| Real marketplace | 2 weeks | Critical | Match founders ↔ execs ↔ apprentices |
| Payment processing | 1 week | Critical | RevenueCat subscriptions + transactions |
| On-device AI | 2 weeks | High | Gemma 3n for offline task extraction |
| Real-time collaboration | 1 week | High | See teammates' live updates |
| Advanced analytics | 2 weeks | High | Efficiency reports, forecasting |

### 5.3 Feature Requests from User Sessions

1. **Circular avatars with initials on Gantt bars** - ✅ Implemented
2. **Capacity squares on home screen** - ✅ Implemented
3. **AI guardrails/cost protection** - ✅ Implemented
4. **Voice/Type buttons closer to thumb** - ✅ Implemented
5. **Google AI Edge integration** - Researched, requires native build

### 5.4 Monetization Recommendations

**Recommended Model**: Tiered SaaS + Transaction Fees

| Tier | Price | Features |
|------|-------|----------|
| Free | £0/mo | 1 workspace, 3 members, 50 AI requests/day |
| Starter | £49/mo | 1 workspace, 10 members, 500 AI requests/day |
| Growth | £149/mo | 3 workspaces, unlimited members, unlimited AI |
| Enterprise | Custom | SSO, API access, white-label, dedicated support |

**Transaction Fees** (Marketplace):
- 10% commission on fractional exec engagements
- 5% commission on apprentice placements
- Optional: 0.5% of TU spend for AI recommendations

---

## SECTION 6: ARCHITECTURE RECOMMENDATIONS

### 6.1 Immediate Priorities

1. **Connect RevenueCat** - Enable monetization
2. **Add push notifications** - Expo Notifications + Supabase triggers
3. **Implement real-time sync** - Supabase Realtime for multi-device
4. **Add error tracking** - Sentry or similar for production debugging

### 6.2 Medium-Term Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    CentaurOS Mobile App                      │
│  (React Native + Expo)                                       │
├─────────────────────────────────────────────────────────────┤
│  Local State (Zustand)    │    Server State (React Query)   │
│  - UI preferences         │    - Tasks, Members             │
│  - Draft cache            │    - Financial data             │
│  - Offline queue          │    - Marketplace                │
├─────────────────────────────────────────────────────────────┤
│                     Supabase Backend                         │
│  ┌─────────┐  ┌──────────┐  ┌──────────┐  ┌─────────────┐  │
│  │ Postgres│  │   Auth   │  │ Realtime │  │   Storage   │  │
│  │   DB    │  │          │  │ Subscr.  │  │   (files)   │  │
│  └─────────┘  └──────────┘  └──────────┘  └─────────────┘  │
├─────────────────────────────────────────────────────────────┤
│                   External Services                          │
│  ┌─────────┐  ┌──────────┐  ┌──────────┐  ┌─────────────┐  │
│  │ OpenAI  │  │  Google  │  │ RevenueCat│  │    Expo     │  │
│  │   API   │  │ Speech   │  │ Payments │  │ Notifications│  │
│  └─────────┘  └──────────┘  └──────────┘  └─────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### 6.3 On-Device AI Opportunity

Using [expo-llm-mediapipe](https://github.com/tirthajyoti-ghosh/expo-llm-mediapipe):

**Benefits**:
- Zero API costs for simple operations
- Works offline
- Faster response times
- Better privacy for sensitive data

**Use Cases**:
- Quick task extraction from voice
- Meeting note summarization
- Smart task suggestions

**Requirements**:
- Development build (not Expo Go)
- 2-4GB model download
- iOS 14+ / Android SDK 24+

---

## SECTION 7: TESTING & VALIDATION

### 7.1 Current Testing Coverage

| Area | Coverage | Notes |
|------|----------|-------|
| Unit Tests | ❌ None | No test files found |
| Integration Tests | ❌ None | - |
| E2E Tests | ❌ None | - |
| Manual QA | ✅ Ongoing | User sessions |

### 7.2 Recommended Testing Strategy

1. **Critical Path Tests** (E2E with Maestro or Detox):
   - Sign up → Create workspace → Add task → Complete task
   - Voice input → AI extraction → Confirm draft
   - Invite member → Assign task → Track progress

2. **Component Tests** (React Native Testing Library):
   - Avatar rendering with various names
   - TU capacity calculations
   - Task status transitions

3. **API Tests** (Jest + MSW):
   - AI guardrails rate limiting
   - Task extraction parsing
   - Supabase data sync

---

## SECTION 8: RED TEAM ANALYSIS

### 8.1 Top 5 Ways This Could Fail

1. **No monetization path executed** - App remains free, burns runway
2. **Marketplace chicken-and-egg** - No execs without founders, no founders without execs
3. **AI costs exceed budget** - Guardrails misconfigured, $1000+ bill
4. **Privacy breach** - Sensitive task data exposed
5. **Performance degradation** - Large workspaces become unusable

### 8.2 Assumptions Made

1. Users want voice-first task creation (validated by user sessions)
2. Fractional executives will pay for platform access (not validated)
3. Apprentices are available and willing to work this way (not validated)
4. 4-hour TU blocks are appropriate for all task types (partially validated)
5. AI tool multipliers are realistic (theoretical, not measured)

### 8.3 Evidence That Would Increase Confidence

- **Cohort retention data** - Do users return after Day 1, Day 7, Day 30?
- **Task completion rates** - Are tasks actually getting done?
- **AI extraction accuracy** - How often do users modify drafts?
- **Time-to-value** - How long until first task created?
- **Revenue per user** - What would users actually pay?

---

## SECTION 9: IMMEDIATE NEXT ACTIONS

### For Product Development
1. [ ] Connect RevenueCat and implement basic subscription flow
2. [ ] Add Expo push notifications for task reminders
3. [ ] Implement real-time sync with Supabase Realtime
4. [ ] Add comprehensive error tracking (Sentry)
5. [ ] Create basic analytics dashboard

### For AI/ML Improvements
1. [ ] Measure AI extraction accuracy (log user edits to drafts)
2. [ ] Evaluate on-device AI (expo-llm-mediapipe) feasibility
3. [ ] Implement smart task suggestions based on history
4. [ ] Add AI-powered workload balancing recommendations

### For Growth
1. [ ] Implement referral system (invite codes)
2. [ ] Build public landing page with signup flow
3. [ ] Create demo mode for prospects
4. [ ] Develop executive/apprentice onboarding funnel

---

## SECTION 10: APPENDICES

### Appendix A: File Structure Overview

```
src/
├── app/                      # Expo Router routes
│   ├── (tabs)/              # Tab navigation screens
│   │   ├── index.tsx        # Home (Mission Control)
│   │   ├── people.tsx       # Team roster
│   │   ├── tasks.tsx        # Task management
│   │   ├── when.tsx         # Timeline/Gantt
│   │   ├── marketplace.tsx  # Service discovery
│   │   └── settings.tsx     # Preferences
│   ├── api/                 # API routes (server-side)
│   │   ├── ai-extract-tasks+api.ts
│   │   ├── transcribe+api.ts
│   │   └── transcribe-whisper+api.ts
│   └── [other screens]      # Modals, onboarding, etc.
├── components/              # Reusable UI components
│   ├── Avatar.tsx           # Role-colored initials
│   ├── MiniGanttChart.tsx   # Timeline visualization
│   ├── FilingCabinetDrawers.tsx  # Home bottom drawers
│   └── [100+ components]
├── lib/                     # Utilities and business logic
│   ├── state/               # Zustand stores
│   ├── ai-guardrails.ts     # AI cost protection
│   ├── ai-tools-system.ts   # Per-person AI equipment
│   └── organization-seed.ts # Data models
└── types/                   # TypeScript definitions
```

### Appendix B: Key Store Files

| Store File | Primary Entity | Lines |
|------------|----------------|-------|
| `organization-store.ts` | OrganizationMember | ~400 |
| `work-plan-store.ts` | WorkPlan (Task) | ~800 |
| `finance-store.ts` | FinancialTransaction | ~300 |
| `app-store.ts` | User, Workspace | ~500 |
| `squad-store.ts` | Squad | ~200 |

### Appendix C: API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/ai-extract-tasks` | POST | Extract tasks from text/voice |
| `/api/transcribe` | POST | Google Speech-to-Text |
| `/api/transcribe-whisper` | POST | OpenAI Whisper transcription |

### Appendix D: Environment Variables Required

```env
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_ANON_KEY=
EXPO_PUBLIC_VIBECODE_OPENAI_API_KEY=
EXPO_PUBLIC_VIBECODE_GOOGLE_API_KEY=
EXPO_PUBLIC_VIBECODE_ANTHROPIC_API_KEY=
EXPO_PUBLIC_VIBECODE_ELEVENLABS_API_KEY=
```

---

**Document Version**: 1.0
**Confidence Level**: 0.85
**Primary Author**: Claude Code (Opus 4.5)
**Review Status**: Pending human review

---

*This document is designed to be consumed by other AI systems for analysis, recommendations, and implementation guidance. All code references are accurate as of the document date.*
