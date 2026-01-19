-- ============================================================================
-- CLEAR ALL SUPABASE DATA
-- ============================================================================
-- This script deletes ALL data from ALL tables in the Supabase database.
-- ⚠️ WARNING: This is irreversible! Only run this if you want a completely clean slate.
-- ============================================================================

-- Disable RLS temporarily to allow deletion
SET session_replication_role = 'replica';

-- ============================================================================
-- TIER 3: USER DATA
-- ============================================================================

DELETE FROM user_preferences;
DELETE FROM user_skills;

-- ============================================================================
-- TIER 2: COMPANY DATA
-- ============================================================================

-- Financial data
DELETE FROM financial_transactions;
DELETE FROM budget_targets;
DELETE FROM company_financials;

-- Work and planning
DELETE FROM work_plans;
DELETE FROM tasks;
DELETE FROM decisions;
DELETE FROM okrs;

-- Organization
DELETE FROM members;
DELETE FROM memberships;

-- Bulk imports
DELETE FROM bulk_import_logs;

-- ============================================================================
-- TIER 1: MARKETPLACE DATA (Optional - comment out if you want to keep marketplace)
-- ============================================================================

-- Uncomment these if you want to clear marketplace data too:
-- DELETE FROM marketplace_reviews;
-- DELETE FROM apprentice_listings;
-- DELETE FROM executive_listings;
-- DELETE FROM ai_tools;
-- DELETE FROM suppliers;
-- DELETE FROM function_templates;
-- DELETE FROM role_definitions;

-- ============================================================================
-- CORE DATA
-- ============================================================================

-- Workspaces (this will cascade delete memberships, members, etc.)
DELETE FROM workspaces;

-- User profiles (this will NOT delete auth.users - that's managed by Supabase Auth)
DELETE FROM profiles;

-- Re-enable RLS
SET session_replication_role = 'origin';

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
