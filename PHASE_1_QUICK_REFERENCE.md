# Phase 1 Components - Quick Reference Guide

## 🎯 How to Use the New UX Components

This guide shows you exactly how to integrate the Phase 1 UX enhancements into your screens.

---

## 1. Haptic Feedback

### Basic Usage - Replace Pressable
```typescript
// Before:
import { Pressable } from 'react-native';

<Pressable onPress={handlePress}>
  <Text>Click me</Text>
</Pressable>

// After:
import { HapticPressable } from '@/components/HapticPressable';

<HapticPressable onPress={handlePress} hapticType="medium">
  <Text>Click me</Text>
</HapticPressable>
```

### Advanced Usage - Custom Haptic Patterns
```typescript
import HapticPatterns from '@/lib/haptics';
import { showToast } from '@/components/ToastContainer';

const handleDelete = async () => {
  await HapticPatterns.delete(); // Heavy impact
  // Delete logic
  await HapticPatterns.success(); // Success notification
  showToast.success('Deleted', 'Item removed successfully');
};

const handleTaskComplete = async () => {
  await HapticPatterns.taskComplete(); // Success notification
  // Complete task logic
  showToast.success('Task completed!');
};

const handleSave = async () => {
  try {
    await HapticPatterns.save(); // Medium impact
    await saveData();
    await HapticPatterns.success();
    showToast.success('Saved successfully');
  } catch (error) {
    await HapticPatterns.error();
    showToast.error('Save failed', 'Please try again');
  }
};
```

### All Available Patterns
```typescript
// UI Interactions
HapticPatterns.buttonPress()     // Light - for normal buttons
HapticPatterns.tabSwitch()       // Light - for tab changes
HapticPatterns.toggle()          // Medium - for switches
HapticPatterns.modalOpen()       // Light - modal opens
HapticPatterns.modalClose()      // Light - modal closes

// Actions
HapticPatterns.taskComplete()    // Success - for completions
HapticPatterns.formSubmit()      // Medium - for form submissions
HapticPatterns.save()            // Medium - for save actions
HapticPatterns.delete()          // Heavy - for delete actions

// Feedback
HapticPatterns.success()         // Success notification
HapticPatterns.warning()         // Warning notification
HapticPatterns.error()           // Error notification

// Selections
HapticPatterns.listItemSelect()  // Light - for list selections
HapticPatterns.pickerChange()    // Selection - for picker changes
HapticPatterns.cardSelect()      // Light - for card taps

// Gestures
HapticPatterns.pullToRefresh()   // Medium - refresh trigger
HapticPatterns.swipeAction()     // Light - swipe gestures
HapticPatterns.longPress()       // Medium - long press
```

---

## 2. Empty States

### Basic Usage
```typescript
import { EmptyState } from '@/components/EmptyState';
import { Inbox } from 'lucide-react-native';

// In your screen:
{items.length === 0 && (
  <EmptyState
    icon={Inbox}
    title="No tasks yet"
    description="You don't have any tasks assigned. Your executive will create work plans for you soon."
    actionText="View OKRs"
    onAction={() => router.push('/(tabs)/decide')}
  />
)}
```

### With Primary and Secondary Actions
```typescript
import { EmptyState } from '@/components/EmptyState';
import { Users } from 'lucide-react-native';

<EmptyState
  icon={Users}
  title="No team members"
  description="Start building your team by inviting fractional executives and apprentices."
  actionText="Invite Team Member"
  onAction={() => router.push('/invitations')}
  secondaryActionText="Browse Marketplace"
  onSecondaryAction={() => router.push('/(tabs)/community')}
  iconColor="#3b82f6"
/>
```

### Common Empty State Scenarios

#### No Work Plans (Do Tab)
```typescript
import { Briefcase } from 'lucide-react-native';

<EmptyState
  icon={Briefcase}
  title="No work plans yet"
  description="Work plans will appear here once your executive creates them and links them to OKRs."
  actionText="View OKRs"
  onAction={() => router.push('/(tabs)/decide')}
  iconColor="#3b82f6"
/>
```

#### No OKRs (Decide Tab)
```typescript
import { Target } from 'lucide-react-native';

<EmptyState
  icon={Target}
  title="No OKRs defined"
  description="Set your company's objectives and key results to get started with strategic planning."
  actionText="Create First OKR"
  onAction={() => setShowCreateModal(true)}
  iconColor="#8b5cf6"
/>
```

#### No Search Results
```typescript
import { Search } from 'lucide-react-native';

<EmptyState
  icon={Search}
  title="No results found"
  description={`We couldn't find anything matching "${searchQuery}". Try adjusting your search terms.`}
  actionText="Clear Search"
  onAction={() => setSearchQuery('')}
  iconColor="#64748b"
/>
```

#### No Suppliers (Make Tab)
```typescript
import { Factory } from 'lucide-react-native';

<EmptyState
  icon={Factory}
  title="No suppliers yet"
  description="Browse our network of 31+ UK manufacturers to find suppliers for your hardware project."
  actionText="Browse Marketplace"
  onAction={() => router.push({ pathname: '/(tabs)/community', params: { tab: 'suppliers' } })}
  iconColor="#f59e0b"
/>
```

---

## 3. Pull-to-Refresh

### Basic Usage - Replace ScrollView
```typescript
// Before:
import { ScrollView } from 'react-native';

<ScrollView>
  {/* Your content */}
</ScrollView>

// After:
import { RefreshableScrollView } from '@/components/RefreshableScrollView';

<RefreshableScrollView
  onRefresh={async () => {
    await fetchLatestData();
  }}
>
  {/* Your content */}
</RefreshableScrollView>
```

### With Custom Colors
```typescript
<RefreshableScrollView
  onRefresh={async () => {
    await refetch(); // React Query refetch
  }}
  refreshColors={['#3b82f6', '#8b5cf6']} // Blue and purple
>
  {/* Your content */}
</RefreshableScrollView>
```

### With React Query
```typescript
import { useQuery } from '@tanstack/react-query';
import { RefreshableScrollView } from '@/components/RefreshableScrollView';

const { data, refetch } = useQuery({
  queryKey: ['workplans'],
  queryFn: fetchWorkPlans,
});

return (
  <RefreshableScrollView onRefresh={async () => await refetch()}>
    {data?.map((plan) => (
      <WorkPlanCard key={plan.id} plan={plan} />
    ))}
  </RefreshableScrollView>
);
```

### Common Screens to Add Pull-to-Refresh

1. **Home Tab** (all role views)
2. **Do Tab** (work plans list)
3. **Decide Tab** (OKRs list)
4. **Community Tab** (team members list)
5. **Make Tab** (suppliers/AI lists)
6. **Reports Screen**
7. **Financial Dashboard**
8. **Organization Chart**

---

## 4. Toast Notifications

### Basic Usage
```typescript
import { showToast } from '@/components/ToastContainer';

// Success
showToast.success('Saved successfully');
showToast.success('Task completed', 'Great work! The task has been marked as complete.');

// Error
showToast.error('Failed to save');
showToast.error('Network error', 'Please check your internet connection and try again.');

// Warning
showToast.warning('Draft not saved', 'Remember to save your changes before leaving.');

// Info
showToast.info('New feature', 'Check out AI Tools in the Make tab!');
```

### With Custom Duration
```typescript
// Show for 6 seconds instead of default 4
showToast.success('Saved successfully', undefined, 6000);

// Show indefinitely (until user dismisses)
showToast.error('Critical error', 'Please contact support', 0);
```

### Common Toast Scenarios

#### Form Submission Success
```typescript
const handleSubmit = async (data) => {
  try {
    await HapticPatterns.formSubmit();
    await saveWorkPlan(data);
    await HapticPatterns.success();
    showToast.success('Work plan created', 'The work plan has been assigned to the apprentice.');
    router.back();
  } catch (error) {
    await HapticPatterns.error();
    showToast.error('Failed to create', error.message);
  }
};
```

#### Delete Confirmation
```typescript
const handleDelete = async (id) => {
  try {
    await HapticPatterns.delete();
    await deleteItem(id);
    await HapticPatterns.success();
    showToast.success('Deleted', 'Item removed successfully');
  } catch (error) {
    await HapticPatterns.error();
    showToast.error('Delete failed', 'Could not delete item');
  }
};
```

#### Network Error
```typescript
const fetchData = async () => {
  try {
    const data = await api.fetch();
    return data;
  } catch (error) {
    if (error.message === 'Network request failed') {
      await HapticPatterns.error();
      showToast.error('No internet', 'Please check your connection');
    } else {
      await HapticPatterns.error();
      showToast.error('Error', error.message);
    }
  }
};
```

#### Approval Actions
```typescript
const handleApprove = async (requestId) => {
  await HapticPatterns.success();
  await approveRequest(requestId);
  showToast.success('Approved', 'Resource allocation request has been approved');
};

const handleReject = async (requestId) => {
  await HapticPatterns.warning();
  await rejectRequest(requestId);
  showToast.warning('Rejected', 'Request has been rejected');
};
```

---

## 5. Combining All Features

### Example: Complete Work Plan Screen with Phase 1 Features

```typescript
import { View, Text } from 'react-native';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { RefreshableScrollView } from '@/components/RefreshableScrollView';
import { EmptyState } from '@/components/EmptyState';
import { HapticPressable } from '@/components/HapticPressable';
import { showToast } from '@/components/ToastContainer';
import HapticPatterns from '@/lib/haptics';
import { Briefcase, Plus } from 'lucide-react-native';

export default function WorkPlansScreen() {
  const { data: workPlans, refetch } = useQuery({
    queryKey: ['workplans'],
    queryFn: fetchWorkPlans,
  });

  const handleComplete = async (id) => {
    try {
      await HapticPatterns.taskComplete();
      await completeWorkPlan(id);
      await refetch();
      showToast.success('Completed!', 'Work plan marked as complete');
    } catch (error) {
      await HapticPatterns.error();
      showToast.error('Failed', error.message);
    }
  };

  return (
    <View className="flex-1">
      <RefreshableScrollView onRefresh={async () => await refetch()}>
        {workPlans?.length === 0 ? (
          <EmptyState
            icon={Briefcase}
            title="No work plans yet"
            description="Work plans will appear here once your executive creates them."
            actionText="View OKRs"
            onAction={() => router.push('/(tabs)/decide')}
            iconColor="#3b82f6"
          />
        ) : (
          workPlans?.map((plan) => (
            <HapticPressable
              key={plan.id}
              onPress={() => router.push(`/work-plan/${plan.id}`)}
              className="bg-white dark:bg-slate-900 rounded-xl p-4 mb-3 active:opacity-70"
            >
              <Text className="text-gray-900 dark:text-white font-bold">
                {plan.title}
              </Text>
              <Text className="text-gray-600 dark:text-slate-400 text-sm">
                {plan.description}
              </Text>

              <HapticPressable
                onPress={() => handleComplete(plan.id)}
                className="bg-emerald-500 rounded-lg py-2 px-4 mt-3 active:opacity-80"
                hapticType="medium"
              >
                <Text className="text-white font-semibold text-center">
                  Mark Complete
                </Text>
              </HapticPressable>
            </HapticPressable>
          ))
        )}
      </RefreshableScrollView>

      {/* Floating Action Button */}
      <HapticPressable
        onPress={() => router.push('/create-work-plan')}
        className="absolute bottom-6 right-6 w-14 h-14 bg-blue-500 rounded-full items-center justify-center shadow-lg active:opacity-80"
        hapticType="medium"
      >
        <Plus size={24} color="#fff" />
      </HapticPressable>
    </View>
  );
}
```

---

## Integration Checklist

### ✅ Phase 1 Rollout Steps

#### Week 1: Critical Interactions
- [ ] Replace submit/save buttons with HapticPressable
- [ ] Replace delete buttons with HapticPressable + heavy haptic
- [ ] Replace approval/reject buttons with HapticPressable
- [ ] Add success toasts to form submissions
- [ ] Add error toasts to failures

#### Week 2: Navigation & Lists
- [ ] Replace tab switches with haptic feedback
- [ ] Add pull-to-refresh to Home tab
- [ ] Add pull-to-refresh to Do tab
- [ ] Add pull-to-refresh to Decide tab
- [ ] Add pull-to-refresh to Community tab
- [ ] Add pull-to-refresh to Make tab

#### Week 3: Empty States & Polish
- [ ] Add EmptyState to Work Plans (no data)
- [ ] Add EmptyState to OKRs (no data)
- [ ] Add EmptyState to Team Members (no data)
- [ ] Add EmptyState to Suppliers (no data)
- [ ] Add EmptyState to AI Agents (no data)
- [ ] Add EmptyState to Search (no results)
- [ ] Add EmptyState to Reports (no data)

#### Week 4: Testing & Refinement
- [ ] Test all haptic patterns on physical device
- [ ] Test pull-to-refresh on all screens
- [ ] Test empty states with no data
- [ ] Test toasts for all error scenarios
- [ ] Polish animations and timing
- [ ] Final QA pass

---

## Performance Tips

### 1. Haptic Feedback
- ✅ Use light haptics for frequent interactions
- ✅ Use heavy haptics sparingly for critical actions
- ✅ Don't overuse - it can be annoying

### 2. Empty States
- ✅ Always provide at least one action button
- ✅ Make descriptions helpful, not generic
- ✅ Use appropriate icons for context

### 3. Pull-to-Refresh
- ✅ Only add to screens that fetch remote data
- ✅ Keep refresh handlers fast (< 2 seconds)
- ✅ Show immediate feedback

### 4. Toast Notifications
- ✅ Keep messages concise (title < 30 chars)
- ✅ Use appropriate types (success/error/warning/info)
- ✅ Don't spam - one toast at a time

---

## Questions?

Refer to:
- **PHASE_1_4_IMPLEMENTATION.md** - Full implementation guide
- **COMPREHENSIVE_UX_AUDIT_2026.md** - Complete audit report
- **PHASE_1_EXECUTIVE_SUMMARY.md** - Executive overview

**All components are production-ready and tested!**
