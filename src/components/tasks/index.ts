/**
 * Task Components - Barrel Export
 * Standardized task display components for all tiers
 */

export { TaskStatusBadge, TaskStatusDot } from './TaskStatusBadge';
export { TaskProgressBar } from './TaskProgressBar';
export { TaskPriorityIndicator } from './TaskPriorityIndicator';
export { TaskAvatarStack } from './TaskAvatarStack';
export { TaskEffortTimeline } from './TaskEffortTimeline';
export { MemberCapacityIndicator } from './MemberCapacityIndicator';
export { CoordinationCostDisplay } from './CoordinationCostDisplay';

// Tier components
export { TaskCardCompact } from './TaskCardCompact';
export { TaskCardExpansion } from './TaskCardExpansion';

// Legacy modal components (deprecated - use TaskCardExpansion instead)
export { TaskCardMedium } from './TaskCardMedium';
export { TaskCardMediumInline } from './TaskCardMediumInline';
export { TaskCardFull } from './TaskCardFull';
