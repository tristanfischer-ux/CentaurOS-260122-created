-- ============================================================================
-- CENTAUR OS - THREE-TIER DATABASE ARCHITECTURE
-- ============================================================================
-- This schema implements a complete three-tier architecture:
-- TIER 1: MARKETPLACE (shared by all users)
-- TIER 2: COMPANY (per workspace)
-- TIER 3: USER (per individual)
-- ============================================================================

-- ============================================================================
-- TIER 1: MARKETPLACE DATABASE (Shared by ALL users)
-- ============================================================================

-- Suppliers - Companies offering services
CREATE TABLE IF NOT EXISTS public.suppliers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  logo_url TEXT,
  website TEXT,
  capabilities TEXT[] DEFAULT '{}', -- Array: manufacturing, design, engineering, etc.
  status TEXT NOT NULL DEFAULT 'pending_approval' CHECK (status IN ('pending_approval', 'verified', 'suspended')),
  contact_email TEXT,
  location TEXT,
  rating_average DECIMAL(3,2) DEFAULT 0.00 CHECK (rating_average >= 0 AND rating_average <= 5),
  review_count INTEGER DEFAULT 0,
  owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE, -- User who created this listing
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- AI Tools - Catalog of available AI agents
CREATE TABLE IF NOT EXISTS public.ai_tools (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  icon_url TEXT,
  category TEXT NOT NULL CHECK (category IN ('productivity', 'coding', 'design', 'marketing', 'data_analysis', 'customer_support', 'other')),
  provider TEXT, -- OpenAI, Anthropic, Google, etc.
  pricing_model TEXT NOT NULL CHECK (pricing_model IN ('free', 'subscription', 'per_use', 'enterprise')),
  capabilities TEXT[] DEFAULT '{}', -- Array of what it can do
  multiplier_effect DECIMAL(3,2) DEFAULT 1.00, -- Productivity boost factor (1.5 = 50% boost)
  is_active BOOLEAN DEFAULT true,
  monthly_cost DECIMAL(10,2), -- For subscription models
  per_use_cost DECIMAL(10,2), -- For per-use models
  documentation_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Executive Listings - Executives available for fractional work
CREATE TABLE IF NOT EXISTS public.executive_listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  business_function TEXT NOT NULL CHECK (business_function IN ('marketing', 'sales', 'finance', 'engineering', 'operations', 'admin', 'product', 'hr')),
  title TEXT NOT NULL, -- e.g., "Fractional CFO", "Head of Marketing"
  bio TEXT,
  skills TEXT[] DEFAULT '{}',
  day_rate DECIMAL(10,2),
  availability_hours_per_week INTEGER,
  visibility TEXT NOT NULL DEFAULT 'public' CHECK (visibility IN ('public', 'unlisted', 'private')),
  is_verified BOOLEAN DEFAULT false,
  rating_average DECIMAL(3,2) DEFAULT 0.00 CHECK (rating_average >= 0 AND rating_average <= 5),
  review_count INTEGER DEFAULT 0,
  portfolio_url TEXT,
  linkedin_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Apprentice Listings - Apprentices available for work
CREATE TABLE IF NOT EXISTS public.apprentice_listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  skills TEXT[] DEFAULT '{}',
  learning_goals TEXT[] DEFAULT '{}',
  hourly_rate DECIMAL(10,2),
  availability_hours_per_week INTEGER,
  portfolio_url TEXT,
  visibility TEXT NOT NULL DEFAULT 'public' CHECK (visibility IN ('public', 'unlisted', 'private')),
  is_verified BOOLEAN DEFAULT false,
  rating_average DECIMAL(3,2) DEFAULT 0.00 CHECK (rating_average >= 0 AND rating_average <= 5),
  review_count INTEGER DEFAULT 0,
  github_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Marketplace Reviews - Reviews for any marketplace listing
CREATE TABLE IF NOT EXISTS public.marketplace_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reviewer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  listing_type TEXT NOT NULL CHECK (listing_type IN ('supplier', 'executive', 'apprentice', 'ai_tool')),
  listing_id UUID NOT NULL, -- References the specific listing (polymorphic)
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review_text TEXT,
  helpful_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- TIER 2: COMPANY DATABASE (Per Workspace) - Enhancements
-- ============================================================================

-- Company Financials - Financial tracking per workspace
CREATE TABLE IF NOT EXISTS public.company_financials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  revenue DECIMAL(15,2) DEFAULT 0.00,
  expenses DECIMAL(15,2) DEFAULT 0.00,
  burn_rate DECIMAL(15,2) DEFAULT 0.00, -- Monthly burn rate
  runway_months DECIMAL(5,1), -- Calculated: remaining_cash / burn_rate
  budget_allocated DECIMAL(15,2) DEFAULT 0.00,
  budget_spent DECIMAL(15,2) DEFAULT 0.00,
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT valid_period CHECK (period_end >= period_start)
);

-- Decisions - Strategic decision tracking (Enhanced)
CREATE TABLE IF NOT EXISTS public.decisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  context TEXT,
  decision_type TEXT NOT NULL CHECK (decision_type IN ('strategic', 'tactical', 'operational')),
  urgency TEXT NOT NULL DEFAULT 'normal' CHECK (urgency IN ('low', 'normal', 'high', 'critical')),
  options JSONB DEFAULT '[]', -- Array of {title, pros[], cons[], cost, impact}
  chosen_option INTEGER, -- Index of chosen option from options array
  decided_by UUID REFERENCES auth.users(id),
  decision_date TIMESTAMPTZ,
  linked_okr_ids UUID[] DEFAULT '{}',
  linked_task_ids UUID[] DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'decided', 'implemented', 'cancelled')),
  outcome TEXT, -- What happened after implementation
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Bulk Import Logs - Track CSV imports
CREATE TABLE IF NOT EXISTS public.bulk_import_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  import_type TEXT NOT NULL CHECK (import_type IN ('team_members', 'tasks', 'okrs', 'decisions', 'financials')),
  file_name TEXT NOT NULL,
  rows_processed INTEGER DEFAULT 0,
  rows_succeeded INTEGER DEFAULT 0,
  rows_failed INTEGER DEFAULT 0,
  error_log JSONB DEFAULT '[]', -- Array of {row, error, data}
  imported_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- TIER 3: USER DATABASE (Per Individual) - Enhancements
-- ============================================================================

-- User Preferences - Extended user settings
CREATE TABLE IF NOT EXISTS public.user_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  timezone TEXT DEFAULT 'UTC',
  locale TEXT DEFAULT 'en-US',
  notification_email BOOLEAN DEFAULT true,
  notification_push BOOLEAN DEFAULT true,
  notification_in_app BOOLEAN DEFAULT true,
  default_workspace_id UUID REFERENCES public.workspaces(id) ON DELETE SET NULL,
  availability_status TEXT DEFAULT 'available' CHECK (availability_status IN ('available', 'busy', 'away', 'offline')),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User Skills - Skills for marketplace discovery
CREATE TABLE IF NOT EXISTS public.user_skills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  skill_name TEXT NOT NULL,
  proficiency_level TEXT NOT NULL CHECK (proficiency_level IN ('beginner', 'intermediate', 'expert', 'master')),
  years_experience DECIMAL(4,1),
  is_verified BOOLEAN DEFAULT false,
  verified_by UUID REFERENCES auth.users(id),
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, skill_name)
);

-- ============================================================================
-- INDEXES for Performance
-- ============================================================================

-- Marketplace Indexes
CREATE INDEX IF NOT EXISTS idx_suppliers_status ON public.suppliers(status);
CREATE INDEX IF NOT EXISTS idx_suppliers_capabilities ON public.suppliers USING GIN(capabilities);
CREATE INDEX IF NOT EXISTS idx_suppliers_owner ON public.suppliers(owner_id);

CREATE INDEX IF NOT EXISTS idx_ai_tools_category ON public.ai_tools(category);
CREATE INDEX IF NOT EXISTS idx_ai_tools_active ON public.ai_tools(is_active);
CREATE INDEX IF NOT EXISTS idx_ai_tools_capabilities ON public.ai_tools USING GIN(capabilities);

CREATE INDEX IF NOT EXISTS idx_executive_listings_user ON public.executive_listings(user_id);
CREATE INDEX IF NOT EXISTS idx_executive_listings_function ON public.executive_listings(business_function);
CREATE INDEX IF NOT EXISTS idx_executive_listings_visibility ON public.executive_listings(visibility);

CREATE INDEX IF NOT EXISTS idx_apprentice_listings_user ON public.apprentice_listings(user_id);
CREATE INDEX IF NOT EXISTS idx_apprentice_listings_visibility ON public.apprentice_listings(visibility);

CREATE INDEX IF NOT EXISTS idx_marketplace_reviews_listing ON public.marketplace_reviews(listing_type, listing_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_reviews_reviewer ON public.marketplace_reviews(reviewer_id);

-- Company Indexes
CREATE INDEX IF NOT EXISTS idx_financials_workspace ON public.company_financials(workspace_id);
CREATE INDEX IF NOT EXISTS idx_financials_period ON public.company_financials(period_start, period_end);

CREATE INDEX IF NOT EXISTS idx_decisions_workspace ON public.decisions(workspace_id);
CREATE INDEX IF NOT EXISTS idx_decisions_status ON public.decisions(status);
CREATE INDEX IF NOT EXISTS idx_decisions_urgency ON public.decisions(urgency);

CREATE INDEX IF NOT EXISTS idx_import_logs_workspace ON public.bulk_import_logs(workspace_id);
CREATE INDEX IF NOT EXISTS idx_import_logs_type ON public.bulk_import_logs(import_type);

-- User Indexes
CREATE INDEX IF NOT EXISTS idx_user_prefs_user ON public.user_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_user_skills_user ON public.user_skills(user_id);
CREATE INDEX IF NOT EXISTS idx_user_skills_name ON public.user_skills(skill_name);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_tools ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.executive_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.apprentice_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketplace_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_financials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.decisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bulk_import_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_skills ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- TIER 1: MARKETPLACE RLS POLICIES
-- Anyone authenticated can READ, only owners can UPDATE their own listings
-- ============================================================================

-- Suppliers
CREATE POLICY "Anyone can view verified suppliers"
  ON public.suppliers FOR SELECT
  TO authenticated
  USING (status = 'verified' OR owner_id = auth.uid());

CREATE POLICY "Owners can insert their own suppliers"
  ON public.suppliers FOR INSERT
  TO authenticated
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Owners can update their own suppliers"
  ON public.suppliers FOR UPDATE
  TO authenticated
  USING (owner_id = auth.uid());

CREATE POLICY "Owners can delete their own suppliers"
  ON public.suppliers FOR DELETE
  TO authenticated
  USING (owner_id = auth.uid());

-- AI Tools (read-only for most users, admins can manage)
CREATE POLICY "Anyone can view active AI tools"
  ON public.ai_tools FOR SELECT
  TO authenticated
  USING (is_active = true);

-- Executive Listings
CREATE POLICY "Anyone can view public executive listings"
  ON public.executive_listings FOR SELECT
  TO authenticated
  USING (visibility = 'public' OR user_id = auth.uid());

CREATE POLICY "Users can create their own executive listing"
  ON public.executive_listings FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own executive listing"
  ON public.executive_listings FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own executive listing"
  ON public.executive_listings FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Apprentice Listings
CREATE POLICY "Anyone can view public apprentice listings"
  ON public.apprentice_listings FOR SELECT
  TO authenticated
  USING (visibility = 'public' OR user_id = auth.uid());

CREATE POLICY "Users can create their own apprentice listing"
  ON public.apprentice_listings FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own apprentice listing"
  ON public.apprentice_listings FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own apprentice listing"
  ON public.apprentice_listings FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Marketplace Reviews
CREATE POLICY "Anyone can view reviews"
  ON public.marketplace_reviews FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create reviews"
  ON public.marketplace_reviews FOR INSERT
  TO authenticated
  WITH CHECK (reviewer_id = auth.uid());

CREATE POLICY "Reviewers can update their own reviews"
  ON public.marketplace_reviews FOR UPDATE
  TO authenticated
  USING (reviewer_id = auth.uid());

CREATE POLICY "Reviewers can delete their own reviews"
  ON public.marketplace_reviews FOR DELETE
  TO authenticated
  USING (reviewer_id = auth.uid());

-- ============================================================================
-- TIER 2: COMPANY RLS POLICIES
-- Only workspace members can access
-- ============================================================================

-- Company Financials
CREATE POLICY "Workspace members can view financials"
  ON public.company_financials FOR SELECT
  TO authenticated
  USING (
    workspace_id IN (
      SELECT workspace_id FROM public.memberships WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Workspace members can create financials"
  ON public.company_financials FOR INSERT
  TO authenticated
  WITH CHECK (
    workspace_id IN (
      SELECT workspace_id FROM public.memberships WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Workspace members can update financials"
  ON public.company_financials FOR UPDATE
  TO authenticated
  USING (
    workspace_id IN (
      SELECT workspace_id FROM public.memberships WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Workspace members can delete financials"
  ON public.company_financials FOR DELETE
  TO authenticated
  USING (
    workspace_id IN (
      SELECT workspace_id FROM public.memberships WHERE user_id = auth.uid()
    )
  );

-- Decisions (same pattern)
CREATE POLICY "Workspace members can view decisions"
  ON public.decisions FOR SELECT
  TO authenticated
  USING (
    workspace_id IN (
      SELECT workspace_id FROM public.memberships WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Workspace members can create decisions"
  ON public.decisions FOR INSERT
  TO authenticated
  WITH CHECK (
    workspace_id IN (
      SELECT workspace_id FROM public.memberships WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Workspace members can update decisions"
  ON public.decisions FOR UPDATE
  TO authenticated
  USING (
    workspace_id IN (
      SELECT workspace_id FROM public.memberships WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Workspace members can delete decisions"
  ON public.decisions FOR DELETE
  TO authenticated
  USING (
    workspace_id IN (
      SELECT workspace_id FROM public.memberships WHERE user_id = auth.uid()
    )
  );

-- Bulk Import Logs (read-only for workspace members)
CREATE POLICY "Workspace members can view import logs"
  ON public.bulk_import_logs FOR SELECT
  TO authenticated
  USING (
    workspace_id IN (
      SELECT workspace_id FROM public.memberships WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Workspace members can create import logs"
  ON public.bulk_import_logs FOR INSERT
  TO authenticated
  WITH CHECK (
    workspace_id IN (
      SELECT workspace_id FROM public.memberships WHERE user_id = auth.uid()
    )
  );

-- ============================================================================
-- TIER 3: USER RLS POLICIES
-- Only the user can access their own data
-- ============================================================================

-- User Preferences
CREATE POLICY "Users can view their own preferences"
  ON public.user_preferences FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own preferences"
  ON public.user_preferences FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own preferences"
  ON public.user_preferences FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own preferences"
  ON public.user_preferences FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- User Skills
CREATE POLICY "Anyone can view user skills"
  ON public.user_skills FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert their own skills"
  ON public.user_skills FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own skills"
  ON public.user_skills FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own skills"
  ON public.user_skills FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- ============================================================================
-- TRIGGERS for updated_at timestamps
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to all tables with updated_at
CREATE TRIGGER update_suppliers_updated_at BEFORE UPDATE ON public.suppliers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ai_tools_updated_at BEFORE UPDATE ON public.ai_tools
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_executive_listings_updated_at BEFORE UPDATE ON public.executive_listings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_apprentice_listings_updated_at BEFORE UPDATE ON public.apprentice_listings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_marketplace_reviews_updated_at BEFORE UPDATE ON public.marketplace_reviews
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_company_financials_updated_at BEFORE UPDATE ON public.company_financials
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_decisions_updated_at BEFORE UPDATE ON public.decisions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_preferences_updated_at BEFORE UPDATE ON public.user_preferences
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_skills_updated_at BEFORE UPDATE ON public.user_skills
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- COMMENTS for Documentation
-- ============================================================================

COMMENT ON TABLE public.suppliers IS 'TIER 1: Marketplace - Companies offering services to all users';
COMMENT ON TABLE public.ai_tools IS 'TIER 1: Marketplace - Catalog of AI agents available to all users';
COMMENT ON TABLE public.executive_listings IS 'TIER 1: Marketplace - Executives available for fractional work';
COMMENT ON TABLE public.apprentice_listings IS 'TIER 1: Marketplace - Apprentices available for work';
COMMENT ON TABLE public.marketplace_reviews IS 'TIER 1: Marketplace - Reviews for any marketplace listing';

COMMENT ON TABLE public.company_financials IS 'TIER 2: Company - Financial tracking per workspace';
COMMENT ON TABLE public.decisions IS 'TIER 2: Company - Strategic decision tracking per workspace';
COMMENT ON TABLE public.bulk_import_logs IS 'TIER 2: Company - Track CSV imports per workspace';

COMMENT ON TABLE public.user_preferences IS 'TIER 3: User - Extended user settings per individual';
COMMENT ON TABLE public.user_skills IS 'TIER 3: User - Skills for marketplace discovery per individual';

-- ============================================================================
-- END OF SCHEMA
-- ============================================================================
