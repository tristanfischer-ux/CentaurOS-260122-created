# People Component Architecture

**Version:** 1.0
**Created:** 2026-01-19
**Status:** Production Ready

## Overview

The People Component for Fractional Foundry implements a three-layer data model for managing talent relationships across the platform. It enables companies to discover, track, and engage fractional executives, apprentices, and other talent while maintaining strict privacy controls.

## Three-Layer Data Model

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         PEOPLE DATA ARCHITECTURE                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │                    LAYER 1: UNIVERSAL MARKETPLACE                       │ │
│  │                         (Global, Opt-in, Verified)                      │ │
│  ├────────────────────────────────────────────────────────────────────────┤ │
│  │  universal_people          - Core profile data                         │ │
│  │  universal_people_contacts - Contact points (privacy-controlled)       │ │
│  │  universal_people_evidence - CVs, portfolios, certifications           │ │
│  │                                                                         │ │
│  │  Visibility: Only profile_visibility='marketplace' shown publicly      │ │
│  │  Privacy: Contact details require explicit opt-in                       │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                      │                                      │
│                                      ▼                                      │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │                    LAYER 2: COMPANY PEOPLE LAYER                        │ │
│  │                    (Per Tenant: Pipeline + Relationships)               │ │
│  ├────────────────────────────────────────────────────────────────────────┤ │
│  │  company_people_relationships - Candidate/contractor relationships     │ │
│  │  company_people_interactions  - Calls, emails, meetings log            │ │
│  │  company_people_docs          - NDAs, contracts, SOWs (links only)     │ │
│  │                                                                         │ │
│  │  Isolation: workspace_id + RLS policies                                 │ │
│  │  Pipeline: identified → contacted → intro_call → trial → engaged       │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                      │                                      │
│                                      ▼                                      │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │                    LAYER 3: PERSONAL CONTACTS LAYER                     │ │
│  │                    (Per User: Private Network + Warm Intros)            │ │
│  ├────────────────────────────────────────────────────────────────────────┤ │
│  │  personal_contacts - User's private network                            │ │
│  │                    - Warm intro signals                                 │ │
│  │                    - Relationship strength                              │ │
│  │                                                                         │ │
│  │  Isolation: user_id only (not even workspace visible)                  │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Permission Model

### Layer 1: Universal Marketplace

| Field/Table | Public Read | Marketplace Read | Authenticated Read |
|-------------|-------------|------------------|-------------------|
| universal_people (marketplace profiles) | No | Yes | Yes |
| universal_people (stubs/private) | No | No | Owner only |
| universal_people_contacts (marketplace) | No | Yes | Yes |
| universal_people_contacts (private) | No | No | Owner only |
| universal_people_evidence | No | Yes (if person is marketplace) | Yes |

### Layer 2: Company Layer

| Table | Access |
|-------|--------|
| company_people_relationships | Workspace members only |
| company_people_interactions | Workspace members only |
| company_people_docs | Workspace members only |

### Layer 3: Personal Layer

| Table | Access |
|-------|--------|
| personal_contacts | Owner user only |

## Integration Points

### 1. Task Draft Pipeline

All hiring-related actions generate task drafts (never auto-execute):

```
People Actions
  │
  ├── "Create outreach task" → task_drafts (source='people_outreach')
  ├── "Schedule intro call" → task_drafts (source='people_scheduling')
  ├── "Send NDA" → task_drafts (source='people_docs')
  └── "Onboard candidate" → task_drafts (source='people_onboarding')
```

### 2. Marketplace Directory

Universal People integrates with existing marketplace:

- `universal_people.org_id` can link to `directory_orgs` (their current/past employer)
- Evidence URLs follow same pattern as `directory_evidence`
- Contact types match `directory_contacts` patterns

### 3. WHY Tab Integration

Stage guidance can suggest talent needs:

```
WHY Stage Analysis
  │
  └── "Ops breaking down"
        │
        └── Suggests: "Fractional COO 8-12 hrs/wk + Ops apprentice"
              │
              └── "Find candidates" → Opens People Wizard pre-filled
```

## Verification Workflow

```
                    ┌─────────┐
                    │  STUB   │ ← Minimal data, private only
                    │         │   (name, linkedin, source)
                    └────┬────┘
                         │
                    invite_token
                         │
                         ▼
                    ┌─────────┐
                    │ INVITED │ ← Person received invite
                    │         │   (invite email sent)
                    └────┬────┘
                         │
                    completes onboarding
                         │
                         ▼
                    ┌─────────┐
                    │ OPTED_IN│ ← Person completed profile
                    │         │   (can choose marketplace visibility)
                    └────┬────┘
                         │
                    admin verification
                         │
                         ▼
                    ┌─────────┐
                    │ VERIFIED│ ← Admin confirmed identity/credentials
                    │         │   (higher confidence_score)
                    └─────────┘
```

## Pipeline Stages

```
HIRING PIPELINE

┌──────────┐   ┌───────────┐   ┌────────────┐   ┌───────┐   ┌─────────┐
│IDENTIFIED│ → │ CONTACTED │ → │ INTRO_CALL │ → │ TRIAL │ → │ ENGAGED │
└──────────┘   └───────────┘   └────────────┘   └───────┘   └─────────┘
     │              │               │               │            │
     │              │               │               │            │
     ▼              ▼               ▼               ▼            ▼
 Add to         Send          Schedule       Assign        Convert to
 pipeline      outreach        meeting       project       relationship
 (draft)       (draft)        (draft)        (draft)         type

                                          ┌──────────┐
                                    OR    │ REJECTED │
                                          └──────────┘
```

## Privacy & Compliance

### Data Collection Rules

1. **NO scraping** - All universal_people data is opt-in or minimal public stubs
2. **NO private emails by default** - Contacts require explicit consent
3. **NO raw audio storage** - Voice input uses transcript-first approach
4. **Stubs are private** - Discovered candidates visible only to discovering company

### GDPR Compliance

- Right to erasure: Delete cascade through all layers
- Data portability: Export endpoint for own data
- Consent tracking: `opted_in_at`, `consent_version` fields
- Audit trail: All changes logged

### Contact Visibility Rules

| Scenario | Email Visible? | LinkedIn Visible? |
|----------|----------------|-------------------|
| Stub (not opted in) | No | Only if manually provided |
| Opted in, private profile | No | No |
| Opted in, marketplace profile | Only if marked is_public | Only if marked is_public |
| Verified, marketplace | Yes (if public) | Yes (if public) |

## Data Relationships

```sql
-- Universal Layer
universal_people (1) ─┬─ (N) universal_people_contacts
                     ├─ (N) universal_people_evidence
                     └─ (1) directory_orgs (optional current org)

-- Company Layer
universal_people (1) ─── (N) company_people_relationships
                              │
                              ├─ (N) company_people_interactions
                              └─ (N) company_people_docs

-- Personal Layer
universal_people (1) ─── (N) personal_contacts ─── (1) users
```

## Search & Matching

### Talent Matching Wizard Flow

```
1. User Input (voice or text)
   │
   ▼
2. Interpret Request (Claude API)
   │  - Extract: role, sector, stage, location, hours, urgency
   │
   ▼
3. Build Search Filters
   │  - role_archetypes CONTAINS requested_role
   │  - sector_tags && requested_sectors
   │  - stage_fit_tags && requested_stages
   │  - location/remote preferences
   │  - availability_hours >= requested
   │
   ▼
4. Execute Search
   │  WHERE profile_visibility = 'marketplace'
   │  ORDER BY match_score DESC
   │
   ▼
5. Present Results
   │  - Candidate cards with match explanation
   │  - "Add to pipeline" button
   │
   ▼
6. Pipeline Integration
   │  - Creates company_people_relationships
   │  - Optionally generates outreach task drafts
```

### Match Scoring Algorithm

```
score =
  + 20 * role_archetype_match
  + 15 * sector_overlap_count (max 3)
  + 15 * stage_fit_match
  + 10 * availability_fit
  + 10 * location_fit
  + 10 * verification_bonus (verified=10, opted_in=5, stub=0)
  + 10 * confidence_score / 10
  + 10 * recency_bonus (active in last 30 days = 10)
```

## Environment Variables

```bash
# Feature flags
PEOPLE_COMPONENT_ENABLED=true
PEOPLE_VOICE_ENABLED=true
PEOPLE_WIZARD_LLM_ENABLED=true

# Privacy defaults
PEOPLE_DEFAULT_VISIBILITY=private
PEOPLE_REQUIRE_CONSENT=true

# Matching
PEOPLE_WIZARD_MAX_RESULTS=20
PEOPLE_MIN_CONFIDENCE_SCORE=30
```

## File Structure

```
src/lib/people/
├── types.ts                  # Type definitions
├── search.ts                 # Search and matching logic
├── wizard.ts                 # Talent wizard interpretation
├── pipeline.ts               # Pipeline stage management
└── privacy.ts                # Privacy rule enforcement

src/app/api/people/
├── search+api.ts             # Search marketplace
├── onboard+api.ts            # Opt-in onboarding
├── wizard/
│   └── interpret+api.ts      # Wizard request interpretation
├── pipeline/
│   ├── [id]+api.ts           # Single relationship CRUD
│   └── drafts+api.ts         # Generate outreach drafts
└── invites+api.ts            # Invite management

src/app/(tabs)/people/
├── index.tsx                 # People overview/search
├── wizard.tsx                # Talent matching wizard
├── pipeline.tsx              # Company hiring pipeline
└── [id].tsx                  # Person detail view

supabase/migrations/
└── 008_people_component.sql  # All people tables
```

## Related Documentation

- [PEOPLE_TAXONOMY.md](./PEOPLE_TAXONOMY.md) - Role archetypes, skills, sectors
- [PEOPLE_TEST_CHECKLIST.md](./PEOPLE_TEST_CHECKLIST.md) - Manual testing steps
- [PRIVACY_RULES.md](./PRIVACY_RULES.md) - Privacy enforcement details
