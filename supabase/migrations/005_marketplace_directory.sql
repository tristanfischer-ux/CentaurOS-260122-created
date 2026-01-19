-- Marketplace Directory Schema
-- Migration 005: Curated marketplace directory for UK hardware startup ecosystem
-- Created: 2026-01-19

-- ============================================================================
-- CURATED LAYER (High-signal, verified data)
-- ============================================================================

-- Organizations (VCs, Law Firms, Accountancies, Manufacturers)
CREATE TABLE IF NOT EXISTS directory_orgs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  org_type TEXT NOT NULL CHECK (org_type IN ('VC', 'PE', 'Angel', 'LawFirm', 'Accountancy', 'Manufacturer', 'Advisor')),
  website TEXT,
  website_domain TEXT, -- normalized for deduplication
  companies_house_number TEXT,
  hq_city TEXT,
  hq_country TEXT DEFAULT 'UK',
  regions TEXT[] DEFAULT '{}', -- ['UK-wide', 'London', 'Scotland', etc.]
  sector_focus TEXT[] DEFAULT '{}', -- ['robotics', 'deeptech', 'medtech']
  stage_focus TEXT[] DEFAULT '{}', -- ['seed', 'series_a', 'series_b']
  capability_tags TEXT[] DEFAULT '{}', -- ['cnc', 'iso13485', 'eis', 'seis']
  description_1liner TEXT,
  preferred_contact_method TEXT CHECK (preferred_contact_method IN ('email', 'contact_form', 'linkedin', 'phone')),
  notes TEXT, -- short factual notes
  confidence_score INTEGER DEFAULT 80 CHECK (confidence_score BETWEEN 0 AND 100),
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
CREATE INDEX idx_directory_orgs_name ON directory_orgs(LOWER(name));
CREATE INDEX idx_directory_orgs_domain ON directory_orgs(website_domain) WHERE website_domain IS NOT NULL;

-- People (Individual contacts)
CREATE TABLE IF NOT EXISTS directory_people (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  full_name TEXT NOT NULL,
  role_title TEXT,
  org_id UUID REFERENCES directory_orgs(id) ON DELETE CASCADE,
  org_name TEXT, -- denormalized for queries
  focus_tags TEXT[] DEFAULT '{}', -- ['deeptech', 'hardware', 'venture']
  regions TEXT[] DEFAULT '{}',
  confidence_score INTEGER DEFAULT 80 CHECK (confidence_score BETWEEN 0 AND 100),
  last_verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_directory_people_org ON directory_people(org_id);
CREATE INDEX idx_directory_people_name ON directory_people(LOWER(full_name));
CREATE INDEX idx_directory_people_focus ON directory_people USING GIN(focus_tags);

-- Contact Points (email, phone, LinkedIn, contact forms)
CREATE TABLE IF NOT EXISTS directory_contacts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID REFERENCES directory_orgs(id) ON DELETE CASCADE,
  person_id UUID REFERENCES directory_people(id) ON DELETE CASCADE,
  contact_type TEXT NOT NULL CHECK (contact_type IN ('email', 'phone', 'contact_form', 'linkedin')),
  contact_value TEXT NOT NULL,
  is_primary BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CHECK ((org_id IS NOT NULL AND person_id IS NULL) OR (org_id IS NULL AND person_id IS NOT NULL))
);

CREATE INDEX idx_directory_contacts_org ON directory_contacts(org_id) WHERE org_id IS NOT NULL;
CREATE INDEX idx_directory_contacts_person ON directory_contacts(person_id) WHERE person_id IS NOT NULL;
CREATE INDEX idx_directory_contacts_type ON directory_contacts(contact_type);

-- Evidence (Source URLs with verification metadata)
CREATE TABLE IF NOT EXISTS directory_evidence (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID REFERENCES directory_orgs(id) ON DELETE CASCADE,
  person_id UUID REFERENCES directory_people(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  last_verified TIMESTAMPTZ NOT NULL,
  confidence_score INTEGER DEFAULT 80 CHECK (confidence_score BETWEEN 0 AND 100),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CHECK ((org_id IS NOT NULL AND person_id IS NULL) OR (org_id IS NULL AND person_id IS NOT NULL))
);

CREATE INDEX idx_directory_evidence_org ON directory_evidence(org_id) WHERE org_id IS NOT NULL;
CREATE INDEX idx_directory_evidence_person ON directory_evidence(person_id) WHERE person_id IS NOT NULL;

-- Portfolio Links (Investor → Company relationships)
CREATE TABLE IF NOT EXISTS directory_portfolio_links (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  investor_org_id UUID REFERENCES directory_orgs(id) ON DELETE CASCADE,
  investor_org_name TEXT NOT NULL, -- denormalized
  company_name TEXT NOT NULL,
  company_id UUID REFERENCES directory_startups(id) ON DELETE SET NULL, -- optional link
  round_type TEXT, -- 'seed', 'series_a', etc.
  round_date DATE,
  role TEXT CHECK (role IN ('lead', 'participant', 'unknown')),
  confidence_score INTEGER DEFAULT 70 CHECK (confidence_score BETWEEN 0 AND 100),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_directory_portfolio_investor ON directory_portfolio_links(investor_org_id);
CREATE INDEX idx_directory_portfolio_company ON directory_portfolio_links(LOWER(company_name));
CREATE INDEX idx_directory_portfolio_round ON directory_portfolio_links(round_type);

-- Hardware Startups Reference Set (UK hardware startups for context)
CREATE TABLE IF NOT EXISTS directory_startups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_name TEXT NOT NULL,
  companies_house_number TEXT,
  website TEXT,
  website_domain TEXT,
  sector_tags TEXT[] DEFAULT '{}', -- ['robotics', 'IoT', 'medtech']
  hq_region TEXT,
  stage_guess TEXT CHECK (stage_guess IN ('pre-seed', 'seed', 'series_a', 'series_b', 'series_c', 'growth', 'public', 'acquired', 'unknown')),
  known_backers TEXT[] DEFAULT '{}', -- array of investor names
  confidence_score INTEGER DEFAULT 70 CHECK (confidence_score BETWEEN 0 AND 100),
  last_verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(website_domain) WHERE website_domain IS NOT NULL,
  UNIQUE(companies_house_number) WHERE companies_house_number IS NOT NULL
);

CREATE INDEX idx_directory_startups_name ON directory_startups(LOWER(company_name));
CREATE INDEX idx_directory_startups_sectors ON directory_startups USING GIN(sector_tags);
CREATE INDEX idx_directory_startups_stage ON directory_startups(stage_guess);
CREATE INDEX idx_directory_startups_domain ON directory_startups(website_domain) WHERE website_domain IS NOT NULL;

-- AI Tools Catalog (Commercial AI tools by business function)
CREATE TABLE IF NOT EXISTS directory_ai_tools (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tool_name TEXT NOT NULL,
  vendor_name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('sales', 'marketing', 'ops', 'finance', 'design', 'manufacturing', 'procurement', 'support')),
  subcategories TEXT[] DEFAULT '{}', -- ['crm', 'forecasting', 'lead_scoring']
  target_user TEXT, -- 'founder', 'sales', 'ops', 'engineer'
  pricing_model TEXT CHECK (pricing_model IN ('free', 'freemium', 'paid', 'enterprise', 'unknown')),
  website TEXT,
  confidence_score INTEGER DEFAULT 80 CHECK (confidence_score BETWEEN 0 AND 100),
  last_verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_directory_ai_tools_category ON directory_ai_tools(category);
CREATE INDEX idx_directory_ai_tools_vendor ON directory_ai_tools(LOWER(vendor_name));
CREATE INDEX idx_directory_ai_tools_pricing ON directory_ai_tools(pricing_model);
CREATE INDEX idx_directory_ai_tools_subcategories ON directory_ai_tools USING GIN(subcategories);

-- Manufacturing Providers (UK + global networks)
CREATE TABLE IF NOT EXISTS directory_manufacturers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  provider_name TEXT NOT NULL,
  provider_type TEXT NOT NULL CHECK (provider_type IN ('network', 'bureau', 'ems', 'machine_shop', 'platform')),
  regions TEXT[] DEFAULT '{}',
  capabilities TEXT[] DEFAULT '{}', -- ['cnc', 'laser_cutting', 'sls', 'injection_molding', 'pcba']
  certifications TEXT[] DEFAULT '{}', -- ['ISO 9001', 'ISO 13485', 'AS9100']
  website TEXT,
  confidence_score INTEGER DEFAULT 80 CHECK (confidence_score BETWEEN 0 AND 100),
  last_verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_directory_manufacturers_type ON directory_manufacturers(provider_type);
CREATE INDEX idx_directory_manufacturers_regions ON directory_manufacturers USING GIN(regions);
CREATE INDEX idx_directory_manufacturers_capabilities ON directory_manufacturers USING GIN(capabilities);
CREATE INDEX idx_directory_manufacturers_certs ON directory_manufacturers USING GIN(certifications);

-- ============================================================================
-- EXTERNAL LAYER (Unverified, lower confidence)
-- ============================================================================

CREATE TABLE IF NOT EXISTS external_entities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  website TEXT,
  website_domain TEXT,
  tags TEXT[] DEFAULT '{}',
  confidence_score INTEGER DEFAULT 50 CHECK (confidence_score BETWEEN 0 AND 100),
  source TEXT, -- where data came from
  last_verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_external_entities_type ON external_entities(entity_type);
CREATE INDEX idx_external_entities_tags ON external_entities USING GIN(tags);

CREATE TABLE IF NOT EXISTS external_contacts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  entity_id UUID REFERENCES external_entities(id) ON DELETE CASCADE,
  contact_type TEXT NOT NULL,
  contact_value TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_external_contacts_entity ON external_contacts(entity_id);

CREATE TABLE IF NOT EXISTS external_evidence (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  entity_id UUID REFERENCES external_entities(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  last_verified TIMESTAMPTZ NOT NULL,
  confidence_score INTEGER DEFAULT 50 CHECK (confidence_score BETWEEN 0 AND 100),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_external_evidence_entity ON external_evidence(entity_id);

-- ============================================================================
-- PROVENANCE (Audit trail for imports)
-- ============================================================================

CREATE TABLE IF NOT EXISTS import_runs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  source_file TEXT NOT NULL, -- 'orgs.json', 'people.json', etc.
  run_type TEXT NOT NULL CHECK (run_type IN ('full', 'incremental', 'dry_run')),
  status TEXT NOT NULL CHECK (status IN ('running', 'success', 'partial_success', 'failed')),
  records_processed INTEGER DEFAULT 0,
  records_inserted INTEGER DEFAULT 0,
  records_updated INTEGER DEFAULT 0,
  records_failed INTEGER DEFAULT 0,
  error_summary JSONB,
  started_at TIMESTAMPTZ NOT NULL,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_import_runs_file ON import_runs(source_file);
CREATE INDEX idx_import_runs_status ON import_runs(status);
CREATE INDEX idx_import_runs_started ON import_runs(started_at DESC);

CREATE TABLE IF NOT EXISTS import_row_errors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  run_id UUID REFERENCES import_runs(id) ON DELETE CASCADE,
  source_file TEXT NOT NULL,
  row_index INTEGER,
  row_data JSONB,
  error_message TEXT NOT NULL,
  error_type TEXT, -- 'validation', 'duplicate', 'constraint', 'unknown'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_import_row_errors_run ON import_row_errors(run_id);
CREATE INDEX idx_import_row_errors_type ON import_row_errors(error_type);

-- ============================================================================
-- FUNCTIONS & TRIGGERS
-- ============================================================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_directory_orgs_updated_at BEFORE UPDATE ON directory_orgs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_directory_people_updated_at BEFORE UPDATE ON directory_people
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_directory_startups_updated_at BEFORE UPDATE ON directory_startups
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_directory_ai_tools_updated_at BEFORE UPDATE ON directory_ai_tools
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_directory_manufacturers_updated_at BEFORE UPDATE ON directory_manufacturers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_directory_portfolio_links_updated_at BEFORE UPDATE ON directory_portfolio_links
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- RLS POLICIES (Public read access for marketplace data)
-- ============================================================================

-- All marketplace data is public-read (no auth required for browsing)
-- Only admins can write (handled via service role key in ingestion scripts)

ALTER TABLE directory_orgs ENABLE ROW LEVEL SECURITY;
ALTER TABLE directory_people ENABLE ROW LEVEL SECURITY;
ALTER TABLE directory_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE directory_evidence ENABLE ROW LEVEL SECURITY;
ALTER TABLE directory_portfolio_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE directory_startups ENABLE ROW LEVEL SECURITY;
ALTER TABLE directory_ai_tools ENABLE ROW LEVEL SECURITY;
ALTER TABLE directory_manufacturers ENABLE ROW LEVEL SECURITY;

-- Public read policies
CREATE POLICY directory_orgs_public_read ON directory_orgs FOR SELECT USING (true);
CREATE POLICY directory_people_public_read ON directory_people FOR SELECT USING (true);
CREATE POLICY directory_contacts_public_read ON directory_contacts FOR SELECT USING (true);
CREATE POLICY directory_evidence_public_read ON directory_evidence FOR SELECT USING (true);
CREATE POLICY directory_portfolio_links_public_read ON directory_portfolio_links FOR SELECT USING (true);
CREATE POLICY directory_startups_public_read ON directory_startups FOR SELECT USING (true);
CREATE POLICY directory_ai_tools_public_read ON directory_ai_tools FOR SELECT USING (true);
CREATE POLICY directory_manufacturers_public_read ON directory_manufacturers FOR SELECT USING (true);

-- External layer policies (also public read)
ALTER TABLE external_entities ENABLE ROW LEVEL SECURITY;
ALTER TABLE external_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE external_evidence ENABLE ROW LEVEL SECURITY;

CREATE POLICY external_entities_public_read ON external_entities FOR SELECT USING (true);
CREATE POLICY external_contacts_public_read ON external_contacts FOR SELECT USING (true);
CREATE POLICY external_evidence_public_read ON external_evidence FOR SELECT USING (true);

-- Provenance tables (admin only, no public access)
ALTER TABLE import_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE import_row_errors ENABLE ROW LEVEL SECURITY;

-- No public policies for import tables (service role only)

-- ============================================================================
-- COMMENTS (Documentation)
-- ============================================================================

COMMENT ON TABLE directory_orgs IS 'Curated directory of VCs, law firms, accountancies, and manufacturers';
COMMENT ON TABLE directory_people IS 'Individual contacts at directory organizations';
COMMENT ON TABLE directory_contacts IS 'Contact points (email, phone, LinkedIn) for orgs and people';
COMMENT ON TABLE directory_evidence IS 'Source URLs with verification metadata for curated data';
COMMENT ON TABLE directory_portfolio_links IS 'Investor→company relationships (portfolio tracking)';
COMMENT ON TABLE directory_startups IS 'UK hardware startups reference set';
COMMENT ON TABLE directory_ai_tools IS 'Commercial AI tools catalog by business function';
COMMENT ON TABLE directory_manufacturers IS 'Manufacturing providers (UK focus + global networks)';
COMMENT ON TABLE external_entities IS 'Unverified entities from external sources (lower confidence)';
COMMENT ON TABLE import_runs IS 'Audit trail of data ingestion runs';
COMMENT ON TABLE import_row_errors IS 'Failed rows from ingestion with error details';
