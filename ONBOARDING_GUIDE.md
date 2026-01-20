# Complete Onboarding Guide - Centaur OS

## 🎯 Purpose
This guide will walk you through setting up your Supabase database and onboarding your first team members. Follow these steps **exactly** in order.

---

## ✅ Prerequisites Checklist

Before you begin, make sure you have:
- [ ] A Supabase account (free tier is fine)
- [ ] Your Supabase project URL and anon key in `.env` file
- [ ] The Centaur OS app running and accessible
- [ ] Access to your Supabase dashboard (https://supabase.com/dashboard)

---

## Part 1: Database Setup (One-Time Setup)

### Step 1: Run the Core Schema

**What**: This creates all the tables your app needs (users, workspaces, members, tasks, etc.)

**How**:
1. Open your Supabase Dashboard
2. Go to **SQL Editor** (left sidebar)
3. Click **+ New Query**
4. Copy the entire contents of `supabase-schema.sql` from your project
5. Paste it into the SQL Editor
6. Click **Run** (or press Cmd/Ctrl + Enter)
7. Wait for ✅ "Success. No rows returned"

**What just happened**: You created these tables:
- `users` - User profiles
- `workspaces` - Company workspaces
- `memberships` - Links users to workspaces with roles
- `team_members` - People in your company (can exist without user accounts)
- `objectives` - Your company goals (OKRs)
- `key_results` - Measurable metrics for objectives
- `tasks` - Work items and to-dos

**Verify it worked**:
1. Go to **Table Editor** (left sidebar)
2. You should see all 7 tables listed
3. Click on `users` - it should be empty but ready

---

### Step 2: (Optional) Add Marketplace Data

**What**: This adds the AI tools catalog, supplier listings, and executive marketplace features.

**How**:
1. Open SQL Editor
2. Copy contents of `supabase-three-tier-schema.sql`
3. Paste and **Run**
4. Wait for success

**What just happened**: You added marketplace features (not critical for basic onboarding)

---

### Step 3: (Optional) Seed AI Tools

**What**: Populates the AI tools catalog with real tools like ChatGPT, Claude, etc.

**How**:
1. Open SQL Editor
2. Copy contents of `supabase-seed-ai-tools.sql`
3. Paste and **Run**
4. Wait for success

**Verify it worked**:
1. Go to **Table Editor** → `ai_tools`
2. You should see ~10-15 AI tools listed

---

## Part 2: Create Your Founder Account

### Step 4: Sign Up as Founder

**What**: Create your personal user account that will own the workspace.

**How**:
1. Open the Centaur OS app
2. If you're signed in, sign out first (Settings → Sign Out)
3. Tap **Create Account** on the sign-in screen
4. Fill in:
   - **Name**: Your full name (e.g., "Sarah Johnson")
   - **Email**: Your email (e.g., "sarah@mycompany.com")
   - **Password**: At least 6 characters (e.g., "founder123")
   - **Workspace Name**: Your company name (e.g., "Acme Inc")
5. Tap **Create Account**

**What just happened**:
- Supabase Auth created your user account
- A `users` record was created with your profile
- A `workspaces` record was created for your company
- A `memberships` record linked you to the workspace as Founder

**Verify it worked**:
1. You should be logged in and see the Home tab
2. Go to Supabase Dashboard → **Authentication** → Users
3. You should see your email address listed
4. Go to **Table Editor** → `users` → You should see 1 row with your name
5. Go to **Table Editor** → `workspaces` → You should see 1 row with your workspace name

---

## Part 3: Add Team Members

**IMPORTANT**: There are TWO ways to add people:

### Option A: Team Members WITHOUT User Accounts (Faster for Demo)

**Use this when**: You want to quickly add people to plan work, but they don't need to log in yet.

**How**:
1. Go to the **People** tab in the app
2. Tap the **+ Add Member** button
3. Fill in:
   - **Name**: Full name (e.g., "Bob Smith")
   - **Role**: Founder / Executive / Apprentice
   - **Function**: Finance / Sales / Marketing / Ops / Engineering / Admin
   - **Base Capacity**: Time units per week (default 10)
   - **Cost Per Unit**: How much they cost per time unit
4. Tap **Save**

**What just happened**:
- A `team_members` record was created
- The person appears in your People tab
- You can assign tasks to them
- They CANNOT log in (no user account yet)

**Verify it worked**:
1. People tab shows the new member
2. Supabase Dashboard → `team_members` table has 1 row
3. The `user_id` field is `NULL` (they don't have a login yet)

---

### Option B: Team Members WITH User Accounts (Production-Ready)

**Use this when**: People need to actually log in and use the app themselves.

**How (2-step process)**:

#### Step 5a: The team member creates their account

1. Send them the app link
2. They tap **Create Account**
3. They fill in:
   - **Name**: Their full name
   - **Email**: Their email
   - **Password**: At least 6 characters
   - **Workspace Name**: Any name (will be their personal workspace)
4. They tap **Create Account**

**What just happened**:
- They now have a Supabase Auth account
- They have their own personal workspace
- They are NOT in your workspace yet

#### Step 5b: You invite them to your workspace

**OPTION 1: Manual Database Entry** (Current Method)

1. Go to Supabase Dashboard → **Table Editor** → `memberships`
2. Click **Insert** → **Insert row**
3. Fill in:
   - `workspace_id`: Copy your workspace ID from the `workspaces` table
   - `user_id`: Copy their user ID from the `users` table (look for their email)
   - `role`: Select their role (Founder / FractionalExec / Apprentice)
   - `function`: Select their function (Finance / Sales / etc.)
4. Click **Save**

**OPTION 2: SQL Query** (Faster for multiple people)

```sql
-- Replace these values with actual IDs
INSERT INTO public.memberships (workspace_id, user_id, role, function)
VALUES (
  'your-workspace-id-here',  -- From workspaces table
  'their-user-id-here',      -- From users table
  'FractionalExec',          -- Their role
  'Engineering'              -- Their function
);
```

**What just happened**:
- They are now a member of YOUR workspace
- They can see your tasks, team, and data
- Next time they log in, they'll see your workspace

---

### Step 6: Link Team Members to User Accounts

**What**: If you created team members in the People tab (Option A) and later those people create user accounts, you need to link them.

**How**:
1. Go to Supabase Dashboard → **Table Editor** → `team_members`
2. Find the team member row (by name)
3. Click **Edit row**
4. In the `user_id` field, paste their user ID from the `users` table
5. Click **Save**

**What just happened**:
- The team member record is now linked to a real user account
- Escalations and notifications will route to their userId
- They can log in and see their assignments

**Verify it worked**:
1. The `user_id` field is no longer `NULL`
2. When they log in and switch to your workspace, they see their profile in People tab

---

## Part 4: Understanding the System

### How Authentication Works

**When someone signs up**:
1. Supabase Auth creates their account → `auth.users` table
2. App creates their profile → `users` table (mirrors auth)
3. App creates their personal workspace → `workspaces` table
4. App creates first membership → `memberships` table (links them to workspace as Founder)

**When someone signs in**:
1. Supabase Auth validates credentials
2. App loads their user profile
3. App loads their workspaces (from `memberships` table)
4. App sets current workspace
5. App loads that workspace's data

### Multi-Workspace Support

**Each user can belong to multiple workspaces**:
- Their own personal workspace (created at signup)
- Any workspaces they're invited to (via `memberships`)

**To switch workspaces** (future feature):
- Settings → Switch Workspace dropdown
- Shows all workspaces from `memberships` table

### Roles and Permissions

**Founder**:
- Owns the workspace
- Can add/remove members
- Can create/edit/delete everything
- Sees escalations inbox

**FractionalExec (Executive)**:
- Can create/edit tasks and objectives
- Can manage team members
- Cannot delete workspace

**Apprentice**:
- Can view tasks assigned to them
- Can update task progress
- Cannot create objectives or manage team

---

## Part 5: Common Scenarios

### Scenario 1: Small team (just you)

1. Sign up as Founder ✅
2. Add team members WITHOUT user accounts in People tab
3. Assign tasks to them
4. Plan work and track capacity

**Result**: You have a working system for planning, they don't need to log in.

---

### Scenario 2: Team needs to collaborate

1. Sign up as Founder ✅
2. Team members each create their own accounts
3. You invite them via `memberships` table
4. Create team member records in People tab
5. Link team member records to their user accounts (Step 6)

**Result**: Everyone can log in, see shared tasks, and collaborate.

---

### Scenario 3: Adding your first team member with login

**Their steps**:
1. They create account: name="Bob Smith", email="bob@company.com", password="bob123"
2. They tell you their email

**Your steps**:
1. Go to Supabase → `users` table
2. Find Bob's row, copy his `id` (the UUID)
3. Go to `workspaces` table, copy YOUR workspace `id`
4. Go to `memberships` table → Insert row:
   - `workspace_id`: your workspace id
   - `user_id`: Bob's user id
   - `role`: 'FractionalExec'
   - `function`: 'Engineering'
5. Go to app → People tab → Add Member
   - Name: "Bob Smith"
   - Role: Executive
   - Function: Engineering
   - (Save)
6. Go to Supabase → `team_members` table
7. Find Bob Smith's row, click Edit
8. Paste Bob's user ID into the `user_id` field
9. Save

**Result**: Bob can now log in, switch to your workspace, and see his tasks.

---

## Part 6: Troubleshooting

### Issue: "Invalid login credentials"
**Cause**: Wrong email/password or user doesn't exist
**Fix**:
- Check email is exact match (case sensitive for password)
- Check Supabase → Authentication → Users to verify account exists

### Issue: User created but can't see workspace
**Cause**: No membership record linking them to your workspace
**Fix**:
- Create membership in Supabase `memberships` table (Step 5b)

### Issue: Team member in People tab but can't log in
**Cause**: Team member created without user account (Option A)
**Fix**:
- Either: Leave it (they're just for planning)
- Or: Have them create account, then link using Step 6

### Issue: Escalations not notifying specific user
**Cause**: Team member record not linked to user account
**Fix**:
- Update `team_members` table, set `user_id` field (Step 6)

### Issue: "Workspace not found" error
**Cause**: User account exists but no workspace or membership
**Fix**:
- Check `workspaces` table has a row for this user
- Check `memberships` table links user to workspace

### Issue: Can't see other workspace members
**Cause**: Different workspaces (each user has their own)
**Fix**:
- Create membership records to share a workspace (Step 5b)

---

## Part 7: Data Export (Backup)

### How to backup your data

1. Open app → Settings tab
2. Scroll to **Data Management**
3. Tap **Export All Data**
4. Choose format (CSV or JSON)
5. Share the file to your email/cloud storage

**What gets exported**:
- Team members
- Tasks
- Objectives
- Financial data
- All workspace data

---

## Part 8: Testing Checklist

After setup, verify everything works:

### Authentication ✅
- [ ] You can sign in with your founder account
- [ ] You can sign out and sign back in
- [ ] Session persists after closing app

### People Tab ✅
- [ ] You see team members you added
- [ ] Capacity calculations show correctly
- [ ] You can create new team members

### Tasks Tab ✅
- [ ] You can create a task
- [ ] You can assign task to team member
- [ ] Task shows in Tasks tab

### Escalations ✅ (if you set up user accounts)
- [ ] Team member can escalate a task
- [ ] You (Founder) see red badge on Home tab
- [ ] You can Accept/Delegate/Reject escalation
- [ ] Original escalator gets notified

---

## Quick Reference: Table Relationships

```
auth.users (Supabase Auth)
    ↓
users (App profile)
    ↓
memberships → workspaces
    ↓
team_members (can have user_id or be standalone)
    ↓
tasks (assigned to team_members)
```

**Key Insight**:
- `users` = people who can LOG IN
- `team_members` = people in your COMPANY (may or may not have login)
- `memberships` = links users to workspaces

---

## Next Steps After Onboarding

1. **Create your first objective** (OKR) in the Goals tab
2. **Add tasks** aligned to that objective
3. **Assign work** to team members
4. **Monitor capacity** in the People tab
5. **Track progress** using the Timeline view

---

## Support

**Need Help?**
- Check `SUPABASE_AUTH_GUIDE.md` for auth issues
- Check `README.md` for feature documentation
- Review `expo.log` file for runtime errors
- Contact support via Settings → Help & Support

---

**Last Updated**: January 20, 2026
**Version**: 2.0 (Multi-user ready)
**Status**: ✅ Production Ready
