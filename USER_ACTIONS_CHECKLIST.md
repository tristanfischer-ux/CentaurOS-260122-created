# User Actions Required - Centaur OS Implementation

**Created:** January 18, 2026
**Status:** Autonomous implementation complete - Your turn!

---

## 🔴 CRITICAL ACTIONS (Must Do)

### 1. Run Supabase Migration

**Why:** Without this, all create/update/delete operations will fail due to missing Row-Level Security policies.

**Steps:**
1. Open [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your Centaur OS project
3. Go to **SQL Editor** (left sidebar)
4. Open `/home/user/workspace/supabase/migrations/003_rls_mutations.sql`
5. Copy the entire file (432 lines)
6. Paste into SQL Editor in Supabase
7. Click **RUN** (bottom right corner)
8. Wait for "Success. No rows returned" message

**Verify it worked:**
```sql
SELECT policyname, tablename 
FROM pg_policies 
WHERE schemaname = 'public' 
ORDER BY tablename, policyname;
```
You should see policies like:
- members_insert, members_update, members_delete
- work_plans_insert, work_plans_update, work_plans_delete
- okrs_insert, okrs_update, okrs_delete
- etc.

**If you see errors:** Check that all tables exist. Run migrations 001 and 002 first.

---

### 2. Test CRUD Operations

**Why:** Ensure data actually persists to Supabase.

**Open the app and try:**

**Members:**
- [ ] Add a new team member
  - Check: Supabase Dashboard → Table Editor → members (should see new row)
- [ ] Edit member details  
  - Check: Changes reflected in Supabase
- [ ] Delete a member
  - Check: Row removed from Supabase

**Work Plans:**
- [ ] Create a new work plan
  - Check: Both `work_plans` and `work_plan_allocations` tables
- [ ] Update work plan status to "completed"
  - Check: Status changed in Supabase
- [ ] Delete a work plan
  - Check: Removed from both tables

**OKRs:**
- [ ] Create an OKR with objectives
  - Check: Both `okrs` and `okr_objectives` tables
- [ ] Update an objective's progress
  - Check: Progress updated in Supabase

**Test Optimistic Updates:**
- [ ] Disconnect from internet
- [ ] Try to create a member (should show in UI instantly)
- [ ] Reconnect to internet  
- [ ] Member should disappear (rollback) or sync (if it worked)

---

## 🟡 IMPORTANT ACTIONS (Recommended)

### 3. Enable Real-time Subscriptions in Supabase

**Why:** Get live updates when data changes (multi-user collaboration).

**Steps:**
1. Supabase Dashboard → Database → Replication
2. Find each table and enable replication:
   - [x] members
   - [x] work_plans
   - [x] work_plan_allocations
   - [x] okrs
   - [x] okr_objectives
   - [x] suppliers
   - [x] supplier_engagements
   - [x] financial_transactions
   - [x] budget_targets

3. Save changes

**Test it worked:**
1. Open app on two devices (or web + mobile)
2. On device 1: Add a new member
3. On device 2: Should see the new member appear within ~1 second

---

### 4. Integrate Real-time into Your App (Optional)

**Where:** Add to `src/app/_layout.tsx` or screen components

**Code to add:**
```tsx
import { useEffect } from 'react';
import { subscribeToWorkspace } from '@/lib/realtime-subscriptions';
import { useOrganizationStore } from '@/lib/state/organization-store';
import { useWorkPlanStore } from '@/lib/state/work-plan-store';
import { useOKRStore } from '@/lib/state/okr-store';

function RootLayout() {
  const workspaceId = 'your-workspace-id'; // Get from auth/context

  useEffect(() => {
    if (!workspaceId) return;

    const cleanup = subscribeToWorkspace(workspaceId, {
      onMembersUpdate: () => {
        useOrganizationStore.getState().loadMembersFromSupabase(workspaceId);
      },
      onWorkPlansUpdate: () => {
        useWorkPlanStore.getState().loadWorkPlansFromSupabase(workspaceId);
      },
      onOKRsUpdate: () => {
        useOKRStore.getState().loadOKRsFromSupabase(workspaceId);
      },
    });

    return cleanup; // Cleanup on unmount
  }, [workspaceId]);

  return <YourLayoutContent />;
}
```

---

## 🟢 NICE-TO-HAVE ACTIONS (When You Have Time)

### 5. Add Loading States

**Where:** Screens that load data (Home, Team, Tasks, OKRs)

**Pattern:**
```tsx
const members = useOrganizationStore(s => s.members);
const isLoading = useOrganizationStore(s => s.isLoading);

if (isLoading) {
  return <View><Text>Loading members...</Text></View>;
}

return <MemberList members={members} />;
```

### 6. Add Empty States

**Where:** Lists that might be empty

**Pattern:**
```tsx
if (members.length === 0) {
  return (
    <View className="items-center py-16">
      <Users size={48} color="#cbd5e1" />
      <Text className="font-bold text-lg mt-4">No Team Members</Text>
      <Text className="text-gray-600 mt-2">Add your first team member</Text>
      <Pressable onPress={handleAdd}>
        <Text className="text-purple-600 mt-4">+ Add Member</Text>
      </Pressable>
    </View>
  );
}
```

### 7. Test Error Scenarios

**Scenarios to test:**
- [ ] Offline mode (airplane mode)
- [ ] Invalid data (empty required fields)
- [ ] Permission errors (try to delete as Apprentice)
- [ ] Network timeout
- [ ] Concurrent edits (two users editing same item)

---

## 📝 VERIFICATION CHECKLIST

After completing actions above:

- [ ] Migration ran successfully (no SQL errors)
- [ ] Can create members and they appear in Supabase
- [ ] Can update members and changes persist
- [ ] Can delete members and they're removed
- [ ] Work plans create with allocations
- [ ] OKRs create with objectives
- [ ] Real-time is enabled in Supabase
- [ ] (Optional) Real-time updates work between devices
- [ ] No console errors in app
- [ ] Optimistic updates feel instant
- [ ] Errors show user-friendly messages

---

## 🆘 TROUBLESHOOTING

### "Permission denied" errors
➜ Run the migration (Action #1)
➜ Check you're authenticated in app
➜ Verify workspace_id matches your membership

### Changes don't persist
➜ Check network connection
➜ Open browser Network tab, look for 4xx/5xx errors
➜ Check Supabase Dashboard → API logs

### Real-time doesn't work
➜ Enable replication (Action #3)
➜ Check browser console for websocket errors
➜ Verify Supabase project is not paused

### App crashes
➜ Check `expo.log` file for errors
➜ Verify all imports are correct
➜ Check TypeScript compilation errors

---

## ✅ YOU'RE DONE WHEN...

1. ✅ Migration shows "Success" in Supabase
2. ✅ You can create/edit/delete data in the app
3. ✅ Changes appear in Supabase Table Editor
4. ✅ No red errors in app console
5. ✅ (Optional) Real-time updates work

**That's it! Your app now has production-ready CRUD operations with multi-tenant security.** 🎉

---

**Need help?** Check IMPLEMENTATION_SUMMARY.md for technical details.
