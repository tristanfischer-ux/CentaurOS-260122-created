# 🚨 CRITICAL: Fix Supabase RLS Policy Infinite Recursion

## The Problem

Your Supabase database has Row Level Security (RLS) policies that cause **infinite recursion** when querying the `memberships` and `workspaces` tables.

**Error:** `infinite recursion detected in policy for relation "memberships"`

This happens when:
- The RLS policy on `memberships` checks if a user is a member (by querying `memberships`)
- The RLS policy on `workspaces` checks if a user has a membership (by querying `memberships`)

This creates a circular dependency: to read memberships, you need to check memberships!

## The Solution

You need to fix the RLS policies in your Supabase dashboard.

### Step 1: Go to Supabase Dashboard

1. Open your Supabase project dashboard
2. Navigate to: **Authentication** → **Policies**
3. Find the `memberships` table

### Step 2: Replace the Recursive Policy

**DELETE** the existing policy on `memberships` that causes recursion.

**CREATE** a new simple policy:

```sql
-- Policy for SELECT (reading memberships)
CREATE POLICY "Users can view their own memberships"
ON memberships FOR SELECT
USING (auth.uid() = user_id);

-- Policy for INSERT (creating memberships when workspace is created)
CREATE POLICY "Users can create their own memberships"
ON memberships FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Policy for UPDATE (if needed)
CREATE POLICY "Users can update their own memberships"
ON memberships FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
```

### Step 3: Fix the Workspaces Policy (Optional)

If `workspaces` also has a recursive policy, simplify it:

```sql
-- Simple policy: users can view workspaces they own
CREATE POLICY "Users can view their workspaces"
ON workspaces FOR SELECT
USING (auth.uid() = owner_id);

-- Or if you need membership-based access, use a subquery that won't recurse:
CREATE POLICY "Users can view workspaces they are members of"
ON workspaces FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM memberships
    WHERE memberships.workspace_id = workspaces.id
    AND memberships.user_id = auth.uid()
  )
);
```

⚠️ **Important:** The subquery approach in the second option should work because it's a direct `EXISTS` check, not a policy check.

## Why This Happened

Common causes of recursive RLS policies:

1. **Policy checks itself:** The policy on `memberships` tries to verify membership by checking `memberships`
2. **Cross-table recursion:** `workspaces` policy checks `memberships`, and `memberships` policy checks `workspaces`
3. **Using auth helpers incorrectly:** Custom functions that query the same table

## Current Workaround

The app is currently **bypassing data loading** to prevent the error. This means:
- ✅ You can still sign in/sign up
- ❌ No workspaces or memberships will load
- ❌ The app won't have any data

Once you fix the RLS policies, remove the workaround in `src/lib/supabase-service.ts` by uncommenting the original `initializeUserData` function.

## Need Help?

If you're stuck, check:
1. Supabase RLS Policy documentation: https://supabase.com/docs/guides/auth/row-level-security
2. Your current policies in: **Supabase Dashboard** → **Authentication** → **Policies**
3. The SQL Editor to run the fix queries directly

---

**Last Updated:** January 17, 2026
