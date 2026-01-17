# Supabase Integration - Using Existing Tables

## ✅ Updated Service Layer

The `supabase-service.ts` has been updated to work with your **existing Supabase tables**:

### Existing Tables Used

| Table | Purpose | Key Fields |
|-------|---------|------------|
| **profiles** | User profiles (extends auth.users) | id, email, name, avatar_url, theme_mode |
| **workspaces** | Companies/organizations | id, name, owner_id |
| **memberships** | User roles in workspaces | workspace_id, user_id, role, function |
| **team_members** | People in workspace | name, person_class, function, capacity, cost |
| **okrs** | OKRs with objectives as JSONB | workspace_id, title, objectives (JSONB array) |
| **tasks** | Work items | workspace_id, title, status, assigned_to |
| **decisions** | Strategic decisions | workspace_id, title, options |
| **work_plans** | Work planning | workspace_id, title, tasks |

### Key Changes from Original Schema

1. **Users → Profiles**: Using existing `profiles` table instead of `users`
2. **Objectives Structure**: OKRs table has `objectives` as a JSONB array field, not separate tables
3. **No Schema Creation Needed**: Works with your existing database structure

---

## 📋 Services Available

### userService (profiles table)

**Note:** The `profiles` table does NOT have a `name` column. User names are derived from email addresses (the part before @). The table only stores: `id`, `email`, `avatar_url`, `created_at`, `theme_mode`.

```typescript
import { userService } from '@/lib/supabase-service';

// Get user by ID
const user = await userService.getById(userId);
// Returns: { id, email, name: "derived@from.email", avatarUrl, createdAt, preferences }

// Get user by email
const user = await userService.getByEmail('user@example.com');

// Create user profile
const user = await userService.create({
  id: authUserId,
  email: 'user@example.com',
  name: 'John Doe' // This is kept in local state but NOT saved to database
});

// Update user (only email, avatarUrl, and theme_mode can be updated)
await userService.update(userId, {
  avatarUrl: 'https://example.com/avatar.jpg',
  preferences: { themeMode: 'dark' }
});
```

### workspaceService

**Note:** The `workspaces` table does NOT have an `owner_id` column. Ownership is tracked through the `memberships` table (users with `role: 'Founder'` are owners). The table only stores: `id`, `name`, `created_at`.

```typescript
import { workspaceService } from '@/lib/supabase-service';

// Get all workspaces for user
const workspaces = await workspaceService.getForUser(userId);

// Create workspace (auto-creates founder membership)
// Note: ownerId is used to create the membership, not stored in workspaces table
const workspace = await workspaceService.create({
  name: 'My Startup',
  ownerId: userId
});

// Update workspace (can only update name)
await workspaceService.update(workspaceId, { name: 'New Name' });
```

### membershipService
```typescript
import { membershipService } from '@/lib/supabase-service';

// Get memberships for user
const memberships = await membershipService.getForUser(userId);

// Get memberships for workspace
const members = await membershipService.getForWorkspace(workspaceId);

// Create membership
await membershipService.create({
  workspaceId: workspaceId,
  userId: userId,
  role: 'Founder',
  function: 'Engineering'
});
```

### teamMemberService
```typescript
import { teamMemberService } from '@/lib/supabase-service';

// Get team members
const members = await teamMemberService.getForWorkspace(workspaceId);

// Create team member
await teamMemberService.create({
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
  aiTools: []
});
```

### okrService (objectives as JSONB)
```typescript
import { okrService } from '@/lib/supabase-service';

// Get OKRs for workspace
const okrs = await okrService.getForWorkspace(workspaceId);

// Create OKR with objectives array
await okrService.create({
  workspaceId: workspaceId,
  function: 'Marketing',
  title: 'Build Brand Awareness',
  description: 'Establish market presence',
  owner: 'Sarah Chen',
  startDate: 'Q1 2026',
  endDate: 'Q4 2026',
  status: 'on-track',
  objectives: [
    {
      id: 'kr-1',
      title: 'Achieve 50K website visitors',
      target: '50,000',
      current: '32,000',
      progress: 64,
      status: 'on-track'
    }
  ]
});

// Update OKR (including objectives)
await okrService.update(okrId, {
  objectives: updatedObjectivesArray
});
```

### taskService
```typescript
import { taskService } from '@/lib/supabase-service';

// Get tasks for workspace
const tasks = await taskService.getForWorkspace(workspaceId);

// Create task
await taskService.create({
  workspace_id: workspaceId,
  title: 'Design landing page',
  description: 'Create hero section',
  status: 'todo',
  priority: 'high'
});
```

---

## 🔄 Data Flow

### Sign Up
1. Supabase Auth creates user
2. Service creates profile in `profiles` table
3. Service creates workspace in `workspaces` table
4. Service auto-creates founder membership in `memberships` table
5. User navigated to onboarding

### Sign In
1. Supabase Auth validates credentials
2. Service fetches user from `profiles` table
3. Service loads workspaces via `memberships` join
4. Service loads team members for all workspaces
5. Data stored in app-store

### Create Data
```
UI Action
  ↓
Service Layer (type conversion)
  ↓
Supabase (snake_case)
  ↓
Database
  ↓
Response (snake_case)
  ↓
Service Layer (type conversion)
  ↓
App Store (camelCase)
```

---

## 🎯 No Schema Changes Needed

Since you already have these tables in Supabase:
- ✅ No need to run `supabase-schema.sql`
- ✅ Service layer works with existing structure
- ✅ RLS policies should already be in place
- ✅ Just use the service layer to interact with data

---

## 🧪 Testing

### 1. Test Sign Up
```
1. Sign up with new account
2. Check `profiles` table - new profile created
3. Check `workspaces` table - new workspace created
4. Check `memberships` table - founder membership created
```

### 2. Test Sign In
```
1. Sign in with existing account
2. Check console - should see workspaces and memberships loaded
3. Check app state - data should be available
```

### 3. Test Data Creation
```typescript
// In any component
import { teamMemberService } from '@/lib/supabase-service';

const createMember = async () => {
  const member = await teamMemberService.create({
    workspaceId: currentWorkspaceId,
    name: 'Test User',
    // ... other fields
  });
  console.log('Created:', member);
};
```

---

## 📚 Type Conversions

The service layer automatically converts between:

**Supabase (snake_case):**
```typescript
{
  workspace_id: '123',
  user_id: '456',
  created_at: '2026-01-17T12:00:00Z'
}
```

**App (camelCase):**
```typescript
{
  workspaceId: '123',
  userId: '456',
  createdAt: '2026-01-17T12:00:00Z'
}
```

This happens automatically in all service methods - you don't need to do anything!

---

## 🐛 Troubleshooting

### ✅ Infinite Recursion in Memberships Policy (RESOLVED)
**Issue:** "Error fetching memberships for workspaces: infinite recursion detected in policy for relation 'memberships'"

**Status:** ✅ **FIXED** - RLS policies have been updated and data loading is now working.

**What was the problem:** The Row Level Security (RLS) policy on the `memberships` table had a circular reference that caused infinite recursion. This happened when a policy checked memberships to determine membership access.

**How it was fixed:** The RLS policy on the `memberships` table was updated in Supabase Dashboard with a simpler policy:

```sql
CREATE POLICY "Users can view their own memberships"
ON memberships FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create memberships"
ON memberships FOR INSERT
WITH CHECK (auth.uid() = user_id);
```

**Current implementation:**
Data loading is fully functional. The `initializeUserData()` function now successfully fetches:
- Workspaces for the user
- Memberships for the user
- Team members for all workspaces

See **[FIX_RLS_POLICY.md](FIX_RLS_POLICY.md)** for reference documentation on this issue.

### Workspace Fetching Error Fixed
**Issue:** "Error fetching workspaces: [object Object]"

**Cause:** Initial implementation used a complex join query that didn't work with the existing schema:
```typescript
// ❌ This didn't work
const { data } = await supabase
  .from('workspaces')
  .select('*, memberships!inner(user_id)')
  .eq('memberships.user_id', userId);
```

**Solution:** Changed to two-step query approach:
```typescript
// ✅ This works
// Step 1: Get workspace IDs from memberships
const { data: membershipData } = await supabase
  .from('memberships')
  .select('workspace_id')
  .eq('user_id', userId);

const workspaceIds = membershipData.map(m => m.workspace_id);

// Step 2: Fetch workspaces using .in()
const { data } = await supabase
  .from('workspaces')
  .select('*')
  .in('id', workspaceIds);
```

### Error Logging
All services now include comprehensive error logging:
```typescript
if (error) {
  console.error('Error message:', error.message, error.details, error.hint);
}
```

Check the expo.log file to see detailed error information if something goes wrong.

---

## ✅ Ready to Use

The integration is complete and ready to use with your existing Supabase tables. No schema creation needed - just start using the service layer!

**Last Updated:** January 17, 2026
