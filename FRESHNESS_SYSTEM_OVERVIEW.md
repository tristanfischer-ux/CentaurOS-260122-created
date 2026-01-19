# Marketplace Data Freshness System

**Version:** 1.0
**Created:** 2026-01-19
**Status:** Production Ready

## Overview

The Freshness System automatically keeps the curated marketplace (VCs, law firms, accountancies, AI tools, manufacturers) up to date by:

1. **Periodically re-checking** official sources (websites/portfolio pages)
2. **Detecting changes** (contacts, focus tags, portfolios, offerings)
3. **Recording** `last_verified_at` timestamps and confidence scores
4. **Creating a review workflow** rather than silently changing trusted data
5. **Automatically generating** review task drafts in WHAT (pending confirmation)

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        FRESHNESS SYSTEM ARCHITECTURE                         │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐                   │
│  │  SCHEDULER   │───▶│   CHECKER    │───▶│   REVIEW     │                   │
│  │              │    │              │    │   PIPELINE   │                   │
│  │ - Cron/API   │    │ - Fetch URLs │    │              │                   │
│  │ - Policies   │    │ - Extract    │    │ - Diff       │                   │
│  │ - Selection  │    │ - Hash       │    │ - Queue      │                   │
│  └──────────────┘    └──────────────┘    │ - Tasks      │                   │
│                                          └──────────────┘                   │
│                                                 │                           │
│                                                 ▼                           │
│                                          ┌──────────────┐                   │
│                                          │  ADMIN UI    │                   │
│                                          │              │                   │
│                                          │ - Dashboard  │                   │
│                                          │ - Approve    │                   │
│                                          │ - Reject     │                   │
│                                          └──────────────┘                   │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Components

#### A) Scheduler
- Triggers checks (daily/weekly) depending on org type and staleness
- Respects `freshness_policies` configuration per org type
- Can be run manually or via external cron

#### B) Checker
- Fetches URLs with HTTP caching (ETag/If-Modified-Since)
- Per-host rate limiting (token bucket, conservative defaults)
- Extracts structured data using deterministic extractors
- Computes content hash for change detection

#### C) Review Pipeline
- Stores "suggested updates" in `freshness_review_queue`
- Creates task drafts for curator review (always pending confirmation)
- Never auto-edits curated data without human approval

## Database Tables

### New Tables (Migration 006)

| Table | Purpose |
|-------|---------|
| `freshness_policies` | Configuration per org type (frequency, limits) |
| `freshness_jobs` | Audit trail of verification job runs |
| `freshness_checks` | Individual URL check results |
| `freshness_review_queue` | Proposed changes awaiting approval |
| `freshness_audit_log` | Complete action audit trail |
| `freshness_url_cache` | HTTP caching to avoid redundant fetches |

### Added Columns to Existing Tables

- `directory_orgs.freshness_status` - fresh/stale/unknown/error
- `directory_orgs.last_check_id` - Reference to last check
- `directory_orgs.portfolio_hash` - Hash for change detection
- `directory_orgs.contact_hash` - Hash for change detection
- Similar fields added to `directory_people`, `directory_ai_tools`, `directory_manufacturers`, `external_entities`

## Default Policies

| Org Type | Frequency | Stale After | Max URLs/Run | Rate Limit |
|----------|-----------|-------------|--------------|------------|
| VC | 14 days | 60 days | 100 | 10/min |
| PE | 14 days | 60 days | 50 | 10/min |
| Angel | 21 days | 90 days | 50 | 10/min |
| LawFirm | 30 days | 90 days | 50 | 8/min |
| Accountancy | 30 days | 90 days | 50 | 8/min |
| Manufacturer | 30 days | 120 days | 100 | 8/min |
| AITool | 14 days | 60 days | 100 | 10/min |
| Advisor | 30 days | 90 days | 30 | 8/min |
| external | 60 days | 180 days | 30 | 5/min |

## Environment Variables

```bash
# Feature flag (default: true)
FRESHNESS_ENABLED=true

# Rate limiting (requests per minute per host)
FRESHNESS_RATE_LIMIT_PER_MIN=10

# Maximum URLs to check per job run
FRESHNESS_MAX_URLS_PER_RUN=50

# Enable LLM assistance for uncertain changes (default: false)
FRESHNESS_LLM_ASSIST_ENABLED=false

# Supabase credentials (required)
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

## How to Run

### 1. Run Database Migration

First, run the migration to create the freshness tables:

```sql
-- In Supabase SQL Editor, run:
-- supabase/migrations/006_freshness_system.sql
```

### 2. Manual Execution (CLI)

```bash
# Run with defaults (curated scope, 50 URLs, 10 req/min)
bun run scripts/run_freshness_job.ts

# Dry run to preview what would be checked
bun run scripts/run_freshness_job.ts --dry-run

# Check only VCs and PEs, max 100 URLs
bun run scripts/run_freshness_job.ts --org-types=VC,PE --max-urls=100

# Check all entries with lower rate limit
bun run scripts/run_freshness_job.ts --scope=all --rate-limit=5

# Show help
bun run scripts/run_freshness_job.ts --help
```

### 3. API Execution

```bash
# Trigger a job via API
curl -X POST http://localhost:8081/api/freshness/run \
  -H "Content-Type: application/json" \
  -d '{"scope": "curated", "max_urls": 50}'

# Get freshness stats
curl http://localhost:8081/api/freshness/run

# Get pending reviews
curl http://localhost:8081/api/freshness/reviews?status=pending

# Approve a review
curl -X POST http://localhost:8081/api/freshness/reviews \
  -H "Content-Type: application/json" \
  -d '{"review_id": "uuid", "action": "approve"}'
```

### 4. Scheduled Execution

The system is designed to be triggered by an external scheduler. Options:

#### Option A: GitHub Actions Cron (Recommended)

Create `.github/workflows/freshness-cron.yml`:

```yaml
name: Freshness Verification

on:
  schedule:
    # Run daily at 3 AM UTC (4 AM London time)
    - cron: '0 3 * * *'
  workflow_dispatch: # Allow manual trigger

jobs:
  verify:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger Freshness Job
        run: |
          curl -X POST ${{ secrets.API_URL }}/api/freshness/run \
            -H "Content-Type: application/json" \
            -d '{"scope": "curated", "frequency": "daily"}'
```

#### Option B: Vercel Cron

Add to `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/freshness/run",
      "schedule": "0 3 * * *"
    }
  ]
}
```

#### Option C: Supabase Edge Functions

Create a scheduled edge function that calls the runner.

## Admin UI

Access the Freshness Dashboard at `/freshness-dashboard` in the app.

Features:
- **Overview Stats**: Total entries, stale count, pending reviews
- **By Org Type**: Freshness breakdown per category
- **Recent Jobs**: History of verification runs
- **Review Queue**: Approve/reject proposed changes
- **Manual Trigger**: Start verification jobs with one click

## Extractors

The system uses deterministic extractors per org type:

| Org Type | Extracts |
|----------|----------|
| VC/PE/Angel | Portfolio company names, investment keywords |
| LawFirm | Practice areas (venture, startup, M&A, IP, etc.) |
| Accountancy | Service keywords (R&D tax, audit, VAT, etc.) |
| Manufacturer | Capabilities (CNC, 3D printing, etc.), certifications (ISO 9001, etc.) |
| AITool | Category keywords (sales, CRM, design, etc.) |
| All | Emails, LinkedIn URLs, contact form detection |

## Safety Rules

1. **No aggressive scraping** - Respects rate limits, uses conditional requests
2. **Prefer official pages** - Uses evidence URLs already stored in database
3. **Never store private data** - Only public web information
4. **No auto-edits** - All changes require human approval
5. **External data stays external** - Unverified data can be refreshed but remains "external"
6. **All tasks are drafts** - Requires human confirmation before action
7. **Timezone: Europe/London** - All timestamps use UK timezone

## File Structure

```
src/lib/freshness/
├── types.ts          # Type definitions
├── fetch.ts          # Canonical fetch strategy with rate limiting
├── extractors.ts     # Deterministic data extractors
├── diff.ts           # Change detection engine
└── runner.ts         # Main job runner

src/app/api/freshness/
├── run+api.ts        # Job trigger and stats API
└── reviews+api.ts    # Review queue API

src/app/
└── freshness-dashboard.tsx  # Admin UI

scripts/
└── run_freshness_job.ts     # CLI runner

supabase/migrations/
└── 006_freshness_system.sql # Database schema
```

## Monitoring & Debugging

### Check Job Status

```sql
SELECT * FROM freshness_jobs
ORDER BY created_at DESC
LIMIT 10;
```

### View Pending Reviews

```sql
SELECT * FROM freshness_review_queue
WHERE status = 'pending'
ORDER BY priority DESC, created_at DESC;
```

### Check Stale Entities

```sql
SELECT * FROM get_stale_entities('VC', 50);
```

### View Freshness Stats

```sql
SELECT * FROM get_freshness_stats();
```

### Check Rate Limiting (URL Cache)

```sql
SELECT url_domain, COUNT(*) as fetch_count, MAX(last_fetched_at) as last_fetch
FROM freshness_url_cache
GROUP BY url_domain
ORDER BY fetch_count DESC;
```

## Troubleshooting

### "Freshness system is disabled"

Set `FRESHNESS_ENABLED=true` in environment variables.

### "Missing SUPABASE_SERVICE_ROLE_KEY"

The freshness system requires the service role key for write access. Add it to your environment.

### Rate limit errors (429)

The system is being too aggressive. Either:
- Reduce `FRESHNESS_RATE_LIMIT_PER_MIN`
- Reduce `FRESHNESS_MAX_URLS_PER_RUN`
- Space out job runs

### No stale entities found

This means all entries have been verified within their policy's `stale_after_days`. This is good!

### Reviews not appearing

Check that:
1. Changes were actually detected (check `freshness_checks.outcome`)
2. Review items were created (check `freshness_review_queue`)
3. The UI is filtering correctly (default: `status=pending`)

## Future Enhancements

1. **LLM Assist**: Optional Claude integration for uncertain change analysis
2. **Webhook Notifications**: Slack/email alerts for high-priority reviews
3. **Bulk Operations**: Approve/reject multiple reviews at once
4. **Custom Extractors**: Plugin system for custom extraction logic
5. **Historical Trends**: Track freshness metrics over time
6. **robots.txt Parsing**: Full compliance with site crawling policies

---

# Portfolio Relationship Refresh System

**Version:** 1.0
**Created:** 2026-01-19
**Status:** Production Ready

## Overview

The Portfolio Refresh System is a specialized extension of the Freshness System focused on tracking investor (VC/PE/Angel/Accelerator) portfolio relationships. It:

1. **Discovers portfolio page URLs** from investor websites
2. **Extracts portfolio company lists** from HTML pages
3. **Detects changes** (additions, removals, renames) using fuzzy matching
4. **Creates review workflows** for curator approval
5. **Generates task drafts** in WHAT for human confirmation

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    PORTFOLIO REFRESH ARCHITECTURE                            │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐                   │
│  │  DISCOVERY   │───▶│  EXTRACTOR   │───▶│    DIFF      │                   │
│  │              │    │              │    │   ENGINE     │                   │
│  │ - Evidence   │    │ - Sections   │    │              │                   │
│  │ - Homepage   │    │ - Links      │    │ - Added      │                   │
│  │ - Patterns   │    │ - Logos      │    │ - Removed    │                   │
│  └──────────────┘    │ - Normalize  │    │ - Renamed    │                   │
│                      └──────────────┘    └──────────────┘                   │
│                                                 │                           │
│                                                 ▼                           │
│                                          ┌──────────────┐                   │
│                                          │  CHANGE SET  │                   │
│                                          │              │                   │
│                                          │ - Review Q   │                   │
│                                          │ - Task Draft │                   │
│                                          │ - Audit Log  │                   │
│                                          └──────────────┘                   │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Components

#### A) Portfolio URL Discovery (`discovery.ts`)

Finds the portfolio page URL for an investor through:
1. **Evidence URLs**: Check existing evidence URLs flagged as portfolio
2. **Homepage Crawl**: Fetch homepage, find links containing "portfolio", "companies", "investments"
3. **Pattern Guessing**: Try common patterns like `/portfolio`, `/companies`

#### B) Portfolio Extractor (`extract.ts`)

Deterministic extraction of company names from HTML:
1. Find sections with portfolio-related class names or headings
2. Extract anchor tag text and hrefs
3. Filter navigation/footer noise
4. Normalize company names (remove Ltd, Inc, etc.)
5. Extract domains from external links
6. Detect JS-heavy and paginated pages

#### C) Diff Engine (`diff.ts`)

Compare existing vs extracted portfolio:
1. **Match by domain** (highest confidence)
2. **Match by normalized name** (exact match)
3. **Fuzzy match for renames** (Levenshtein distance >= 0.7)
4. Calculate confidence scores

#### D) Change Set & Review

For each investor with changes:
1. Create `portfolio_change_sets` record with all changes
2. Add to `freshness_review_queue`
3. Generate task draft in WHAT (pending confirmation)
4. Write to `portfolio_audit_log`

## Database Tables (Migration 007)

| Table | Purpose |
|-------|---------|
| `directory_portfolio_pages` | Tracked portfolio page URLs per investor |
| `directory_portfolio_companies` | Portfolio company relationships |
| `portfolio_change_sets` | Detected changes awaiting review |
| `portfolio_audit_log` | Complete audit trail of portfolio changes |

### Company Status Values

| Status | Meaning |
|--------|---------|
| `active` | Currently in portfolio |
| `removed_pending_review` | Detected as removed, awaiting confirmation |
| `removed` | Confirmed removal |
| `exited` | Successful exit (IPO, acquisition) |
| `acquired` | Company was acquired |
| `unknown` | Status unclear |

## Environment Variables

```bash
# Feature flag (default: true if FRESHNESS_ENABLED)
PORTFOLIO_REFRESH_ENABLED=true

# Maximum investors per job run
PORTFOLIO_MAX_INVESTORS_PER_RUN=20

# Rate limiting for portfolio fetches
PORTFOLIO_RATE_LIMIT_PER_MIN=8

# Enable LLM assistance for extraction (default: false)
PORTFOLIO_LLM_ASSIST_ENABLED=false
```

## How to Run

### 1. Run Database Migration

```sql
-- In Supabase SQL Editor, run:
-- supabase/migrations/007_portfolio_refresh.sql
```

### 2. API Execution

```bash
# Trigger a portfolio refresh job
curl -X POST http://localhost:8081/api/freshness/portfolio \
  -H "Content-Type: application/json" \
  -d '{"run_job": true, "max_investors": 20}'

# Dry run (no database changes)
curl -X POST http://localhost:8081/api/freshness/portfolio \
  -H "Content-Type: application/json" \
  -d '{"run_job": true, "dry_run": true}'

# Get pending portfolio change sets
curl http://localhost:8081/api/freshness/portfolio?status=pending

# Approve a change set
curl -X POST http://localhost:8081/api/freshness/portfolio \
  -H "Content-Type: application/json" \
  -d '{"change_set_id": "uuid", "action": "approve"}'

# Reject a change set
curl -X POST http://localhost:8081/api/freshness/portfolio \
  -H "Content-Type: application/json" \
  -d '{"change_set_id": "uuid", "action": "reject"}'
```

### 3. Admin UI

Access the Freshness Dashboard at `/freshness-dashboard` and select the **Portfolio** tab.

Features:
- **Portfolio Stats**: Tracked portfolios, total companies, pending changes
- **Refresh Button**: Trigger portfolio refresh job
- **Change Sets**: View pending portfolio updates
- **Approve/Reject**: Process each change set

## Extraction Quality

The extractor reports quality levels:

| Quality | Meaning |
|---------|---------|
| `high` | Clear portfolio section found, 5+ companies extracted |
| `medium` | Extraction complete but with caveats (pagination, notes) |
| `low` | Few companies extracted, may be incomplete |
| `uncertain` | JS-heavy page or very few results |
| `unknown` | Unable to determine quality |

## Safety Rules

1. **Never auto-delete** - Removed companies marked as `removed_pending_review`
2. **Fuzzy rename detection** - Prevents false removals when companies rebrand
3. **Confidence scoring** - Lower confidence = requires more careful review
4. **Manual URL discovery** - Can override auto-discovered portfolio URLs
5. **Audit everything** - Complete trail of all changes

## File Structure

```
src/lib/freshness/portfolio/
├── types.ts          # Type definitions
├── discovery.ts      # Portfolio URL discovery
├── extract.ts        # Company list extraction
├── diff.ts           # Change detection engine
└── runner.ts         # Main job runner

src/app/api/freshness/
└── portfolio+api.ts  # Portfolio API endpoint

supabase/migrations/
└── 007_portfolio_refresh.sql  # Database schema
```

## Monitoring & Debugging

### Check Stale Investors

```sql
SELECT * FROM get_stale_portfolio_investors(50);
```

### View Portfolio Stats

```sql
SELECT * FROM get_portfolio_stats();
```

### View Pending Change Sets

```sql
SELECT
  cs.investor_org_name,
  json_array_length(cs.added_companies_json::json) as added,
  json_array_length(cs.removed_companies_json::json) as removed,
  json_array_length(cs.renamed_companies_json::json) as renamed,
  cs.confidence_score,
  cs.detected_at
FROM portfolio_change_sets cs
WHERE cs.status = 'pending'
ORDER BY cs.detected_at DESC;
```

### Check Portfolio Companies

```sql
SELECT
  o.name as investor,
  pc.company_name,
  pc.company_domain,
  pc.status,
  pc.last_seen_at
FROM directory_portfolio_companies pc
JOIN directory_orgs o ON o.id = pc.investor_org_id
WHERE o.name ILIKE '%sequoia%'
ORDER BY pc.company_name;
```

## Troubleshooting

### No portfolio URL found

The discovery process couldn't find a portfolio page. Solutions:
1. Manually add the portfolio URL via admin
2. Check if the investor website is JavaScript-heavy
3. Add the URL to evidence URLs with `/portfolio` in the path

### Low extraction confidence

The extractor found few companies or quality is uncertain:
1. Check if the page is paginated (only first page is extracted)
2. Check if the page is JavaScript-rendered
3. Consider enabling LLM assist for complex pages

### Fuzzy matching false positives

If rename detection is too aggressive:
1. Review and reject incorrect renames
2. Consider adjusting `RENAME_SIMILARITY_THRESHOLD` in `diff.ts`

### Many removals detected

A large number of removals might indicate:
1. Page structure changed (new design)
2. Pagination not detected
3. JavaScript rendering issue

Always review large change sets carefully before approving.
