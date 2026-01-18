-- ============================================================================
-- RLS Policies for Mutations (INSERT, UPDATE, DELETE)
-- ============================================================================
-- Created: 2026-01-18
-- Purpose: Enable CRUD operations for authenticated users in their workspaces
--
-- Security Model:
-- - Users can only modify data in workspaces they belong to
-- - Policies check membership via the members table
-- - All policies use workspace_id for multi-tenant isolation
-- ============================================================================

-- ============================================================================
-- MEMBERS TABLE POLICIES
-- ============================================================================

-- Allow users to insert members (requires workspace membership with Founder/FractionalExec role)
CREATE POLICY members_insert ON members
  FOR INSERT
  WITH CHECK (
    workspace_id IN (
      SELECT workspace_id
      FROM members
      WHERE user_id = auth.uid()
        AND role IN ('Founder', 'FractionalExec')
    )
  );

-- Allow users to update members in their workspace
CREATE POLICY members_update ON members
  FOR UPDATE
  USING (
    workspace_id IN (
      SELECT workspace_id
      FROM members
      WHERE user_id = auth.uid()
    )
  );

-- Allow users to delete members (requires Founder role)
CREATE POLICY members_delete ON members
  FOR DELETE
  USING (
    workspace_id IN (
      SELECT workspace_id
      FROM members
      WHERE user_id = auth.uid()
        AND role = 'Founder'
    )
  );

-- ============================================================================
-- WORK PLANS TABLE POLICIES
-- ============================================================================

-- Allow users to insert work plans in their workspace
CREATE POLICY work_plans_insert ON work_plans
  FOR INSERT
  WITH CHECK (
    workspace_id IN (
      SELECT workspace_id
      FROM members
      WHERE user_id = auth.uid()
    )
  );

-- Allow users to update work plans in their workspace
CREATE POLICY work_plans_update ON work_plans
  FOR UPDATE
  USING (
    workspace_id IN (
      SELECT workspace_id
      FROM members
      WHERE user_id = auth.uid()
    )
  );

-- Allow users to delete work plans in their workspace
CREATE POLICY work_plans_delete ON work_plans
  FOR DELETE
  USING (
    workspace_id IN (
      SELECT workspace_id
      FROM members
      WHERE user_id = auth.uid()
    )
  );

-- ============================================================================
-- WORK PLAN ALLOCATIONS TABLE POLICIES
-- ============================================================================

-- Allow users to insert allocations for work plans in their workspace
CREATE POLICY work_plan_allocations_insert ON work_plan_allocations
  FOR INSERT
  WITH CHECK (
    work_plan_id IN (
      SELECT id
      FROM work_plans
      WHERE workspace_id IN (
        SELECT workspace_id
        FROM members
        WHERE user_id = auth.uid()
      )
    )
  );

-- Allow users to update allocations
CREATE POLICY work_plan_allocations_update ON work_plan_allocations
  FOR UPDATE
  USING (
    work_plan_id IN (
      SELECT id
      FROM work_plans
      WHERE workspace_id IN (
        SELECT workspace_id
        FROM members
        WHERE user_id = auth.uid()
      )
    )
  );

-- Allow users to delete allocations
CREATE POLICY work_plan_allocations_delete ON work_plan_allocations
  FOR DELETE
  USING (
    work_plan_id IN (
      SELECT id
      FROM work_plans
      WHERE workspace_id IN (
        SELECT workspace_id
        FROM members
        WHERE user_id = auth.uid()
      )
    )
  );

-- ============================================================================
-- OKRS TABLE POLICIES
-- ============================================================================

-- Allow users to insert OKRs in their workspace
CREATE POLICY okrs_insert ON okrs
  FOR INSERT
  WITH CHECK (
    workspace_id IN (
      SELECT workspace_id
      FROM members
      WHERE user_id = auth.uid()
    )
  );

-- Allow users to update OKRs in their workspace
CREATE POLICY okrs_update ON okrs
  FOR UPDATE
  USING (
    workspace_id IN (
      SELECT workspace_id
      FROM members
      WHERE user_id = auth.uid()
    )
  );

-- Allow users to delete OKRs in their workspace
CREATE POLICY okrs_delete ON okrs
  FOR DELETE
  USING (
    workspace_id IN (
      SELECT workspace_id
      FROM members
      WHERE user_id = auth.uid()
    )
  );

-- ============================================================================
-- OKR OBJECTIVES TABLE POLICIES
-- ============================================================================

-- Allow users to insert objectives for OKRs in their workspace
CREATE POLICY okr_objectives_insert ON okr_objectives
  FOR INSERT
  WITH CHECK (
    okr_id IN (
      SELECT id
      FROM okrs
      WHERE workspace_id IN (
        SELECT workspace_id
        FROM members
        WHERE user_id = auth.uid()
      )
    )
  );

-- Allow users to update objectives
CREATE POLICY okr_objectives_update ON okr_objectives
  FOR UPDATE
  USING (
    okr_id IN (
      SELECT id
      FROM okrs
      WHERE workspace_id IN (
        SELECT workspace_id
        FROM members
        WHERE user_id = auth.uid()
      )
    )
  );

-- Allow users to delete objectives
CREATE POLICY okr_objectives_delete ON okr_objectives
  FOR DELETE
  USING (
    okr_id IN (
      SELECT id
      FROM okrs
      WHERE workspace_id IN (
        SELECT workspace_id
        FROM members
        WHERE user_id = auth.uid()
      )
    )
  );

-- ============================================================================
-- SUPPLIERS TABLE POLICIES
-- ============================================================================

-- Allow users to insert suppliers in their workspace
CREATE POLICY suppliers_insert ON suppliers
  FOR INSERT
  WITH CHECK (
    workspace_id IN (
      SELECT workspace_id
      FROM members
      WHERE user_id = auth.uid()
    )
  );

-- Allow users to update suppliers in their workspace
CREATE POLICY suppliers_update ON suppliers
  FOR UPDATE
  USING (
    workspace_id IN (
      SELECT workspace_id
      FROM members
      WHERE user_id = auth.uid()
    )
  );

-- Allow users to delete suppliers in their workspace
CREATE POLICY suppliers_delete ON suppliers
  FOR DELETE
  USING (
    workspace_id IN (
      SELECT workspace_id
      FROM members
      WHERE user_id = auth.uid()
    )
  );

-- ============================================================================
-- SUPPLIER ENGAGEMENTS TABLE POLICIES
-- ============================================================================

-- Allow users to insert supplier engagements in their workspace
CREATE POLICY supplier_engagements_insert ON supplier_engagements
  FOR INSERT
  WITH CHECK (
    workspace_id IN (
      SELECT workspace_id
      FROM members
      WHERE user_id = auth.uid()
    )
  );

-- Allow users to update supplier engagements in their workspace
CREATE POLICY supplier_engagements_update ON supplier_engagements
  FOR UPDATE
  USING (
    workspace_id IN (
      SELECT workspace_id
      FROM members
      WHERE user_id = auth.uid()
    )
  );

-- Allow users to delete supplier engagements in their workspace
CREATE POLICY supplier_engagements_delete ON supplier_engagements
  FOR DELETE
  USING (
    workspace_id IN (
      SELECT workspace_id
      FROM members
      WHERE user_id = auth.uid()
    )
  );

-- ============================================================================
-- FINANCIAL TRANSACTIONS TABLE POLICIES
-- ============================================================================

-- Allow users to insert financial transactions in their workspace
CREATE POLICY financial_transactions_insert ON financial_transactions
  FOR INSERT
  WITH CHECK (
    workspace_id IN (
      SELECT workspace_id
      FROM members
      WHERE user_id = auth.uid()
        AND role IN ('Founder', 'FractionalExec')
    )
  );

-- Allow users to update financial transactions in their workspace
CREATE POLICY financial_transactions_update ON financial_transactions
  FOR UPDATE
  USING (
    workspace_id IN (
      SELECT workspace_id
      FROM members
      WHERE user_id = auth.uid()
        AND role IN ('Founder', 'FractionalExec')
    )
  );

-- Allow users to delete financial transactions (Founder only)
CREATE POLICY financial_transactions_delete ON financial_transactions
  FOR DELETE
  USING (
    workspace_id IN (
      SELECT workspace_id
      FROM members
      WHERE user_id = auth.uid()
        AND role = 'Founder'
    )
  );

-- ============================================================================
-- BUDGET TARGETS TABLE POLICIES
-- ============================================================================

-- Allow users to insert budget targets in their workspace
CREATE POLICY budget_targets_insert ON budget_targets
  FOR INSERT
  WITH CHECK (
    workspace_id IN (
      SELECT workspace_id
      FROM members
      WHERE user_id = auth.uid()
        AND role IN ('Founder', 'FractionalExec')
    )
  );

-- Allow users to update budget targets in their workspace
CREATE POLICY budget_targets_update ON budget_targets
  FOR UPDATE
  USING (
    workspace_id IN (
      SELECT workspace_id
      FROM members
      WHERE user_id = auth.uid()
        AND role IN ('Founder', 'FractionalExec')
    )
  );

-- Allow users to delete budget targets
CREATE POLICY budget_targets_delete ON budget_targets
  FOR DELETE
  USING (
    workspace_id IN (
      SELECT workspace_id
      FROM members
      WHERE user_id = auth.uid()
        AND role = 'Founder'
    )
  );

-- ============================================================================
-- NOTES
-- ============================================================================

-- Universal data tables (ai_tools, function_templates, role_definitions) are read-only
-- No mutation policies needed for these tables
--
-- User-specific tables (user_preferences, user_favorite_suppliers) need per-user policies
-- These will be added when those features are implemented
--
-- To apply this migration:
-- 1. Copy this file content
-- 2. Go to Supabase Dashboard → SQL Editor
-- 3. Paste and run the migration
-- 4. Verify policies with: SELECT * FROM pg_policies WHERE schemaname = 'public';
