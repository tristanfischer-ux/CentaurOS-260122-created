-- Portfolio Relationship Refresh System
-- Migration 007: Dedicated portfolio tracking for VCs/PEs
-- Created: 2026-01-19
--
-- Maintains accurate VC/PE portfolio relationships by:
-- 1) Tracking portfolio page URLs and their content
-- 2) Extracting and versioning portfolio company lists
-- 3) Detecting additions/removals/renames
-- 4) Proposing changes via review queue (never auto-apply)

-- ============================================================================
-- PORTFOLIO PAGES (Where to find portfolio lists)
-- ============================================================================

CREATE TABLE IF NOT EXISTS directory_portfolio_pages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  investor_org_id UUID NOT NULL REFERENCES directory_orgs(id) ON DELETE CASCADE,

  -- URL info
  portfolio_url TEXT NOT NULL,
  portfolio_url_domain TEXT,

  -- Discovery
  discovery_method TEXT NOT NULL DEFAULT 'manual' CHECK (discovery_method IN ('manual', 'auto', 'evidence')),
  discovered_at TIMESTAMPTZ DEFAULT NOW(),

  -- Content tracking
  last_checked_at TIMESTAMPTZ,
  last_content_hash TEXT, -- SHA256 of normalized content
  last_http_status INTEGER,
  last_etag TEXT,
  last_modified TEXT,

  -- Quality
  confidence_score INTEGER DEFAULT 70 CHECK (confidence_score BETWEEN 0 AND 100),
  extraction_quality TEXT DEFAULT 'unknown' CHECK (extraction_quality IN ('high', 'medium', 'low', 'uncertain', 'unknown')),
  extraction_notes TEXT, -- reason for quality rating

  -- State
  is_primary BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(investor_org_id, portfolio_url)
);

CREATE INDEX idx_portfolio_pages_investor ON directory_portfolio_pages(investor_org_id);
CREATE INDEX idx_portfolio_pages_active ON directory_portfolio_pages(is_active, last_checked_at);
CREATE INDEX idx_portfolio_pages_quality ON directory_portfolio_pages(extraction_quality);

-- ============================================================================
-- PORTFOLIO COMPANIES (Tracked portfolio holdings)
-- ============================================================================

CREATE TABLE IF NOT EXISTS directory_portfolio_companies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  investor_org_id UUID NOT NULL REFERENCES directory_orgs(id) ON DELETE CASCADE,

  -- Company info (as extracted)
  company_name TEXT NOT NULL,
  company_name_normalized TEXT NOT NULL, -- lowercase, trimmed, no Ltd/Inc
  company_website TEXT,
  company_domain TEXT, -- extracted domain for deduplication
  company_logo_url TEXT,

  -- Source
  source_portfolio_page_id UUID REFERENCES directory_portfolio_pages(id) ON DELETE SET NULL,
  source_portfolio_url TEXT,
  source_href TEXT, -- the actual href from the portfolio page

  -- Link to our startup database (if matched)
  matched_startup_id UUID REFERENCES directory_startups(id) ON DELETE SET NULL,
  match_confidence INTEGER CHECK (match_confidence BETWEEN 0 AND 100),

  -- Lifecycle tracking
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'removed_pending_review', 'removed', 'exited', 'acquired', 'unknown')),
  first_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  removed_at TIMESTAMPTZ,

  -- Quality
  confidence_score INTEGER DEFAULT 70 CHECK (confidence_score BETWEEN 0 AND 100),

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Unique constraint: one company per investor (by domain if available, else normalized name)
  UNIQUE(investor_org_id, company_domain) WHERE company_domain IS NOT NULL,
  UNIQUE(investor_org_id, company_name_normalized) WHERE company_domain IS NULL
);

CREATE INDEX idx_portfolio_companies_investor ON directory_portfolio_companies(investor_org_id);
CREATE INDEX idx_portfolio_companies_status ON directory_portfolio_companies(status);
CREATE INDEX idx_portfolio_companies_name ON directory_portfolio_companies(company_name_normalized);
CREATE INDEX idx_portfolio_companies_domain ON directory_portfolio_companies(company_domain) WHERE company_domain IS NOT NULL;
CREATE INDEX idx_portfolio_companies_last_seen ON directory_portfolio_companies(last_seen_at DESC);
CREATE INDEX idx_portfolio_companies_matched ON directory_portfolio_companies(matched_startup_id) WHERE matched_startup_id IS NOT NULL;

-- ============================================================================
-- PORTFOLIO CHANGE SETS (Detected changes awaiting review)
-- ============================================================================

CREATE TABLE IF NOT EXISTS portfolio_change_sets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- What we're tracking
  investor_org_id UUID NOT NULL REFERENCES directory_orgs(id) ON DELETE CASCADE,
  investor_org_name TEXT NOT NULL, -- denormalized
  portfolio_page_id UUID REFERENCES directory_portfolio_pages(id) ON DELETE SET NULL,
  portfolio_url TEXT NOT NULL,

  -- Detection info
  detected_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  job_id UUID REFERENCES freshness_jobs(id) ON DELETE SET NULL,
  check_id UUID REFERENCES freshness_checks(id) ON DELETE SET NULL,

  -- Changes
  added_companies_json JSONB NOT NULL DEFAULT '[]'::JSONB, -- [{name, website?, domain?, href?}]
  removed_companies_json JSONB NOT NULL DEFAULT '[]'::JSONB, -- [{name, domain?, last_seen_at}]
  renamed_companies_json JSONB NOT NULL DEFAULT '[]'::JSONB, -- [{old_name, new_name, domain?, confidence}]
  unchanged_count INTEGER DEFAULT 0,

  -- Confidence
  extraction_quality TEXT DEFAULT 'unknown' CHECK (extraction_quality IN ('high', 'medium', 'low', 'uncertain', 'unknown')),
  confidence_score INTEGER DEFAULT 50 CHECK (confidence_score BETWEEN 0 AND 100),
  notes TEXT,

  -- Review tracking
  review_queue_id UUID REFERENCES freshness_review_queue(id) ON DELETE SET NULL,
  task_draft_id UUID, -- references task_drafts

  -- Status
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'merged', 'deferred')),
  reviewed_by_user_id UUID,
  reviewed_at TIMESTAMPTZ,
  review_notes TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_portfolio_change_sets_investor ON portfolio_change_sets(investor_org_id);
CREATE INDEX idx_portfolio_change_sets_status ON portfolio_change_sets(status);
CREATE INDEX idx_portfolio_change_sets_pending ON portfolio_change_sets(created_at DESC) WHERE status = 'pending';
CREATE INDEX idx_portfolio_change_sets_job ON portfolio_change_sets(job_id);

-- ============================================================================
-- PORTFOLIO REFRESH POLICIES (Extension to freshness_policies)
-- ============================================================================

-- Add portfolio-specific fields to policies if not exists
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'freshness_policies' AND column_name = 'portfolio_refresh_enabled') THEN
    ALTER TABLE freshness_policies ADD COLUMN portfolio_refresh_enabled BOOLEAN DEFAULT TRUE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'freshness_policies' AND column_name = 'portfolio_frequency_days') THEN
    ALTER TABLE freshness_policies ADD COLUMN portfolio_frequency_days INTEGER DEFAULT 14;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'freshness_policies' AND column_name = 'portfolio_stale_after_days') THEN
    ALTER TABLE freshness_policies ADD COLUMN portfolio_stale_after_days INTEGER DEFAULT 30;
  END IF;
END $$;

-- Update VC/PE/Angel policies with portfolio settings
UPDATE freshness_policies
SET
  portfolio_refresh_enabled = TRUE,
  portfolio_frequency_days = CASE
    WHEN org_type = 'VC' THEN 7
    WHEN org_type = 'PE' THEN 14
    WHEN org_type = 'Angel' THEN 21
    ELSE 30
  END,
  portfolio_stale_after_days = CASE
    WHEN org_type = 'VC' THEN 30
    WHEN org_type = 'PE' THEN 45
    WHEN org_type = 'Angel' THEN 60
    ELSE 90
  END
WHERE org_type IN ('VC', 'PE', 'Angel');

-- ============================================================================
-- ADD ACCELERATOR TYPE IF NOT EXISTS
-- ============================================================================

-- Accelerators are also investors
DO $$
BEGIN
  -- Check if Accelerator is allowed in org_type
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'directory_orgs_org_type_check'
  ) THEN
    -- If no constraint, org_type may be TEXT without check
    NULL;
  ELSE
    -- Try to add Accelerator to the check constraint
    BEGIN
      ALTER TABLE directory_orgs DROP CONSTRAINT IF EXISTS directory_orgs_org_type_check;
      ALTER TABLE directory_orgs ADD CONSTRAINT directory_orgs_org_type_check
        CHECK (org_type IN ('VC', 'PE', 'Angel', 'LawFirm', 'Accountancy', 'Manufacturer', 'Advisor', 'Accelerator', 'AngelNetwork'));
    EXCEPTION WHEN OTHERS THEN
      NULL; -- Constraint might not exist or be named differently
    END;
  END IF;
END $$;

-- Add Accelerator policy if not exists
INSERT INTO freshness_policies (org_type, default_frequency_days, stale_after_days, max_urls_per_run, max_requests_per_minute, priority, portfolio_refresh_enabled, portfolio_frequency_days, portfolio_stale_after_days)
VALUES ('Accelerator', 21, 90, 50, 8, 60, TRUE, 14, 45)
ON CONFLICT (org_type) DO NOTHING;

-- ============================================================================
-- AUDIT LOG FOR PORTFOLIO CHANGES
-- ============================================================================

CREATE TABLE IF NOT EXISTS portfolio_audit_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- What was acted on
  investor_org_id UUID NOT NULL,
  change_set_id UUID REFERENCES portfolio_change_sets(id) ON DELETE SET NULL,

  -- Action
  action TEXT NOT NULL CHECK (action IN (
    'companies_added',
    'companies_removed',
    'companies_renamed',
    'change_set_approved',
    'change_set_rejected',
    'change_set_merged',
    'portfolio_page_added',
    'portfolio_page_updated',
    'manual_edit'
  )),

  -- Who and when
  performed_by_user_id UUID,
  performed_at TIMESTAMPTZ DEFAULT NOW(),

  -- Details
  details_json JSONB,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_portfolio_audit_investor ON portfolio_audit_log(investor_org_id);
CREATE INDEX idx_portfolio_audit_change_set ON portfolio_audit_log(change_set_id);
CREATE INDEX idx_portfolio_audit_action ON portfolio_audit_log(action);
CREATE INDEX idx_portfolio_audit_performed ON portfolio_audit_log(performed_at DESC);

-- ============================================================================
-- TRIGGERS
-- ============================================================================

CREATE TRIGGER update_portfolio_pages_updated_at BEFORE UPDATE ON directory_portfolio_pages
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_portfolio_companies_updated_at BEFORE UPDATE ON directory_portfolio_companies
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_portfolio_change_sets_updated_at BEFORE UPDATE ON portfolio_change_sets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- RLS POLICIES
-- ============================================================================

ALTER TABLE directory_portfolio_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE directory_portfolio_companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolio_change_sets ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolio_audit_log ENABLE ROW LEVEL SECURITY;

-- Public read for portfolio data
CREATE POLICY portfolio_pages_public_read ON directory_portfolio_pages FOR SELECT USING (true);
CREATE POLICY portfolio_companies_public_read ON directory_portfolio_companies FOR SELECT USING (true);
CREATE POLICY portfolio_change_sets_public_read ON portfolio_change_sets FOR SELECT USING (true);

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Get investors with stale portfolios
CREATE OR REPLACE FUNCTION get_stale_portfolio_investors(
  p_limit INTEGER DEFAULT 50
)
RETURNS TABLE (
  investor_org_id UUID,
  investor_name TEXT,
  org_type TEXT,
  website TEXT,
  portfolio_url TEXT,
  last_checked_at TIMESTAMPTZ,
  days_since_checked INTEGER
) AS $$
BEGIN
  RETURN QUERY
  WITH investor_pages AS (
    SELECT
      o.id AS investor_org_id,
      o.name AS investor_name,
      o.org_type,
      o.website,
      pp.portfolio_url,
      pp.last_checked_at,
      COALESCE(fp.portfolio_stale_after_days, 30) AS stale_days
    FROM directory_orgs o
    LEFT JOIN directory_portfolio_pages pp ON pp.investor_org_id = o.id AND pp.is_primary = TRUE
    LEFT JOIN freshness_policies fp ON fp.org_type = o.org_type
    WHERE o.org_type IN ('VC', 'PE', 'Angel', 'Accelerator', 'AngelNetwork')
      AND o.website IS NOT NULL
      AND COALESCE(fp.portfolio_refresh_enabled, TRUE) = TRUE
  )
  SELECT
    ip.investor_org_id,
    ip.investor_name,
    ip.org_type,
    ip.website,
    ip.portfolio_url,
    ip.last_checked_at,
    EXTRACT(DAY FROM NOW() - COALESCE(ip.last_checked_at, ip.investor_org_id::TEXT::TIMESTAMPTZ - INTERVAL '1 year'))::INTEGER AS days_since_checked
  FROM investor_pages ip
  WHERE ip.last_checked_at IS NULL
     OR ip.last_checked_at < NOW() - (ip.stale_days || ' days')::INTERVAL
  ORDER BY ip.last_checked_at ASC NULLS FIRST
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- Get portfolio statistics
CREATE OR REPLACE FUNCTION get_portfolio_stats()
RETURNS TABLE (
  total_investors BIGINT,
  investors_with_portfolios BIGINT,
  total_portfolio_companies BIGINT,
  active_companies BIGINT,
  pending_changes BIGINT,
  avg_confidence NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    (SELECT COUNT(*) FROM directory_orgs WHERE org_type IN ('VC', 'PE', 'Angel', 'Accelerator', 'AngelNetwork'))::BIGINT AS total_investors,
    (SELECT COUNT(DISTINCT investor_org_id) FROM directory_portfolio_pages WHERE is_active = TRUE)::BIGINT AS investors_with_portfolios,
    (SELECT COUNT(*) FROM directory_portfolio_companies)::BIGINT AS total_portfolio_companies,
    (SELECT COUNT(*) FROM directory_portfolio_companies WHERE status = 'active')::BIGINT AS active_companies,
    (SELECT COUNT(*) FROM portfolio_change_sets WHERE status = 'pending')::BIGINT AS pending_changes,
    (SELECT ROUND(AVG(confidence_score)::NUMERIC, 1) FROM directory_portfolio_companies WHERE status = 'active') AS avg_confidence;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE directory_portfolio_pages IS 'Portfolio page URLs for each investor org';
COMMENT ON TABLE directory_portfolio_companies IS 'Portfolio companies tracked for each investor';
COMMENT ON TABLE portfolio_change_sets IS 'Detected portfolio changes awaiting review';
COMMENT ON TABLE portfolio_audit_log IS 'Audit trail for portfolio relationship changes';

COMMENT ON FUNCTION get_stale_portfolio_investors IS 'Returns investors whose portfolios need checking';
COMMENT ON FUNCTION get_portfolio_stats IS 'Returns aggregate portfolio tracking statistics';
