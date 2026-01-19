-- ============================================================================
-- FOUNDER ONBOARDING SYSTEM
-- Migration: 010_founder_onboarding.sql
-- Created: 2026-01-19
-- Description: Guided onboarding checklist for founders with stage-awareness,
--              evidence gating, and task draft generation
-- ============================================================================

-- Enable UUID generation if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- 1. ONBOARDING PROGRAMS (Templates)
-- ============================================================================

CREATE TABLE IF NOT EXISTS onboarding_programs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Program identity
  name TEXT NOT NULL,
  description TEXT,
  version TEXT NOT NULL DEFAULT '1.0.0',

  -- Status
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  is_default BOOLEAN NOT NULL DEFAULT FALSE,

  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- 2. ONBOARDING MODULES (Groups of Steps)
-- ============================================================================

CREATE TABLE IF NOT EXISTS onboarding_modules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  program_id UUID NOT NULL REFERENCES onboarding_programs(id) ON DELETE CASCADE,

  -- Module identity
  module_key TEXT NOT NULL, -- e.g., 'foundation', 'market', 'product'
  title TEXT NOT NULL,
  description TEXT,
  icon TEXT, -- lucide icon name
  color TEXT, -- hex color

  -- Ordering
  order_index INTEGER NOT NULL DEFAULT 0,

  -- Stage applicability rules
  -- JSON: { org_stages: ['S0', 'S1'], finance_stages: ['F0', 'F1'], required: true, auto_skip_if: [...] }
  stage_applicability_json JSONB NOT NULL DEFAULT '{}',

  -- Flags
  is_required BOOLEAN NOT NULL DEFAULT TRUE,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(program_id, module_key)
);

-- ============================================================================
-- 3. ONBOARDING STEPS (Individual Checklist Items)
-- ============================================================================

CREATE TABLE IF NOT EXISTS onboarding_steps (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  module_id UUID NOT NULL REFERENCES onboarding_modules(id) ON DELETE CASCADE,

  -- Step identity
  step_key TEXT NOT NULL, -- e.g., 'define_mission', 'define_icp'
  title TEXT NOT NULL,
  description_short TEXT NOT NULL,
  description_long TEXT,

  -- Ordering
  order_index INTEGER NOT NULL DEFAULT 0,

  -- Input configuration
  -- JSON: [{ key: 'mission', type: 'text', label: 'Your mission', placeholder: '...', required: true }]
  required_inputs_json JSONB NOT NULL DEFAULT '[]',

  -- Evidence requirements
  -- JSON: [{ key: 'mission_statement', label: '2-sentence mission', type: 'text', min_length: 20 }]
  evidence_requirements_json JSONB NOT NULL DEFAULT '[]',

  -- Output templates (objectives + task drafts)
  -- JSON: { objectives: [...], task_drafts: [...] }
  outputs_templates_json JSONB NOT NULL DEFAULT '{}',

  -- Gating rules
  -- JSON: { requires_step_ids: [], min_evidence_count: 1, allow_skip: true }
  gating_rules_json JSONB NOT NULL DEFAULT '{}',

  -- Stage applicability (inherits from module, can override)
  stage_applicability_json JSONB,

  -- LLM prompt template for dynamic generation
  llm_prompt_template TEXT,

  -- Flags
  is_required BOOLEAN NOT NULL DEFAULT TRUE,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(module_id, step_key)
);

-- ============================================================================
-- 4. COMPANY ONBOARDING STATE (Per-Company Progress)
-- ============================================================================

CREATE TABLE IF NOT EXISTS company_onboarding_state (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Multi-tenancy
  company_id UUID NOT NULL, -- Links to workspace/company
  program_id UUID NOT NULL REFERENCES onboarding_programs(id) ON DELETE CASCADE,

  -- Current position
  current_module_id UUID REFERENCES onboarding_modules(id) ON DELETE SET NULL,
  current_step_id UUID REFERENCES onboarding_steps(id) ON DELETE SET NULL,

  -- Overall progress
  -- JSON: { modules_completed: 0, modules_total: 7, steps_completed: 0, steps_total: 21, percent: 0 }
  progress_json JSONB NOT NULL DEFAULT '{}',

  -- Status
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'paused', 'completed', 'abandoned')),

  -- Stage snapshot at start (for tailoring)
  org_stage TEXT,
  finance_stage TEXT,

  -- Timestamps
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(company_id, program_id)
);

-- ============================================================================
-- 5. COMPANY ONBOARDING STEP STATE (Per-Step Progress)
-- ============================================================================

CREATE TABLE IF NOT EXISTS company_onboarding_step_state (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Links
  company_id UUID NOT NULL,
  step_id UUID NOT NULL REFERENCES onboarding_steps(id) ON DELETE CASCADE,
  onboarding_state_id UUID NOT NULL REFERENCES company_onboarding_state(id) ON DELETE CASCADE,

  -- Status
  status TEXT NOT NULL DEFAULT 'locked'
    CHECK (status IN ('locked', 'unlocked', 'in_progress', 'completed', 'skipped')),

  -- User inputs (raw text/transcript)
  inputs_json JSONB NOT NULL DEFAULT '{}',

  -- Evidence provided
  -- JSON: { mission_statement: { value: '...', type: 'text', satisfied: true } }
  evidence_json JSONB NOT NULL DEFAULT '{}',

  -- Skip handling
  skip_reason TEXT,

  -- Generated outputs (before sending to WHAT)
  generated_outputs_json JSONB,

  -- Timestamps
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  skipped_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(company_id, step_id)
);

-- ============================================================================
-- 6. ONBOARDING OUTPUTS LINKS (Traceability)
-- ============================================================================

CREATE TABLE IF NOT EXISTS onboarding_outputs_links (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Source
  company_id UUID NOT NULL,
  step_id UUID NOT NULL REFERENCES onboarding_steps(id) ON DELETE CASCADE,
  step_state_id UUID NOT NULL REFERENCES company_onboarding_step_state(id) ON DELETE CASCADE,

  -- Target (one of these will be set)
  objective_id UUID, -- Links to OKR/objective if created
  task_draft_id UUID, -- Links to task_drafts table
  task_id UUID, -- Links to actual task after confirmation

  -- Metadata
  output_type TEXT NOT NULL CHECK (output_type IN ('objective', 'task_draft', 'task')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- 7. TASK DRAFTS TABLE (if not exists - for onboarding + other sources)
-- ============================================================================

CREATE TABLE IF NOT EXISTS onboarding_task_drafts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Multi-tenancy
  company_id UUID NOT NULL,

  -- Task content
  title TEXT NOT NULL,
  notes TEXT,
  units INTEGER NOT NULL DEFAULT 1,

  -- Assignment hints
  assignee_hint TEXT DEFAULT 'founder'
    CHECK (assignee_hint IN ('founder', 'exec', 'apprentice', 'unassigned')),
  assignee_id UUID, -- If explicitly set

  -- Dates
  due_iso TEXT,
  start_iso TEXT,

  -- Source traceability
  source_type TEXT NOT NULL DEFAULT 'onboarding'
    CHECK (source_type IN ('onboarding', 'brainstorm', 'voice', 'import', 'manual')),
  source_step_id UUID REFERENCES onboarding_steps(id) ON DELETE SET NULL,
  source_objective_id UUID,

  -- Status
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'confirmed', 'rejected', 'expired')),

  -- Confidence (from LLM)
  confidence_score INTEGER DEFAULT 80 CHECK (confidence_score >= 0 AND confidence_score <= 100),

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  confirmed_at TIMESTAMPTZ,
  created_by UUID NOT NULL,

  -- Link to actual task after confirmation
  confirmed_task_id UUID
);

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Company onboarding lookups
CREATE INDEX IF NOT EXISTS idx_company_onboarding_state_company
  ON company_onboarding_state(company_id);
CREATE INDEX IF NOT EXISTS idx_company_onboarding_state_status
  ON company_onboarding_state(status);

-- Step state lookups
CREATE INDEX IF NOT EXISTS idx_company_onboarding_step_state_company
  ON company_onboarding_step_state(company_id);
CREATE INDEX IF NOT EXISTS idx_company_onboarding_step_state_status
  ON company_onboarding_step_state(status);
CREATE INDEX IF NOT EXISTS idx_company_onboarding_step_state_onboarding
  ON company_onboarding_step_state(onboarding_state_id);

-- Output links
CREATE INDEX IF NOT EXISTS idx_onboarding_outputs_links_company
  ON onboarding_outputs_links(company_id);
CREATE INDEX IF NOT EXISTS idx_onboarding_outputs_links_step
  ON onboarding_outputs_links(step_id);

-- Task drafts
CREATE INDEX IF NOT EXISTS idx_onboarding_task_drafts_company
  ON onboarding_task_drafts(company_id);
CREATE INDEX IF NOT EXISTS idx_onboarding_task_drafts_status
  ON onboarding_task_drafts(status);
CREATE INDEX IF NOT EXISTS idx_onboarding_task_drafts_source_step
  ON onboarding_task_drafts(source_step_id);

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Function: Calculate onboarding progress
CREATE OR REPLACE FUNCTION calculate_onboarding_progress(p_company_id UUID, p_onboarding_state_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_result JSONB;
  v_modules_completed INTEGER;
  v_modules_total INTEGER;
  v_steps_completed INTEGER;
  v_steps_total INTEGER;
BEGIN
  -- Count modules
  SELECT COUNT(*) INTO v_modules_total
  FROM onboarding_modules m
  JOIN company_onboarding_state cos ON cos.program_id = m.program_id
  WHERE cos.id = p_onboarding_state_id;

  -- Count completed modules (all required steps done)
  SELECT COUNT(DISTINCT m.id) INTO v_modules_completed
  FROM onboarding_modules m
  JOIN onboarding_steps s ON s.module_id = m.id
  JOIN company_onboarding_step_state css ON css.step_id = s.id AND css.company_id = p_company_id
  WHERE css.onboarding_state_id = p_onboarding_state_id
    AND css.status IN ('completed', 'skipped')
  GROUP BY m.id
  HAVING COUNT(*) = (SELECT COUNT(*) FROM onboarding_steps WHERE module_id = m.id AND is_required = TRUE);

  v_modules_completed := COALESCE(v_modules_completed, 0);

  -- Count steps
  SELECT COUNT(*) INTO v_steps_total
  FROM onboarding_steps s
  JOIN onboarding_modules m ON m.id = s.module_id
  JOIN company_onboarding_state cos ON cos.program_id = m.program_id
  WHERE cos.id = p_onboarding_state_id
    AND s.is_required = TRUE;

  SELECT COUNT(*) INTO v_steps_completed
  FROM company_onboarding_step_state css
  WHERE css.onboarding_state_id = p_onboarding_state_id
    AND css.status IN ('completed', 'skipped');

  v_result := jsonb_build_object(
    'modules_completed', v_modules_completed,
    'modules_total', v_modules_total,
    'steps_completed', v_steps_completed,
    'steps_total', v_steps_total,
    'percent', CASE WHEN v_steps_total > 0 THEN ROUND((v_steps_completed::NUMERIC / v_steps_total) * 100) ELSE 0 END
  );

  RETURN v_result;
END;
$$ LANGUAGE plpgsql;

-- Function: Unlock next step
CREATE OR REPLACE FUNCTION unlock_next_onboarding_step(
  p_company_id UUID,
  p_onboarding_state_id UUID,
  p_current_step_id UUID
)
RETURNS UUID AS $$
DECLARE
  v_current_module_id UUID;
  v_current_order INTEGER;
  v_next_step_id UUID;
  v_next_module_id UUID;
BEGIN
  -- Get current step info
  SELECT module_id, order_index INTO v_current_module_id, v_current_order
  FROM onboarding_steps WHERE id = p_current_step_id;

  -- Try next step in same module
  SELECT id INTO v_next_step_id
  FROM onboarding_steps
  WHERE module_id = v_current_module_id
    AND order_index > v_current_order
  ORDER BY order_index
  LIMIT 1;

  -- If no more steps in module, try first step of next module
  IF v_next_step_id IS NULL THEN
    SELECT m.id INTO v_next_module_id
    FROM onboarding_modules m
    JOIN onboarding_modules cm ON cm.id = v_current_module_id
    WHERE m.program_id = cm.program_id
      AND m.order_index > cm.order_index
    ORDER BY m.order_index
    LIMIT 1;

    IF v_next_module_id IS NOT NULL THEN
      SELECT id INTO v_next_step_id
      FROM onboarding_steps
      WHERE module_id = v_next_module_id
      ORDER BY order_index
      LIMIT 1;
    END IF;
  END IF;

  -- Unlock the next step if found
  IF v_next_step_id IS NOT NULL THEN
    INSERT INTO company_onboarding_step_state (
      company_id, step_id, onboarding_state_id, status
    ) VALUES (
      p_company_id, v_next_step_id, p_onboarding_state_id, 'unlocked'
    )
    ON CONFLICT (company_id, step_id)
    DO UPDATE SET status = 'unlocked', updated_at = NOW();

    -- Update current position
    UPDATE company_onboarding_state
    SET current_step_id = v_next_step_id,
        current_module_id = (SELECT module_id FROM onboarding_steps WHERE id = v_next_step_id),
        updated_at = NOW()
    WHERE id = p_onboarding_state_id;
  END IF;

  RETURN v_next_step_id;
END;
$$ LANGUAGE plpgsql;

-- Function: Check if step can be completed
CREATE OR REPLACE FUNCTION can_complete_onboarding_step(
  p_step_state_id UUID
)
RETURNS JSONB AS $$
DECLARE
  v_step_id UUID;
  v_evidence_json JSONB;
  v_evidence_reqs JSONB;
  v_req JSONB;
  v_satisfied_count INTEGER := 0;
  v_required_count INTEGER := 0;
  v_missing_evidence TEXT[] := '{}';
BEGIN
  -- Get step state
  SELECT step_id, evidence_json INTO v_step_id, v_evidence_json
  FROM company_onboarding_step_state WHERE id = p_step_state_id;

  -- Get evidence requirements
  SELECT evidence_requirements_json INTO v_evidence_reqs
  FROM onboarding_steps WHERE id = v_step_id;

  -- Check each requirement
  FOR v_req IN SELECT * FROM jsonb_array_elements(v_evidence_reqs)
  LOOP
    v_required_count := v_required_count + 1;

    IF v_evidence_json ? (v_req->>'key') AND
       (v_evidence_json->(v_req->>'key')->>'satisfied')::BOOLEAN = TRUE THEN
      v_satisfied_count := v_satisfied_count + 1;
    ELSE
      v_missing_evidence := array_append(v_missing_evidence, v_req->>'label');
    END IF;
  END LOOP;

  RETURN jsonb_build_object(
    'can_complete', v_satisfied_count >= v_required_count,
    'satisfied_count', v_satisfied_count,
    'required_count', v_required_count,
    'missing_evidence', to_jsonb(v_missing_evidence)
  );
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE onboarding_programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE onboarding_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE onboarding_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_onboarding_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_onboarding_step_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE onboarding_outputs_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE onboarding_task_drafts ENABLE ROW LEVEL SECURITY;

-- Programs, modules, steps are readable by all (templates)
CREATE POLICY "Programs are viewable by all" ON onboarding_programs
  FOR SELECT USING (true);

CREATE POLICY "Modules are viewable by all" ON onboarding_modules
  FOR SELECT USING (true);

CREATE POLICY "Steps are viewable by all" ON onboarding_steps
  FOR SELECT USING (true);

-- Company-specific data restricted to workspace members
CREATE POLICY "Company onboarding state is workspace-scoped" ON company_onboarding_state
  FOR ALL USING (
    company_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Company step state is workspace-scoped" ON company_onboarding_step_state
  FOR ALL USING (
    company_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Output links are workspace-scoped" ON onboarding_outputs_links
  FOR ALL USING (
    company_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Task drafts are workspace-scoped" ON onboarding_task_drafts
  FOR ALL USING (
    company_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = auth.uid()
    )
  );

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Auto-update updated_at timestamps
CREATE OR REPLACE FUNCTION update_onboarding_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_company_onboarding_state_timestamp
  BEFORE UPDATE ON company_onboarding_state
  FOR EACH ROW EXECUTE FUNCTION update_onboarding_timestamp();

CREATE TRIGGER update_company_onboarding_step_state_timestamp
  BEFORE UPDATE ON company_onboarding_step_state
  FOR EACH ROW EXECUTE FUNCTION update_onboarding_timestamp();
