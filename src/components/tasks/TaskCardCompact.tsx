/**
 * TaskCardCompact - Tier 1
 * Single line task display for lists and overviews
 *
 * Shows: Status dot, title (truncated), team avatars, effort timeline, progress, priority
 * Format: "16 TU @ 8/wk = ~2w"
 *
 * Supports priority indicator (colored left border) and expansion slot
 */

import { View, Text, Pressable } from 'react-native';
import { AlertTriangle } from 'lucide-react-native';
import type { WorkPlan } from '@/lib/state/work-plan-store';
import type { PriorityLevel } from '@/lib/ai-priority-scoring';
import {
  TaskStatusDot,
  TaskAvatarStack,
  TaskEffortTimeline,
  TaskPriorityIndicator,
  TaskProgressBar,
} from './index';
import { ObjectiveBadges } from '@/components/LinkToObjectiveModal';
import {
  calculateNetVelocity,
  calculateEstimatedWeeks,
  formatTaskDate,
} from '@/lib/task-calculations';

// Standardized typography
const TYPOGRAPHY = {
  title: 'text-sm font-semibold text-slate-900 dark:text-white',
  smallValue: 'text-[10px] font-medium',
};

interface TaskCardCompactProps {
  task: WorkPlan;
  onPress?: () => void;
  priorityLevel?: PriorityLevel;
  isExpanded?: boolean;
}

export function TaskCardCompact({
  task,
  onPress,
  priorityLevel,
  isExpanded = false,
}: TaskCardCompactProps) {
  // Calculate effort metrics
  const rawVelocity = task.allocations.reduce((sum, a) => sum + a.squaresPerWeek, 0);
  const teamSize = task.allocations.length;
  const netVelocity = calculateNetVelocity(teamSize, rawVelocity);
  const remaining = Math.max(0, task.estimatedTimeUnits - (task.tusExpended || 0));
  const estimatedWeeks = calculateEstimatedWeeks(remaining, netVelocity);

  // Get member IDs for avatars
  const memberIds = task.allocations.map((a) => a.memberId);

  // Determine priority (you might need to add this field to WorkPlan or derive it)
  const priority: 'normal' | 'high' | 'critical' = 'normal';

  // Check if overdue
  const dueDate = new Date(task.dueDate);
  const isOverdue = dueDate < new Date() && task.status !== 'completed';

  // Priority border color
  const priorityBorderColor = priorityLevel
    ? priorityLevel === 'critical'
      ? '#ef4444'
      : priorityLevel === 'high'
      ? '#f59e0b'
      : priorityLevel === 'important'
      ? '#3b82f6'
      : '#e2e8f0'
    : undefined;

  return (
    <Pressable
      onPress={onPress}
      className={`bg-white dark:bg-slate-800 p-3 border border-slate-200 dark:border-slate-700 active:opacity-70 ${
        isExpanded ? 'rounded-t-lg' : 'rounded-lg mb-2'
      }`}
      style={
        priorityBorderColor
          ? {
              borderLeftWidth: 4,
              borderLeftColor: priorityBorderColor,
            }
          : undefined
      }
    >
      {/* Line 1: Status, Title, Avatars, Priority */}
      <View className="flex-row items-center gap-2">
        <TaskStatusDot status={task.status} size={8} />
        {task.isEscalated && (
          <View className="flex-row items-center gap-1 bg-red-50 dark:bg-red-900/30 px-2 py-0.5 rounded">
            <AlertTriangle size={12} color="#ef4444" />
            <Text className="text-red-600 dark:text-red-400 text-xs font-semibold">
              Escalated
            </Text>
          </View>
        )}
        <Text className={TYPOGRAPHY.title} numberOfLines={1} style={{ flexShrink: 1 }}>
          {task.title}
        </Text>
        <View className="flex-1" />
        <View className="flex-row items-center gap-2">
          <TaskAvatarStack memberIds={memberIds} maxVisible={3} size={20} />
          <TaskPriorityIndicator priority={priority} size={14} />
        </View>
      </View>

      {/* Line 2: Effort timeline LEFT, Due date RIGHT */}
      <View className="pl-4 mt-1 flex-row items-center justify-between gap-2">
        <View className="flex-row items-center gap-2 flex-1">
          <TaskEffortTimeline
            totalTU={task.estimatedTimeUnits}
            velocityPerWeek={netVelocity}
            estimatedWeeks={estimatedWeeks}
            completed={task.tusExpended || 0}
            showProgressBar={false}
          />
          {/* Objective badges */}
          <ObjectiveBadges taskId={task.id} maxBadges={1} />
        </View>
        <Text
          className={`${TYPOGRAPHY.smallValue} ${
            isOverdue ? 'text-red-600 dark:text-red-400' : 'text-slate-600 dark:text-slate-400'
          }`}
        >
          Due {formatTaskDate(dueDate)}
        </Text>
      </View>

      {/* Line 3: Progress bar */}
      <View className="pl-4 mt-1">
        <TaskProgressBar
          completed={task.tusExpended || 0}
          total={task.estimatedTimeUnits}
          showPercentage={false}
          variant="thin"
        />
      </View>
    </Pressable>
  );
}
