-- WHAT/WHY Flows Migration
-- Implements task drafts, scheduling, capacity management, and brainstorm sessions
-- Migration: 004_what_why_flows.sql

-- ============================================================================
-- TASK DRAFTS (pending confirmation)
-- ============================================================================

CREATE TABLE IF NOT EXISTS task_drafts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE NOT NULL,
  created_by_user_id UUID REFERENCES auth.users(id) NOT NULL,
  assignee_user_id UUID REFERENCES auth.users(id), -- nullable, default to creator

  -- Task content
  title TEXT NOT NULL CHECK (char_length(title) >= 1 AND char_length(title) <= 200),
  notes TEXT CHECK (char_length(notes) <= 2000),

  -- Scheduling
  start_iso TIMESTAMPTZ DEFAULT NOW(),
  due_iso TIMESTAMPTZ,
  units INTEGER NOT NULL DEFAULT 1 CHECK (units >= 1), -- time units (minimum 1)

  -- Metadata
  source TEXT NOT NULL, -- 'what_voice' | 'what_text' | 'why_brainstorm' | 'manual'
  confidence_assignee INTEGER CHECK (confidence_assignee BETWEEN 0 AND 100),
  confidence_due INTEGER CHECK (confidence_due BETWEEN 0 AND 100),
  status TEXT NOT NULL DEFAULT 'pending_confirmation', -- 'pending_confirmation' | 'confirmed' | 'discarded'

  -- Transcript reference (optional, if from voice)
  transcript_ref TEXT,

  -- Brainstorm context (if from WHY flow)
  session_id UUID, -- Foreign key added later
  objective_id UUID, -- Foreign key added later

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_task_drafts_workspace ON task_drafts(workspace_id);
CREATE INDEX idx_task_drafts_creator ON task_drafts(created_by_user_id);
CREATE INDEX idx_task_drafts_status ON task_drafts(status);
CREATE INDEX idx_task_drafts_session ON task_drafts(session_id) WHERE session_id IS NOT NULL;

-- Enable RLS
ALTER TABLE task_drafts ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see drafts in their workspaces
CREATE POLICY task_drafts_workspace_isolation ON task_drafts
  FOR ALL
  USING (
    workspace_id IN (
      SELECT workspace_id FROM members WHERE user_id = auth.uid()
    )
  );

-- ============================================================================
-- TASKS (confirmed, replacing work_plans eventually)
-- ============================================================================

CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE NOT NULL,
  created_by_user_id UUID REFERENCES auth.users(id) NOT NULL,
  assignee_user_id UUID REFERENCES auth.users(id),

  -- Task content
  title TEXT NOT NULL CHECK (char_length(title) >= 1 AND char_length(title) <= 200),
  notes TEXT CHECK (char_length(notes) <= 2000),

  -- Scheduling
  start_iso TIMESTAMPTZ DEFAULT NOW(),
  due_iso TIMESTAMPTZ,
  units INTEGER NOT NULL DEFAULT 1 CHECK (units >= 1),
  risk_flag BOOLEAN DEFAULT FALSE, -- true if deadline may be missed

  -- Metadata
  source TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active', -- 'active' | 'done' | 'blocked' | 'abandoned'

  -- Linkage
  draft_id UUID REFERENCES task_drafts(id), -- which draft created this task (idempotency)
  session_id UUID, -- if from WHY flow

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- Indexes
CREATE INDEX idx_tasks_workspace ON tasks(workspace_id);
CREATE INDEX idx_tasks_assignee ON tasks(assignee_user_id);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_due ON tasks(due_iso) WHERE due_iso IS NOT NULL;
CREATE INDEX idx_tasks_draft ON tasks(draft_id) WHERE draft_id IS NOT NULL;

-- Unique constraint: one task per draft (idempotency)
CREATE UNIQUE INDEX idx_tasks_draft_unique ON tasks(draft_id) WHERE draft_id IS NOT NULL;

-- Enable RLS
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see tasks in their workspaces
CREATE POLICY tasks_workspace_isolation ON tasks
  FOR ALL
  USING (
    workspace_id IN (
      SELECT workspace_id FROM members WHERE user_id = auth.uid()
    )
  );

-- ============================================================================
-- USER CAPACITY (weekly time units available)
-- ============================================================================

CREATE TABLE IF NOT EXISTS user_capacity (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  week_start_iso DATE NOT NULL, -- Monday of the week (ISO 8601)
  capacity_units INTEGER NOT NULL DEFAULT 10 CHECK (capacity_units >= 0),

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Unique constraint: one capacity record per user per week
  UNIQUE(user_id, week_start_iso)
);

-- Indexes
CREATE INDEX idx_user_capacity_user_week ON user_capacity(user_id, week_start_iso);
CREATE INDEX idx_user_capacity_workspace ON user_capacity(workspace_id);

-- Enable RLS
ALTER TABLE user_capacity ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see capacity in their workspaces
CREATE POLICY user_capacity_workspace_isolation ON user_capacity
  FOR ALL
  USING (
    workspace_id IN (
      SELECT workspace_id FROM members WHERE user_id = auth.uid()
    )
  );

-- ============================================================================
-- TASK ALLOCATIONS (weekly assignments)
-- ============================================================================

CREATE TABLE IF NOT EXISTS task_allocations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE NOT NULL,
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  week_start_iso DATE NOT NULL, -- Monday of the week
  units INTEGER NOT NULL CHECK (units > 0), -- TUs allocated this week

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_task_allocations_task ON task_allocations(task_id);
CREATE INDEX idx_task_allocations_user_week ON task_allocations(user_id, week_start_iso);
CREATE INDEX idx_task_allocations_workspace ON task_allocations(workspace_id);

-- Enable RLS
ALTER TABLE task_allocations ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see allocations in their workspaces
CREATE POLICY task_allocations_workspace_isolation ON task_allocations
  FOR ALL
  USING (
    workspace_id IN (
      SELECT workspace_id FROM members WHERE user_id = auth.uid()
    )
  );

-- ============================================================================
-- TASK EVENTS (audit log)
-- ============================================================================

CREATE TABLE IF NOT EXISTS task_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE NOT NULL,
  task_id UUID REFERENCES tasks(id) ON DELETE SET NULL,
  draft_id UUID REFERENCES task_drafts(id) ON DELETE SET NULL,

  event_type TEXT NOT NULL, -- 'draft_created' | 'draft_edited' | 'draft_confirmed' | 'task_status_changed' | etc.
  payload_json JSONB, -- event-specific data (before/after state, etc.)

  created_by_user_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_task_events_workspace ON task_events(workspace_id);
CREATE INDEX idx_task_events_task ON task_events(task_id) WHERE task_id IS NOT NULL;
CREATE INDEX idx_task_events_draft ON task_events(draft_id) WHERE draft_id IS NOT NULL;
CREATE INDEX idx_task_events_type ON task_events(event_type);
CREATE INDEX idx_task_events_created_at ON task_events(created_at DESC);

-- Enable RLS
ALTER TABLE task_events ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see events in their workspaces
CREATE POLICY task_events_workspace_isolation ON task_events
  FOR SELECT
  USING (
    workspace_id IN (
      SELECT workspace_id FROM members WHERE user_id = auth.uid()
    )
  );

-- ============================================================================
-- BRAINSTORM SESSIONS (WHY flow conversations)
-- ============================================================================

CREATE TABLE IF NOT EXISTS brainstorm_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE NOT NULL,
  created_by_user_id UUID REFERENCES auth.users(id) NOT NULL,

  domain TEXT, -- auto-detected topic/domain of brainstorm
  status TEXT NOT NULL DEFAULT 'active', -- 'active' | 'synthesized' | 'archived'

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_brainstorm_sessions_workspace ON brainstorm_sessions(workspace_id);
CREATE INDEX idx_brainstorm_sessions_creator ON brainstorm_sessions(created_by_user_id);
CREATE INDEX idx_brainstorm_sessions_status ON brainstorm_sessions(status);

-- Enable RLS
ALTER TABLE brainstorm_sessions ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see sessions in their workspaces
CREATE POLICY brainstorm_sessions_workspace_isolation ON brainstorm_sessions
  FOR ALL
  USING (
    workspace_id IN (
      SELECT workspace_id FROM members WHERE user_id = auth.uid()
    )
  );

-- ============================================================================
-- BRAINSTORM MESSAGES (chat history)
-- ============================================================================

CREATE TABLE IF NOT EXISTS brainstorm_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID REFERENCES brainstorm_sessions(id) ON DELETE CASCADE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  text TEXT NOT NULL,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_brainstorm_messages_session ON brainstorm_messages(session_id);
CREATE INDEX idx_brainstorm_messages_created_at ON brainstorm_messages(created_at ASC);

-- Enable RLS
ALTER TABLE brainstorm_messages ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see messages in their workspace sessions
CREATE POLICY brainstorm_messages_workspace_isolation ON brainstorm_messages
  FOR ALL
  USING (
    session_id IN (
      SELECT id FROM brainstorm_sessions
      WHERE workspace_id IN (
        SELECT workspace_id FROM members WHERE user_id = auth.uid()
      )
    )
  );

-- ============================================================================
-- OBJECTIVES (strategic goals from WHY sessions)
-- ============================================================================

CREATE TABLE IF NOT EXISTS objectives (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE NOT NULL,
  session_id UUID REFERENCES brainstorm_sessions(id) ON DELETE SET NULL,

  title TEXT NOT NULL CHECK (char_length(title) >= 1 AND char_length(title) <= 200),
  horizon TEXT, -- '30d' | '90d' | '1y' | null
  metric TEXT, -- optional KPI/metric

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_objectives_workspace ON objectives(workspace_id);
CREATE INDEX idx_objectives_session ON objectives(session_id) WHERE session_id IS NOT NULL;

-- Enable RLS
ALTER TABLE objectives ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see objectives in their workspaces
CREATE POLICY objectives_workspace_isolation ON objectives
  FOR ALL
  USING (
    workspace_id IN (
      SELECT workspace_id FROM members WHERE user_id = auth.uid()
    )
  );

-- ============================================================================
-- OBJECTIVE TASK LINKS (traceability)
-- ============================================================================

CREATE TABLE IF NOT EXISTS objective_task_links (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  objective_id UUID REFERENCES objectives(id) ON DELETE CASCADE NOT NULL,
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
  draft_id UUID REFERENCES task_drafts(id) ON DELETE CASCADE,
  confidence INTEGER CHECK (confidence BETWEEN 0 AND 100), -- how strongly related

  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Must link to either task or draft
  CHECK ((task_id IS NOT NULL) OR (draft_id IS NOT NULL))
);

-- Indexes
CREATE INDEX idx_objective_task_links_objective ON objective_task_links(objective_id);
CREATE INDEX idx_objective_task_links_task ON objective_task_links(task_id) WHERE task_id IS NOT NULL;
CREATE INDEX idx_objective_task_links_draft ON objective_task_links(draft_id) WHERE draft_id IS NOT NULL;

-- Enable RLS
ALTER TABLE objective_task_links ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see links in their workspaces
CREATE POLICY objective_task_links_workspace_isolation ON objective_task_links
  FOR ALL
  USING (
    objective_id IN (
      SELECT id FROM objectives
      WHERE workspace_id IN (
        SELECT workspace_id FROM members WHERE user_id = auth.uid()
      )
    )
  );

-- ============================================================================
-- Add foreign key constraints after all tables exist
-- ============================================================================

ALTER TABLE task_drafts
  ADD CONSTRAINT fk_task_drafts_session
  FOREIGN KEY (session_id) REFERENCES brainstorm_sessions(id) ON DELETE SET NULL;

ALTER TABLE task_drafts
  ADD CONSTRAINT fk_task_drafts_objective
  FOREIGN KEY (objective_id) REFERENCES objectives(id) ON DELETE SET NULL;

ALTER TABLE tasks
  ADD CONSTRAINT fk_tasks_session
  FOREIGN KEY (session_id) REFERENCES brainstorm_sessions(id) ON DELETE SET NULL;

-- ============================================================================
-- Functions for automatic timestamps
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply to all tables with updated_at
CREATE TRIGGER update_task_drafts_updated_at BEFORE UPDATE ON task_drafts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON tasks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_capacity_updated_at BEFORE UPDATE ON user_capacity
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_brainstorm_sessions_updated_at BEFORE UPDATE ON brainstorm_sessions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_objectives_updated_at BEFORE UPDATE ON objectives
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- Grant permissions
-- ============================================================================

-- Authenticated users can read/write their workspace data
GRANT SELECT, INSERT, UPDATE, DELETE ON task_drafts TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON tasks TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON user_capacity TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON task_allocations TO authenticated;
GRANT SELECT ON task_events TO authenticated;
GRANT INSERT ON task_events TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON brainstorm_sessions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON brainstorm_messages TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON objectives TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON objective_task_links TO authenticated;
