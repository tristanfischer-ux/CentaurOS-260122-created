-- Data Architecture Migration
-- Creates all tables for Universal, Company, and User data tiers
-- Implements Row-Level Security (RLS) for multi-tenant isolation

-- ============================================================================
-- UNIVERSAL DATA TABLES (shared across all users/companies)
-- ============================================================================

-- AI Tools Catalog
CREATE TABLE IF NOT EXISTS ai_tools (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  provider TEXT NOT NULL, -- 'openai', 'anthropic', 'midjourney', 'elevenlabs', etc.
  category TEXT NOT NULL, -- 'text', 'image', 'voice', 'video', etc.
  description TEXT,
  typical_monthly_cost DECIMAL(10,2),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Function Templates (Engineering, Marketing, Finance, etc.)
CREATE TABLE IF NOT EXISTS function_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  typical_cost_per_day DECIMAL(10,2),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Role Definitions
CREATE TABLE IF NOT EXISTS role_definitions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL, -- 'Founder', 'FractionalExec', 'Apprentice'
  description TEXT,
  permissions JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- COMPANY DATA TABLES (workspace-specific, multi-tenant)
-- ============================================================================

-- Workspaces (Companies)
CREATE TABLE IF NOT EXISTS workspaces (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Members (People in workspace)
CREATE TABLE IF NOT EXISTS members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id), -- nullable for external members
  name TEXT NOT NULL,
  role TEXT NOT NULL, -- 'Founder', 'FractionalExec', 'Apprentice'
  function TEXT, -- 'Engineering', 'Marketing', 'Finance', etc.
  status TEXT NOT NULL DEFAULT 'active', -- 'active', 'inactive'
  days_per_week DECIMAL(3,1),
  cost_per_day DECIMAL(10,2),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on members
ALTER TABLE members ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see members of workspaces they belong to
CREATE POLICY members_workspace_isolation ON members
  FOR SELECT
  USING (
    workspace_id IN (
      SELECT workspace_id FROM members WHERE user_id = auth.uid()
    )
  );

-- Work Plans (Tasks/Projects)
CREATE TABLE IF NOT EXISTS work_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'planning', -- 'planning', 'in-progress', 'blocked', 'completed', 'abandoned'
  priority TEXT, -- 'low', 'medium', 'high', 'critical'
  progress INTEGER DEFAULT 0,
  start_date DATE,
  end_date DATE,
  created_by UUID REFERENCES members(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE work_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY work_plans_workspace_isolation ON work_plans
  FOR SELECT
  USING (
    workspace_id IN (
      SELECT workspace_id FROM members WHERE user_id = auth.uid()
    )
  );

-- Work Plan Allocations (Member assignments)
CREATE TABLE IF NOT EXISTS work_plan_allocations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  work_plan_id UUID REFERENCES work_plans(id) ON DELETE CASCADE NOT NULL,
  member_id UUID REFERENCES members(id) ON DELETE CASCADE NOT NULL,
  squares_per_week DECIMAL(4,1), -- time units (1 square = 0.5 days)
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(work_plan_id, member_id)
);

-- Work Plan Audit Records (Completion tracking)
CREATE TABLE IF NOT EXISTS work_plan_audit_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  work_plan_id UUID REFERENCES work_plans(id) ON DELETE CASCADE NOT NULL,
  completed_at TIMESTAMPTZ,
  completed_by UUID REFERENCES members(id),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(work_plan_id) -- one audit record per work plan
);

-- OKRs (Objectives and Key Results)
CREATE TABLE IF NOT EXISTS okrs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'on-track', -- 'on-track', 'at-risk', 'off-track'
  quarter TEXT, -- 'Q1 2026', etc.
  owner_id UUID REFERENCES members(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE okrs ENABLE ROW LEVEL SECURITY;

CREATE POLICY okrs_workspace_isolation ON okrs
  FOR SELECT
  USING (
    workspace_id IN (
      SELECT workspace_id FROM members WHERE user_id = auth.uid()
    )
  );

-- OKR Objectives (Sub-objectives within OKR)
CREATE TABLE IF NOT EXISTS okr_objectives (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  okr_id UUID REFERENCES okrs(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  progress INTEGER DEFAULT 0, -- 0-100
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Suppliers (External vendors)
CREATE TABLE IF NOT EXISTS suppliers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  category TEXT, -- 'Manufacturing', 'AI Tools', 'Infrastructure', etc.
  description TEXT,
  website TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;

CREATE POLICY suppliers_workspace_isolation ON suppliers
  FOR SELECT
  USING (
    workspace_id IN (
      SELECT workspace_id FROM members WHERE user_id = auth.uid()
    )
  );

-- Supplier Engagements (Active contracts/work)
CREATE TABLE IF NOT EXISTS supplier_engagements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE NOT NULL,
  supplier_id UUID REFERENCES suppliers(id),
  category TEXT, -- 'Manufacturing', 'AI Tools', 'Infrastructure', etc.
  status TEXT NOT NULL DEFAULT 'planning', -- 'planning', 'in_progress', 'completed'
  contract_value DECIMAL(12,2),
  paid_to_date DECIMAL(12,2) DEFAULT 0,
  start_date DATE,
  end_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE supplier_engagements ENABLE ROW LEVEL SECURITY;

CREATE POLICY supplier_engagements_workspace_isolation ON supplier_engagements
  FOR SELECT
  USING (
    workspace_id IN (
      SELECT workspace_id FROM members WHERE user_id = auth.uid()
    )
  );

-- Financial Transactions (Revenue and costs)
CREATE TABLE IF NOT EXISTS financial_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL, -- 'revenue', 'cost'
  category TEXT NOT NULL, -- 'product_sales', 'services', 'team', 'ai_tools', 'manufacturing', etc.
  subcategory TEXT, -- more specific breakdown
  amount DECIMAL(12,2) NOT NULL,
  transaction_date DATE NOT NULL,
  description TEXT,
  recurring BOOLEAN DEFAULT FALSE, -- is this a recurring transaction?
  recurrence_period TEXT, -- 'monthly', 'quarterly', 'annual'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE financial_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY financial_transactions_workspace_isolation ON financial_transactions
  FOR SELECT
  USING (
    workspace_id IN (
      SELECT workspace_id FROM members WHERE user_id = auth.uid()
    )
  );

-- Budget Targets (Financial goals)
CREATE TABLE IF NOT EXISTS budget_targets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE NOT NULL,
  month DATE NOT NULL, -- first day of month
  category TEXT NOT NULL, -- 'revenue', 'team_cost', 'ai_cost', 'cogs', 'other'
  target_amount DECIMAL(12,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(workspace_id, month, category)
);

ALTER TABLE budget_targets ENABLE ROW LEVEL SECURITY;

CREATE POLICY budget_targets_workspace_isolation ON budget_targets
  FOR SELECT
  USING (
    workspace_id IN (
      SELECT workspace_id FROM members WHERE user_id = auth.uid()
    )
  );

-- ============================================================================
-- USER DATA TABLES (individual user-specific)
-- ============================================================================

-- User Preferences (Personal settings)
CREATE TABLE IF NOT EXISTS user_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  default_workspace_id UUID REFERENCES workspaces(id) ON DELETE SET NULL,
  theme TEXT DEFAULT 'system', -- 'light', 'dark', 'system'
  notification_enabled BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY user_preferences_own_data ON user_preferences
  FOR ALL
  USING (user_id = auth.uid());

-- User Favorite Suppliers (Personal bookmarks)
CREATE TABLE IF NOT EXISTS user_favorite_suppliers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  supplier_id UUID REFERENCES suppliers(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, supplier_id)
);

ALTER TABLE user_favorite_suppliers ENABLE ROW LEVEL SECURITY;

CREATE POLICY user_favorite_suppliers_own_data ON user_favorite_suppliers
  FOR ALL
  USING (user_id = auth.uid());

-- ============================================================================
-- INDEXES for performance
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_members_workspace_id ON members(workspace_id);
CREATE INDEX IF NOT EXISTS idx_members_user_id ON members(user_id);
CREATE INDEX IF NOT EXISTS idx_work_plans_workspace_id ON work_plans(workspace_id);
CREATE INDEX IF NOT EXISTS idx_work_plans_status ON work_plans(status);
CREATE INDEX IF NOT EXISTS idx_okrs_workspace_id ON okrs(workspace_id);
CREATE INDEX IF NOT EXISTS idx_suppliers_workspace_id ON suppliers(workspace_id);
CREATE INDEX IF NOT EXISTS idx_supplier_engagements_workspace_id ON supplier_engagements(workspace_id);
CREATE INDEX IF NOT EXISTS idx_financial_transactions_workspace_id ON financial_transactions(workspace_id);
CREATE INDEX IF NOT EXISTS idx_financial_transactions_date ON financial_transactions(transaction_date);
