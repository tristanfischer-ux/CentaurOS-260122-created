/**
 * Database Schema Documentation
 *
 * This file documents the database schema for Centaur OS.
 * Use this as a reference when setting up your production database.
 *
 * Recommended: Supabase (PostgreSQL) with Row Level Security (RLS)
 *
 * To generate migrations from this schema:
 * 1. Set up Supabase CLI: https://supabase.com/docs/guides/cli
 * 2. Run: supabase init
 * 3. Create migration: supabase migration new initial_schema
 * 4. Copy SQL from this file to the migration
 * 5. Run: supabase db push
 */

// =============================================================================
// ENTITY RELATIONSHIP DIAGRAM (Mermaid format)
// =============================================================================
/*
erDiagram
    users ||--o{ memberships : has
    workspaces ||--o{ memberships : has
    workspaces ||--o{ work_plans : contains
    workspaces ||--o{ okrs : contains
    workspaces ||--o{ organization_members : contains
    workspaces ||--o{ squads : contains
    workspaces ||--o{ allocation_requests : contains
    organization_members ||--o{ work_plan_allocations : assigned_to
    work_plans ||--o{ work_plan_allocations : has
    squads ||--o{ squad_members : has
    organization_members ||--o{ squad_members : belongs_to
*/

// =============================================================================
// SQL SCHEMA (PostgreSQL / Supabase)
// =============================================================================

export const SQL_SCHEMA = `
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================================================
-- CORE TABLES
-- =============================================================================

-- Users table (managed by Supabase Auth, extended here)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  avatar_url TEXT,
  preferences JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Workspaces (companies)
CREATE TABLE IF NOT EXISTS workspaces (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  owner_id UUID NOT NULL REFERENCES users(id),
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Memberships (user <-> workspace relationship with role)
CREATE TABLE IF NOT EXISTS memberships (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('Founder', 'FractionalExec', 'Apprentice')),
  function TEXT CHECK (function IN ('Finance', 'Sales', 'Marketing', 'Ops', 'Engineering', 'Admin')),
  permissions JSONB DEFAULT '{}',
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(workspace_id, user_id)
);

-- =============================================================================
-- ORGANIZATION TABLES
-- =============================================================================

-- Organization members (people working in a workspace)
CREATE TABLE IF NOT EXISTS organization_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id), -- Optional link to app user
  name TEXT NOT NULL,
  email TEXT,
  role TEXT NOT NULL CHECK (role IN ('Founder', 'FractionalExec', 'Apprentice')),
  function TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'invited')),
  cost_per_day DECIMAL(10,2),
  currency TEXT DEFAULT 'GBP',
  capacity_per_week INTEGER DEFAULT 40, -- Time units per week
  reports_to UUID REFERENCES organization_members(id),
  manages UUID[], -- Array of member IDs this person manages
  skills TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Squads (teams of people working together)
CREATE TABLE IF NOT EXISTS squads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT,
  type TEXT DEFAULT 'manual' CHECK (type IN ('manual', 'auto')),
  function TEXT,
  deployed_work_plan_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Squad members (many-to-many)
CREATE TABLE IF NOT EXISTS squad_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  squad_id UUID NOT NULL REFERENCES squads(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES organization_members(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(squad_id, member_id)
);

-- =============================================================================
-- WORK MANAGEMENT TABLES
-- =============================================================================

-- Work plans (tasks/projects)
CREATE TABLE IF NOT EXISTS work_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  function TEXT,
  status TEXT DEFAULT 'not-started' CHECK (status IN ('not-started', 'in-progress', 'completed', 'blocked', 'abandoned')),
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  estimated_time_units INTEGER,
  actual_time_units INTEGER,
  start_date DATE,
  due_date DATE,
  completed_at TIMESTAMPTZ,
  okr_id UUID,
  parent_id UUID REFERENCES work_plans(id),
  created_by UUID REFERENCES organization_members(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Work plan allocations (who is assigned to what)
CREATE TABLE IF NOT EXISTS work_plan_allocations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  work_plan_id UUID NOT NULL REFERENCES work_plans(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES organization_members(id) ON DELETE CASCADE,
  squares_per_week INTEGER NOT NULL DEFAULT 0, -- Time units allocated per week
  start_date DATE,
  end_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(work_plan_id, member_id)
);

-- =============================================================================
-- OKR TABLES
-- =============================================================================

-- OKRs (Objectives and Key Results)
CREATE TABLE IF NOT EXISTS okrs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  owner_id UUID REFERENCES organization_members(id),
  function TEXT,
  quarter TEXT, -- e.g., 'Q1 2026'
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'archived')),
  progress INTEGER DEFAULT 0,
  confidence TEXT DEFAULT 'medium' CHECK (confidence IN ('low', 'medium', 'high')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- OKR Objectives (sub-objectives within an OKR)
CREATE TABLE IF NOT EXISTS okr_objectives (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  okr_id UUID NOT NULL REFERENCES okrs(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  progress INTEGER DEFAULT 0,
  status TEXT DEFAULT 'on-track' CHECK (status IN ('on-track', 'at-risk', 'behind', 'completed')),
  metrics JSONB DEFAULT '[]',
  milestones JSONB DEFAULT '[]',
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- ALLOCATION REQUEST TABLES
-- =============================================================================

-- Allocation requests (executive requests to allocate apprentices)
CREATE TABLE IF NOT EXISTS allocation_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  requester_id UUID NOT NULL REFERENCES organization_members(id),
  apprentice_id UUID NOT NULL REFERENCES organization_members(id),
  work_plan_id UUID REFERENCES work_plans(id),
  time_units_per_week INTEGER NOT NULL,
  duration_weeks INTEGER,
  justification TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'withdrawn')),
  responder_id UUID REFERENCES organization_members(id),
  response_note TEXT,
  responded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Delegation settings (per workspace)
CREATE TABLE IF NOT EXISTS delegation_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID UNIQUE NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  direct_report_delegation BOOLEAN DEFAULT FALSE,
  full_delegation BOOLEAN DEFAULT FALSE,
  auto_approval_threshold INTEGER DEFAULT 0,
  updated_by UUID REFERENCES organization_members(id),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- SUPPLIER TABLES
-- =============================================================================

-- Suppliers (shared across platform)
CREATE TABLE IF NOT EXISTS suppliers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  service_type TEXT CHECK (service_type IN ('manufacturing', 'bank', 'lawyer', 'accountant')),
  capabilities TEXT[],
  region TEXT,
  location JSONB,
  contact JSONB,
  certifications TEXT[],
  minimum_order_quantity INTEGER,
  lead_time_weeks INTEGER,
  status TEXT DEFAULT 'pending_approval' CHECK (status IN ('pending_approval', 'approved', 'verified', 'suspended', 'rejected')),
  rating DECIMAL(2,1),
  review_count INTEGER DEFAULT 0,
  recommended_by_workspace_ids UUID[],
  approved_by_admin_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Workspace supplier relationships
CREATE TABLE IF NOT EXISTS workspace_suppliers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  supplier_id UUID NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'paused', 'ended')),
  total_spend DECIMAL(12,2) DEFAULT 0,
  last_order_date DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(workspace_id, supplier_id)
);

-- =============================================================================
-- DECISIONS TABLES
-- =============================================================================

-- Urgent decisions requiring founder attention
CREATE TABLE IF NOT EXISTS decisions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  question TEXT NOT NULL,
  context TEXT,
  category TEXT CHECK (category IN ('hiring', 'budget', 'strategy', 'operations', 'product', 'legal')),
  urgency TEXT DEFAULT 'normal' CHECK (urgency IN ('critical', 'high', 'normal')),
  deadline TIMESTAMPTZ,
  required_decision_maker TEXT DEFAULT 'founder',
  options JSONB DEFAULT '[]',
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'decided', 'deferred')),
  decision TEXT,
  decided_by UUID REFERENCES organization_members(id),
  decided_at TIMESTAMPTZ,
  created_by UUID REFERENCES organization_members(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- AUDIT & ANALYTICS
-- =============================================================================

-- Audit logs
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  actor_id UUID NOT NULL,
  action TEXT NOT NULL,
  object_type TEXT NOT NULL,
  object_id UUID,
  payload_summary TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for audit log queries
CREATE INDEX IF NOT EXISTS idx_audit_logs_workspace ON audit_logs(workspace_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor ON audit_logs(actor_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON audit_logs(created_at DESC);

-- =============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =============================================================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE squads ENABLE ROW LEVEL SECURITY;
ALTER TABLE squad_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_plan_allocations ENABLE ROW LEVEL SECURITY;
ALTER TABLE okrs ENABLE ROW LEVEL SECURITY;
ALTER TABLE okr_objectives ENABLE ROW LEVEL SECURITY;
ALTER TABLE allocation_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE delegation_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspace_suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE decisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Users can read their own data
CREATE POLICY "Users can view own data" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own data" ON users
  FOR UPDATE USING (auth.uid() = id);

-- Workspace access based on membership
CREATE POLICY "Members can view workspace" ON workspaces
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM memberships
      WHERE memberships.workspace_id = workspaces.id
      AND memberships.user_id = auth.uid()
    )
  );

-- Memberships - users can see workspaces they belong to
CREATE POLICY "Users can view own memberships" ON memberships
  FOR SELECT USING (user_id = auth.uid());

-- Work plans - workspace members can view
CREATE POLICY "Members can view work plans" ON work_plans
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM memberships
      WHERE memberships.workspace_id = work_plans.workspace_id
      AND memberships.user_id = auth.uid()
    )
  );

-- Founders can do everything in their workspace
CREATE POLICY "Founders have full access" ON work_plans
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM memberships
      WHERE memberships.workspace_id = work_plans.workspace_id
      AND memberships.user_id = auth.uid()
      AND memberships.role = 'Founder'
    )
  );

-- =============================================================================
-- FUNCTIONS & TRIGGERS
-- =============================================================================

-- Update updated_at timestamp automatically
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply trigger to all tables with updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_workspaces_updated_at BEFORE UPDATE ON workspaces
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_work_plans_updated_at BEFORE UPDATE ON work_plans
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_okrs_updated_at BEFORE UPDATE ON okrs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- INDEXES FOR PERFORMANCE
-- =============================================================================

CREATE INDEX IF NOT EXISTS idx_memberships_user ON memberships(user_id);
CREATE INDEX IF NOT EXISTS idx_memberships_workspace ON memberships(workspace_id);
CREATE INDEX IF NOT EXISTS idx_work_plans_workspace ON work_plans(workspace_id);
CREATE INDEX IF NOT EXISTS idx_work_plans_status ON work_plans(status);
CREATE INDEX IF NOT EXISTS idx_organization_members_workspace ON organization_members(workspace_id);
CREATE INDEX IF NOT EXISTS idx_allocation_requests_workspace ON allocation_requests(workspace_id);
CREATE INDEX IF NOT EXISTS idx_allocation_requests_status ON allocation_requests(status);
`;

// =============================================================================
// TYPE MAPPINGS (TypeScript <-> PostgreSQL)
// =============================================================================

export const TYPE_MAPPINGS = {
  // TypeScript -> PostgreSQL
  string: 'TEXT',
  number: 'INTEGER',
  boolean: 'BOOLEAN',
  Date: 'TIMESTAMPTZ',
  'Record<string, any>': 'JSONB',
  'string[]': 'TEXT[]',

  // Enums
  Role: "TEXT CHECK (role IN ('Founder', 'FractionalExec', 'Apprentice'))",
  Function: "TEXT CHECK (function IN ('Finance', 'Sales', 'Marketing', 'Ops', 'Engineering', 'Admin'))",
  WorkPlanStatus: "TEXT CHECK (status IN ('not-started', 'in-progress', 'completed', 'blocked', 'abandoned'))",
  Priority: "TEXT CHECK (priority IN ('low', 'medium', 'high', 'critical'))",
};

// =============================================================================
// MIGRATION HELPERS
// =============================================================================

export const MIGRATION_NOTES = `
## Migration Strategy

### Phase 1: Setup (No code changes needed)
1. Create Supabase project
2. Run initial SQL schema
3. Set up RLS policies
4. Configure environment variables

### Phase 2: Auth Integration
1. Replace local auth with Supabase Auth
2. Update user creation flow
3. Add social login (Apple required for App Store)

### Phase 3: Data Migration
1. Create API endpoints for each entity
2. Update Zustand stores to call API
3. Add offline sync with React Query
4. Migrate existing local data to cloud

### Phase 4: Real-time Features
1. Enable Supabase Realtime for critical tables
2. Add presence indicators
3. Implement collaborative features

### Testing Checklist
- [ ] Auth flow works (signup, login, logout)
- [ ] Data persists across app restarts
- [ ] Offline mode works correctly
- [ ] Real-time updates appear
- [ ] RLS policies prevent unauthorized access
- [ ] Audit logs capture all changes
`;
