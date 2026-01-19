# Founder Onboarding Checklist - Specification

## Overview

The Founder Onboarding Checklist guides early-stage founders from "nothing" to a functioning company operating cadence. It is stage-aware, interactive, and generates draft tasks requiring explicit confirmation.

## Conceptual Model

```
Program
  └── Modules (7 core modules)
        └── Steps (gated items with evidence requirements)
              └── Inputs/Evidence → Outputs (objectives + task drafts)
```

### Status Flow

```
locked → unlocked → in_progress → completed
                               └→ skipped (with reason)
```

## Core Principles

1. **No tasks without confirmation** - All outputs are DRAFTS requiring explicit user approval
2. **Evidence-gated progression** - Steps cannot complete without evidence OR skip reason
3. **Transcript-first input** - Optimized for voice transcription (paste transcript if STT unavailable)
4. **Stage-aware tailoring** - Paths adapt based on org_stage + finance_stage
5. **Timezone: Europe/London** - All date handling uses UK timezone

## Program: "Founder Zero-to-One"

### Module A: FOUNDATION (company basics)

| Step | Title | Required Inputs | Evidence Required | Output Templates |
|------|-------|-----------------|-------------------|------------------|
| A1 | Define mission & constraints | transcript/text | 2-sentence mission + 3 constraints | Objective: "Establish clear mission and operating constraints" |
| A2 | Define offer / product wedge | transcript/text | 1-liner offer + target buyer persona | Objective: "Validate product-market hypothesis" |
| A3 | Define 30-day success metric | transcript/text | Single measurable target + baseline | Task draft: "Track [metric] daily for 30 days" |

### Module B: MARKET (who and why)

| Step | Title | Required Inputs | Evidence Required | Output Templates |
|------|-------|-----------------|-------------------|------------------|
| B1 | Define ICP | transcript/text | ICP statement (industry, size, pain) | Objective: "Develop Ideal Customer Profile" |
| B2 | Define pain + why now | transcript/text | Top 3 pains ranked + timing trigger | Task draft: "Validate top pain with 5 ICP calls" |
| B3 | List 20 target customers | transcript/text OR CSV | List of 20 names/companies | Task drafts: Outreach tasks for top 5 |

### Module C: PRODUCT (MVP and proof)

| Step | Title | Required Inputs | Evidence Required | Output Templates |
|------|-------|-----------------|-------------------|------------------|
| C1 | MVP definition | transcript/text | What "shipping" means (1-2 sentences) | Objective: "Ship MVP by [date]" |
| C2 | Validation plan | transcript/text | 5 validation tests with pass/fail criteria | Task drafts: 5 validation experiment tasks |
| C3 | Prototype plan | transcript/text | Key prototype milestones | Task drafts: Prototype milestone tasks |

### Module D: GO-TO-MARKET

| Step | Title | Required Inputs | Evidence Required | Output Templates |
|------|-------|-----------------|-------------------|------------------|
| D1 | Channel hypothesis | transcript/text | 2 channels + rationale | Objective: "Validate GTM channels" |
| D2 | Outreach plan | transcript/text | 10 prepared outreach messages | Task drafts: 10 outreach tasks |
| D3 | Pipeline tracking setup | link/text | CRM/sheet link or system name | Task draft: "Set up pipeline tracking" |

### Module E: FINANCE (runway + reporting)

| Step | Title | Required Inputs | Evidence Required | Output Templates |
|------|-------|-----------------|-------------------|------------------|
| E1 | Runway + burn baseline | transcript/text | Monthly burn estimate + runway months | Objective: "Manage runway to [X] months" |
| E2 | Funding plan | transcript/text | 3 target funders + timeline | Task drafts: Investor outreach tasks |
| E3 | Reporting cadence | transcript/text | Weekly KPI list (3-5 metrics) | Task draft: "Weekly KPI review ritual" |

### Module F: PEOPLE (fractional exec + apprentices)

| Step | Title | Required Inputs | Evidence Required | Output Templates |
|------|-------|-----------------|-------------------|------------------|
| F1 | Role gaps | transcript/text | Top 2 missing roles/capabilities | Objective: "Fill critical role gaps" |
| F2 | Find candidates | transcript/text | Shortlist (3+ people per role) | Task drafts: Outreach to shortlist |
| F3 | Interview plan | transcript/text | Scorecard criteria | Task draft: "Create interview scorecard" |

### Module G: OPS (cadence + task system)

| Step | Title | Required Inputs | Evidence Required | Output Templates |
|------|-------|-----------------|-------------------|------------------|
| G1 | Weekly cadence | transcript/text | Weekly planning ritual description | Task draft: "Schedule weekly planning" |
| G2 | Task ownership rules | transcript/text | RACI-lite (who owns what) | Objective: "Establish task ownership" |
| G3 | Capacity setup | transcript/text | Capacity units per person | Task draft: "Configure capacity in CursorOS" |

## Stage Applicability Rules

### Organization Stages
- **S0 (Idea)**: Full onboarding, all modules unlocked
- **S1 (Pre-seed)**: Full onboarding, all modules unlocked
- **S2 (Seed)**: Skip A1-A2 if company profile exists, condense FOUNDATION
- **S3+ (Series A+)**: Skip FOUNDATION entirely, start at MARKET, unlock OPS/FINANCE first

### Finance Stages
- **F0 (Bootstrapped)**: Skip E2 (funding plan)
- **F1 (Pre-revenue)**: Full onboarding
- **F2+ (Revenue)**: Skip E1 basics, focus on E3 reporting

## Evidence Types

| Type | Validation | Example |
|------|------------|---------|
| `text` | Non-empty, min 10 chars | Mission statement |
| `list` | Array with min items | 3 constraints |
| `link` | Valid URL | CRM sheet link |
| `file` | File reference exists | Uploaded CSV |
| `transcript` | Transcript processed | Voice input converted |

## Gating Rules

1. **Step Unlock**: Previous step must be `completed` or `skipped`
2. **Step Completion**: All evidence requirements satisfied
3. **Skip Allowed**: Must provide `skip_reason` (min 20 chars)
4. **Module Completion**: All required steps complete/skipped
5. **Program Completion**: All required modules complete

## Task Draft Structure

```typescript
interface OnboardingTaskDraft {
  title: string;
  notes?: string;
  units: number; // Default: 1
  assignee_hint: 'founder' | 'exec' | 'apprentice';
  due_offset_days?: number;
  linked_step_id: string;
  linked_objective_id?: string;
}
```

## Objective Template Structure

```typescript
interface OnboardingObjective {
  title: string;
  description?: string;
  period: string; // e.g., "Q1 2026"
  category: 'growth' | 'product' | 'operations' | 'financial' | 'team';
  linked_step_id: string;
}
```
