# Clean Supabase Dummy Data

## Overview
This guide provides SQL queries to remove all dummy/seed data from your Supabase database while keeping YOUR real user data intact.

## ⚠️ IMPORTANT: Before Running These Queries

1. **Find Your User ID**: You need to know YOUR user ID to avoid deleting your own data
2. **Find Your Workspace ID**: You need to know YOUR workspace ID

### How to Find Your IDs

Run this query first to see your user and workspace information:

```sql
-- Find YOUR user ID and email
SELECT id, email, created_at
FROM profiles
ORDER BY created_at DESC
LIMIT 10;

-- Find YOUR workspace ID and memberships
SELECT w.id as workspace_id, w.name, m.user_id, m.role
FROM workspaces w
LEFT JOIN memberships m ON m.workspace_id = w.id
ORDER BY w.created_at DESC
LIMIT 10;
```

**Copy your `user_id` and `workspace_id` - you'll need them below!**

---

## 🗑️ SQL Queries to Clean Dummy Data

### Step 1: Delete All Team Members (EXCEPT for your workspace)

Replace `'YOUR_WORKSPACE_ID_HERE'` with your actual workspace ID:

```sql
-- Delete all team members that DON'T belong to your workspace
DELETE FROM team_members
WHERE workspace_id != 'YOUR_WORKSPACE_ID_HERE';

-- OR if you want to delete ALL team members (including yours):
DELETE FROM team_members;
```

### Step 2: Delete All OKRs (EXCEPT for your workspace)

```sql
-- Delete all OKRs that DON'T belong to your workspace
DELETE FROM okrs
WHERE workspace_id != 'YOUR_WORKSPACE_ID_HERE';

-- OR delete ALL OKRs:
DELETE FROM okrs;
```

### Step 3: Delete All Tasks (EXCEPT for your workspace)

```sql
-- Delete all tasks that DON'T belong to your workspace
DELETE FROM tasks
WHERE workspace_id != 'YOUR_WORKSPACE_ID_HERE';

-- OR delete ALL tasks:
DELETE FROM tasks;
```

### Step 4: Delete All Decisions (EXCEPT for your workspace)

```sql
-- Delete all decisions that DON'T belong to your workspace
DELETE FROM decisions
WHERE workspace_id != 'YOUR_WORKSPACE_ID_HERE';

-- OR delete ALL decisions:
DELETE FROM decisions;
```

### Step 5: Delete All Work Plans (EXCEPT for your workspace)

```sql
-- Delete all work plans that DON'T belong to your workspace
DELETE FROM work_plans
WHERE workspace_id != 'YOUR_WORKSPACE_ID_HERE';

-- OR delete ALL work plans:
DELETE FROM work_plans;
```

### Step 6: Delete Dummy Workspaces (EXCEPT yours)

```sql
-- Delete all workspaces that DON'T belong to you
-- First, delete memberships for those workspaces
DELETE FROM memberships
WHERE workspace_id NOT IN (
  SELECT id FROM workspaces WHERE id = 'YOUR_WORKSPACE_ID_HERE'
);

-- Then delete the workspaces
DELETE FROM workspaces
WHERE id != 'YOUR_WORKSPACE_ID_HERE';
```

### Step 7: Delete Dummy User Profiles (EXCEPT yours)

Replace `'YOUR_USER_ID_HERE'` with your actual user ID:

```sql
-- Delete all profiles that aren't yours
DELETE FROM profiles
WHERE id != 'YOUR_USER_ID_HERE';
```

---

## 🔥 NUCLEAR OPTION: Delete EVERYTHING (Start Completely Fresh)

**⚠️ DANGER: This will delete ALL data including YOUR account!**

Only use this if you want to completely wipe the database and start over:

```sql
-- Delete all data from all tables
DELETE FROM team_members;
DELETE FROM okrs;
DELETE FROM tasks;
DELETE FROM decisions;
DELETE FROM work_plans;
DELETE FROM memberships;
DELETE FROM workspaces;
DELETE FROM profiles;
```

After running this, you'll need to sign up again with a new account.

---

## ✅ Verify Clean State

After running the queries, verify your data is clean:

```sql
-- Check what's left in each table
SELECT 'profiles' as table_name, COUNT(*) as row_count FROM profiles
UNION ALL
SELECT 'workspaces', COUNT(*) FROM workspaces
UNION ALL
SELECT 'memberships', COUNT(*) FROM memberships
UNION ALL
SELECT 'team_members', COUNT(*) FROM team_members
UNION ALL
SELECT 'okrs', COUNT(*) FROM okrs
UNION ALL
SELECT 'tasks', COUNT(*) FROM tasks
UNION ALL
SELECT 'decisions', COUNT(*) FROM decisions
UNION ALL
SELECT 'work_plans', COUNT(*) FROM work_plans;
```

Expected results for a fresh new user:
- `profiles`: 1 row (your profile)
- `workspaces`: 1 row (your workspace)
- `memberships`: 1 row (your membership)
- `team_members`: 0 rows
- `okrs`: 0 rows
- `tasks`: 0 rows
- `decisions`: 0 rows
- `work_plans`: 0 rows

---

## 📝 How to Run These Queries

1. Open Supabase Dashboard: https://supabase.com/dashboard
2. Select your project
3. Click "SQL Editor" in the left sidebar
4. Click "New query"
5. Copy and paste the SQL queries
6. Replace `YOUR_USER_ID_HERE` and `YOUR_WORKSPACE_ID_HERE` with your actual IDs
7. Click "Run" (or press Cmd/Ctrl + Enter)

---

## 🎯 Recommended Approach

**For a new user who just signed up:**

1. Run Step 1 to find your IDs
2. Run Steps 2-5 to delete ALL workspace-specific data (team members, OKRs, tasks, decisions, work plans)
3. Keep your workspace and profile intact
4. Use the app's "Clear All Data" button in Settings to clear local storage
5. Sign out and sign back in to start fresh

This gives you a completely clean slate with just your account and workspace, ready to build your real company data!
