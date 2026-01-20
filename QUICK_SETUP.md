# Direct Database Setup - For You (The Founder)

## What You Need to Do - Simple Version

### Step 1: Run the Database Schema (5 minutes)

1. Go to https://supabase.com/dashboard
2. Click on your project
3. Click **SQL Editor** in the left sidebar
4. Click **+ New Query**
5. Open the file `supabase-schema.sql` in your project folder
6. Copy ALL of it (Cmd/Ctrl + A, then Cmd/Ctrl + C)
7. Paste into Supabase SQL Editor
8. Click **Run** (or press Cmd/Ctrl + Enter)
9. Wait for ✅ "Success. No rows returned"

**That's it. Your database is ready.**

---

### Step 2: Verify It Worked (2 minutes)

1. In Supabase Dashboard, click **Table Editor** (left sidebar)
2. You should see these tables:
   - users
   - workspaces
   - memberships
   - team_members
   - objectives
   - key_results
   - tasks

**If you see all 7 tables, you're done. Backend is ready.**

---

### Step 3: Create Your Account in the App (2 minutes)

1. Open the Centaur OS app
2. If already signed in, sign out first (Settings → scroll down → Sign Out)
3. Tap **Create Account**
4. Fill in:
   - **Name**: Your name (e.g., "John Smith")
   - **Email**: Your email (e.g., "john@mycompany.com")
   - **Password**: Any password 6+ characters (e.g., "founder123")
   - **Workspace Name**: Your company name (e.g., "Acme Inc")
5. Tap **Create Account**

**You should now be logged in and see the Home tab.**

---

### Step 4: Verify Your Account (1 minute)

Go back to Supabase Dashboard:

1. Click **Authentication** → **Users**
   - You should see your email listed

2. Click **Table Editor** → **users**
   - You should see 1 row with your name and email

3. Click **Table Editor** → **workspaces**
   - You should see 1 row with your workspace name

4. Click **Table Editor** → **memberships**
   - You should see 1 row linking you to the workspace

**If all 4 are there, your backend is 100% ready.**

---

## That's All You Need

**Total time:** ~10 minutes

**What you have now:**
- ✅ Database with all tables and security policies
- ✅ Your founder account
- ✅ Your workspace
- ✅ You're linked to the workspace as Founder
- ✅ App is connected to database
- ✅ Ready to add team members, create tasks, etc.

---

## Adding Team Members (Simple Way)

**You don't need to create user accounts for team members.**

Just use the app:
1. Go to **People** tab
2. Tap **+ Add Member**
3. Fill in their name, role, function
4. Tap **Save**

They'll show up in the app. You can assign tasks to them. **They just can't log in** (which is fine for now).

---

## If Someone Needs to Actually Log In Later

**Only do this when you actually need it:**

1. Have them create an account in the app (their own account)
2. Go to Supabase → **Table Editor** → **users** → find their row → copy their `id`
3. Go to Supabase → **Table Editor** → **workspaces** → find your workspace row → copy the `id`
4. Go to Supabase → **Table Editor** → **memberships** → **Insert row**:
   - workspace_id: paste your workspace id
   - user_id: paste their user id
   - role: pick their role (Founder, FractionalExec, Apprentice)
   - function: pick their function (Engineering, Finance, etc.)
5. Click **Save**

Now they can log in and see your workspace.

---

## Troubleshooting

**"relation 'public.users' does not exist"**
→ You didn't run the SQL schema. Go back to Step 1.

**"EXPO_PUBLIC_SUPABASE_URL is not defined"**
→ Check your `.env` file has the Supabase URL and key. Restart dev server.

**"Invalid login credentials"**
→ Wrong email or password. Try again or create a new account.

**Can't see team members in People tab**
→ Make sure you're logged in and have created your account (Step 3).

---

## Summary

1. Run `supabase-schema.sql` in Supabase SQL Editor → Done
2. Create your account in the app → Done
3. Add team members in People tab → Done

**Backend is ready. Start using the app.**
