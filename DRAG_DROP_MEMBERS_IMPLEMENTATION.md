# Drag & Drop Team Members Implementation Plan

## Overview
Allow founders, executives, and apprentices to be dragged onto OKRs/tasks in the Decide tab to speed them up.

## Current Status
✅ Created `DraggableTeamMember` component with avatar initials
✅ Updated OKR store with `assignedMemberIds` on objectives
✅ Added methods: `assignMemberToObjective`, `removeMemberFromObjective`, `getObjectiveMembers`

## Next Steps

### 1. Add Team Member Sidebar to Decide Tab
Create a collapsible sidebar showing all team members as draggable avatars:
- Founders (purple avatars)
- Executives (blue avatars)
- Apprentices (green avatars)
- Each shows first+last name initials

### 2. Make Task Cards Accept Drops
Update `DraggableTaskCard` component to:
- Accept drop events from team member avatars
- Show assigned member avatars on each task
- Allow removing members by tapping X on avatar
- Highlight when hovering with a draggable member

### 3. Auto-Queue Logic
Implement automatic queuing when members are removed:
- If all members removed from a task (objective) → task stays but marked as unassigned
- If ALL tasks in an OKR have no members → entire OKR moves to queue

### 4. Visual Feedback
- Task cards show assigned member avatars in a row
- Drop zones highlight when dragging a member over them
- Smooth animations for member assignment
- Badge showing number of assigned members

## Technical Implementation

### File Structure
```
src/components/
  DraggableTeamMember.tsx ✅ (created)
  TeamMemberSidebar.tsx (new)

src/app/(tabs)/
  decide.tsx (update with sidebar and drop logic)

src/lib/state/
  okr-store.ts ✅ (updated with member tracking)
```

### Key Components

#### TeamMemberSidebar.tsx
```typescript
interface TeamMemberSidebarProps {
  onMemberDragStart: (memberId: string) => void;
  onMemberDragEnd: (memberId: string, x: number, y: number) => void;
}
```

#### Updated DraggableTaskCard
Add props:
- `assignedMemberIds: string[]`
- `onMemberDrop: (memberId: string) => void`
- `onMemberRemove: (memberId: string) => void`

## Auto-Queue Rules

1. **Task Level**: Individual objectives can have 0 members (unassigned)
2. **OKR Level**: If ALL objectives in an OKR have 0 members → move OKR to queue
3. **Queue Status**: Use existing `queueStatus` field to track this

## UI/UX Details

### Member Avatars
- Size: 28x28px (small)
- Initials: First + Last name (e.g., "JD" for John Doe)
- Colors: Purple (Founder), Blue (Exec), Green (Apprentice)
- Remove button: Small red X badge on top-right

### Drop Zones
- Tasks glow with subtle border when member is dragged over
- Drop accepted: Green flash
- Drop rejected: Red flash (if already assigned)

### Sidebar
- Collapsible with toggle button
- Scrollable list of all active team members
- Grouped by role (Founders → Execs → Apprentices)
- Each member draggable

## Testing Checklist
- [ ] Drag member onto task assigns them
- [ ] Member avatar appears on task
- [ ] Remove member by tapping X
- [ ] Cannot assign same member twice
- [ ] OKR moves to queue when all tasks have no members
- [ ] Sidebar collapses/expands properly
- [ ] Works in both light and dark mode
