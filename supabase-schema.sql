-- Centaur OS Database Schema for Supabase
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- USERS TABLE
-- ============================================================================
-- Note: Auth users are managed by Supabase Auth
-- This table extends auth.users with app-specific profile data

CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Preferences
  theme_mode TEXT DEFAULT 'system' CHECK (theme_mode IN ('light', 'dark', 'off-white', 'system'))
);

-- Enable Row Level Security
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Users can read their own profile
CREATE POLICY "Users can read own profile"
  ON public.users FOR SELECT
  USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON public.users FOR UPDATE
  USING (auth.uid() = id);

-- Allow insert when user signs up
CREATE POLICY "Users can insert own profile"
  ON public.users FOR INSERT
  WITH CHECK (auth.uid() = id);

-- ============================================================================
-- WORKSPACES TABLE
-- ============================================================================

CREATE TABLE public.workspaces (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  owner_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.workspaces ENABLE ROW LEVEL SECURITY;

-- Users can read workspaces they're members of
CREATE POLICY "Users can read workspaces they belong to"
  ON public.workspaces FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.memberships
      WHERE memberships.workspace_id = workspaces.id
      AND memberships.user_id = auth.uid()
    )
  );

-- Only owners can update workspaces
CREATE POLICY "Owners can update their workspaces"
  ON public.workspaces FOR UPDATE
  USING (owner_id = auth.uid());

-- Users can create workspaces
CREATE POLICY "Users can create workspaces"
  ON public.workspaces FOR INSERT
  WITH CHECK (owner_id = auth.uid());

-- ============================================================================
-- MEMBERSHIPS TABLE
-- ============================================================================

CREATE TABLE public.memberships (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('Founder', 'Apprentice', 'FractionalExec', 'Government', 'Unaffiliated')),
  function TEXT NOT NULL CHECK (function IN ('Finance', 'Sales', 'Marketing', 'Ops', 'Engineering', 'Admin')),
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  permissions JSONB DEFAULT '{}',

  -- Ensure unique user per workspace
  UNIQUE(workspace_id, user_id)
);

ALTER TABLE public.memberships ENABLE ROW LEVEL SECURITY;

-- Users can read memberships for workspaces they belong to
CREATE POLICY "Users can read memberships in their workspaces"
  ON public.memberships FOR SELECT
  USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.memberships m
      WHERE m.workspace_id = memberships.workspace_id
      AND m.user_id = auth.uid()
    )
  );

-- Founders can create memberships in their workspaces
CREATE POLICY "Founders can create memberships"
  ON public.memberships FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.workspaces w
      WHERE w.id = workspace_id
      AND w.owner_id = auth.uid()
    )
  );

-- Founders can update memberships in their workspaces
CREATE POLICY "Founders can update memberships"
  ON public.memberships FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.workspaces w
      WHERE w.id = workspace_id
      AND w.owner_id = auth.uid()
    )
  );

-- Founders can delete memberships in their workspaces
CREATE POLICY "Founders can delete memberships"
  ON public.memberships FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.workspaces w
      WHERE w.id = workspace_id
      AND w.owner_id = auth.uid()
    )
  );

-- ============================================================================
-- TEAM MEMBERS TABLE (for People/Who tab)
-- ============================================================================

CREATE TABLE public.team_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL, -- Nullable for non-user team members

  -- Basic info
  name TEXT NOT NULL,
  initials TEXT NOT NULL,
  email TEXT,
  avatar_color TEXT NOT NULL,

  -- Role info
  person_class TEXT NOT NULL CHECK (person_class IN ('Founder', 'Executive', 'Apprentice')),
  function TEXT NOT NULL CHECK (function IN ('Finance', 'Sales', 'Marketing', 'Ops', 'Engineering', 'Admin')),

  -- Capacity (Time Units)
  base_squares_per_week NUMERIC NOT NULL DEFAULT 10,
  overtime_squares_per_week NUMERIC NOT NULL DEFAULT 5,
  overtime_enabled BOOLEAN DEFAULT FALSE,
  allocated_squares NUMERIC DEFAULT 0,

  -- Cost
  cost_per_square NUMERIC NOT NULL DEFAULT 0,
  day_rate NUMERIC,

  -- AI Tools (stored as array of tool IDs)
  ai_tools JSONB DEFAULT '[]',

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;

-- Users can read team members in their workspaces
CREATE POLICY "Users can read team members in their workspaces"
  ON public.team_members FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.memberships
      WHERE memberships.workspace_id = team_members.workspace_id
      AND memberships.user_id = auth.uid()
    )
  );

-- Founders and Execs can create team members
CREATE POLICY "Founders and Execs can create team members"
  ON public.team_members FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.memberships m
      WHERE m.workspace_id = workspace_id
      AND m.user_id = auth.uid()
      AND m.role IN ('Founder', 'FractionalExec')
    )
  );

-- Founders and Execs can update team members
CREATE POLICY "Founders and Execs can update team members"
  ON public.team_members FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.memberships m
      WHERE m.workspace_id = workspace_id
      AND m.user_id = auth.uid()
      AND m.role IN ('Founder', 'FractionalExec')
    )
  );

-- Only Founders can delete team members
CREATE POLICY "Founders can delete team members"
  ON public.team_members FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.memberships m
      JOIN public.workspaces w ON w.id = m.workspace_id
      WHERE m.workspace_id = team_members.workspace_id
      AND w.owner_id = auth.uid()
      AND m.role = 'Founder'
    )
  );

-- ============================================================================
-- OBJECTIVES TABLE (OKRs)
-- ============================================================================

CREATE TABLE public.objectives (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  owner_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.objectives ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read objectives in their workspaces"
  ON public.objectives FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.memberships
      WHERE memberships.workspace_id = objectives.workspace_id
      AND memberships.user_id = auth.uid()
    )
  );

CREATE POLICY "Founders and Execs can create objectives"
  ON public.objectives FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.memberships m
      WHERE m.workspace_id = workspace_id
      AND m.user_id = auth.uid()
      AND m.role IN ('Founder', 'FractionalExec')
    )
  );

CREATE POLICY "Founders and Execs can update objectives"
  ON public.objectives FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.memberships m
      WHERE m.workspace_id = workspace_id
      AND m.user_id = auth.uid()
      AND m.role IN ('Founder', 'FractionalExec')
    )
  );

-- ============================================================================
-- KEY RESULTS TABLE
-- ============================================================================

CREATE TABLE public.key_results (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  objective_id UUID NOT NULL REFERENCES public.objectives(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  target_value NUMERIC NOT NULL,
  current_value NUMERIC DEFAULT 0,
  unit TEXT NOT NULL,
  health_status TEXT DEFAULT 'on_track' CHECK (health_status IN ('on_track', 'at_risk', 'off_track')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.key_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read key results in their workspaces"
  ON public.key_results FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.objectives o
      JOIN public.memberships m ON m.workspace_id = o.workspace_id
      WHERE o.id = key_results.objective_id
      AND m.user_id = auth.uid()
    )
  );

CREATE POLICY "Founders and Execs can manage key results"
  ON public.key_results FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.objectives o
      JOIN public.memberships m ON m.workspace_id = o.workspace_id
      WHERE o.id = key_results.objective_id
      AND m.user_id = auth.uid()
      AND m.role IN ('Founder', 'FractionalExec')
    )
  );

-- ============================================================================
-- TASKS TABLE
-- ============================================================================

CREATE TABLE public.tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'backlog' CHECK (status IN ('backlog', 'todo', 'in_progress', 'in_review', 'done')),
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  assigned_to UUID REFERENCES public.team_members(id) ON DELETE SET NULL,
  objective_id UUID REFERENCES public.objectives(id) ON DELETE SET NULL,

  -- Effort tracking
  estimated_hours NUMERIC,
  actual_hours NUMERIC DEFAULT 0,

  -- Dates
  due_date TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,

  created_by UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read tasks in their workspaces"
  ON public.tasks FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.memberships
      WHERE memberships.workspace_id = tasks.workspace_id
      AND memberships.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create tasks in their workspaces"
  ON public.tasks FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.memberships
      WHERE memberships.workspace_id = workspace_id
      AND memberships.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update tasks in their workspaces"
  ON public.tasks FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.memberships
      WHERE memberships.workspace_id = tasks.workspace_id
      AND memberships.user_id = auth.uid()
    )
  );

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

CREATE INDEX idx_memberships_workspace_id ON public.memberships(workspace_id);
CREATE INDEX idx_memberships_user_id ON public.memberships(user_id);
CREATE INDEX idx_team_members_workspace_id ON public.team_members(workspace_id);
CREATE INDEX idx_objectives_workspace_id ON public.objectives(workspace_id);
CREATE INDEX idx_key_results_objective_id ON public.key_results(objective_id);
CREATE INDEX idx_tasks_workspace_id ON public.tasks(workspace_id);
CREATE INDEX idx_tasks_assigned_to ON public.tasks(assigned_to);
CREATE INDEX idx_tasks_objective_id ON public.tasks(objective_id);

-- ============================================================================
-- FUNCTIONS FOR UPDATED_AT TRIGGERS
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_workspaces_updated_at BEFORE UPDATE ON public.workspaces
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_team_members_updated_at BEFORE UPDATE ON public.team_members
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_objectives_updated_at BEFORE UPDATE ON public.objectives
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_key_results_updated_at BEFORE UPDATE ON public.key_results
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON public.tasks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- REALTIME SUBSCRIPTIONS (Optional - enable if needed)
-- ============================================================================

-- Enable realtime for tables you want to subscribe to
-- ALTER PUBLICATION supabase_realtime ADD TABLE public.tasks;
-- ALTER PUBLICATION supabase_realtime ADD TABLE public.team_members;
-- ALTER PUBLICATION supabase_realtime ADD TABLE public.objectives;
