# Marketplace Ingestion Architecture

**Created:** 2026-01-19
**Project:** Centaur OS Marketplace Directory

---

## Overview

The marketplace ingestion system provides a curated, searchable directory of UK hardware startup ecosystem partners including VCs, law firms, accountancies, hardware startups, AI tools, and manufacturers.

## Architecture Layers

### 1. Data Sources
Location: `/home/user/workspace/marketplace_data/`

Files:
- `orgs.json` - VCs, law firms, accountancies, manufacturers (29 records)
- `people.json` - Key contacts at organizations (4 records)
- `relationships_portfolios.json` - Investor-company relationships (11 records)
- `hardware_startups.json` - UK hardware startups reference (5 records)
- `ai_tools.json` - Commercial AI tools by function (17 records)
- `manufacturing_providers.json` - Manufacturing services (15 records)

### 2. Database Schema
Location: `/home/user/workspace/supabase/migrations/`

**Migration:** `005_marketplace_directory.sql`

Tables created:
- **Curated Layer** (high-signal, verified data)
  - `directory_orgs` - Organizations (VCs, law firms, etc.)
  - `directory_people` - Individual contacts
  - `directory_contacts` - Contact points (email, phone, etc.)
  - `directory_evidence` - Source URLs with confidence scores
  - `directory_portfolio_links` - Investor→Company relationships
  - `directory_startups` - Hardware startup reference set
  - `directory_ai_tools` - AI tools catalog
  - `directory_manufacturers` - Manufacturing providers

- **External Layer** (unverified, lower confidence)
  - `external_entities` - Unverified organizations
  - `external_contacts` - Unverified contacts
  - `external_evidence` - Source tracking

- **Provenance** (audit trail)
  - `import_runs` - Track each ingestion run
  - `import_row_errors` - Failed records with error messages

### 3. Ingestion Pipeline
Location: `/home/user/workspace/scripts/ingest_marketplace.ts`

**Purpose:** Deterministic, repeatable ingestion of JSON files into Supabase

**Features:**
- Schema validation
- Field normalization (lowercase tags, trim whitespace, extract domains)
- Deduplication (by website domain, Companies House number, name+domain)
- Upsert logic (update existing, insert new)
- Dry-run mode (preview changes without writing)
- Error logging (track failures per row)
- Import run tracking (audit history)

**Usage:**
```bash
# Dry run (preview changes)
bun run scripts/ingest_marketplace.ts --dry-run

# Full ingestion
bun run scripts/ingest_marketplace.ts

# Specific file only
bun run scripts/ingest_marketplace.ts --file orgs.json
```

### 4. Search API Endpoints
Location: `/home/user/workspace/src/app/api/marketplace/`

Endpoints:
- `POST /api/marketplace/search` - Structured search with filters
- `POST /api/marketplace/wizard/interpret` - Natural language→filters (uses Claude)
- `POST /api/marketplace/outreach/drafts` - Generate task drafts from selected orgs

**Search Ranking:**
1. Curated results always rank first
2. Within curated: confidence_score DESC, last_verified_at DESC, tag_match_count DESC
3. External results labeled "unverified"

### 5. UI Components
Location: `/home/user/workspace/src/app/marketplace.tsx`

**Features:**
- Wizard flow (5-8 guided questions)
- Structured filter UI
- Results list with org cards
- Trust badges (curated/unverified)
- Multi-select for outreach
- Draft task creation (→ WHAT tab for confirmation)

---

## Database Schema Details

### directory_orgs
```sql
CREATE TABLE directory_orgs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  org_type TEXT NOT NULL, -- 'VC', 'LawFirm', 'Accountancy', 'Manufacturer'
  website TEXT,
  website_domain TEXT, -- normalized domain for deduplication
  companies_house_number TEXT,
  hq_city TEXT,
  hq_country TEXT,
  regions TEXT[], -- ['UK-wide', 'London', 'Scotland']
  sector_focus TEXT[], -- ['robotics', 'deeptech', 'medtech']
  stage_focus TEXT[], -- ['seed', 'series_a', 'series_b']
  capability_tags TEXT[], -- ['cnc', 'iso13485', 'eis', 'seis']
  description_1liner TEXT,
  preferred_contact_method TEXT, -- 'email', 'contact_form', 'linkedin'
  confidence_score INTEGER DEFAULT 80, -- 0-100
  last_verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(website_domain),
  UNIQUE(companies_house_number) WHERE companies_house_number IS NOT NULL
);

CREATE INDEX idx_directory_orgs_type ON directory_orgs(org_type);
CREATE INDEX idx_directory_orgs_regions ON directory_orgs USING GIN(regions);
CREATE INDEX idx_directory_orgs_sectors ON directory_orgs USING GIN(sector_focus);
CREATE INDEX idx_directory_orgs_stages ON directory_orgs USING GIN(stage_focus);
CREATE INDEX idx_directory_orgs_capabilities ON directory_orgs USING GIN(capability_tags);
CREATE INDEX idx_directory_orgs_name ON directory_orgs(name);
```

### directory_contacts
```sql
CREATE TABLE directory_contacts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID REFERENCES directory_orgs(id) ON DELETE CASCADE,
  person_id UUID REFERENCES directory_people(id) ON DELETE CASCADE,
  contact_type TEXT NOT NULL, -- 'email', 'phone', 'contact_form', 'linkedin'
  contact_value TEXT NOT NULL,
  is_primary BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### directory_evidence
```sql
CREATE TABLE directory_evidence (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID REFERENCES directory_orgs(id) ON DELETE CASCADE,
  person_id UUID REFERENCES directory_people(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  last_verified TIMESTAMPTZ NOT NULL,
  confidence_score INTEGER DEFAULT 80,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### import_runs
```sql
CREATE TABLE import_runs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  source_file TEXT NOT NULL, -- 'orgs.json', 'people.json', etc.
  run_type TEXT NOT NULL, -- 'full', 'incremental', 'dry_run'
  status TEXT NOT NULL, -- 'success', 'partial_success', 'failed'
  records_processed INTEGER DEFAULT 0,
  records_inserted INTEGER DEFAULT 0,
  records_updated INTEGER DEFAULT 0,
  records_failed INTEGER DEFAULT 0,
  error_summary JSONB,
  started_at TIMESTAMPTZ NOT NULL,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## Data Flow

```
JSON Files (marketplace_data/)
    ↓
Ingestion Script (scripts/ingest_marketplace.ts)
    ↓ validates, normalizes, deduplicates
Supabase Tables (directory_* tables)
    ↓
Search API (/api/marketplace/search)
    ↓ queries with filters + ranking
UI Results List (marketplace.tsx)
    ↓ user selects orgs
Outreach Drafts API (/api/marketplace/outreach/drafts)
    ↓ generates task drafts
Task Drafts (task_drafts table → WHAT tab)
    ↓ user confirms
Work Plans (work_plans table)
```

---

## Normalization Rules

### Tags
- Convert to lowercase
- Trim whitespace
- Replace spaces with underscores
- Remove special characters

Example: `"Venture Capital Law"` → `"venture_capital_law"`

### Regions
Normalized values:
- `UK-wide`
- `London`
- `Scotland`
- `North East`
- `Cambridge`
- `Europe`
- `USA`
- `Global`

### Website Domains
Extract domain from URL for deduplication:
- `https://www.example.com/path` → `example.com`
- `http://subdomain.example.co.uk` → `example.co.uk`

### Dates
- Parse ISO format: `YYYY-MM-DD`
- Store as TIMESTAMPTZ in Supabase

---

## Deduplication Strategy

**Priority Order:**
1. **Companies House Number** (highest confidence)
   - If same CH number exists, merge records
   - Keep highest confidence_score data

2. **Website Domain** (high confidence)
   - If same domain exists, merge records
   - Update fields if new data has higher confidence

3. **Name + Domain** (fallback)
   - If exact name match + same domain, merge
   - Otherwise create new record

**Merge Logic:**
- Keep non-null values from higher confidence source
- Merge arrays (regions, tags) with deduplication
- Update `updated_at` timestamp
- Preserve original `created_at`

---

## Security

### API Keys
- ❌ **NEVER** expose in client code
- ✅ Server-side only: `ANTHROPIC_API_KEY` for Claude LLM
- ✅ Use Supabase RLS for workspace isolation
- ✅ Validate user permissions before generating drafts

### Trust Layers
- **Curated:** High confidence (80-100%), verified sources, ranked first
- **External:** Lower confidence (<80%), unverified, clearly labeled

### Task Draft Security
- All draft tasks created with `status = 'pending_confirmation'`
- User MUST explicitly confirm in WHAT tab
- No automatic task creation without user review

---

## Testing

### Unit Tests
Location: `/home/user/workspace/scripts/__tests__/`

Tests:
- `ingest_marketplace.test.ts` - Normalization, deduplication logic
- `marketplace_search.test.ts` - Ranking algorithm
- `marketplace_api.test.ts` - API endpoints

### Integration Tests
```bash
# Test ingestion end-to-end
bun test scripts/__tests__/ingest_marketplace.test.ts

# Test search with fixtures
bun test scripts/__tests__/marketplace_search.test.ts
```

### Manual Checklist
1. ✅ Run ingestion: `bun run scripts/ingest_marketplace.ts`
2. ✅ Search for "seed robotics UK" via API
3. ✅ Select 3 results in UI
4. ✅ Create outreach drafts
5. ✅ Confirm drafts in WHAT tab → verify work_plans created

---

## Environment Variables Required

```bash
# Supabase (already configured)
EXPO_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJxxx...

# Server-side only (for Claude API in wizard/interpret)
ANTHROPIC_API_KEY=sk-ant-xxx

# Optional: Webhook for import notifications
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/xxx
```

---

## Future Enhancements

1. **Incremental Updates**
   - Track changed records since last import
   - Only process diffs

2. **External Data Sources**
   - Scrape Crunchbase, PitchBook APIs
   - Auto-refresh verification dates
   - Flag stale data (>90 days)

3. **AI-Powered Enrichment**
   - Auto-classify org_type from website
   - Extract contact emails from LinkedIn
   - Suggest missing tags

4. **Smart Deduplication UI**
   - Show potential duplicates for manual review
   - Confidence threshold slider
   - Merge/split controls

5. **Analytics**
   - Track most-searched sectors
   - Popular org types
   - Conversion: search → draft → confirmed task

---

## How to Run Ingestion (Summary)

```bash
# 1. Ensure data files exist
ls -l /home/user/workspace/marketplace_data/

# 2. Run database migration
# (Supabase will auto-apply on deploy, or run locally via CLI)

# 3. Run ingestion (dry run first)
cd /home/user/workspace
bun run scripts/ingest_marketplace.ts --dry-run

# 4. Review dry run output, then run for real
bun run scripts/ingest_marketplace.ts

# 5. Verify in Supabase dashboard
# Check directory_orgs table for records

# 6. Test search API
curl -X POST http://localhost:8081/api/marketplace/search \
  -H "Content-Type: application/json" \
  -d '{"query_text": "seed robotics", "limit": 5}'
```

---

**End of Architecture Document**
