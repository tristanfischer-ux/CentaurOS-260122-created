-- ============================================================================
-- FINANCIAL DATA ACCESS RESTRICTIONS
-- Migration: 012_finance_function_access.sql
-- Created: 2026-01-19
-- Description: Restrict financial data to Finance function + Founders only
-- ============================================================================

-- ============================================================================
-- SUPPLIER ENGAGEMENTS - Finance-only access
-- ============================================================================

-- Drop old workspace isolation policy
DROP POLICY IF EXISTS supplier_engagements_workspace_isolation ON supplier_engagements;

-- Create new finance-restricted policy for SELECT
CREATE POLICY supplier_engagements_finance_select ON supplier_engagements
  FOR SELECT
  USING (
    workspace_id IN (
      SELECT workspace_id FROM members
      WHERE user_id = auth.uid()
      AND (
        -- Finance function members
        function = 'Finance'
        -- OR Founders/Co-founders (always have access)
        OR role IN ('Founder', 'CoFounder')
      )
    )
  );

-- Allow Finance + Founders to insert
CREATE POLICY supplier_engagements_finance_insert ON supplier_engagements
  FOR INSERT
  WITH CHECK (
    workspace_id IN (
      SELECT workspace_id FROM members
      WHERE user_id = auth.uid()
      AND (function = 'Finance' OR role IN ('Founder', 'CoFounder'))
    )
  );

-- Allow Finance + Founders to update
CREATE POLICY supplier_engagements_finance_update ON supplier_engagements
  FOR UPDATE
  USING (
    workspace_id IN (
      SELECT workspace_id FROM members
      WHERE user_id = auth.uid()
      AND (function = 'Finance' OR role IN ('Founder', 'CoFounder'))
    )
  );

-- Allow Finance + Founders to delete
CREATE POLICY supplier_engagements_finance_delete ON supplier_engagements
  FOR DELETE
  USING (
    workspace_id IN (
      SELECT workspace_id FROM members
      WHERE user_id = auth.uid()
      AND (function = 'Finance' OR role IN ('Founder', 'CoFounder'))
    )
  );

-- ============================================================================
-- ADD VISIBILITY INDICATOR TO MEMBERS TABLE
-- ============================================================================

-- Add column to track if cost_per_day should be hidden (optional future enhancement)
ALTER TABLE members
  ADD COLUMN IF NOT EXISTS hide_compensation BOOLEAN DEFAULT FALSE;

COMMENT ON COLUMN members.hide_compensation IS 'If true, hide compensation details from non-Finance/Founder members (future enhancement)';

-- ============================================================================
-- CREATE VIEW FOR SAFE MEMBER ACCESS
-- ============================================================================

-- Create a view that shows members with conditional compensation visibility
CREATE OR REPLACE VIEW members_safe AS
SELECT
  m.id,
  m.workspace_id,
  m.user_id,
  m.name,
  m.role,
  m.function,
  m.status,
  m.days_per_week,
  -- Show cost_per_day only if:
  -- 1. Current user is in Finance function
  -- 2. OR current user is Founder/CoFounder
  -- 3. OR it's the user's own record
  CASE
    WHEN EXISTS (
      SELECT 1 FROM members viewer
      WHERE viewer.user_id = auth.uid()
      AND viewer.workspace_id = m.workspace_id
      AND (viewer.function = 'Finance' OR viewer.role IN ('Founder', 'CoFounder'))
    ) THEN m.cost_per_day
    WHEN m.user_id = auth.uid() THEN m.cost_per_day
    ELSE NULL  -- Hide for others (if hide_compensation is ever enforced)
  END AS cost_per_day,
  m.created_at,
  m.updated_at
FROM members m
WHERE m.workspace_id IN (
  SELECT workspace_id FROM members WHERE user_id = auth.uid()
);

COMMENT ON VIEW members_safe IS 'Safe view of members with conditional compensation visibility (currently all visible per requirements, but structured for future changes)';

-- ============================================================================
-- HELPER FUNCTION: Check if user has finance access
-- ============================================================================

CREATE OR REPLACE FUNCTION has_finance_access(
  p_workspace_id UUID,
  p_user_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  v_has_access BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM members
    WHERE workspace_id = p_workspace_id
    AND user_id = p_user_id
    AND (function = 'Finance' OR role IN ('Founder', 'CoFounder'))
  ) INTO v_has_access;

  RETURN v_has_access;
END;
$$;

COMMENT ON FUNCTION has_finance_access IS 'Check if a user has access to financial data in a workspace';

-- ============================================================================
-- AUDIT FUNCTION: Log financial data access
-- ============================================================================

CREATE TABLE IF NOT EXISTS finance_access_audit (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  action TEXT NOT NULL, -- 'view', 'create', 'update', 'delete'
  resource_type TEXT NOT NULL, -- 'supplier_engagement', 'invoice', etc.
  resource_id UUID,
  accessed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_finance_audit_workspace ON finance_access_audit(workspace_id);
CREATE INDEX IF NOT EXISTS idx_finance_audit_user ON finance_access_audit(user_id);
CREATE INDEX IF NOT EXISTS idx_finance_audit_accessed ON finance_access_audit(accessed_at);

COMMENT ON TABLE finance_access_audit IS 'Audit log for all financial data access';

-- Function to log finance access
CREATE OR REPLACE FUNCTION log_finance_access(
  p_workspace_id UUID,
  p_action TEXT,
  p_resource_type TEXT,
  p_resource_id UUID DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO finance_access_audit (
    workspace_id,
    user_id,
    action,
    resource_type,
    resource_id
  ) VALUES (
    p_workspace_id,
    auth.uid(),
    p_action,
    p_resource_type,
    p_resource_id
  );
END;
$$;

-- ============================================================================
-- NOTES ON CURRENT REQUIREMENTS
-- ============================================================================

/*
 * Based on user requirements:
 *
 * 1. Team members CAN see each other's day rates (cost_per_day in members table)
 *    - Currently: All workspace members can see this
 *    - RLS: No change needed, workspace isolation is sufficient
 *    - Future: Can use hide_compensation column if requirements change
 *
 * 2. Finance apprentices CAN see financials, others CANNOT
 *    - Implemented: supplier_engagements restricted to Finance function + Founders
 *    - Note: If other financial tables exist (invoices, budgets, etc.), apply same pattern
 *
 * 3. Founders always have access to everything
 *    - Implemented: All policies check for role IN ('Founder', 'CoFounder')
 *
 * IMPORTANT: Apply the same RLS pattern to any other tables containing financial data:
 * - Invoices
 * - Budgets
 * - Revenue data
 * - P&L statements
 * - Bank connections
 * - Payment processing data
 */

-- ============================================================================
-- VERIFICATION
-- ============================================================================

DO $$
BEGIN
  -- Verify policies exist
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
    AND tablename = 'supplier_engagements'
    AND policyname = 'supplier_engagements_finance_select'
  ) THEN
    RAISE EXCEPTION 'Migration failed: Finance RLS policy not created';
  END IF;

  RAISE NOTICE 'Finance function access migration completed successfully';
END;
$$;
