# 🚨 CRITICAL: Fix Supabase RLS Policy Issues

## Issue 1: Infinite Recursion (RESOLVED ✅)

**Error:** `infinite recursion detected in policy for relation "memberships"`

**Status:** ✅ FIXED - See troubleshooting section for details.

---

## Issue 2: Profile Creation RLS Policy (CURRENT)

**Error:** `new row violates row-level security policy for table "profiles"`

### The Problem

When signing up, the app tries to create a profile in the `profiles` table, but the RLS policy blocks it. This happens because:

1. The authenticated user (`auth.uid()`) must match the profile ID being inserted
2. OR Supabase has a database trigger that auto-creates profiles (recommended approach)

### Solution Option A: Let Supabase Auto-Create Profiles (RECOMMENDED)

The best approach is to have Supabase automatically create profile entries when users sign up via Auth.

**In Supabase Dashboard → SQL Editor, run:**

```sql
-- Create a trigger function to auto-create profiles
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, created_at)
  VALUES (NEW.id, NEW.email, NOW())
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

**Then update the RLS policy for SELECT only:**

```sql
-- Allow users to view their own profile
CREATE POLICY "Users can view their own profile"
ON profiles FOR SELECT
USING (auth.uid() = id);

-- Allow users to update their own profile
CREATE POLICY "Users can update their own profile"
ON profiles FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);
```

With this approach, profiles are automatically created by the database trigger, and the app doesn't need to manually insert them.

### Solution Option B: Allow Manual Profile Creation

If you prefer to manually create profiles from the app:

**In Supabase Dashboard → SQL Editor, run:**

```sql
-- Allow users to insert their own profile
CREATE POLICY "Users can insert their own profile"
ON profiles FOR INSERT
WITH CHECK (auth.uid() = id);

-- Allow users to view their own profile
CREATE POLICY "Users can view their own profile"
ON profiles FOR SELECT
USING (auth.uid() = id);

-- Allow users to update their own profile
CREATE POLICY "Users can update their own profile"
ON profiles FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);
```

---

## Current Workaround in Code

The app now has a fallback mechanism:
1. First checks if the profile already exists (may be auto-created)
2. Tries to create the profile
3. If creation fails, checks again if it was auto-created by a trigger
4. Only throws error if profile still doesn't exist

This ensures sign-up works regardless of which approach you use.

---

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
