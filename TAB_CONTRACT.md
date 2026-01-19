# TAB CONTRACT - CentaurOS 7-Tab Structure

## Overview

CentaurOS uses exactly **7 top-level tabs**. This document defines the purpose, ownership, and boundaries of each tab.

---

## Tab Structure

| # | Tab | Purpose | Owner |
|---|-----|---------|-------|
| 1 | **Home** | Snapshots + entry points | Mission Control |
| 2 | **People** | Team roster, capacity, hiring | People Ops |
| 3 | **Tasks** | Task creation, editing, status | Task Management |
| 4 | **When** | Timeline, capacity view | Scheduling |
| 5 | **Resources** | Current AI tools, suppliers | Operations |
| 6 | **Marketplace** | Discovery only | Discovery |
| 7 | **Settings** | Config, integrations | System |

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
- Create and edit tasks
- Show status groups: Doing / Queued / Blocked / Done
- Accept voice and text input for task drafts
- Confirm task drafts before creation

**DON'T:**
- Show timeline/Gantt (belongs to When)
- Duplicate people management
- Auto-create tasks without confirmation

### 4. When
**DO:**
- Show week view grid (rows=people, cols=Mon–Sun)
- Display allocated tasks/capacity blocks
- Link to task details in Tasks

**DON'T:**
- Allow task editing (link to Tasks)
- Duplicate task lists
- Show full team management

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
- Create task drafts for outreach actions
- Search and filter capabilities

**DON'T:**
- Auto-execute any actions
- Create confirmed tasks automatically
- Duplicate current resource views

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

These routes are hidden from the tab bar but still accessible for backward compatibility:

| Old Route | Redirects To | Notes |
|-----------|--------------|-------|
| /who | /people | Hidden tab |
| /what | /tasks | Hidden tab |
| /why | Home → Plan | Quick Access button |
| /tools | /resources | Hidden tab |
| /performance | Home → Analytics | Quick Access button |
| /decide | /tasks | Hidden tab |
| /do | /tasks | Hidden tab |
| /make | /resources | Hidden tab |
| /community | /marketplace | Hidden tab |

---

## Non-Negotiable Rules

1. **Never expose API keys client-side**
2. **Never create tasks without explicit confirmation** (drafts only)
3. **Avoid modals** - if unavoidable, modal body must scroll and CTA must remain visible
4. **Timezone default**: Europe/London
5. **Keep backward compatibility** - old routes must keep working

---

## Version History

| Date | Version | Changes |
|------|---------|---------|
| 2024-01-19 | 1.0 | Initial 7-tab structure |
