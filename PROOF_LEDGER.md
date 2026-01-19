# PROOF LEDGER - Evidence of Implementation

## 1. FAB Centering
**File:** `src/app/(tabs)/_layout.tsx`
**Lines:** 57-61, 153
**Evidence:**
```typescript
// Calculation (line 57-61)
const screenWidth = Dimensions.get('window').width;
const fabSize = 70;
const fabBottom = insets.bottom + (60 - fabSize) / 2;
const fabLeft = (screenWidth - fabSize) / 2;

// Usage (line 153)
style={{
  position: 'absolute',
  bottom: fabBottom,
  left: fabLeft,  // ✅ CORRECT - Uses calculated center
  width: fabSize,
  height: fabSize,
  ...
}}
```

## 2. Weekly Resource Pool Gap Removal
**File:** `src/components/CollapsibleResourcePool.tsx`
**Line:** 296
**Evidence:**
```typescript
className={`flex-row items-center px-3 py-2 border-b border-gray-100 dark:border-slate-800 active:bg-gray-50 dark:active:bg-slate-800 ${
  isSelected ? 'bg-purple-50 dark:bg-purple-900/20' : ''
}`}
```
**Note:** Changed from `py-1.5` to `py-2`

## 3. Avatar Initials Uppercase
**File:** `src/components/CollapsibleResourcePool.tsx`
**Line:** 309
**Evidence:**
```typescript
<Text className="font-bold text-[9px]" style={{ color: roleColor }}>
  {member.name.split(' ').map(n => n[0].toUpperCase()).join('')}
</Text>
```

## 4. TU-Based Metrics (Home Tab)
**File:** `src/components/home/CurrentActivitiesSection.tsx`
**Lines:** 53-57, 106-112
**Evidence:**
```typescript
// Calculation (lines 53-57)
const totalTUs = task.estimatedTimeUnits || 0;
const completedTUs = Math.round((task.progress / 100) * totalTUs);
const remainingTUs = totalTUs - completedTUs;
const weeksToFinish = allocatedPerWeek > 0 ? Math.ceil(remainingTUs / allocatedPerWeek) : null;

// Display (lines 106-112)
<Text className="text-slate-900 dark:text-white text-xs font-bold">
  {completedTUs}/{totalTUs} TU
</Text>
{weeksToFinish !== null && (
  <Text className="text-slate-500 dark:text-slate-400 text-xs">
    ~{weeksToFinish} wk{weeksToFinish !== 1 ? 's' : ''} left
  </Text>
)}
```

## 5. TU-Based Metrics (People Tab)
**File:** `src/app/(tabs)/people.tsx`
**Lines:** 543-558, 655-670
**Evidence:**
```typescript
// Manual squads (lines 543-558)
{squad.activeTasks.slice(0, 3).map((task: WorkPlan) => {
  const totalTUs = task.estimatedTimeUnits || 0;
  const completedTUs = Math.round((task.progress / 100) * totalTUs);

  return (
    <View key={task.id} className="flex-row items-center gap-2 mb-1.5">
      <Text className="text-slate-400 dark:text-slate-500 text-xs">
        {completedTUs}/{totalTUs} TU
      </Text>
    </View>
  );
})}

// Automatic squads (lines 655-670)
{squad.activeTasks.map((task: WorkPlan) => {
  const totalTUs = task.estimatedTimeUnits || 0;
  const completedTUs = Math.round((task.progress / 100) * totalTUs);

  return (
    <View key={task.id} className="flex-row items-center gap-2">
      <Text className="text-blue-600 dark:text-blue-400 text-xs font-semibold">
        {completedTUs}/{totalTUs} TU
      </Text>
    </View>
  );
})}
```

## 6. TU-Based Metrics (When Tab)
**File:** `src/app/(tabs)/when.tsx`
**Lines:** 72-95, 135
**Evidence:**
```typescript
// Calculation (lines 72-95)
const taskStats = useMemo(() => {
  const activeTasks = workPlans.filter(wp => wp.status !== 'completed' && wp.status !== 'abandoned');
  const totalAllocatedTUs = activeTasks.reduce((sum, task) => {
    const allocated = task.allocations?.reduce((taskSum, alloc) => taskSum + (alloc.squaresPerWeek || 0), 0) || 0;
    return sum + allocated;
  }, 0);
  const totalTeamCapacity = members.filter(m => m.status === 'active').length * 10;

  return {
    total: activeTasks.length,
    inProgress: inProgress.length,
    blocked: blocked.length,
    queued: queued.length,
    allocatedTUs: totalAllocatedTUs,
    totalCapacity: totalTeamCapacity,
  };
}, [workPlans, members]);

// Display (line 135)
<Text className="text-white font-bold text-sm">
  {taskStats.allocatedTUs}/{taskStats.totalCapacity}
</Text>
```

## 7. PersonCard TU Display
**File:** `src/components/PersonCard.tsx`
**Line:** 166 (approx)
**Evidence:**
```typescript
<View className={`px-2 py-0.5 rounded-full flex-row items-center gap-1 ${utilStyle.bgClass}`}>
  <Text className={`text-xs font-bold ${utilStyle.textClass}`}>
    {memberWorkload.totalAllocated}/{memberWorkload.totalCapacity} TU
  </Text>
  {utilizationPercent >= 100 && <AlertCircle size={10} color="#ef4444" />}
</View>
```

## 8. All 24 AI Tools in Marketplace
**File:** `src/app/(tabs)/marketplace.tsx`
**Lines:** 285-400+
**Evidence:**
```typescript
{/* AI Tools Discovery */}
{(activeCategory === 'all' || activeCategory === 'ai-tools') && (
  <View className="mb-6">
    <View className="flex-row items-center justify-between mb-3">
      <Text className="text-slate-900 dark:text-white font-bold text-lg">
        AI Tools ({THIRD_PARTY_AI_TOOLS.length})
      </Text>
    </View>

    {/* Manufacturing & Design (4 tools) */}
    <Text className="text-slate-600 dark:text-slate-400 text-sm font-semibold mb-2 mt-3">
      Manufacturing & Design (4)
    </Text>
    <View className="gap-3 mb-4">
      {THIRD_PARTY_AI_TOOLS.filter(t => t.category === 'manufacturing').map((tool, index) => (
        <Pressable className="bg-white dark:bg-slate-800 rounded-xl p-4 active:opacity-80 border border-orange-200 dark:border-orange-800">
          ...
        </Pressable>
      ))}
    </View>

    {/* Sales (4 tools) */}
    {/* Marketing (6 tools) */}
    {/* Finance (3 tools) */}
    {/* Operations (3 tools) */}
    {/* Admin/Productivity (4 tools) */}
  </View>
)}
```

**Tools Count Verification:**
- Manufacturing: Autodesk Fusion AI, Monolith AI, Paperless Parts, Instrumental
- Sales: 11x Alice, Gong AI, Clay AI, ElevenLabs Voice AI
- Marketing: Jasper AI, Copy.ai, Midjourney, DALL-E 3, Perplexity Pro, Runway Gen-2
- Finance: Vic AI, Digits AI, Gemini Pro
- Operations: Hebbia AI, Zapier AI, Harvey AI
- Admin: ChatGPT Enterprise, Notion AI, Otter.ai, Grammarly Business

**Total:** 4 + 4 + 6 + 3 + 3 + 4 = 24 ✅

## 9. AI Tools Data Source
**File:** `src/lib/third-party-ai-tools.ts`
**Lines:** 59-1331
**Evidence:** THIRD_PARTY_AI_TOOLS array contains all 24 tools with complete metadata including:
- name, provider, purpose, description
- functions, capabilities, integrations
- costPerMonth, website
- useCases, keyFeatures, pricing details
- setup requirements, support info, reviews

## 10. PersonCard Progressive Disclosure Pattern
**File:** `src/components/PersonCard.tsx`
**Lines:** 11, 99-107, 128-428
**Evidence:**
```typescript
// Line 11 - ViewState type definition
type ViewState = 'collapsed' | 'expanded';

// Lines 99-107 - State transition logic
const handlePress = () => {
  lightImpact();
  if (viewState === 'collapsed') {
    setViewState('expanded');
  } else {
    // Expanded -> Full modal
    onOpenModal();
  }
};

// Lines 128-178 - Collapsed view (always visible)
<View className="flex-row items-center">
  {/* Avatar with initials */}
  <View className="w-12 h-12 rounded-full items-center justify-center mr-3"
        style={{ backgroundColor: roleColor + '20' }}>
    <Text className="text-lg font-bold" style={{ color: roleColor }}>
      {getInitials(member.name)}
    </Text>
  </View>

  {/* Name and function */}
  <View className="flex-1">
    <Text className="text-slate-900 dark:text-white font-semibold text-base" numberOfLines={1}>
      {member.name}
    </Text>
    <View className="flex-row items-center gap-2">
      <Text className="text-slate-500 dark:text-slate-400 text-sm">
        {member.function}
      </Text>
      <View className="flex-row items-center gap-1">
        <Clock size={12} color="#64748b" />
        <Text className="text-slate-500 dark:text-slate-400 text-xs">
          {member.daysPerWeek || 5}d/wk
        </Text>
      </View>
    </View>
  </View>

  {/* Compact stats - TU allocation and task count */}
  <View className="items-end gap-1">
    <View className={`px-2 py-0.5 rounded-full flex-row items-center gap-1 ${utilStyle.bgClass}`}>
      <Text className={`text-xs font-bold ${utilStyle.textClass}`}>
        {memberWorkload.totalAllocated}/{memberWorkload.totalCapacity} TU
      </Text>
      {utilizationPercent >= 100 && <AlertCircle size={10} color="#ef4444" />}
    </View>
    <View className="flex-row items-center gap-1">
      <Target size={10} color="#64748b" />
      <Text className="text-slate-500 dark:text-slate-400 text-[10px]">
        {memberWorkload.tasks.length} task{memberWorkload.tasks.length !== 1 ? 's' : ''}
      </Text>
    </View>
  </View>
</View>

// Lines 181-212 - Collapsed state quick info bar
{viewState === 'collapsed' && (
  <View className="flex-row items-center justify-between mt-2 pt-2 border-t border-slate-100 dark:border-slate-700">
    <View className="flex-row items-center gap-3">
      {/* Shows: Capacity, Squads count, AI Tools count */}
    </View>
    <Text className="text-blue-500 text-[10px] font-medium">Tap for more</Text>
  </View>
)}

// Lines 214-428 - Expanded view with all details
{viewState === 'expanded' && (
  <View className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-700">
    {/* Task Status Breakdown (In Progress / Blocked / Queued) */}
    {/* Workload Metrics (Weekly Capacity / Available TU) with color coding */}
    {/* Due Soon Alert */}
    {/* Squads Section */}
    {/* AI Tools Section */}
    {/* Current Tasks Summary (up to 3 tasks with progress) */}
    {/* Quick Action Buttons (View Tasks, View Schedule) */}
    <Text className="text-slate-400 dark:text-slate-500 text-xs text-center mt-2">
      Tap again for full details
    </Text>
  </View>
)}
```

**3-State Pattern Verified:**
1. **Collapsed**: Shows avatar, name, function, days/week, TU allocation (line 166), task count (line 173), and "Tap for more" hint (line 210)
2. **Expanded** (first tap): Shows task breakdown (lines 218-240), capacity allocation with color coding (lines 242-258), due soon (lines 260-282), squads (lines 284-306), AI tools (lines 308-337), current tasks summary (lines 339-393), quick action buttons (lines 395-421), and "Tap again for full details" hint (line 424)
3. **Full Modal** (second tap): Calls `onOpenModal()` which opens PersonDetailsModal (line 105)
