# Centaur OS - Architecture Review & Implementation Plan

**Date:** January 18, 2026
**Review Type:** Comprehensive Backend & Frontend Audit
**Status:** Planning Phase (Not Executing)

---

## 📊 Executive Summary

### Current State
- **Codebase Size:** 282 TypeScript files
- **State Management:** ~10,769 lines across 19+ store files
- **Modal Components:** 18 modal components identified
- **Active Screens:** 13+ tab screens in main navigation
- **Database:** 16 Supabase tables with RLS policies
- **Migration Status:** ✅ Complete (4/4 core stores migrated)

### Key Achievements
✅ Authentication system fully integrated
✅ Multi-tenant architecture with RLS
✅ All core stores loading from Supabase
✅ Workspace data loading hook created
✅ TypeScript compilation passing

### Critical Gaps Identified
⚠️ **No CRUD operations** - Only read operations implemented
⚠️ **Modal inconsistencies** - 18 modals, some follow patterns, others don't
⚠️ **Mixed data layers** - Some components still use AsyncStorage
⚠️ **No real-time sync** - No Supabase subscriptions
⚠️ **No workspace switcher** - Can't switch between workspaces

---

## 🏗️ Architecture Analysis

### 1. Backend Integration (Supabase)

#### Current Implementation
```
✅ Database Schema
   - 16 tables created
   - RLS policies for multi-tenancy
   - Indexes for performance
   - 3-tier data model (Universal, Company, User)

✅ Service Layer
   - supabase.ts: Client initialization
   - supabase-service.ts: Type conversions & CRUD helpers
   - supabase-three-tier-service.ts: Three-tier helpers

✅ Store Integration
   - OrganizationStore: loadMembersFromSupabase(), loadEngagementsFromSupabase()
   - WorkPlanStore: loadWorkPlansFromSupabase()
   - OKRStore: loadOKRsFromSupabase()
   - SupplierStore: loadSuppliersFromSupabase()
   - UniversalStore: loadUniversalData()
   - FinanceStore: loadFinancialData()
```

#### Critical Gaps

**1. Missing CRUD Operations (55 mutations found, but limited implementation)**
- ❌ No `createMember()` in OrganizationStore
- ❌ No `updateWorkPlan()` with Supabase sync
- ❌ No `deleteOKR()` with Supabase sync
- ❌ No `createSupplier()` with Supabase
- Most stores have local mutations but no backend persistence

**2. Data Consistency Issues**
- Mixed storage layers (Supabase + AsyncStorage + MMKV)
- No optimistic updates
- No conflict resolution
- Cache invalidation not implemented

**3. Schema Mismatches**
```typescript
// Example: WorkPlan in app vs database
App expects:
  - function: BusinessFunction
  - assignedBy: string
  - needsSubmission: boolean

Database has:
  - No function column
  - created_by (UUID reference)
  - No submission tracking
```

**4. Missing RLS Policies for Mutations**
- Current policies: SELECT only
- Need: INSERT, UPDATE, DELETE policies
- Without these, mutations will fail with permission errors

**5. No Real-time Subscriptions**
- No live updates when data changes
- Multi-user collaboration not possible
- Changes require manual refresh

#### Recommended Backend Fixes

**Phase 1: Complete CRUD Operations (Priority: HIGH)**
```typescript
// Pattern for each store:
1. Add mutation methods that call Supabase
2. Update local state optimistically
3. Handle errors and rollback on failure
4. Invalidate cache when needed

Example for OrganizationStore:
async createMember(member: Partial<OrganizationMember>) {
  // Optimistic update
  set(state => ({ members: [...state.members, { ...member, id: tempId }] }));

  try {
    const { data, error } = await supabase
      .from('members')
      .insert(memberToSupabase(member))
      .select()
      .single();

    if (error) throw error;

    // Replace temp with real data
    set(state => ({
      members: state.members.map(m => m.id === tempId ? supabaseToMember(data) : m)
    }));
  } catch (err) {
    // Rollback on error
    set(state => ({ members: state.members.filter(m => m.id !== tempId) }));
    throw err;
  }
}
```

**Phase 2: Add RLS Policies for Mutations**
```sql
-- Example: Allow users to insert members in their workspace
CREATE POLICY members_insert ON members
  FOR INSERT
  WITH CHECK (
    workspace_id IN (
      SELECT workspace_id FROM members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY members_update ON members
  FOR UPDATE
  USING (
    workspace_id IN (
      SELECT workspace_id FROM members WHERE user_id = auth.uid()
    )
  );
```

**Phase 3: Real-time Subscriptions**
```typescript
// In each store, add subscription setup
useEffect(() => {
  const subscription = supabase
    .channel('members_changes')
    .on('postgres_changes',
      { event: '*', schema: 'public', table: 'members' },
      (payload) => {
        // Update local state based on payload
      }
    )
    .subscribe();

  return () => subscription.unsubscribe();
}, [workspaceId]);
```

**Phase 4: Schema Migration & Alignment**
```sql
-- Add missing columns to align with app types
ALTER TABLE work_plans ADD COLUMN function TEXT;
ALTER TABLE work_plans ADD COLUMN needs_submission BOOLEAN DEFAULT false;

-- OR: Update app types to match database
// Preferred: Keep database minimal, transform in app layer
```

---

### 2. Modal Components Analysis

#### Current State: 18 Modals Identified
```
✅ Following STYLE_GUIDE.md pattern:
- CreateTaskModal.tsx (117 lines) - Has onRequestClose
- TaskDetailModal.tsx
- TimeTrackingModal.tsx
- HelpModal.tsx

⚠️ Needs Review:
- UnifiedTaskAllocationModal.tsx
- PersonDetailsModal.tsx (3 Modal instances!)
- HireResourceModal.tsx
- SendInvitationModal.tsx
- EditPersonModal.tsx
- StrategyResultsModal.tsx
- GoalQuestionnaireModal.tsx
- CompanyAimModal.tsx
- PersonDetailModalEnhanced.tsx
- ApprovalHistoryModal.tsx
- CapacityBreakdownModal.tsx
- CelebrationModal.tsx
- RecommendResourceModal.tsx
- TaskDetailsModal.tsx
```

#### Common Issues Found

**1. Missing `onRequestClose` (Android back button)**
- Critical for Android compatibility
- Some modals have it, others don't
- STYLE_GUIDE.md requires it

**2. Inconsistent Structure**
```typescript
// ❌ Bad: No maxHeight, no stopPropagation
<Modal visible={show}>
  <Pressable onPress={close}>
    <View>Content</View>
  </Pressable>
</Modal>

// ✅ Good: Follows STYLE_GUIDE.md
<Modal visible={show} transparent animationType="slide" onRequestClose={close}>
  <Pressable className="flex-1 bg-black/70" onPress={close}>
    <View className="flex-1" />
    <Pressable onPress={(e) => e.stopPropagation()} style={{ maxHeight: '90%' }}>
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        {/* Content */}
      </ScrollView>
    </Pressable>
  </Pressable>
</Modal>
```

**3. No Keyboard Handling**
- Modals with forms don't handle keyboard properly
- Need `KeyboardAvoidingView` or `react-native-keyboard-controller`

**4. State Management Issues**
- Some modals fetch their own data
- Should receive data as props or use React Query
- No loading states in some modals

#### Recommended Modal Fixes

**Phase 1: Audit All Modals (Priority: HIGH)**
```bash
# For each modal:
1. Check onRequestClose - REQUIRED
2. Check Pressable stopPropagation - REQUIRED for tap-outside
3. Check maxHeight on content - REQUIRED for scrollability
4. Check ScrollView contentContainerStyle - REQUIRED
5. Verify keyboard handling - REQUIRED for forms
6. Check loading/error states - RECOMMENDED
```

**Phase 2: Create Modal Template Component**
```typescript
// src/components/StandardModal.tsx
export function StandardModal({
  visible,
  onClose,
  title,
  children,
  maxHeight = '90%',
}: StandardModalProps) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable className="flex-1 bg-black/70" onPress={onClose}>
        <View className="flex-1" />
        <Pressable onPress={(e) => e.stopPropagation()} style={{ maxHeight }}>
          <View className="bg-white dark:bg-slate-950 rounded-t-3xl">
            {/* Standard header */}
            <View className="p-5 border-b border-gray-200 dark:border-slate-800">
              <Text className="text-xl font-bold">{title}</Text>
              <Pressable onPress={onClose} className="absolute right-5 top-5">
                <X size={24} />
              </Pressable>
            </View>

            {/* Scrollable content */}
            <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
              {children}
            </ScrollView>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
```

**Phase 3: Refactor Existing Modals**
- Replace boilerplate with `<StandardModal>`
- Consolidate similar modals (PersonDetailsModal + PersonDetailModalEnhanced)
- Add proper TypeScript types
- Add error boundaries

---

### 3. Data Flow Architecture

#### Current Flow (Simplified)
```
User Action → Component State → Store Method → Supabase Query → Update Store → Re-render
```

#### Issues Identified

**1. No Separation of Concerns**
```typescript
// ❌ Bad: Component directly calls Supabase
function MyComponent() {
  const [data, setData] = useState([]);

  useEffect(() => {
    supabase.from('members').select('*').then(({ data }) => setData(data));
  }, []);
}

// ✅ Good: Use store + hook
function MyComponent() {
  const members = useOrganizationStore(s => s.members);
  const loadMembers = useOrganizationStore(s => s.loadMembersFromSupabase);

  useEffect(() => {
    loadMembers(workspaceId);
  }, [workspaceId]);
}
```

**2. No React Query Integration**
- Despite being in CLAUDE.md as preferred
- Manual loading states everywhere
- No caching strategy
- No background refetching

**3. Mixed State Management**
```
- Zustand: Local UI state + data cache
- AsyncStorage: Legacy persistence
- MMKV: Some Zustand persistence
- Supabase: Source of truth
```

#### Recommended Data Flow Improvements

**Phase 1: Add React Query Layer**
```typescript
// src/lib/hooks/queries.ts
export function useMembers(workspaceId: string) {
  return useQuery({
    queryKey: ['members', workspaceId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('members')
        .select('*')
        .eq('workspace_id', workspaceId);

      if (error) throw error;
      return data.map(supabaseToMember);
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// In components:
function TeamScreen() {
  const workspaceId = useAppStore(s => s.currentWorkspaceId);
  const { data: members, isLoading, error } = useMembers(workspaceId);

  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorMessage error={error} />;

  return <MemberList members={members} />;
}
```

**Phase 2: Simplify Store Responsibilities**
```typescript
// Stores should:
✅ Hold UI-specific state (selectedItem, filters, etc.)
✅ Provide computed values (getters)
✅ Handle complex business logic
❌ NOT fetch data (use React Query)
❌ NOT hold server data (use React Query)
```

**Phase 3: Implement Optimistic Updates Pattern**
```typescript
function useUpdateMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (update: Partial<Member>) => {
      const { data, error } = await supabase
        .from('members')
        .update(update)
        .eq('id', update.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onMutate: async (update) => {
      // Cancel outgoing queries
      await queryClient.cancelQueries(['members']);

      // Snapshot previous value
      const previous = queryClient.getQueryData(['members', workspaceId]);

      // Optimistically update
      queryClient.setQueryData(['members', workspaceId], (old: Member[]) =>
        old.map(m => m.id === update.id ? { ...m, ...update } : m)
      );

      return { previous };
    },
    onError: (err, update, context) => {
      // Rollback on error
      queryClient.setQueryData(['members', workspaceId], context.previous);
    },
    onSettled: () => {
      // Refetch to ensure consistency
      queryClient.invalidateQueries(['members']);
    },
  });
}
```

---

### 4. Screen & Navigation Analysis

#### Current Structure
```
src/app/
├── (tabs)/               # Main navigation
│   ├── index.tsx         # Home/Dashboard
│   ├── do.tsx           # Task Management
│   ├── decide.tsx       # Decision Making
│   ├── evaluate.tsx     # Performance
│   ├── make.tsx         # Manufacturing
│   ├── what.tsx         # OKRs
│   ├── who.tsx          # Team
│   ├── why.tsx          # Strategy
│   ├── tools.tsx        # AI Tools
│   ├── performance.tsx  # Analytics
│   ├── community.tsx    # Network
│   ├── settings.tsx     # Settings
│   └── _layout.tsx      # Tab navigator
├── sign-in.tsx
├── sign-up.tsx
├── onboarding.tsx
└── [other screens]
```

#### Issues Identified

**1. Too Many Tabs (12+)**
- Violates mobile UX best practices (max 5 tabs)
- User confusion and navigation complexity
- Some tabs have low usage

**2. Inconsistent Data Loading**
```typescript
// Some screens use useWorkspaceData:
function DoScreen() {
  useWorkspaceData(workspaceId); // ✅ Auto-loads all data
}

// Others fetch directly:
function EvaluateScreen() {
  const [data, setData] = useState([]); // ❌ Manual fetching
  useEffect(() => { /* fetch */ }, []);
}
```

**3. No Loading States on Many Screens**
- Flash of empty content
- Poor UX during data loads

**4. No Error Boundaries**
- App crashes propagate to root
- No graceful degradation

#### Recommended Screen Improvements

**Phase 1: Consolidate Tabs (Priority: HIGH)**
```
Proposed structure (5 tabs max):

1. Home       - Dashboard, recent activity
2. Work       - Merged: Do + What (tasks + OKRs)
3. Team       - Merged: Who + Tools (people + AI)
4. Insights   - Merged: Evaluate + Performance
5. More       - Everything else (Settings, Community, Make, etc.)
```

**Phase 2: Standardize Data Loading**
```typescript
// Create screen template
export function StandardScreen({ children }: { children: ReactNode }) {
  const workspaceId = useAppStore(s => s.currentWorkspaceId);
  useWorkspaceData(workspaceId);

  const isLoading = useOrganizationStore(s => s.isLoading) ||
                    useWorkPlanStore(s => s.isLoading) ||
                    useOKRStore(s => s.isLoading);

  if (isLoading) return <ScreenLoader />;

  return (
    <ErrorBoundary>
      <SafeAreaView className="flex-1 bg-white dark:bg-slate-950">
        {children}
      </SafeAreaView>
    </ErrorBoundary>
  );
}
```

**Phase 3: Add Error Boundaries**
```typescript
// src/components/ErrorBoundary.tsx
export class ErrorBoundary extends React.Component {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('Screen error:', error, info);
    // Log to error tracking service
  }

  render() {
    if (this.state.hasError) {
      return <ErrorFallback error={this.state.error} />;
    }
    return this.props.children;
  }
}
```

---

## 📋 Comprehensive Implementation Plan

### Phase 1: Critical Fixes (Week 1)
**Goal:** Make existing features production-ready

1. **Backend CRUD Operations** (3 days)
   - Add INSERT/UPDATE/DELETE to all 4 stores
   - Add RLS policies for mutations
   - Test with real data flow

2. **Modal Standardization** (2 days)
   - Audit all 18 modals
   - Add missing `onRequestClose`
   - Fix keyboard handling
   - Create `StandardModal` component

3. **Error Handling** (1 day)
   - Add error boundaries to all screens
   - Improve error messages
   - Add retry logic

4. **Testing** (1 day)
   - Test sign-in/sign-up flow
   - Test data CRUD operations
   - Test workspace switching (once built)

**Deliverables:**
- ✅ All stores have working CRUD
- ✅ All modals follow standards
- ✅ Proper error handling throughout
- ✅ Full authentication flow tested

---

### Phase 2: Data Layer Improvements (Week 2)
**Goal:** Optimize data flow and add real-time features

1. **React Query Integration** (3 days)
   - Create query hooks for all resources
   - Migrate screens to use queries
   - Implement optimistic updates

2. **Real-time Subscriptions** (2 days)
   - Add Supabase subscriptions to stores
   - Handle real-time updates
   - Test multi-user scenarios

3. **Schema Alignment** (1 day)
   - Fix WorkPlan schema mismatches
   - Add missing database columns OR
   - Update transformation logic

4. **Cache Strategy** (1 day)
   - Define staleTime for each resource
   - Implement background refetch
   - Add cache invalidation rules

**Deliverables:**
- ✅ React Query managing all server state
- ✅ Real-time updates working
- ✅ Schema 100% aligned
- ✅ Optimal cache performance

---

### Phase 3: UX Enhancements (Week 3)
**Goal:** Polish user experience

1. **Workspace Switcher** (2 days)
   - Build workspace selection screen
   - Add workspace switcher component
   - Handle workspace switch gracefully

2. **Tab Consolidation** (2 days)
   - Reduce from 12+ tabs to 5 tabs
   - Reorganize features logically
   - Update navigation

3. **Loading States** (1 day)
   - Add skeleton screens
   - Improve loading indicators
   - Add pull-to-refresh

4. **Empty States** (1 day)
   - Design empty state components
   - Add helpful CTAs
   - Improve onboarding flow

**Deliverables:**
- ✅ Workspace switcher working
- ✅ 5-tab navigation
- ✅ Beautiful loading states
- ✅ Helpful empty states

---

### Phase 4: Production Readiness (Week 4)
**Goal:** Prepare for real users

1. **Offline Support** (2 days)
   - Cache data for offline use
   - Queue mutations for sync
   - Handle network errors gracefully

2. **Performance Optimization** (2 days)
   - Optimize large lists (virtualization)
   - Reduce re-renders
   - Lazy load heavy screens

3. **Security Audit** (1 day)
   - Review RLS policies
   - Check for data leaks
   - Validate input sanitization

4. **Documentation** (1 day)
   - API documentation
   - Architecture diagrams
   - Developer onboarding guide

**Deliverables:**
- ✅ App works offline
- ✅ 60fps performance
- ✅ Security audit passed
- ✅ Complete documentation

---

## 🎯 Key Metrics & Success Criteria

### Performance Targets
- [ ] App loads in < 2 seconds
- [ ] Screens render in < 500ms
- [ ] Mutations complete in < 1 second
- [ ] 60fps scrolling on all lists

### Quality Targets
- [ ] 0 TypeScript errors
- [ ] 0 React warnings
- [ ] 100% modals follow standards
- [ ] All screens have error boundaries

### Feature Completeness
- [ ] Full CRUD for all entities
- [ ] Real-time sync working
- [ ] Offline mode functional
- [ ] Multi-workspace support

### User Experience
- [ ] 5 or fewer tabs
- [ ] Loading states everywhere
- [ ] Helpful error messages
- [ ] Smooth animations

---

## 🚨 Risk Assessment

### High Risk
1. **RLS Policy Errors** - May block mutations
   - Mitigation: Test policies thoroughly

2. **Schema Mismatches** - May cause runtime errors
   - Mitigation: Align schema first

3. **Data Migration** - Users have AsyncStorage data
   - Mitigation: Build migration script

### Medium Risk
1. **Performance** - Large datasets may be slow
   - Mitigation: Add pagination early

2. **Offline Conflicts** - Multiple devices editing
   - Mitigation: Last-write-wins for MVP

3. **Tab Consolidation** - Users may resist change
   - Mitigation: Keep old tabs temporarily

### Low Risk
1. **Modal Refactoring** - Low impact
2. **Error Boundaries** - Non-breaking changes
3. **Documentation** - Can be done incrementally

---

## 💡 Recommendations

### Do First
1. ✅ **Add CRUD operations** - Blocks all other features
2. ✅ **Fix RLS policies** - Security critical
3. ✅ **Standardize modals** - Improves reliability

### Do Soon
4. ⏭️ **Add React Query** - Better DX, less bugs
5. ⏭️ **Build workspace switcher** - Key user feature
6. ⏭️ **Reduce tabs** - Better UX

### Do Later
7. 📅 **Offline support** - Nice to have
8. 📅 **Real-time subscriptions** - Collaboration feature
9. 📅 **Performance optimization** - Optimize as needed

### Don't Do (Yet)
- ❌ Advanced animations (fix functionality first)
- ❌ Social features (focus on core)
- ❌ AI integrations beyond basics (scope creep)

---

## 📁 Files Requiring Changes

### High Priority
```
src/lib/state/organization-store.ts      - Add CRUD methods
src/lib/state/work-plan-store.ts         - Add CRUD methods
src/lib/state/okr-store.ts               - Add CRUD methods
src/lib/state/supplier-store.ts          - Add CRUD methods
supabase/migrations/003_rls_mutations.sql - New migration
src/components/StandardModal.tsx         - New component
src/components/ErrorBoundary.tsx         - New component
```

### Medium Priority
```
src/lib/hooks/queries.ts                 - Add React Query hooks
src/app/(tabs)/_layout.tsx               - Reduce tabs
src/components/WorkspaceSwitcher.tsx     - New component
All 18 modal files                       - Fix patterns
```

### Low Priority
```
All screen files                         - Add error boundaries
All list components                      - Add virtualization
Documentation files                      - Update docs
```

---

## ✅ Pre-execution Checklist

Before starting implementation:

- [ ] Review this plan with team/stakeholders
- [ ] Confirm Supabase migrations are run
- [ ] Back up current codebase
- [ ] Create feature branch
- [ ] Set up error tracking (Sentry?)
- [ ] Prepare test accounts
- [ ] Document current behavior (baseline)

---

## 📝 Notes

- This is a **planning document only** - no code changes made
- All code examples are illustrative, not production-ready
- Timelines are estimates for a single developer
- Priorities can be adjusted based on business needs
- Some features may be descoped if timeline is tight

**Next Step:** Get approval on this plan before starting Phase 1.
