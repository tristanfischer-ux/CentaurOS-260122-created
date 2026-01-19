-- ============================================================================
-- PEOPLE SEEDING SYSTEM SCHEMA
-- Migration: 009_people_seeding.sql
-- Created: 2026-01-19
-- Description: Seeding, invites, partnerships, and verification workflow
-- ============================================================================

-- Enable UUID generation if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- PARTNER ORGANIZATIONS (Universities, Bootcamps, Providers)
-- ============================================================================

CREATE TABLE IF NOT EXISTS partner_orgs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Basic Info
  name TEXT NOT NULL,
  org_type TEXT NOT NULL DEFAULT 'university'
    CHECK (org_type IN ('university', 'bootcamp', 'provider', 'community', 'other')),
  region TEXT DEFAULT 'UK',

  -- Contact
  contact_name TEXT,
  contact_email TEXT,
  contact_url TEXT,

  -- Status
  status TEXT NOT NULL DEFAULT 'not_contacted'
    CHECK (status IN ('not_contacted', 'contacted', 'in_conversation', 'active', 'paused', 'declined')),

  -- Tracking
  volume_estimate INTEGER, -- Expected candidates per year
  quality_score INTEGER CHECK (quality_score IS NULL OR (quality_score >= 1 AND quality_score <= 5)),
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),

  -- Notes
  notes TEXT,
  last_contacted_at TIMESTAMPTZ,
  next_followup_at TIMESTAMPTZ,

  -- Workspace
  workspace_id UUID,
  created_by_user_id UUID,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- SEED BATCHES (Track upload batches for auditing)
-- ============================================================================

CREATE TABLE IF NOT EXISTS seed_batches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Batch Info
  source_type TEXT NOT NULL CHECK (source_type IN ('network', 'event', 'import', 'manual')),
  source_name TEXT, -- e.g., "TechCrunch Disrupt 2026" for events

  -- Stats
  total_rows INTEGER DEFAULT 0,
  created_count INTEGER DEFAULT 0,
  duplicate_count INTEGER DEFAULT 0,
  error_count INTEGER DEFAULT 0,

  -- Metadata
  raw_data_json JSONB, -- Original upload for audit
  error_details_json JSONB, -- Any errors during processing

  -- Workspace
  workspace_id UUID,
  created_by_user_id UUID,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- VERIFICATION AUDIT LOG
-- ============================================================================

CREATE TABLE IF NOT EXISTS verification_audit_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Person
  person_id UUID NOT NULL REFERENCES universal_people(id) ON DELETE CASCADE,

  -- Action
  action TEXT NOT NULL CHECK (action IN ('verify', 'unverify', 'flag', 'update_visibility')),
  previous_status TEXT,
  new_status TEXT,
  previous_visibility TEXT,
  new_visibility TEXT,

  -- Checklist (what was verified)
  checklist_json JSONB,
  -- Structure: { linkedin_confirmed, role_history_checked, evidence_count, references_checked, notes }

  -- User
  verified_by_user_id UUID,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- APPRENTICE APPLICATIONS (Pre-profile submissions)
-- ============================================================================

CREATE TABLE IF NOT EXISTS apprentice_applications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Submitted Info
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  linkedin_url TEXT,
  education_status TEXT CHECK (education_status IN (
    'degree_apprentice', 'final_year', 'graduate', 'career_changer', 'self_taught', 'other'
  )),

  -- Interests
  interests_json JSONB, -- Array of role archetypes/sectors
  availability_hours_per_week INTEGER,
  availability_start_date DATE,
  location_city TEXT,
  location_country TEXT DEFAULT 'UK',
  remote_ok BOOLEAN DEFAULT TRUE,

  -- Additional
  bio TEXT,
  portfolio_url TEXT,
  referral_source TEXT,

  -- Status
  status TEXT NOT NULL DEFAULT 'new'
    CHECK (status IN ('new', 'screening', 'interview', 'offer', 'accepted', 'rejected', 'withdrawn')),

  -- Converted to person
  converted_person_id UUID REFERENCES universal_people(id) ON DELETE SET NULL,

  -- Workspace (for tracking which workspace received the app)
  workspace_id UUID,
  processed_by_user_id UUID,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  processed_at TIMESTAMPTZ
);

-- ============================================================================
-- INVITE TRACKING ENHANCEMENTS
-- ============================================================================

-- Add columns to people_invites if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'people_invites' AND column_name = 'person_id') THEN
    ALTER TABLE people_invites ADD COLUMN person_id UUID REFERENCES universal_people(id) ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'people_invites' AND column_name = 'invite_type') THEN
    ALTER TABLE people_invites ADD COLUMN invite_type TEXT DEFAULT 'marketplace'
      CHECK (invite_type IN ('marketplace', 'apprentice', 'partner'));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'people_invites' AND column_name = 'template_used') THEN
    ALTER TABLE people_invites ADD COLUMN template_used TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'people_invites' AND column_name = 'channel') THEN
    ALTER TABLE people_invites ADD COLUMN channel TEXT DEFAULT 'email'
      CHECK (channel IN ('email', 'linkedin', 'other'));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'people_invites' AND column_name = 'followup_count') THEN
    ALTER TABLE people_invites ADD COLUMN followup_count INTEGER DEFAULT 0;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'people_invites' AND column_name = 'last_followup_at') THEN
    ALTER TABLE people_invites ADD COLUMN last_followup_at TIMESTAMPTZ;
  END IF;
END $$;

-- ============================================================================
-- INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_partner_orgs_status ON partner_orgs(status);
CREATE INDEX IF NOT EXISTS idx_partner_orgs_org_type ON partner_orgs(org_type);
CREATE INDEX IF NOT EXISTS idx_partner_orgs_workspace ON partner_orgs(workspace_id);

CREATE INDEX IF NOT EXISTS idx_seed_batches_workspace ON seed_batches(workspace_id);
CREATE INDEX IF NOT EXISTS idx_seed_batches_source ON seed_batches(source_type);

CREATE INDEX IF NOT EXISTS idx_verification_audit_person ON verification_audit_log(person_id);
CREATE INDEX IF NOT EXISTS idx_verification_audit_created ON verification_audit_log(created_at);

CREATE INDEX IF NOT EXISTS idx_apprentice_apps_status ON apprentice_applications(status);
CREATE INDEX IF NOT EXISTS idx_apprentice_apps_email ON apprentice_applications(email);
CREATE INDEX IF NOT EXISTS idx_apprentice_apps_workspace ON apprentice_applications(workspace_id);

CREATE INDEX IF NOT EXISTS idx_people_invites_person ON people_invites(person_id);
CREATE INDEX IF NOT EXISTS idx_people_invites_status ON people_invites(status);

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function to check for duplicates during seed upload
CREATE OR REPLACE FUNCTION check_person_duplicates(
  p_linkedin_url TEXT,
  p_name TEXT,
  p_email TEXT DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  display_name TEXT,
  linkedin_url TEXT,
  match_type TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    up.id,
    up.display_name,
    (SELECT upc.contact_value FROM universal_people_contacts upc
     WHERE upc.person_id = up.id AND upc.contact_type = 'linkedin' LIMIT 1) as linkedin_url,
    CASE
      WHEN EXISTS (
        SELECT 1 FROM universal_people_contacts upc
        WHERE upc.person_id = up.id
        AND upc.contact_type = 'linkedin'
        AND upc.contact_value = p_linkedin_url
      ) THEN 'linkedin_match'
      WHEN LOWER(TRIM(up.display_name)) = LOWER(TRIM(p_name)) THEN 'name_match'
      WHEN p_email IS NOT NULL AND EXISTS (
        SELECT 1 FROM universal_people_contacts upc
        WHERE upc.person_id = up.id
        AND upc.contact_type = 'email'
        AND upc.contact_value = LOWER(p_email)
      ) THEN 'email_match'
      ELSE NULL
    END as match_type
  FROM universal_people up
  WHERE
    -- LinkedIn URL match
    EXISTS (
      SELECT 1 FROM universal_people_contacts upc
      WHERE upc.person_id = up.id
      AND upc.contact_type = 'linkedin'
      AND upc.contact_value = p_linkedin_url
    )
    OR
    -- Name match (exact, case-insensitive)
    LOWER(TRIM(up.display_name)) = LOWER(TRIM(p_name))
    OR
    -- Email match
    (p_email IS NOT NULL AND EXISTS (
      SELECT 1 FROM universal_people_contacts upc
      WHERE upc.person_id = up.id
      AND upc.contact_type = 'email'
      AND upc.contact_value = LOWER(p_email)
    ));
END;
$$ LANGUAGE plpgsql;

-- Function to get seeding dashboard stats
CREATE OR REPLACE FUNCTION get_seeding_stats(p_workspace_id UUID DEFAULT NULL)
RETURNS TABLE (
  stat_type TEXT,
  stat_key TEXT,
  stat_value BIGINT
) AS $$
BEGIN
  RETURN QUERY

  -- Verification status counts
  SELECT 'verification_status'::TEXT, up.verification_status::TEXT, COUNT(*)::BIGINT
  FROM universal_people up
  GROUP BY up.verification_status

  UNION ALL

  -- Person type counts
  SELECT 'person_type'::TEXT, up.person_type::TEXT, COUNT(*)::BIGINT
  FROM universal_people up
  GROUP BY up.person_type

  UNION ALL

  -- Invite status counts
  SELECT 'invite_status'::TEXT, pi.status::TEXT, COUNT(*)::BIGINT
  FROM people_invites pi
  WHERE (p_workspace_id IS NULL OR pi.invited_by_workspace_id = p_workspace_id)
  GROUP BY pi.status

  UNION ALL

  -- Partner org counts by status
  SELECT 'partner_status'::TEXT, po.status::TEXT, COUNT(*)::BIGINT
  FROM partner_orgs po
  WHERE (p_workspace_id IS NULL OR po.workspace_id = p_workspace_id)
  GROUP BY po.status

  UNION ALL

  -- Apprentice application counts
  SELECT 'apprentice_app_status'::TEXT, aa.status::TEXT, COUNT(*)::BIGINT
  FROM apprentice_applications aa
  WHERE (p_workspace_id IS NULL OR aa.workspace_id = p_workspace_id)
  GROUP BY aa.status

  UNION ALL

  -- Stale invites (14+ days, no response)
  SELECT 'stale_invites'::TEXT, 'count'::TEXT, COUNT(*)::BIGINT
  FROM people_invites pi
  WHERE pi.status IN ('pending', 'sent')
  AND pi.created_at < NOW() - INTERVAL '14 days'
  AND (p_workspace_id IS NULL OR pi.invited_by_workspace_id = p_workspace_id);

END;
$$ LANGUAGE plpgsql;

-- Function to get stale stubs for follow-up
CREATE OR REPLACE FUNCTION get_stale_invites(
  p_workspace_id UUID,
  p_days_stale INTEGER DEFAULT 14
)
RETURNS TABLE (
  invite_id UUID,
  person_id UUID,
  person_name TEXT,
  email TEXT,
  linkedin_url TEXT,
  invited_at TIMESTAMPTZ,
  days_since_invite INTEGER,
  followup_count INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    pi.id as invite_id,
    pi.person_id,
    COALESCE(up.display_name, pi.prefill_name) as person_name,
    pi.email,
    (SELECT upc.contact_value FROM universal_people_contacts upc
     WHERE upc.person_id = pi.person_id AND upc.contact_type = 'linkedin' LIMIT 1) as linkedin_url,
    pi.created_at as invited_at,
    EXTRACT(DAY FROM NOW() - pi.created_at)::INTEGER as days_since_invite,
    COALESCE(pi.followup_count, 0) as followup_count
  FROM people_invites pi
  LEFT JOIN universal_people up ON up.id = pi.person_id
  WHERE pi.status IN ('pending', 'sent')
  AND pi.created_at < NOW() - (p_days_stale || ' days')::INTERVAL
  AND (p_workspace_id IS NULL OR pi.invited_by_workspace_id = p_workspace_id)
  ORDER BY pi.created_at ASC;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Update timestamps
CREATE OR REPLACE FUNCTION update_seeding_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_partner_orgs_updated ON partner_orgs;
CREATE TRIGGER trg_partner_orgs_updated
  BEFORE UPDATE ON partner_orgs
  FOR EACH ROW EXECUTE FUNCTION update_seeding_timestamp();

DROP TRIGGER IF EXISTS trg_apprentice_apps_updated ON apprentice_applications;
CREATE TRIGGER trg_apprentice_apps_updated
  BEFORE UPDATE ON apprentice_applications
  FOR EACH ROW EXECUTE FUNCTION update_seeding_timestamp();

-- ============================================================================
-- RLS POLICIES
-- ============================================================================

-- Enable RLS
ALTER TABLE partner_orgs ENABLE ROW LEVEL SECURITY;
ALTER TABLE seed_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE verification_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE apprentice_applications ENABLE ROW LEVEL SECURITY;

-- Partner orgs: workspace members can view/edit
CREATE POLICY "partner_orgs_workspace_access" ON partner_orgs
  FOR ALL USING (
    workspace_id IS NULL OR
    EXISTS (
      SELECT 1 FROM workspace_members wm
      WHERE wm.workspace_id = partner_orgs.workspace_id
      AND wm.user_id = auth.uid()
    )
  );

-- Seed batches: workspace members can view
CREATE POLICY "seed_batches_workspace_access" ON seed_batches
  FOR ALL USING (
    workspace_id IS NULL OR
    EXISTS (
      SELECT 1 FROM workspace_members wm
      WHERE wm.workspace_id = seed_batches.workspace_id
      AND wm.user_id = auth.uid()
    )
  );

-- Verification audit: workspace members can view
CREATE POLICY "verification_audit_workspace_access" ON verification_audit_log
  FOR SELECT USING (TRUE);

CREATE POLICY "verification_audit_insert" ON verification_audit_log
  FOR INSERT WITH CHECK (TRUE);

-- Apprentice applications: workspace members can view/edit
CREATE POLICY "apprentice_apps_workspace_access" ON apprentice_applications
  FOR ALL USING (
    workspace_id IS NULL OR
    EXISTS (
      SELECT 1 FROM workspace_members wm
      WHERE wm.workspace_id = apprentice_applications.workspace_id
      AND wm.user_id = auth.uid()
    )
  );

-- Public insert for apprentice applications (anyone can apply)
CREATE POLICY "apprentice_apps_public_insert" ON apprentice_applications
  FOR INSERT WITH CHECK (TRUE);
