-- ============================================================================
-- PEOPLE COMPONENT SCHEMA
-- Migration: 008_people_component.sql
-- Created: 2026-01-19
-- Description: Three-layer people data model for Fractional Foundry
-- ============================================================================

-- Enable UUID generation if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- LAYER 1: UNIVERSAL MARKETPLACE (Global, Opt-in, Verified)
-- ============================================================================

-- 1A) universal_people - Core profile data
-- Privacy: Only profile_visibility='marketplace' shown publicly
-- Contact details require explicit opt-in

CREATE TABLE IF NOT EXISTS universal_people (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Basic Info
  display_name TEXT NOT NULL,
  headline TEXT, -- 1-liner description
  bio TEXT, -- longer description

  -- Person Type
  person_type TEXT NOT NULL DEFAULT 'other'
    CHECK (person_type IN (
      'fractional_exec', 'apprentice', 'advisor', 'contractor', 'other'
    )),

  -- Location
  location_city TEXT,
  location_country TEXT DEFAULT 'UK',
  timezone TEXT DEFAULT 'Europe/London',
  remote_ok BOOLEAN DEFAULT TRUE,

  -- Availability
  availability_hours_per_week INTEGER CHECK (availability_hours_per_week >= 0 AND availability_hours_per_week <= 80),
  availability_start_date DATE, -- null = immediately available
  notice_period_weeks INTEGER DEFAULT 0,

  -- Seniority & Role
  seniority_band TEXT DEFAULT 'mid'
    CHECK (seniority_band IN ('junior', 'mid', 'senior', 'exec')),
  role_archetypes TEXT[] DEFAULT '{}', -- e.g., ['fractional_coo', 'fractional_cfo']

  -- Tags
  sector_tags TEXT[] DEFAULT '{}', -- e.g., ['fintech', 'saas']
  skill_tags TEXT[] DEFAULT '{}', -- e.g., ['financial_modeling', 'fundraising']
  stage_fit_tags TEXT[] DEFAULT '{}', -- e.g., ['seed', 'series_a']

  -- Apprentice-specific
  education_status TEXT CHECK (education_status IS NULL OR education_status IN (
    'degree_apprentice', 'final_year', 'graduate', 'career_changer', 'self_taught', 'other'
  )),

  -- Compensation (nullable, only if person chooses to share)
  compensation_preferences_json JSONB,
  -- Structure: { day_rate_min, day_rate_max, equity_interest, retainer_preferred, currency }

  -- Verification & Trust
  verification_status TEXT NOT NULL DEFAULT 'stub'
    CHECK (verification_status IN ('stub', 'invited', 'opted_in', 'verified')),
  profile_visibility TEXT NOT NULL DEFAULT 'private'
    CHECK (profile_visibility IN ('private', 'marketplace')),
  confidence_score INTEGER DEFAULT 50 CHECK (confidence_score >= 0 AND confidence_score <= 100),

  -- Source & Provenance
  source_type TEXT NOT NULL DEFAULT 'manual'
    CHECK (source_type IN ('referral', 'manual', 'import', 'event', 'platform')),
  source_notes TEXT,

  -- Consent tracking
  opted_in_at TIMESTAMPTZ,
  consent_version TEXT, -- track which privacy policy version they agreed to

  -- Current/Last Organization (optional link to directory_orgs)
  current_org_id UUID REFERENCES directory_orgs(id) ON DELETE SET NULL,
  current_org_name TEXT, -- denormalized for display

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_verified_at TIMESTAMPTZ,
  last_active_at TIMESTAMPTZ DEFAULT NOW()
);

-- 1B) universal_people_contacts - Contact points with privacy controls
-- IMPORTANT: Email/phone only marketplace-visible if person opted_in and marked it public

CREATE TABLE IF NOT EXISTS universal_people_contacts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  person_id UUID NOT NULL REFERENCES universal_people(id) ON DELETE CASCADE,

  contact_type TEXT NOT NULL
    CHECK (contact_type IN ('email', 'linkedin', 'website', 'contact_form', 'phone', 'twitter', 'github', 'calendly')),
  contact_value TEXT NOT NULL,

  -- Privacy controls
  visibility TEXT NOT NULL DEFAULT 'private'
    CHECK (visibility IN ('private', 'marketplace')),
  is_public BOOLEAN NOT NULL DEFAULT FALSE,
  is_primary BOOLEAN DEFAULT FALSE,

  -- Verification
  verified_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Prevent duplicate contact types
  UNIQUE(person_id, contact_type, contact_value)
);

-- 1C) universal_people_evidence - CVs, portfolios, certifications

CREATE TABLE IF NOT EXISTS universal_people_evidence (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  person_id UUID NOT NULL REFERENCES universal_people(id) ON DELETE CASCADE,

  evidence_type TEXT NOT NULL
    CHECK (evidence_type IN ('cv', 'portfolio', 'reference', 'certification', 'press', 'linkedin', 'website', 'other')),
  title TEXT, -- e.g., "AWS Solutions Architect Certificate"
  url TEXT NOT NULL,
  notes TEXT,

  -- Verification
  last_verified_at TIMESTAMPTZ,
  confidence_score INTEGER DEFAULT 50 CHECK (confidence_score >= 0 AND confidence_score <= 100),

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 1D) people_invites - Invite tokens for opt-in flow

CREATE TABLE IF NOT EXISTS people_invites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Invite details
  email TEXT NOT NULL,
  token TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),

  -- Who sent the invite
  invited_by_user_id UUID,
  invited_by_workspace_id UUID,

  -- Optional: pre-fill profile data
  prefill_name TEXT,
  prefill_role_archetypes TEXT[],
  prefill_source_notes TEXT,

  -- Status
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'sent', 'opened', 'completed', 'expired', 'cancelled')),

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT NOW() + INTERVAL '30 days',
  sent_at TIMESTAMPTZ,
  opened_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,

  -- Link to created profile
  person_id UUID REFERENCES universal_people(id) ON DELETE SET NULL
);

-- ============================================================================
-- LAYER 2: COMPANY PEOPLE LAYER (Per Tenant: Pipeline + Relationships)
-- ============================================================================

-- 2A) company_people_relationships - Candidate/contractor relationships per workspace

CREATE TABLE IF NOT EXISTS company_people_relationships (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Tenant isolation
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,

  -- The person
  person_id UUID NOT NULL REFERENCES universal_people(id) ON DELETE CASCADE,

  -- Relationship details
  relationship_type TEXT NOT NULL DEFAULT 'candidate'
    CHECK (relationship_type IN (
      'candidate', 'advisor', 'fractional_exec', 'apprentice', 'employee', 'contractor', 'other'
    )),

  -- Pipeline stage
  pipeline_stage TEXT NOT NULL DEFAULT 'identified'
    CHECK (pipeline_stage IN (
      'identified', 'contacted', 'intro_call', 'trial', 'engaged', 'rejected', 'archived'
    )),

  -- Assignment
  owner_user_id UUID, -- who manages this relationship

  -- Signals
  warm_intro_available BOOLEAN DEFAULT FALSE,
  priority TEXT DEFAULT 'med'
    CHECK (priority IN ('low', 'med', 'high', 'urgent')),

  -- Private notes (workspace-only)
  notes_private TEXT,

  -- Role-specific
  target_role_archetype TEXT, -- what role are they being considered for
  target_hours_per_week INTEGER,
  target_start_date DATE,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  stage_changed_at TIMESTAMPTZ DEFAULT NOW(),

  -- Prevent duplicate relationships
  UNIQUE(workspace_id, person_id, relationship_type)
);

-- 2B) company_people_interactions - Log of interactions

CREATE TABLE IF NOT EXISTS company_people_interactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  relationship_id UUID NOT NULL REFERENCES company_people_relationships(id) ON DELETE CASCADE,

  -- Interaction details
  interaction_type TEXT NOT NULL
    CHECK (interaction_type IN ('email', 'call', 'meeting', 'message', 'note', 'interview', 'reference_check')),
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Content
  summary TEXT NOT NULL,
  next_steps TEXT,

  -- Who logged it
  logged_by_user_id UUID,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2C) company_people_docs - Document links (NDAs, contracts, etc.)

CREATE TABLE IF NOT EXISTS company_people_docs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  relationship_id UUID NOT NULL REFERENCES company_people_relationships(id) ON DELETE CASCADE,

  -- Document details
  doc_type TEXT NOT NULL
    CHECK (doc_type IN ('nda', 'contract', 'sow', 'invoice', 'cv', 'reference', 'other')),
  title TEXT,
  url TEXT NOT NULL,
  notes TEXT,

  -- Who uploaded
  uploaded_by_user_id UUID,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- LAYER 3: PERSONAL CONTACTS LAYER (Per User: Private Network)
-- ============================================================================

-- 3A) personal_contacts - User's private network for warm intros

CREATE TABLE IF NOT EXISTS personal_contacts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- User isolation (NOT workspace - truly personal)
  user_id UUID NOT NULL,

  -- Can link to universal_people or directory_orgs
  person_id UUID REFERENCES universal_people(id) ON DELETE SET NULL,
  org_id UUID REFERENCES directory_orgs(id) ON DELETE SET NULL,

  -- If not linked to universal record, store name
  contact_name TEXT,
  contact_org_name TEXT,

  -- Relationship info
  label TEXT, -- e.g., "Former colleague", "University friend"
  relationship_strength TEXT DEFAULT 'medium'
    CHECK (relationship_strength IN ('weak', 'medium', 'strong')),

  -- Warm intro signals
  warm_intro_notes TEXT, -- how they could help
  last_contacted_at TIMESTAMPTZ,

  -- Privacy
  do_not_contact BOOLEAN DEFAULT FALSE,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- User must have at least person_id OR contact_name
  CONSTRAINT personal_contacts_has_identifier
    CHECK (person_id IS NOT NULL OR contact_name IS NOT NULL)
);

-- ============================================================================
-- SEARCH SUPPORT
-- ============================================================================

-- Search index for fast full-text search
CREATE TABLE IF NOT EXISTS people_search_index (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  person_id UUID NOT NULL REFERENCES universal_people(id) ON DELETE CASCADE,

  -- Searchable text (combined from multiple fields)
  searchable_text TEXT NOT NULL,
  tags_text TEXT, -- concatenated tags for filtering

  -- Denormalized for filtering
  person_type TEXT,
  seniority_band TEXT,
  verification_status TEXT,
  profile_visibility TEXT,
  location_country TEXT,
  remote_ok BOOLEAN,

  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(person_id)
);

-- Full-text search index
CREATE INDEX IF NOT EXISTS idx_people_search_text
  ON people_search_index USING gin(to_tsvector('english', searchable_text));

-- ============================================================================
-- INDEXES
-- ============================================================================

-- universal_people indexes
CREATE INDEX IF NOT EXISTS idx_universal_people_visibility
  ON universal_people(verification_status, profile_visibility);

CREATE INDEX IF NOT EXISTS idx_universal_people_type
  ON universal_people(person_type);

CREATE INDEX IF NOT EXISTS idx_universal_people_seniority
  ON universal_people(seniority_band);

CREATE INDEX IF NOT EXISTS idx_universal_people_location
  ON universal_people(location_country, remote_ok);

-- GIN indexes for array columns
CREATE INDEX IF NOT EXISTS idx_universal_people_role_archetypes
  ON universal_people USING gin(role_archetypes);

CREATE INDEX IF NOT EXISTS idx_universal_people_sector_tags
  ON universal_people USING gin(sector_tags);

CREATE INDEX IF NOT EXISTS idx_universal_people_skill_tags
  ON universal_people USING gin(skill_tags);

CREATE INDEX IF NOT EXISTS idx_universal_people_stage_fit
  ON universal_people USING gin(stage_fit_tags);

-- universal_people_contacts indexes
CREATE INDEX IF NOT EXISTS idx_universal_people_contacts_person
  ON universal_people_contacts(person_id);

CREATE INDEX IF NOT EXISTS idx_universal_people_contacts_visibility
  ON universal_people_contacts(visibility, is_public);

-- company_people_relationships indexes
CREATE INDEX IF NOT EXISTS idx_company_people_rel_workspace
  ON company_people_relationships(workspace_id);

CREATE INDEX IF NOT EXISTS idx_company_people_rel_pipeline
  ON company_people_relationships(workspace_id, pipeline_stage);

CREATE INDEX IF NOT EXISTS idx_company_people_rel_type
  ON company_people_relationships(workspace_id, relationship_type);

CREATE INDEX IF NOT EXISTS idx_company_people_rel_owner
  ON company_people_relationships(owner_user_id);

-- personal_contacts indexes
CREATE INDEX IF NOT EXISTS idx_personal_contacts_user
  ON personal_contacts(user_id);

CREATE INDEX IF NOT EXISTS idx_personal_contacts_person
  ON personal_contacts(person_id) WHERE person_id IS NOT NULL;

-- people_invites indexes
CREATE INDEX IF NOT EXISTS idx_people_invites_token
  ON people_invites(token);

CREATE INDEX IF NOT EXISTS idx_people_invites_email
  ON people_invites(email);

CREATE INDEX IF NOT EXISTS idx_people_invites_status
  ON people_invites(status);

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE universal_people ENABLE ROW LEVEL SECURITY;
ALTER TABLE universal_people_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE universal_people_evidence ENABLE ROW LEVEL SECURITY;
ALTER TABLE people_invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_people_relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_people_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_people_docs ENABLE ROW LEVEL SECURITY;
ALTER TABLE personal_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE people_search_index ENABLE ROW LEVEL SECURITY;

-- Universal People: Public marketplace profiles are readable by all authenticated
CREATE POLICY universal_people_marketplace_read ON universal_people
  FOR SELECT
  USING (
    profile_visibility = 'marketplace'
    AND verification_status IN ('opted_in', 'verified')
  );

-- Universal People: Users can read stubs they created (via relationships)
CREATE POLICY universal_people_stub_owner_read ON universal_people
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM company_people_relationships cpr
      JOIN members m ON m.workspace_id = cpr.workspace_id
      WHERE cpr.person_id = universal_people.id
      AND m.user_id = auth.uid()
    )
  );

-- Universal People Contacts: Only visible if person is marketplace AND contact is public
CREATE POLICY universal_people_contacts_read ON universal_people_contacts
  FOR SELECT
  USING (
    visibility = 'marketplace'
    AND is_public = TRUE
    AND EXISTS (
      SELECT 1 FROM universal_people up
      WHERE up.id = universal_people_contacts.person_id
      AND up.profile_visibility = 'marketplace'
      AND up.verification_status IN ('opted_in', 'verified')
    )
  );

-- Universal People Contacts: Stub owners can see private contacts
CREATE POLICY universal_people_contacts_owner_read ON universal_people_contacts
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM company_people_relationships cpr
      JOIN members m ON m.workspace_id = cpr.workspace_id
      WHERE cpr.person_id = universal_people_contacts.person_id
      AND m.user_id = auth.uid()
    )
  );

-- Universal People Evidence: Same rules as contacts
CREATE POLICY universal_people_evidence_read ON universal_people_evidence
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM universal_people up
      WHERE up.id = universal_people_evidence.person_id
      AND (
        (up.profile_visibility = 'marketplace' AND up.verification_status IN ('opted_in', 'verified'))
        OR EXISTS (
          SELECT 1 FROM company_people_relationships cpr
          JOIN members m ON m.workspace_id = cpr.workspace_id
          WHERE cpr.person_id = up.id
          AND m.user_id = auth.uid()
        )
      )
    )
  );

-- People Invites: Only inviters and admins can see
CREATE POLICY people_invites_read ON people_invites
  FOR SELECT
  USING (invited_by_user_id = auth.uid());

-- Company People Relationships: Workspace members only
CREATE POLICY company_people_rel_read ON company_people_relationships
  FOR SELECT
  USING (
    workspace_id IN (
      SELECT workspace_id FROM members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY company_people_rel_insert ON company_people_relationships
  FOR INSERT
  WITH CHECK (
    workspace_id IN (
      SELECT workspace_id FROM members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY company_people_rel_update ON company_people_relationships
  FOR UPDATE
  USING (
    workspace_id IN (
      SELECT workspace_id FROM members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY company_people_rel_delete ON company_people_relationships
  FOR DELETE
  USING (
    workspace_id IN (
      SELECT workspace_id FROM members WHERE user_id = auth.uid()
    )
  );

-- Company People Interactions: Via relationship access
CREATE POLICY company_people_interactions_read ON company_people_interactions
  FOR SELECT
  USING (
    relationship_id IN (
      SELECT id FROM company_people_relationships
      WHERE workspace_id IN (
        SELECT workspace_id FROM members WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY company_people_interactions_insert ON company_people_interactions
  FOR INSERT
  WITH CHECK (
    relationship_id IN (
      SELECT id FROM company_people_relationships
      WHERE workspace_id IN (
        SELECT workspace_id FROM members WHERE user_id = auth.uid()
      )
    )
  );

-- Company People Docs: Via relationship access
CREATE POLICY company_people_docs_read ON company_people_docs
  FOR SELECT
  USING (
    relationship_id IN (
      SELECT id FROM company_people_relationships
      WHERE workspace_id IN (
        SELECT workspace_id FROM members WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY company_people_docs_insert ON company_people_docs
  FOR INSERT
  WITH CHECK (
    relationship_id IN (
      SELECT id FROM company_people_relationships
      WHERE workspace_id IN (
        SELECT workspace_id FROM members WHERE user_id = auth.uid()
      )
    )
  );

-- Personal Contacts: User only
CREATE POLICY personal_contacts_read ON personal_contacts
  FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY personal_contacts_insert ON personal_contacts
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY personal_contacts_update ON personal_contacts
  FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY personal_contacts_delete ON personal_contacts
  FOR DELETE
  USING (user_id = auth.uid());

-- People Search Index: Same as universal_people
CREATE POLICY people_search_index_read ON people_search_index
  FOR SELECT
  USING (
    profile_visibility = 'marketplace'
    AND verification_status IN ('opted_in', 'verified')
  );

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION update_people_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER universal_people_updated_at
  BEFORE UPDATE ON universal_people
  FOR EACH ROW EXECUTE FUNCTION update_people_updated_at();

CREATE TRIGGER universal_people_contacts_updated_at
  BEFORE UPDATE ON universal_people_contacts
  FOR EACH ROW EXECUTE FUNCTION update_people_updated_at();

CREATE TRIGGER universal_people_evidence_updated_at
  BEFORE UPDATE ON universal_people_evidence
  FOR EACH ROW EXECUTE FUNCTION update_people_updated_at();

CREATE TRIGGER company_people_rel_updated_at
  BEFORE UPDATE ON company_people_relationships
  FOR EACH ROW EXECUTE FUNCTION update_people_updated_at();

CREATE TRIGGER company_people_docs_updated_at
  BEFORE UPDATE ON company_people_docs
  FOR EACH ROW EXECUTE FUNCTION update_people_updated_at();

CREATE TRIGGER personal_contacts_updated_at
  BEFORE UPDATE ON personal_contacts
  FOR EACH ROW EXECUTE FUNCTION update_people_updated_at();

-- Update pipeline stage timestamp
CREATE OR REPLACE FUNCTION update_pipeline_stage_changed()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.pipeline_stage IS DISTINCT FROM NEW.pipeline_stage THEN
    NEW.stage_changed_at = NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER company_people_rel_stage_changed
  BEFORE UPDATE ON company_people_relationships
  FOR EACH ROW EXECUTE FUNCTION update_pipeline_stage_changed();

-- Sync search index when person is updated
CREATE OR REPLACE FUNCTION sync_people_search_index()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO people_search_index (
    person_id,
    searchable_text,
    tags_text,
    person_type,
    seniority_band,
    verification_status,
    profile_visibility,
    location_country,
    remote_ok
  )
  VALUES (
    NEW.id,
    COALESCE(NEW.display_name, '') || ' ' ||
    COALESCE(NEW.headline, '') || ' ' ||
    COALESCE(NEW.bio, '') || ' ' ||
    COALESCE(NEW.location_city, '') || ' ' ||
    COALESCE(NEW.location_country, ''),
    array_to_string(NEW.role_archetypes, ' ') || ' ' ||
    array_to_string(NEW.sector_tags, ' ') || ' ' ||
    array_to_string(NEW.skill_tags, ' ') || ' ' ||
    array_to_string(NEW.stage_fit_tags, ' '),
    NEW.person_type,
    NEW.seniority_band,
    NEW.verification_status,
    NEW.profile_visibility,
    NEW.location_country,
    NEW.remote_ok
  )
  ON CONFLICT (person_id) DO UPDATE SET
    searchable_text = EXCLUDED.searchable_text,
    tags_text = EXCLUDED.tags_text,
    person_type = EXCLUDED.person_type,
    seniority_band = EXCLUDED.seniority_band,
    verification_status = EXCLUDED.verification_status,
    profile_visibility = EXCLUDED.profile_visibility,
    location_country = EXCLUDED.location_country,
    remote_ok = EXCLUDED.remote_ok,
    updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER universal_people_search_sync
  AFTER INSERT OR UPDATE ON universal_people
  FOR EACH ROW EXECUTE FUNCTION sync_people_search_index();

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Search marketplace people
CREATE OR REPLACE FUNCTION search_marketplace_people(
  p_query TEXT DEFAULT NULL,
  p_person_type TEXT DEFAULT NULL,
  p_seniority_band TEXT DEFAULT NULL,
  p_role_archetypes TEXT[] DEFAULT NULL,
  p_sector_tags TEXT[] DEFAULT NULL,
  p_skill_tags TEXT[] DEFAULT NULL,
  p_stage_fit_tags TEXT[] DEFAULT NULL,
  p_location_country TEXT DEFAULT NULL,
  p_remote_ok BOOLEAN DEFAULT NULL,
  p_min_hours INTEGER DEFAULT NULL,
  p_max_hours INTEGER DEFAULT NULL,
  p_limit INTEGER DEFAULT 20,
  p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  display_name TEXT,
  headline TEXT,
  person_type TEXT,
  seniority_band TEXT,
  role_archetypes TEXT[],
  sector_tags TEXT[],
  skill_tags TEXT[],
  stage_fit_tags TEXT[],
  location_city TEXT,
  location_country TEXT,
  remote_ok BOOLEAN,
  availability_hours_per_week INTEGER,
  verification_status TEXT,
  confidence_score INTEGER,
  last_active_at TIMESTAMPTZ,
  match_score INTEGER
)
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    up.id,
    up.display_name,
    up.headline,
    up.person_type,
    up.seniority_band,
    up.role_archetypes,
    up.sector_tags,
    up.skill_tags,
    up.stage_fit_tags,
    up.location_city,
    up.location_country,
    up.remote_ok,
    up.availability_hours_per_week,
    up.verification_status,
    up.confidence_score,
    up.last_active_at,
    -- Calculate match score
    (
      -- Role archetype match
      CASE WHEN p_role_archetypes IS NOT NULL AND up.role_archetypes && p_role_archetypes THEN 20 ELSE 0 END +
      -- Sector match
      CASE WHEN p_sector_tags IS NOT NULL AND up.sector_tags && p_sector_tags THEN 15 ELSE 0 END +
      -- Stage fit match
      CASE WHEN p_stage_fit_tags IS NOT NULL AND up.stage_fit_tags && p_stage_fit_tags THEN 15 ELSE 0 END +
      -- Verification bonus
      CASE WHEN up.verification_status = 'verified' THEN 10
           WHEN up.verification_status = 'opted_in' THEN 5
           ELSE 0 END +
      -- Confidence score factor
      (up.confidence_score / 10) +
      -- Recency bonus
      CASE WHEN up.last_active_at > NOW() - INTERVAL '30 days' THEN 10
           WHEN up.last_active_at > NOW() - INTERVAL '90 days' THEN 5
           ELSE 0 END
    )::INTEGER as match_score
  FROM universal_people up
  WHERE
    -- Must be marketplace visible
    up.profile_visibility = 'marketplace'
    AND up.verification_status IN ('opted_in', 'verified')
    -- Optional filters
    AND (p_person_type IS NULL OR up.person_type = p_person_type)
    AND (p_seniority_band IS NULL OR up.seniority_band = p_seniority_band)
    AND (p_role_archetypes IS NULL OR up.role_archetypes && p_role_archetypes)
    AND (p_sector_tags IS NULL OR up.sector_tags && p_sector_tags)
    AND (p_skill_tags IS NULL OR up.skill_tags && p_skill_tags)
    AND (p_stage_fit_tags IS NULL OR up.stage_fit_tags && p_stage_fit_tags)
    AND (p_location_country IS NULL OR up.location_country = p_location_country OR up.remote_ok = TRUE)
    AND (p_remote_ok IS NULL OR up.remote_ok = p_remote_ok OR p_remote_ok = FALSE)
    AND (p_min_hours IS NULL OR up.availability_hours_per_week >= p_min_hours)
    AND (p_max_hours IS NULL OR up.availability_hours_per_week <= p_max_hours)
    -- Text search
    AND (p_query IS NULL OR EXISTS (
      SELECT 1 FROM people_search_index psi
      WHERE psi.person_id = up.id
      AND to_tsvector('english', psi.searchable_text) @@ plainto_tsquery('english', p_query)
    ))
  ORDER BY match_score DESC, up.last_active_at DESC NULLS LAST
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;

-- Get pipeline stats for workspace
CREATE OR REPLACE FUNCTION get_people_pipeline_stats(p_workspace_id UUID)
RETURNS TABLE (
  pipeline_stage TEXT,
  relationship_type TEXT,
  count BIGINT
)
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    cpr.pipeline_stage,
    cpr.relationship_type,
    COUNT(*)::BIGINT
  FROM company_people_relationships cpr
  WHERE cpr.workspace_id = p_workspace_id
  GROUP BY cpr.pipeline_stage, cpr.relationship_type
  ORDER BY cpr.pipeline_stage, cpr.relationship_type;
END;
$$;

-- Get warm intro opportunities for a workspace
CREATE OR REPLACE FUNCTION get_warm_intro_opportunities(
  p_workspace_id UUID,
  p_target_person_id UUID DEFAULT NULL
)
RETURNS TABLE (
  contact_user_id UUID,
  contact_user_name TEXT,
  person_id UUID,
  person_name TEXT,
  relationship_strength TEXT,
  warm_intro_notes TEXT
)
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    pc.user_id as contact_user_id,
    m.name as contact_user_name,
    pc.person_id,
    up.display_name as person_name,
    pc.relationship_strength,
    pc.warm_intro_notes
  FROM personal_contacts pc
  JOIN members m ON m.user_id = pc.user_id
  JOIN universal_people up ON up.id = pc.person_id
  WHERE m.workspace_id = p_workspace_id
    AND pc.person_id IS NOT NULL
    AND pc.do_not_contact = FALSE
    AND pc.relationship_strength IN ('medium', 'strong')
    AND (p_target_person_id IS NULL OR pc.person_id = p_target_person_id);
END;
$$;

-- ============================================================================
-- SEED DATA: Apprentice Role Packs
-- ============================================================================

CREATE TABLE IF NOT EXISTS apprentice_role_packs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  name TEXT NOT NULL UNIQUE,
  description TEXT,

  -- Defaults for this pack
  role_archetype TEXT NOT NULL,
  skill_requirements TEXT[] DEFAULT '{}',
  typical_hours_per_week INTEGER DEFAULT 24,

  -- Task templates to generate
  task_templates_json JSONB NOT NULL DEFAULT '[]',
  -- Structure: [{ title, notes, source }]

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Insert default packs
INSERT INTO apprentice_role_packs (name, description, role_archetype, skill_requirements, typical_hours_per_week, task_templates_json)
VALUES
  ('Finance Apprentice', 'Support for FP&A, bookkeeping, and financial operations', 'apprentice_finance',
   ARRAY['financial_modeling', 'budgeting', 'fp_and_a'],
   24,
   '[
     {"title": "Draft finance apprentice job posting", "notes": "Create job posting for finance apprentice role. Include: responsibilities (FP&A support, bookkeeping, financial modeling), requirements (Excel proficiency, attention to detail, learning mindset), hours and compensation.", "source": "people_apprentice_pack"},
     {"title": "Set up screening criteria for finance apprentice", "notes": "Define screening criteria: Excel test, numerical reasoning assessment, basic accounting knowledge check.", "source": "people_apprentice_pack"},
     {"title": "Prepare interview scorecard for finance skills", "notes": "Create structured interview scorecard covering: analytical ability, attention to detail, communication skills, learning agility, cultural fit.", "source": "people_apprentice_pack"},
     {"title": "Create finance onboarding checklist", "notes": "Prepare onboarding materials: accounting software access, financial templates, process documentation, training schedule.", "source": "people_apprentice_pack"}
   ]'::JSONB),

  ('Ops Apprentice', 'Support for process optimization, admin, and operations', 'apprentice_ops',
   ARRAY['process_optimization', 'project_management', 'vendor_management'],
   32,
   '[
     {"title": "Draft ops apprentice job posting", "notes": "Create job posting for ops apprentice role. Include: responsibilities (process documentation, vendor coordination, project support), requirements (organizational skills, proactive mindset).", "source": "people_apprentice_pack"},
     {"title": "Set up screening criteria for ops apprentice", "notes": "Define screening criteria: organizational assessment, problem-solving scenarios, communication test.", "source": "people_apprentice_pack"},
     {"title": "Prepare interview scorecard for ops skills", "notes": "Create structured interview scorecard covering: problem-solving, organization, communication, initiative, adaptability.", "source": "people_apprentice_pack"},
     {"title": "Create ops onboarding checklist", "notes": "Prepare onboarding materials: tool access, process documentation, vendor contacts, project overview.", "source": "people_apprentice_pack"}
   ]'::JSONB),

  ('CAD/Engineering Apprentice', 'Support for mechanical design and product development', 'apprentice_cad',
   ARRAY['hardware_development', 'manufacturing_ops'],
   32,
   '[
     {"title": "Draft CAD apprentice job posting", "notes": "Create job posting for CAD/engineering apprentice. Include: responsibilities (CAD modeling, drawing creation, BOM management), requirements (SolidWorks/Fusion 360, basic manufacturing knowledge).", "source": "people_apprentice_pack"},
     {"title": "Set up screening criteria for CAD skills", "notes": "Define screening criteria: CAD proficiency test, GD&T knowledge check, design challenge.", "source": "people_apprentice_pack"},
     {"title": "Prepare practical CAD assessment task", "notes": "Create timed CAD assessment: model a component from drawing, create assembly, generate production drawing.", "source": "people_apprentice_pack"},
     {"title": "Create engineering onboarding checklist", "notes": "Prepare onboarding: CAD licenses, design standards, PDM access, manufacturing partner contacts.", "source": "people_apprentice_pack"}
   ]'::JSONB),

  ('Sales Apprentice', 'Support for lead generation and business development', 'apprentice_sales',
   ARRAY['sales_enablement', 'demand_gen'],
   40,
   '[
     {"title": "Draft sales apprentice job posting", "notes": "Create job posting for sales apprentice (SDR). Include: responsibilities (lead research, outreach, qualification), requirements (communication skills, resilience, CRM familiarity).", "source": "people_apprentice_pack"},
     {"title": "Set up screening criteria for sales aptitude", "notes": "Define screening criteria: communication assessment, cold call roleplay, objection handling scenarios.", "source": "people_apprentice_pack"},
     {"title": "Prepare sales roleplay assessment", "notes": "Create roleplay scenarios: cold call, discovery call, objection handling, follow-up email.", "source": "people_apprentice_pack"},
     {"title": "Create sales onboarding checklist", "notes": "Prepare onboarding: CRM access, sales playbook, product training, shadowing schedule.", "source": "people_apprentice_pack"}
   ]'::JSONB)
ON CONFLICT (name) DO NOTHING;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE universal_people IS 'Global talent directory - opt-in profiles for fractional execs, apprentices, advisors';
COMMENT ON TABLE universal_people_contacts IS 'Contact information with privacy controls - only visible if person opted in and marked public';
COMMENT ON TABLE universal_people_evidence IS 'Supporting evidence: CVs, portfolios, certifications, references';
COMMENT ON TABLE people_invites IS 'Invite tokens for opt-in onboarding flow';
COMMENT ON TABLE company_people_relationships IS 'Per-workspace talent relationships and hiring pipeline';
COMMENT ON TABLE company_people_interactions IS 'Log of interactions with candidates/contractors';
COMMENT ON TABLE company_people_docs IS 'Document links (NDAs, contracts) - stored externally, only URLs here';
COMMENT ON TABLE personal_contacts IS 'Private contact network for warm intros - visible only to owner';
COMMENT ON TABLE people_search_index IS 'Full-text search index for marketplace profiles';
COMMENT ON TABLE apprentice_role_packs IS 'Pre-configured templates for common apprentice hiring needs';
