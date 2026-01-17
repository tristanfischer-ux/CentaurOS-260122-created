# Supabase Database Integration - Setup Guide

## Overview

Centaur OS is now fully integrated with Supabase for data persistence. User authentication, workspaces, memberships, and team members are all stored in a PostgreSQL database with Row Level Security.

---

## ✅ What's Been Done

### 1. **Database Schema Created** (`supabase-schema.sql`)
- **Users table**: User profiles linked to Supabase Auth
- **Workspaces table**: Companies/organizations
- **Memberships table**: User roles in workspaces (Founder, Executive, Apprentice)
- **Team Members table**: People working in each workspace
- **Objectives table**: OKRs for strategic planning
- **Key Results table**: Measurable targets for objectives
- **Tasks table**: Work items assigned to team members

### 2. **Row Level Security (RLS)**
All tables have RLS policies that enforce:
- Users can only see data from workspaces they belong to
- Founders can manage everything in their workspace
- Executives can create/update in their function
- Apprentices can view and create tasks

### 3. **Supabase Service Layer** (`src/lib/supabase-service.ts`)
Centralized API for all database operations:
- `userService`: Create, read, update users
- `workspaceService`: Manage workspaces
- `membershipService`: Handle workspace memberships
- `teamMemberService`: Manage team members
- `initializeUserData()`: Load all user data on login

### 4. **App Store Integration** (`src/lib/state/app-store.ts`)
Updated to use Supabase:
- `loadUserData()`: Fetches workspaces, memberships, team members from database
- `createWorkspace()`: Creates workspace in Supabase
- `updateWorkspace()`: Updates workspace in Supabase
- Session restoration from Supabase Auth
- Automatic data loading on login

### 5. **Sign-In/Sign-Up Updated**
- Create user profiles in Supabase database
- Load workspace data after authentication
- Automatic membership creation for workspace owners

---

## 🚀 Setup Instructions

### Step 1: Run the Database Schema

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Copy the contents of `supabase-schema.sql`
4. Paste and click **Run**

This will create all tables, indexes, RLS policies, and triggers.

### Step 2: Verify RLS is Enabled

In the **Table Editor**, check that each table shows a lock icon (🔒) indicating RLS is enabled.

### Step 3: Test Authentication Flow

**Sign Up:**
1. Open the app
2. Tap "Sign Up Free"
3. Enter: Name, Email, Password (6+ chars), Workspace Name
4. Submit

**What happens:**
- Supabase Auth creates authenticated user
- User profile created in `public.users` table
- Workspace created in `public.workspaces` table
- Founder membership created in `public.memberships` table
- User navigated to welcome screen

**Sign In:**
1. Enter email and password
2. Submit

**What happens:**
- Supabase Auth validates credentials
- User profile fetched from database
- All workspaces and memberships loaded
- User navigated to main app

---

## 📊 Database Structure

### Tables Overview

```
users (extends auth.users)
├─ id (UUID, links to auth.users)
├─ email
├─ name
├─ avatar_url
└─ theme_mode

workspaces
├─ id (UUID)
├─ name
├─ owner_id (references users)
└─ timestamps

memberships
├─ id (UUID)
├─ workspace_id (references workspaces)
├─ user_id (references users)
├─ role (Founder, Executive, Apprentice, etc.)
├─ function (Finance, Sales, Marketing, etc.)
└─ permissions (JSONB)

team_members
├─ id (UUID)
├─ workspace_id (references workspaces)
├─ user_id (nullable, references users)
├─ name, initials, email
├─ person_class (Founder, Executive, Apprentice)
├─ function
├─ capacity (squares per week)
├─ cost_per_square
└─ ai_tools (JSONB array)

objectives
├─ id (UUID)
├─ workspace_id
├─ title, description
├─ owner_id (references users)
└─ start_date, end_date

key_results
├─ id (UUID)
├─ objective_id (references objectives)
├─ title
├─ target_value, current_value, unit
└─ health_status

tasks
├─ id (UUID)
├─ workspace_id
├─ title, description
├─ status, priority
├─ assigned_to (references team_members)
├─ objective_id (optional link to OKR)
└─ estimated_hours, actual_hours
```

---

## 🔐 Row Level Security Examples

### Users Table
```sql
-- Users can read their own profile
CREATE POLICY "Users can read own profile"
  ON public.users FOR SELECT
  USING (auth.uid() = id);
```

### Workspaces Table
```sql
-- Users can read workspaces they're members of
CREATE POLICY "Users can read workspaces they belong to"
  ON public.workspaces FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.memberships
      WHERE memberships.workspace_id = workspaces.id
      AND memberships.user_id = auth.uid()
    )
  );
```

### Team Members Table
```sql
-- Founders and Execs can create team members
CREATE POLICY "Founders and Execs can create team members"
  ON public.team_members FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.memberships m
      WHERE m.workspace_id = workspace_id
      AND m.user_id = auth.uid()
      AND m.role IN ('Founder', 'FractionalExec')
    )
  );
```

---

## 🔄 Data Flow

### Sign Up Flow
```
1. User submits sign-up form
   ↓
2. supabase.auth.signUp() creates auth user
   ↓
3. userService.create() creates user profile in database
   ↓
4. workspaceService.create() creates workspace
   ↓
5. membershipService.create() (automatic) creates Founder membership
   ↓
6. User navigated to welcome screen
```

### Sign In Flow
```
1. User enters email/password
   ↓
2. supabase.auth.signInWithPassword() validates
   ↓
3. userService.getByEmail() fetches user profile
   ↓
4. loadUserData() fetches workspaces, memberships, team members
   ↓
5. Data stored in app-store (Zustand)
   ↓
6. User navigated to main app
```

### Data Sync Pattern
```
User Action (UI)
   ↓
Optimistic Update (local state)
   ↓
Supabase Service Call (database)
   ↓
Success: Keep optimistic update
Failure: Rollback and show error
```

---

## 🛠️ Using the Supabase Service

### Create a Workspace
```typescript
import { useAppStore } from '@/lib/state/app-store';

const createWorkspace = async () => {
  const workspace = await useAppStore.getState().createWorkspace(
    'My Startup',
    currentUser.id
  );
  // Workspace created, membership added automatically
};
```

### Fetch Team Members
```typescript
import { teamMemberService } from '@/lib/supabase-service';

const members = await teamMemberService.getForWorkspace(workspaceId);
```

### Create a Team Member
```typescript
const member = await teamMemberService.create({
  workspaceId: workspaceId,
  name: 'Jane Doe',
  initials: 'JD',
  personClass: 'Apprentice',
  function: 'Marketing',
  baseSquaresPerWeek: 10,
  overtimeSquaresPerWeek: 5,
  overtimeEnabled: false,
  allocatedSquares: 0,
  costPerSquare: 50,
  avatarColor: '#3b82f6',
  aiTools: [],
});
```

### Update a Team Member
```typescript
await teamMemberService.update(memberId, {
  overtimeEnabled: true,
  aiTools: ['cursor-pro', 'claude-sonnet'],
});
```

---

## 📝 Type Conversions

The service layer handles conversion between:
- **Supabase**: snake_case (e.g., `workspace_id`, `created_at`)
- **App**: camelCase (e.g., `workspaceId`, `createdAt`)

Example:
```typescript
// Supabase row
{
  id: '123',
  workspace_id: '456',
  base_squares_per_week: 10,
  created_at: '2026-01-17T12:00:00Z'
}

// Converted to app format
{
  id: '123',
  workspaceId: '456',
  baseSquaresPerWeek: 10,
  createdAt: '2026-01-17T12:00:00Z'
}
```

---

## 🧪 Testing Checklist

### Database Setup
- [ ] Schema created in Supabase
- [ ] All tables visible in Table Editor
- [ ] RLS enabled on all tables (lock icon)
- [ ] Indexes created

### Authentication
- [ ] Sign up creates user in auth.users
- [ ] Sign up creates profile in public.users
- [ ] Sign up creates workspace
- [ ] Sign up creates founder membership
- [ ] Sign in fetches user profile
- [ ] Sign in loads workspaces
- [ ] Sign in loads memberships

### Data Operations
- [ ] Create workspace works
- [ ] Create team member works
- [ ] Update team member works
- [ ] Fetch team members works
- [ ] RLS prevents unauthorized access

### Session Management
- [ ] Session persists after app restart
- [ ] Token auto-refreshes
- [ ] Logout clears session

---

## 🐛 Troubleshooting

### Issue: "relation public.users does not exist"
**Solution:** Run the schema SQL in Supabase SQL Editor

### Issue: "new row violates row-level security policy"
**Solution:** Check that user has proper membership in workspace

### Issue: "User profile not found"
**Solution:** Ensure user profile is created during sign-up

### Issue: "No workspaces loaded"
**Solution:** Check that membership was created when workspace was created

### Issue: "Cannot read property 'id' of null"
**Solution:** User not authenticated or session expired - redirect to sign-in

---

## 🔜 Next Steps

### Immediate
1. Run schema in Supabase
2. Test sign-up flow
3. Test sign-in flow
4. Verify data appears in Supabase Table Editor

### Short Term
- Migrate existing local data to Supabase (if any)
- Add realtime subscriptions for collaborative features
- Generate TypeScript types from schema
- Add more RLS policies for fine-grained permissions

### Long Term
- Implement objectives and key results (OKRs) storage
- Add tasks and time tracking to database
- Build dashboard analytics from database
- Add audit logs for compliance

---

## 📚 Resources

- [Supabase Docs](https://supabase.com/docs)
- [Row Level Security Guide](https://supabase.com/docs/guides/auth/row-level-security)
- [Realtime Subscriptions](https://supabase.com/docs/guides/realtime)
- [TypeScript Type Generation](https://supabase.com/docs/guides/api/generating-types)

---

**Last Updated:** January 17, 2026
**Version:** 1.0
**Status:** ✅ Ready for Testing
