-- ============================================================================
-- CLEAR TEST/SEED DATA ONLY (Safe Option)
-- ============================================================================
-- This script deletes ONLY the test/seed data for the default workspace.
-- Your actual user data and other workspaces remain intact.
-- ============================================================================

-- The default test workspace ID used in seed data
-- Change this if you want to delete a different workspace
DO $$
DECLARE
  test_workspace_id UUID := '00000000-0000-0000-0000-000000000001';
BEGIN
  -- Financial data for test workspace
  DELETE FROM financial_transactions WHERE workspace_id = test_workspace_id;
  DELETE FROM budget_targets WHERE workspace_id = test_workspace_id;
  DELETE FROM company_financials WHERE workspace_id = test_workspace_id;

  -- Work and planning for test workspace
  DELETE FROM work_plans WHERE workspace_id = test_workspace_id;
  DELETE FROM tasks WHERE workspace_id = test_workspace_id;
  DELETE FROM decisions WHERE workspace_id = test_workspace_id;
  DELETE FROM okrs WHERE workspace_id = test_workspace_id;

  -- Organization for test workspace
  DELETE FROM members WHERE workspace_id = test_workspace_id;
  DELETE FROM memberships WHERE workspace_id = test_workspace_id;

  -- Delete the test workspace itself
  DELETE FROM workspaces WHERE id = test_workspace_id;

  RAISE NOTICE 'Test workspace % and all its data have been deleted', test_workspace_id;
END $$;

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Check remaining row counts
SELECT
  'profiles' as table_name, COUNT(*) as row_count FROM profiles
UNION ALL
SELECT 'workspaces', COUNT(*) FROM workspaces
UNION ALL
SELECT 'memberships', COUNT(*) FROM memberships
UNION ALL
SELECT 'members', COUNT(*) FROM members
UNION ALL
SELECT 'financial_transactions', COUNT(*) FROM financial_transactions
UNION ALL
SELECT 'budget_targets', COUNT(*) FROM budget_targets
UNION ALL
SELECT 'work_plans', COUNT(*) FROM work_plans
UNION ALL
SELECT 'tasks', COUNT(*) FROM tasks
UNION ALL
SELECT 'decisions', COUNT(*) FROM decisions
UNION ALL
SELECT 'okrs', COUNT(*) FROM okrs
ORDER BY table_name;

-- Show remaining workspaces (should only be YOUR real workspaces)
SELECT id, name, created_at
FROM workspaces
ORDER BY created_at DESC;
