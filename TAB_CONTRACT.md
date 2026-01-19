# TAB CONTRACT - CentaurOS 7-Tab Structure

## Overview

CentaurOS uses exactly **7 top-level tabs**. This document defines the purpose, ownership, and boundaries of each tab.

**Last Updated**: 2026-01-19

---

## Tab Structure

| # | Tab | Purpose | Owner |
|---|-----|---------|-------|
| 1 | **Home** | Snapshots + entry points | Mission Control |
| 2 | **People** | Team roster, capacity, hiring | People Ops |
| 3 | **Tasks** | Task creation, editing, status, **DRAFTS** | Task Management |
| 4 | **When** | Timeline, capacity view | Scheduling |
| 5 | **Resources** | Current AI tools, suppliers | Operations |
| 6 | **Marketplace** | Discovery only | Discovery |
| 7 | **Settings** | Config, integrations | System |

---

## DRAFTS vs TASKS (CRITICAL)

### What are Drafts?

Drafts are **separate entities** from real tasks. They represent unconfirmed work items that must be explicitly confirmed before becoming tasks.

| Property | Drafts | Tasks |
|----------|--------|-------|
| Store | `useDraftStore` | `useWorkPlanStore` |
| Status | Always `pending_confirmation` | `not-started`, `in-progress`, `blocked`, `completed` |
| Shown in When tab | **NO** | YES |
| Included in metrics | **NO** | YES |
| Can be scheduled | **NO** | YES |
| Location | Tasks tab → Drafts section | Tasks tab → Status groups |

### Draft Sources

| Source | Description | Example |
|--------|-------------|---------|
| `ai_extraction` | Voice or text input processed by AI | "Create a landing page" via voice |
| `marketplace` | Actions from Marketplace discovery | "Contact Fractional CFO" button |
| `import` | External imports | CSV import, API sync |
| `manual` | Manually created drafts | Quick add without AI |

### Draft Lifecycle

```
1. Creation
   - Marketplace: User clicks action → Draft created in Draft store
   - AI Extraction: User speaks/types → AI extracts → Drafts created

2. Review
   - Drafts appear in Tasks tab → Drafts section (top)
   - User can edit title, description, units
   - User can delete unwanted drafts

3. Confirmation
   - User selects drafts to confirm
   - Clicks "Confirm" button
   - Drafts removed from Draft store
   - Real tasks created in WorkPlan store

4. Task Lifecycle
   - Task appears in status groups (Queued/Doing/Blocked/Done)
   - Can be allocated, scheduled, tracked
   - Appears in When tab and metrics
```

---

## Tab Boundaries (ANTI-BLOAT)

### 1. Home
**DO:**
- Show summary dashboards and KPIs
- Provide entry points to other tabs
- Display urgent decisions
- Link to Plan/Strategy (via Quick Access)
- Link to Analytics (via Quick Access)

**DON'T:**
- Allow deep editing
- Duplicate task lists
- Show full team management UI

### 2. People
**DO:**
- Show team roster (Founder/Exec/Apprentice)
- Display capacity per person
- Track hiring pipeline (Identified → Contacted → Intro → Trial → Engaged)
- Link to Tasks for "view tasks for [person]"
- Link to When for "view schedule for [person]"

**DON'T:**
- Allow task editing (link to Tasks instead)
- Duplicate timeline views

### 3. Tasks
**DO:**
- **Show Drafts section at top** (from unified Draft store)
- Allow draft confirmation (converts to real tasks)
- Create and edit tasks
- Show status groups: Doing / Queued / Blocked / Done
- Accept voice and text input for task drafts

**DON'T:**
- Show timeline/Gantt (belongs to When)
- Duplicate people management
- Auto-create tasks without confirmation

### 4. When
**DO:**
- Show week view grid (rows=people, cols=Mon–Sun)
- Display allocated tasks/capacity blocks
- Link to task details in Tasks
- **ONLY show confirmed real tasks** (not drafts)

**DON'T:**
- Allow task editing (link to Tasks)
- Duplicate task lists
- Show full team management
- **Show drafts** (drafts are not scheduled)

### 5. Resources
**DO:**
- Show AI tools currently configured
- Show active supplier engagements
- Display spend summaries

**DON'T:**
- Allow discovery browsing (moved to Marketplace)
- Duplicate marketplace functionality

### 6. Marketplace
**DO:**
- Enable discovery of people, suppliers, tools, advisors
- **Create drafts ONLY** (never real tasks)
- Search and filter capabilities

**DON'T:**
- Auto-execute any actions
- Create confirmed tasks automatically
- Duplicate current resource views
- Use WorkPlan store directly

### 7. Settings
**DO:**
- Handle configuration and preferences
- Manage integrations
- Import/export functionality

**DON'T:**
- Duplicate core functionality from other tabs

---

## Status Vocabulary

Use consistent status terminology across all tabs:

| Status | Label | Color | Description |
|--------|-------|-------|-------------|
| `in-progress` | Doing | Blue (#3b82f6) | Actively being worked on |
| `not-started` | Queued | Gray (#64748b) | Ready to start |
| `blocked` | Blocked | Red (#ef4444) | Cannot proceed |
| `completed` | Done | Green (#10b981) | Finished |

---

## Legacy Routes (Backward Compatibility)

These routes are hidden from the tab bar and **auto-redirect** to new locations:

| Old Route | Redirects To | Implementation | Deprecation |
|-----------|--------------|----------------|-------------|
| /who | /people | Auto-redirect on mount | 4 weeks |
| /what | /tasks | Auto-redirect on mount | 4 weeks |
| /why | Home → Plan | Quick Access button | 4 weeks |
| /tools | /resources | Auto-redirect on mount | 4 weeks |
| /performance | Home → Analytics | Quick Access button | 4 weeks |
| /decide | /tasks | Hidden tab | 4 weeks |
| /do | /tasks | Hidden tab | 4 weeks |
| /make | /resources | Hidden tab | 4 weeks |
| /community | /marketplace | Hidden tab | 4 weeks |

---

## Non-Negotiable Rules

1. **Never expose API keys client-side**
2. **Never create tasks without explicit confirmation** (drafts only)
3. **Avoid modals** - if unavoidable, modal body must scroll and CTA must remain visible
4. **Timezone default**: Europe/London
5. **Keep backward compatibility** - old routes must keep working via redirects

---

## Version History

| Date | Version | Changes |
|------|---------|---------|
| 2026-01-19 | 2.0 | Added Draft store, unified draft pipeline, real redirects |
| 2024-01-19 | 1.0 | Initial 7-tab structure |
