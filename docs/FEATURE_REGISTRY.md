# Feature Registry

Complete inventory of features in CursorOS with status, location, and dependencies.

## Legend
- **Status**: Live | Beta | Stub | Coming Soon
- **Location**: Tab where feature is accessed
- **Depends On**: Required integrations/stores

---

## Task Management

| Feature | Status | Location | Description | Depends On |
|---------|--------|----------|-------------|------------|
| Manual Task Creation | Live | WHAT | Create tasks via form | work-plan store |
| Voice Task Capture | Live | WHAT | Record voice → extract tasks | Whisper API, GPT |
| Text Task Extraction | Live | WHAT | Text → AI-extracted tasks | GPT API |
| Task Status Lifecycle | Live | WHAT | not-started → completed flow | work-plan store |
| Task Allocation | Live | WHAT | Assign tasks to team members | organization store |
| Task Templates | Live | WHAT | Function-based task templates | work-plan store |
| Gantt Chart | Live | WHAT | Timeline visualization | work-plan store |
| Task Draft Review | Live | WHAT | Review AI-extracted drafts | GPT API |
| Linked Tasks | Live | WHAT | Link tasks to OKRs | okr store |

---

## Strategic Planning

| Feature | Status | Location | Description | Depends On |
|---------|--------|----------|-------------|------------|
| Company Aim | Live | WHY | Mission statement | company-aim store |
| OKR Creation | Live | WHY | Create objectives | okr store |
| OKR Key Results | Live | WHY | Track key results | okr store |
| OKR Status Tracking | Live | WHY | on-track/at-risk/off-track | okr store |
| Strategic Health Dashboard | Live | WHY | Metrics overview | Multiple stores |
| Brainstorm Sessions | Live | WHY | AI-assisted brainstorming | Gemini/GPT API |
| Objective Synthesis | Live | WHY | Convert brainstorm → OKRs | Gemini API |
| Business Improvements | Beta | WHY | AI-generated suggestions | GPT API |
| Founder Onboarding | Live | WHY | 7-module, 21-step checklist | onboarding store |
| UK Startup Pack | Live | WHY | Company registration guide | Static content |

---

## People Management

| Feature | Status | Location | Description | Depends On |
|---------|--------|----------|-------------|------------|
| Team List | Live | WHO | View all team members | organization store |
| Add Member | Live | WHO | Add founder/exec/apprentice | organization store |
| Role Assignment | Live | WHO | Assign roles to members | organization store |
| Squad Organization | Beta | WHO | Group members into squads | squad store |
| People Seeding | Live | WHO | Seed demo/example people | seeding data |
| People Sourcing | Live | WHO | Source from marketplace | marketplace-requests |
| Invitation Flow | Live | WHO | Invite via email | invitation store |
| Capacity Display | Live | WHO | Show TU capacity | organization store |

---

## Supplier Management

| Feature | Status | Location | Description | Depends On |
|---------|--------|----------|-------------|------------|
| Supplier List | Live | TOOLS | Active engagements | supplier store |
| Add Engagement | Live | TOOLS | Create supplier engagement | supplier store |
| Cost Tracking | Live | TOOLS | Paid vs total cost | supplier store |
| Delivery Tracking | Live | TOOLS | Track delivery dates | supplier store |
| Contact Management | Live | TOOLS | Phone/email/SMS | supplier store |
| Linked Work Plans | Live | TOOLS | Link to tasks | work-plan store |
| Marketplace Browse | Live | TOOLS | Browse suppliers | marketplace data |

---

## AI & Automation

| Feature | Status | Location | Description | Depends On |
|---------|--------|----------|-------------|------------|
| AI Tool Marketplace | Live | TOOLS | Browse AI tools | marketplace data |
| Equipment Slots | Beta | TOOLS | 5 slots for AI tools | armory store |
| Efficiency Multipliers | Beta | TOOLS | 2x-20x productivity | armory store |
| Orchestration Agent | Stub | TOOLS | Auto task routing | Not implemented |
| RFQ Processing Agent | Stub | TOOLS | Auto quote requests | Not implemented |
| Quote Normalization | Stub | TOOLS | Standardize quotes | Not implemented |

---

## Analytics & Performance

| Feature | Status | Location | Description | Depends On |
|---------|--------|----------|-------------|------------|
| Team Utilization | Live | PERFORMANCE | TU utilization metrics | organization, work-plan |
| Task Velocity | Live | PERFORMANCE | Tasks completed/week | work-plan store |
| Financial Dashboard | Live | PERFORMANCE | P&L, runway, ratios | finance store |
| Individual Performance | Live | PERFORMANCE | Per-member metrics | organization, work-plan |
| Cash Runway | Live | PERFORMANCE | Months until depletion | finance store |
| Burn Multiple | Live | PERFORMANCE | Efficiency ratio | finance store |
| CAC/LTV | Live | PERFORMANCE | Customer metrics | finance store |

---

## Settings & Configuration

| Feature | Status | Location | Description | Depends On |
|---------|--------|----------|-------------|------------|
| Theme Switching | Live | SETTINGS | Dark/Light/Off-White | theme store |
| Setup Checklist | Live | SETTINGS | Onboarding steps | Multiple stores |
| Data Export | Live | SETTINGS | CSV export | All stores |
| Data Import | Beta | SETTINGS | CSV import | All stores |
| Google Sheets Sync | Stub | SETTINGS | Sync to Sheets | Not implemented |
| Company Reset | Live | SETTINGS | Clear all data | All stores |
| Role Visibility | Live | SETTINGS | Role-based access | app store |

---

## Hidden/Transitional Features

| Feature | Status | Location | Description | Depends On |
|---------|--------|----------|-------------|------------|
| Decide Tab | Beta | DECIDE | Resource allocation | Multiple stores |
| Do Tab | Beta | DO | Apprentice execution | work-plan store |
| Evaluate Tab | Beta | EVALUATE | OKR evaluation | okr store |
| Make Tab | Beta | MAKE | Supplier workflows | supplier store |
| Community Tab | Beta | COMMUNITY | Marketplace access | marketplace data |

---

## Offline Features

| Feature | Status | Location | Description | Depends On |
|---------|--------|----------|-------------|------------|
| Offline Storage | Live | Global | AsyncStorage collections | offline/storage |
| AI Job Queue | Live | Global | Outbox for AI operations | offline/outbox |
| Network Detection | Live | Global | Online/offline status | offline/network |
| Auto Sync | Live | Global | Sync when online | offline/sync |
| Offline Banner | Live | Global | Status indicator | OfflineBanner component |

---

## Integration Status

| Integration | Status | Used By |
|-------------|--------|---------|
| Supabase | Live | All tabs (via stores) |
| OpenAI GPT | Live | WHAT (extraction), WHY (brainstorm) |
| OpenAI Whisper | Live | WHAT (voice transcription) |
| Google Speech | Live | WHAT (voice fallback) |
| Google Gemini | Live | WHY (brainstorm, synthesis) |
| Anthropic Claude | Stub | Not yet used |
| NetInfo | Live | Offline features |
| AsyncStorage | Live | Offline storage |

---

## Feature Addition Checklist

Before adding a new feature:
1. [ ] Check if similar feature exists in registry
2. [ ] Identify owner tab (see TAB_CONTRACT.md)
3. [ ] Document status (Live/Beta/Stub)
4. [ ] List dependencies
5. [ ] Add to this registry
6. [ ] Update relevant store if needed
7. [ ] Update SYSTEM_OBJECTS.md if new object type
