-- Marketplace Data Freshness System
-- Migration 006: Automated verification and review workflow
-- Created: 2026-01-19
--
-- This system keeps the curated marketplace up to date by:
-- 1) Periodically re-checking official sources
-- 2) Detecting changes (contacts, focus tags, portfolios)
-- 3) Recording last_verified timestamps and confidence scores
-- 4) Creating review workflows rather than silently changing data
-- 5) Generating draft tasks for curator review

-- ============================================================================
-- FRESHNESS POLICIES (Configuration per org type)
-- ============================================================================

CREATE TABLE IF NOT EXISTS freshness_policies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_type TEXT NOT NULL UNIQUE, -- 'VC', 'PE', 'LawFirm', 'Accountancy', 'Manufacturer', 'AITool', 'external'
  default_frequency_days INTEGER NOT NULL DEFAULT 30, -- how often to check
  stale_after_days INTEGER NOT NULL DEFAULT 90, -- when to flag as stale
  max_urls_per_run INTEGER NOT NULL DEFAULT 50, -- limit URLs checked per job run
  max_requests_per_minute INTEGER NOT NULL DEFAULT 10, -- rate limit
  priority INTEGER NOT NULL DEFAULT 50, -- higher = check more often (1-100)
  enabled BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Default policies (safe defaults: conservative rate limits)
INSERT INTO freshness_policies (org_type, default_frequency_days, stale_after_days, max_urls_per_run, max_requests_per_minute, priority)
VALUES
  ('VC', 14, 60, 100, 10, 80),           -- VCs: check every 2 weeks, stale after 2 months
  ('PE', 14, 60, 50, 10, 70),             -- PE firms: similar to VCs
  ('Angel', 21, 90, 50, 10, 60),          -- Angel networks: every 3 weeks
  ('LawFirm', 30, 90, 50, 8, 50),         -- Law firms: monthly
  ('Accountancy', 30, 90, 50, 8, 50),     -- Accountancies: monthly
  ('Manufacturer', 30, 120, 100, 8, 40),  -- Manufacturers: monthly, stale after 4 months
  ('AITool', 14, 60, 100, 10, 70),        -- AI tools: every 2 weeks (fast-moving)
  ('Advisor', 30, 90, 30, 8, 40),         -- Advisors: monthly
  ('external', 60, 180, 30, 5, 20)        -- External/unverified: every 2 months, very conservative
ON CONFLICT (org_type) DO NOTHING;

-- ============================================================================
-- FRESHNESS JOBS (Audit trail of verification runs)
-- ============================================================================

CREATE TABLE IF NOT EXISTS freshness_jobs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  scope TEXT NOT NULL CHECK (scope IN ('curated', 'external', 'all')),
  job_type TEXT NOT NULL DEFAULT 'scheduled' CHECK (job_type IN ('scheduled', 'manual', 'triggered')),
  frequency TEXT NOT NULL CHECK (frequency IN ('daily', 'weekly', 'monthly', 'adhoc')),
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'running', 'done', 'failed', 'cancelled')),

  -- Timing
  scheduled_for TIMESTAMPTZ, -- when job was scheduled to run
  started_at TIMESTAMPTZ,
  finished_at TIMESTAMPTZ,

  -- Stats
  entities_checked INTEGER DEFAULT 0,
  urls_fetched INTEGER DEFAULT 0,
  changes_detected INTEGER DEFAULT 0,
  review_items_created INTEGER DEFAULT 0,
  errors_count INTEGER DEFAULT 0,

  -- Detailed stats
  stats_json JSONB DEFAULT '{}'::JSONB, -- { by_org_type: {...}, by_outcome: {...} }

  -- Config used for this run
  config_json JSONB DEFAULT '{}'::JSONB, -- { max_urls, rate_limit, etc. }

  -- Error details
  error_message TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_freshness_jobs_status ON freshness_jobs(status);
CREATE INDEX idx_freshness_jobs_started ON freshness_jobs(started_at DESC);
CREATE INDEX idx_freshness_jobs_scope ON freshness_jobs(scope);

-- ============================================================================
-- FRESHNESS CHECKS (Individual URL checks)
-- ============================================================================

CREATE TABLE IF NOT EXISTS freshness_checks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_id UUID REFERENCES freshness_jobs(id) ON DELETE CASCADE,

  -- What we're checking
  entity_type TEXT NOT NULL CHECK (entity_type IN ('org', 'person', 'tool', 'manufacturer', 'startup', 'external')),
  entity_id UUID NOT NULL, -- references the appropriate directory table
  entity_name TEXT, -- denormalized for easy querying

  -- URL being checked
  url TEXT NOT NULL,
  url_type TEXT DEFAULT 'primary' CHECK (url_type IN ('primary', 'portfolio', 'team', 'about', 'contact')),

  -- Fetch results
  fetched_at TIMESTAMPTZ,
  http_status INTEGER,
  response_time_ms INTEGER, -- for monitoring

  -- Caching headers for conditional requests
  etag TEXT,
  last_modified TEXT,

  -- Content analysis
  content_hash TEXT, -- SHA256 of normalized content (for change detection)
  content_length INTEGER,

  -- Extracted data
  extract_json JSONB, -- { tags:[], contacts:[], portfolio:[], keywords:[] }

  -- Diff against current DB
  diff_json JSONB, -- { added:[], removed:[], changed:[] }

  -- Confidence and outcome
  confidence_score INTEGER DEFAULT 0 CHECK (confidence_score BETWEEN 0 AND 100),
  outcome TEXT NOT NULL DEFAULT 'pending' CHECK (outcome IN ('pending', 'no_change', 'changed', 'error', 'blocked', 'timeout', 'not_found')),

  -- Error handling
  error_text TEXT,
  retry_count INTEGER DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_freshness_checks_job ON freshness_checks(job_id);
CREATE INDEX idx_freshness_checks_entity ON freshness_checks(entity_type, entity_id);
CREATE INDEX idx_freshness_checks_outcome ON freshness_checks(outcome);
CREATE INDEX idx_freshness_checks_fetched ON freshness_checks(fetched_at DESC);

-- ============================================================================
-- REVIEW QUEUE (Proposed changes awaiting human approval)
-- ============================================================================

CREATE TABLE IF NOT EXISTS freshness_review_queue (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- What entity this review is for
  entity_type TEXT NOT NULL CHECK (entity_type IN ('org', 'person', 'tool', 'manufacturer', 'startup', 'external')),
  entity_id UUID NOT NULL,
  entity_name TEXT NOT NULL, -- denormalized

  -- The check that triggered this review
  check_id UUID REFERENCES freshness_checks(id) ON DELETE SET NULL,
  job_id UUID REFERENCES freshness_jobs(id) ON DELETE SET NULL,

  -- What changed
  change_type TEXT NOT NULL CHECK (change_type IN ('contact_changed', 'tags_changed', 'portfolio_changed', 'content_changed', 'not_found', 'needs_verification', 'confidence_dropped')),
  change_summary TEXT NOT NULL, -- Human-readable summary
  proposed_changes_json JSONB NOT NULL, -- { field: { old, new }, ... }

  -- Evidence
  evidence_url TEXT,
  evidence_snapshot TEXT, -- relevant excerpt from page

  -- Confidence
  confidence_score INTEGER DEFAULT 50 CHECK (confidence_score BETWEEN 0 AND 100),

  -- Status
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'merged', 'deferred')),
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),

  -- Review tracking
  reviewer_user_id UUID,
  reviewed_at TIMESTAMPTZ,
  review_notes TEXT,

  -- Task draft tracking
  task_draft_id UUID, -- links to task_drafts table when created
  task_draft_created_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_review_queue_status ON freshness_review_queue(status);
CREATE INDEX idx_review_queue_entity ON freshness_review_queue(entity_type, entity_id);
CREATE INDEX idx_review_queue_priority ON freshness_review_queue(priority, created_at DESC);
CREATE INDEX idx_review_queue_pending ON freshness_review_queue(created_at DESC) WHERE status = 'pending';

-- ============================================================================
-- FRESHNESS AUDIT LOG (Track all verification actions)
-- ============================================================================

CREATE TABLE IF NOT EXISTS freshness_audit_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- What was acted on
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  review_id UUID REFERENCES freshness_review_queue(id) ON DELETE SET NULL,

  -- Action
  action TEXT NOT NULL CHECK (action IN ('verified', 'updated', 'approved', 'rejected', 'merged', 'deferred', 'flagged_stale', 'confidence_updated')),

  -- Who and when
  performed_by_user_id UUID,
  performed_at TIMESTAMPTZ DEFAULT NOW(),

  -- Details
  details_json JSONB, -- { old_values, new_values, reason, etc. }

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_freshness_audit_entity ON freshness_audit_log(entity_type, entity_id);
CREATE INDEX idx_freshness_audit_action ON freshness_audit_log(action);
CREATE INDEX idx_freshness_audit_performed ON freshness_audit_log(performed_at DESC);

-- ============================================================================
-- URL FETCH CACHE (Respect HTTP caching, avoid redundant fetches)
-- ============================================================================

CREATE TABLE IF NOT EXISTS freshness_url_cache (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  url TEXT NOT NULL UNIQUE,
  url_domain TEXT NOT NULL, -- for per-domain rate limiting stats

  -- Last fetch info
  last_fetched_at TIMESTAMPTZ NOT NULL,
  last_status INTEGER,
  last_etag TEXT,
  last_modified TEXT,

  -- Content info
  content_hash TEXT,
  content_length INTEGER,

  -- Rate limiting
  fetch_count INTEGER DEFAULT 1,
  consecutive_errors INTEGER DEFAULT 0,

  -- Respect robots.txt
  robots_blocked BOOLEAN DEFAULT FALSE,
  robots_checked_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_url_cache_domain ON freshness_url_cache(url_domain);
CREATE INDEX idx_url_cache_fetched ON freshness_url_cache(last_fetched_at DESC);

-- ============================================================================
-- ADD FIELDS TO EXISTING DIRECTORY TABLES
-- ============================================================================

-- Add freshness tracking fields to directory_orgs if not exists
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'directory_orgs' AND column_name = 'freshness_status') THEN
    ALTER TABLE directory_orgs ADD COLUMN freshness_status TEXT DEFAULT 'unknown' CHECK (freshness_status IN ('fresh', 'stale', 'unknown', 'error'));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'directory_orgs' AND column_name = 'last_check_id') THEN
    ALTER TABLE directory_orgs ADD COLUMN last_check_id UUID;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'directory_orgs' AND column_name = 'portfolio_hash') THEN
    ALTER TABLE directory_orgs ADD COLUMN portfolio_hash TEXT; -- hash of portfolio company list for change detection
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'directory_orgs' AND column_name = 'contact_hash') THEN
    ALTER TABLE directory_orgs ADD COLUMN contact_hash TEXT; -- hash of contact info for change detection
  END IF;
END $$;

-- Add to directory_people
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'directory_people' AND column_name = 'freshness_status') THEN
    ALTER TABLE directory_people ADD COLUMN freshness_status TEXT DEFAULT 'unknown' CHECK (freshness_status IN ('fresh', 'stale', 'unknown', 'error'));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'directory_people' AND column_name = 'last_check_id') THEN
    ALTER TABLE directory_people ADD COLUMN last_check_id UUID;
  END IF;
END $$;

-- Add to directory_ai_tools
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'directory_ai_tools' AND column_name = 'freshness_status') THEN
    ALTER TABLE directory_ai_tools ADD COLUMN freshness_status TEXT DEFAULT 'unknown' CHECK (freshness_status IN ('fresh', 'stale', 'unknown', 'error'));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'directory_ai_tools' AND column_name = 'last_check_id') THEN
    ALTER TABLE directory_ai_tools ADD COLUMN last_check_id UUID;
  END IF;
END $$;

-- Add to directory_manufacturers
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'directory_manufacturers' AND column_name = 'freshness_status') THEN
    ALTER TABLE directory_manufacturers ADD COLUMN freshness_status TEXT DEFAULT 'unknown' CHECK (freshness_status IN ('fresh', 'stale', 'unknown', 'error'));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'directory_manufacturers' AND column_name = 'last_check_id') THEN
    ALTER TABLE directory_manufacturers ADD COLUMN last_check_id UUID;
  END IF;
END $$;

-- Add to external_entities
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'external_entities' AND column_name = 'freshness_status') THEN
    ALTER TABLE external_entities ADD COLUMN freshness_status TEXT DEFAULT 'unknown' CHECK (freshness_status IN ('fresh', 'stale', 'unknown', 'error'));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'external_entities' AND column_name = 'last_check_id') THEN
    ALTER TABLE external_entities ADD COLUMN last_check_id UUID;
  END IF;
END $$;

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Auto-update updated_at
CREATE TRIGGER update_freshness_jobs_updated_at BEFORE UPDATE ON freshness_jobs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_freshness_review_queue_updated_at BEFORE UPDATE ON freshness_review_queue
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_freshness_policies_updated_at BEFORE UPDATE ON freshness_policies
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_freshness_url_cache_updated_at BEFORE UPDATE ON freshness_url_cache
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- RLS POLICIES
-- ============================================================================

-- Freshness tables are admin-only (service role)
ALTER TABLE freshness_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE freshness_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE freshness_checks ENABLE ROW LEVEL SECURITY;
ALTER TABLE freshness_review_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE freshness_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE freshness_url_cache ENABLE ROW LEVEL SECURITY;

-- Public read access for review queue (curators need to see it)
CREATE POLICY freshness_review_queue_public_read ON freshness_review_queue FOR SELECT USING (true);
CREATE POLICY freshness_jobs_public_read ON freshness_jobs FOR SELECT USING (true);
CREATE POLICY freshness_policies_public_read ON freshness_policies FOR SELECT USING (true);

-- No public write access (service role only)

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function to get stale entities for a given org type
CREATE OR REPLACE FUNCTION get_stale_entities(
  p_org_type TEXT,
  p_limit INTEGER DEFAULT 50
)
RETURNS TABLE (
  entity_id UUID,
  entity_type TEXT,
  entity_name TEXT,
  website TEXT,
  last_verified_at TIMESTAMPTZ,
  days_since_verified INTEGER,
  confidence_score INTEGER
) AS $$
DECLARE
  v_stale_days INTEGER;
BEGIN
  -- Get stale threshold from policy
  SELECT stale_after_days INTO v_stale_days
  FROM freshness_policies
  WHERE org_type = p_org_type;

  IF v_stale_days IS NULL THEN
    v_stale_days := 90; -- default
  END IF;

  RETURN QUERY
  SELECT
    d.id AS entity_id,
    'org'::TEXT AS entity_type,
    d.name AS entity_name,
    d.website,
    d.last_verified_at,
    EXTRACT(DAY FROM NOW() - COALESCE(d.last_verified_at, d.created_at))::INTEGER AS days_since_verified,
    d.confidence_score
  FROM directory_orgs d
  WHERE d.org_type = p_org_type
    AND (
      d.last_verified_at IS NULL
      OR d.last_verified_at < NOW() - (v_stale_days || ' days')::INTERVAL
    )
    AND d.website IS NOT NULL
  ORDER BY d.last_verified_at ASC NULLS FIRST
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate overall freshness stats
CREATE OR REPLACE FUNCTION get_freshness_stats()
RETURNS TABLE (
  org_type TEXT,
  total_count BIGINT,
  fresh_count BIGINT,
  stale_count BIGINT,
  unknown_count BIGINT,
  pending_reviews BIGINT,
  avg_confidence NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    d.org_type,
    COUNT(*)::BIGINT AS total_count,
    COUNT(*) FILTER (WHERE d.freshness_status = 'fresh')::BIGINT AS fresh_count,
    COUNT(*) FILTER (WHERE d.freshness_status = 'stale')::BIGINT AS stale_count,
    COUNT(*) FILTER (WHERE d.freshness_status = 'unknown' OR d.freshness_status IS NULL)::BIGINT AS unknown_count,
    (
      SELECT COUNT(*)::BIGINT
      FROM freshness_review_queue r
      WHERE r.entity_id = ANY(ARRAY_AGG(d.id)) AND r.status = 'pending'
    ) AS pending_reviews,
    ROUND(AVG(d.confidence_score)::NUMERIC, 1) AS avg_confidence
  FROM directory_orgs d
  GROUP BY d.org_type
  ORDER BY d.org_type;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE freshness_policies IS 'Configuration for verification frequency and limits per org type';
COMMENT ON TABLE freshness_jobs IS 'Audit trail of verification job runs';
COMMENT ON TABLE freshness_checks IS 'Individual URL check results with extracted data';
COMMENT ON TABLE freshness_review_queue IS 'Proposed changes awaiting human curator approval';
COMMENT ON TABLE freshness_audit_log IS 'Complete audit trail of all verification actions';
COMMENT ON TABLE freshness_url_cache IS 'HTTP caching info to avoid redundant fetches';

COMMENT ON FUNCTION get_stale_entities IS 'Returns entities that need verification based on policy thresholds';
COMMENT ON FUNCTION get_freshness_stats IS 'Returns freshness statistics grouped by org type';
