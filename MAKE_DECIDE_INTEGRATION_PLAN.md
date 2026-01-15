# Make <-> Decide Integration Implementation Plan

## Completed ✅
1. **Make Tab Supplier Cards** - Added team avatars and linked task info
   - Shows task title and progress percentage
   - Shows team member avatars (colored by role)
   - Displays on summary card

## Remaining Tasks

### 1. Decide Tab - Show Supplier Info (HIGH PRIORITY)
**File**: `/home/user/workspace/src/app/(tabs)/decide.tsx`

Add to task cards:
- Supplier badge if `linkedSupplierEngagementId` exists
- Show: Supplier name, component, estimated duration
- Click badge → navigate to Make tab with supplier selected

### 2. UnifiedTaskAllocationModal - Add Supplier Link UI (HIGH PRIORITY)
**File**: `/home/user/workspace/src/components/UnifiedTaskAllocationModal.tsx`

Add new section in modal:
```
Manufacturing & Equipment
├── Link to Supplier (dropdown)
├── Component Being Made (text input)
├── Manufacturing Process (text input)
└── Estimated Duration (number input, days)
```

Functions needed:
- `linkWorkPlanToSupplier(engagementId, workPlanId)`
- `unlinkWorkPlanFromSupplier(engagementId, workPlanId)`

### 3. Add Manufacturing Cost Field to WorkPlan (MEDIUM PRIORITY)
**File**: `/home/user/workspace/src/lib/state/work-plan-store.ts`

Add to WorkPlan interface:
```typescript
manufacturingCost?: number; // Cost from linked supplier
equipmentCost?: number; // Cost of AI tools, equipment used
```

Update when:
- Task is linked to supplier → set `manufacturingCost` from supplier's totalCost
- Task uses AI tools → calculate `equipmentCost` from tool costs

### 4. Update Financial Analysis (MEDIUM PRIORITY)
**Files**:
- `/home/user/workspace/src/app/(tabs)/index.tsx` (Home tab)
- `/home/user/workspace/src/lib/state/finance-store.ts`

Current calculation only includes:
- People cost (TU × cost per TU)

Need to add:
- Manufacturing cost (from linkedSupplierEngagementId)
- Equipment cost (AI tools, other resources)

Update:
- Weekly burn calculation
- Project cost estimates
- Resource cost breakdowns

### 5. Make Tab Modal - Enhanced Task Details (LOW PRIORITY)
**File**: `/home/user/workspace/src/app/(tabs)/make.tsx`

The modal already shows linked tasks (lines 770-849), but enhance:
- Show more task details (due date, status, blockers)
- Add clickable link to navigate to task in Decide tab
- Show cost breakdown (people vs equipment)

## Implementation Order

### Phase 1 (Current - 30 min)
1. ✅ Make tab supplier cards - show team & task
2. 🔄 Decide tab task cards - show supplier badge
3. 🔄 UnifiedTaskAllocationModal - add supplier link UI

### Phase 2 (Next - 45 min)
4. Add manufacturingCost and equipmentCost fields
5. Update financial calculations to include all costs
6. Test end-to-end flow

### Phase 3 (Polish - 15 min)
7. Enhance Make tab modal with more task details
8. Add navigation between Make ↔ Decide tabs
9. Update README with new features

## Technical Notes

### Data Flow
```
Work Plan (Decide)
├── linkedSupplierEngagementId → Supplier Engagement (Make)
├── componentBeingMade
├── manufacturingProcess
└── manufacturingCost (calculated from supplier)

Supplier Engagement (Make)
├── linkedWorkPlanIds → Work Plans (Decide)
├── componentName
├── processDescription
├── estimatedDuration
└── totalCost → flows to work plan manufacturingCost
```

### Cost Calculation Formula
```
Total Task Cost = People Cost + Manufacturing Cost + Equipment Cost

People Cost = Σ (TU × cost per TU for each person)
Manufacturing Cost = Linked supplier's totalCost (prorated if shared)
Equipment Cost = Σ (AI tool cost × usage)
```

### Navigation
```
Make Tab → Decide Tab:
  router.push({ pathname: '/(tabs)/decide', params: { highlightTask: workPlanId } })

Decide Tab → Make Tab:
  router.push({ pathname: '/(tabs)/make', params: { tab: 'suppliers', highlightSupplier: engagementId } })
```

## Files Modified So Far
1. `/home/user/workspace/src/app/(tabs)/make.tsx` - Added team avatars and task info to supplier cards
2. `/home/user/workspace/src/lib/organization-seed.ts` - Added linkedWorkPlanIds and component info to suppliers
3. `/home/user/workspace/src/lib/state/work-plan-store.ts` - Added linkedSupplierEngagementId fields to work plans

## Next Steps
Start with Decide tab to show supplier badges on tasks that have linkedSupplierEngagementId.
