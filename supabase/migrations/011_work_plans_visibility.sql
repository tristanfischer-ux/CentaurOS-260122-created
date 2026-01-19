-- ============================================================================
-- WORK PLANS VISIBILITY & PRIVACY MIGRATION
-- Migration: 011_work_plans_visibility.sql
-- Created: 2026-01-19
-- Description: Add visibility controls to work_plans table
-- ============================================================================

-- Add visibility columns to work_plans
ALTER TABLE work_plans
  ADD COLUMN IF NOT EXISTS visibility TEXT DEFAULT 'company'
    CHECK (visibility IN ('private', 'shared', 'function', 'company', 'restricted')),
  ADD COLUMN IF NOT EXISTS owner_user_id UUID REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS shared_user_ids UUID[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS shared_functions TEXT[] DEFAULT '{}';

-- Create index for visibility queries
CREATE INDEX IF NOT EXISTS idx_work_plans_visibility ON work_plans(visibility);
CREATE INDEX IF NOT EXISTS idx_work_plans_owner ON work_plans(owner_user_id);

-- Add comments
COMMENT ON COLUMN work_plans.visibility IS 'Visibility level: private (owner only), shared (specific users), function (team function), company (all workspace), restricted (special access)';
COMMENT ON COLUMN work_plans.owner_user_id IS 'User who owns this work plan - used for private visibility';
COMMENT ON COLUMN work_plans.shared_user_ids IS 'Array of user IDs who have access when visibility=shared';
COMMENT ON COLUMN work_plans.shared_functions IS 'Array of functions (Finance, Marketing, etc.) who have access when visibility=function';

-- ============================================================================
-- UPDATE RLS POLICIES FOR VISIBILITY
-- ============================================================================

-- Drop old policy
DROP POLICY IF EXISTS work_plans_workspace_isolation ON work_plans;

-- Create new visibility-aware SELECT policy
CREATE POLICY work_plans_visibility_select ON work_plans
  FOR SELECT
  USING (
    -- Must be a member of the workspace
    workspace_id IN (
      SELECT workspace_id FROM members WHERE user_id = auth.uid()
    )
    AND (
      -- Company-wide: everyone in workspace can see
      visibility = 'company'

      -- Private: only owner can see
      OR (visibility = 'private' AND owner_user_id = auth.uid())

      -- Function: users in the same function as owner
      OR (visibility = 'function' AND EXISTS (
        SELECT 1 FROM members m_viewer, members m_owner
        WHERE m_viewer.workspace_id = work_plans.workspace_id
        AND m_viewer.user_id = auth.uid()
        AND m_owner.workspace_id = work_plans.workspace_id
        AND m_owner.user_id = work_plans.owner_user_id
        AND m_viewer.function = m_owner.function
      ))

      -- Shared: explicitly shared with this user
      OR (visibility = 'shared' AND auth.uid() = ANY(shared_user_ids))

      -- Restricted: has special access (handled by application layer)
      OR (visibility = 'restricted' AND auth.uid() = ANY(shared_user_ids))
    )
  );

-- Allow workspace members to insert work plans
CREATE POLICY work_plans_visibility_insert ON work_plans
  FOR INSERT
  WITH CHECK (
    workspace_id IN (
      SELECT workspace_id FROM members WHERE user_id = auth.uid()
    )
  );

-- Allow owner or shared users to update work plans
CREATE POLICY work_plans_visibility_update ON work_plans
  FOR UPDATE
  USING (
    workspace_id IN (
      SELECT workspace_id FROM members WHERE user_id = auth.uid()
    )
    AND (
      -- Owner can always update
      owner_user_id = auth.uid()
      -- Or if shared with explicit edit permission
      OR (visibility IN ('shared', 'company') AND auth.uid() = ANY(shared_user_ids))
      -- Company-wide tasks can be edited by anyone in workspace
      OR visibility = 'company'
    )
  );

-- Allow owner to delete work plans
CREATE POLICY work_plans_visibility_delete ON work_plans
  FOR DELETE
  USING (
    workspace_id IN (
      SELECT workspace_id FROM members WHERE user_id = auth.uid()
    )
    AND owner_user_id = auth.uid()
  );

-- ============================================================================
-- BACKFILL EXISTING DATA
-- ============================================================================

-- Set owner_user_id for existing work_plans based on created_by
UPDATE work_plans
SET owner_user_id = (
  SELECT user_id FROM members WHERE id = work_plans.created_by LIMIT 1
)
WHERE owner_user_id IS NULL AND created_by IS NOT NULL;

-- For work_plans without created_by, set to first founder in workspace
UPDATE work_plans
SET owner_user_id = (
  SELECT user_id FROM members
  WHERE workspace_id = work_plans.workspace_id
  AND role = 'Founder'
  LIMIT 1
)
WHERE owner_user_id IS NULL;

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function to check if user can view a work plan
CREATE OR REPLACE FUNCTION can_view_work_plan(
  p_work_plan_id UUID,
  p_user_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  v_can_view BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM work_plans wp
    WHERE wp.id = p_work_plan_id
    AND wp.workspace_id IN (
      SELECT workspace_id FROM members WHERE user_id = p_user_id
    )
    AND (
      wp.visibility = 'company'
      OR (wp.visibility = 'private' AND wp.owner_user_id = p_user_id)
      OR (wp.visibility = 'function' AND EXISTS (
        SELECT 1 FROM members m_viewer, members m_owner
        WHERE m_viewer.workspace_id = wp.workspace_id
        AND m_viewer.user_id = p_user_id
        AND m_owner.workspace_id = wp.workspace_id
        AND m_owner.user_id = wp.owner_user_id
        AND m_viewer.function = m_owner.function
      ))
      OR (wp.visibility IN ('shared', 'restricted') AND p_user_id = ANY(wp.shared_user_ids))
    )
  ) INTO v_can_view;

  RETURN v_can_view;
END;
$$;

-- Function to share work plan with users
CREATE OR REPLACE FUNCTION share_work_plan(
  p_work_plan_id UUID,
  p_user_ids UUID[],
  p_requesting_user_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
  -- Check if requesting user is the owner
  IF NOT EXISTS (
    SELECT 1 FROM work_plans
    WHERE id = p_work_plan_id
    AND owner_user_id = p_requesting_user_id
  ) THEN
    RAISE EXCEPTION 'Only the owner can share this work plan';
  END IF;

  -- Update shared_user_ids
  UPDATE work_plans
  SET shared_user_ids = array_cat(shared_user_ids, p_user_ids),
      visibility = 'shared'
  WHERE id = p_work_plan_id;

  RETURN TRUE;
END;
$$;

-- Function to unshare work plan from users
CREATE OR REPLACE FUNCTION unshare_work_plan(
  p_work_plan_id UUID,
  p_user_ids UUID[],
  p_requesting_user_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
  -- Check if requesting user is the owner
  IF NOT EXISTS (
    SELECT 1 FROM work_plans
    WHERE id = p_work_plan_id
    AND owner_user_id = p_requesting_user_id
  ) THEN
    RAISE EXCEPTION 'Only the owner can unshare this work plan';
  END IF;

  -- Remove users from shared_user_ids
  UPDATE work_plans
  SET shared_user_ids = array(
    SELECT unnest(shared_user_ids)
    EXCEPT
    SELECT unnest(p_user_ids)
  )
  WHERE id = p_work_plan_id;

  RETURN TRUE;
END;
$$;

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Verify migration
DO $$
BEGIN
  -- Check columns exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'work_plans' AND column_name = 'visibility') THEN
    RAISE EXCEPTION 'Migration failed: visibility column not added';
  END IF;

  RAISE NOTICE 'Work plans visibility migration completed successfully';
END;
$$;
