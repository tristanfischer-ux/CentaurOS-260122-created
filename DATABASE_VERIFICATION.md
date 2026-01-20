# Database Verification Checklist

## Before You Begin

Ensure you have:
- [x] Supabase project created
- [x] `.env` file with `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY`
- [x] Access to Supabase Dashboard

---

## Step-by-Step Verification

### 1. Database Schema Setup ✅

**What to do:**
1. Open Supabase Dashboard → SQL Editor
2. Copy the entire contents of `supabase-schema.sql`
3. Paste into SQL Editor
4. Click **Run** (or Cmd/Ctrl + Enter)
5. Wait for: ✅ "Success. No rows returned"

**Verify:**
- [ ] Go to **Table Editor** (left sidebar)
- [ ] You see these tables:
  - [ ] `users`
  - [ ] `workspaces`
  - [ ] `memberships`
  - [ ] `team_members`
  - [ ] `objectives`
  - [ ] `key_results`
  - [ ] `tasks`

**If you see errors:**
- Check if tables already exist (error will say "already exists")
- If so, skip to step 2 - schema is already set up

---

### 2. Row Level Security (RLS) Policies ✅

**Verify RLS is enabled:**
1. Table Editor → Click any table (e.g., `users`)
2. Click the **Settings** tab
3. Check: "Enable Row Level Security (RLS)" is **ON**

**Expected policies per table:**

**users table:**
- [ ] "Users can read own profile" (SELECT)
- [ ] "Users can update own profile" (UPDATE)
- [ ] "Users can insert own profile" (INSERT)

**workspaces table:**
- [ ] "Users can read workspaces they belong to" (SELECT)
- [ ] "Owners can update their workspaces" (UPDATE)
- [ ] "Users can create workspaces" (INSERT)

**memberships table:**
- [ ] "Users can read memberships in their workspaces" (SELECT)
- [ ] "Founders can create memberships" (INSERT)
- [ ] "Founders can update memberships" (UPDATE)
- [ ] "Founders can delete memberships" (DELETE)

**team_members table:**
- [ ] "Users can read team members in their workspaces" (SELECT)
- [ ] "Founders and Execs can create team members" (INSERT)
- [ ] "Founders and Execs can update team members" (UPDATE)
- [ ] "Founders can delete team members" (DELETE)

---

### 3. Authentication Setup ✅

**Verify Supabase Auth is configured:**
1. Go to **Authentication** → **Settings**
2. Check:
   - [ ] Email auth is enabled
   - [ ] Confirm email is enabled (or disabled for testing)
   - [ ] Minimum password length: 6 characters

**Verify app is connected:**
1. Open the app
2. Go to sign-in screen
3. You should NOT see any errors about missing environment variables

---

### 4. Create Test Account ✅

**Create your founder account:**
1. In the app, tap **Create Account**
2. Fill in:
   - Name: Your full name
   - Email: Your email
   - Password: At least 6 characters
   - Workspace Name: Your company name
3. Tap **Create Account**

**Verify it worked:**
- [ ] No error messages
- [ ] You're logged in and see the Home tab
- [ ] Supabase Dashboard → **Authentication** → Users shows your email
- [ ] Table Editor → **users** has 1 row with your profile
- [ ] Table Editor → **workspaces** has 1 row with your workspace
- [ ] Table Editor → **memberships** has 1 row linking you to workspace

**If you get errors:**
- "Invalid login credentials" → Check email/password are correct
- "User already registered" → That email already exists, use sign-in instead
- Environment variable errors → Check `.env` file has correct Supabase URL and key

---

### 5. Test People Tab (Team Members) ✅

**Add a team member (without login):**
1. Go to **People** tab
2. Tap **+ Add Member**
3. Fill in:
   - Name: "Test Member"
   - Role: Executive
   - Function: Engineering
   - Base Capacity: 10
   - Cost: 100
4. Tap **Save**

**Verify:**
- [ ] People tab shows "Test Member"
- [ ] Table Editor → **team_members** has 1 row
- [ ] The `user_id` field is `NULL` (member has no login yet)

---

### 6. Test Task Creation ✅

**Create a test task:**
1. Go to **Tasks** tab
2. Tap **+ Add Task** (or similar)
3. Fill in:
   - Title: "Test Task"
   - Description: "Testing task creation"
   - Due Date: Any future date
4. Assign to: "Test Member"
5. Save

**Verify:**
- [ ] Task appears in Tasks tab
- [ ] Table Editor → **tasks** has 1 row
- [ ] Task shows in People tab under Test Member's assignments

---

### 7. Multi-User Setup (Advanced) ✅

**Only do this if you need team members to log in:**

**Step 1: Team member creates account**
1. Team member opens app
2. Taps **Create Account**
3. Enters their name, email, password
4. They are now logged in to their OWN workspace

**Step 2: You invite them to YOUR workspace**
1. Go to Supabase → **Table Editor** → **users**
2. Find their row, copy their `id` (UUID)
3. Go to **Table Editor** → **workspaces**
4. Find YOUR workspace row, copy its `id`
5. Go to **Table Editor** → **memberships**
6. Click **Insert** → **Insert row**
7. Fill in:
   - `workspace_id`: Your workspace ID (from step 4)
   - `user_id`: Their user ID (from step 2)
   - `role`: FractionalExec (or Founder/Apprentice)
   - `function`: Engineering (or Finance/Sales/etc.)
8. Click **Save**

**Step 3: Link to team member record**
1. Go to People tab in app
2. Add member with same name (if not already added)
3. Go to Supabase → **team_members**
4. Find their row (by name)
5. Click **Edit**
6. Paste their `user_id` into the `user_id` field
7. Save

**Verify:**
- [ ] They can log in
- [ ] When logged in, they can switch to your workspace (future feature)
- [ ] Escalations route to their userId
- [ ] They see tasks assigned to them

---

## Common Issues & Solutions

### Issue: "EXPO_PUBLIC_SUPABASE_URL is not defined"
**Fix:**
1. Check `.env` file exists in project root
2. Verify it contains:
   ```
   EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   ```
3. Restart dev server: `bun run start`

---

### Issue: "relation 'public.users' does not exist"
**Fix:**
1. Run `supabase-schema.sql` in SQL Editor
2. Check for errors in SQL output
3. Verify tables appear in Table Editor

---

### Issue: "permission denied for table users"
**Fix:**
1. Check RLS is enabled (Table Editor → table → Settings)
2. Check RLS policies exist (Table Editor → table → Policies tab)
3. Re-run the schema SQL if policies are missing

---

### Issue: User created but can't see workspace
**Fix:**
1. Check `memberships` table has a row linking user to workspace
2. `workspace_id` should match a row in `workspaces`
3. `user_id` should match the user's ID in `users`

---

### Issue: Team member can't log in
**Fix:**
- If created via People tab → They don't have a user account yet
- Either: Keep them as planning-only (no login)
- Or: Follow Multi-User Setup steps above

---

## Database is Ready When:

- [x] All 7 core tables exist
- [x] RLS is enabled on all tables
- [x] RLS policies exist (3-4 per table)
- [x] You can create an account
- [x] Account appears in Authentication → Users
- [x] Profile appears in users table
- [x] Workspace appears in workspaces table
- [x] Membership appears in memberships table
- [x] You can create team members in People tab
- [x] You can create tasks in Tasks tab
- [x] Tasks assign to team members correctly

**When all checked:** Your database is fully operational! 🎉

---

## Next Steps

1. Follow **ONBOARDING_GUIDE.md** for detailed team member onboarding
2. Check **SUPABASE_AUTH_GUIDE.md** for authentication details
3. See **README.md** for feature documentation
4. Use **Settings → Setup & Onboarding** in the app for quick reference

---

**Last Updated:** January 20, 2026
**Status:** ✅ Production Ready
