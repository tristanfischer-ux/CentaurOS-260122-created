/**
 * TaskCardCompact - Tier 1
 * Single line task display for lists and overviews
 *
 * Shows: Status dot, title (truncated), team avatars, effort timeline, progress, priority
 * Format: "16 TU @ 8/wk = ~2w"
 */

import { View, Text, Pressable } from 'react-native';
import type { WorkPlan } from '@/lib/state/work-plan-store';
import {
  TaskStatusDot,
  TaskAvatarStack,
  TaskEffortTimeline,
  TaskPriorityIndicator,
} from './index';
import {
  calculateNetVelocity,
  calculateEstimatedWeeks,
  calculateEstimatedDate,
  formatTaskDate,
} from '@/lib/task-calculations';

interface TaskCardCompactProps {
  task: WorkPlan;
  onPress?: () => void;
}

export function TaskCardCompact({ task, onPress }: TaskCardCompactProps) {
  // Calculate effort metrics
  const rawVelocity = task.allocations.reduce((sum, a) => sum + a.squaresPerWeek, 0);
  const teamSize = task.allocations.length;
  const netVelocity = calculateNetVelocity(teamSize, rawVelocity);
  const remaining = Math.max(0, task.estimatedTimeUnits - (task.tusExpended || 0));
  const estimatedWeeks = calculateEstimatedWeeks(remaining, netVelocity);
  const estimatedDate = calculateEstimatedDate(new Date(), estimatedWeeks);

  // Get member IDs for avatars
  const memberIds = task.allocations.map((a) => a.memberId);

  // Determine priority (you might need to add this field to WorkPlan or derive it)
  // For now, using a placeholder
  const priority: 'normal' | 'high' | 'critical' = 'normal';

  // Check if overdue
  const dueDate = new Date(task.dueDate);
  const isOverdue = dueDate < new Date() && task.status !== 'completed';

  return (
    <Pressable
      onPress={onPress}
      className="bg-white dark:bg-slate-800 rounded-lg p-3 mb-2 border border-slate-200 dark:border-slate-700 active:opacity-70"
    >
      <View className="flex-row items-start gap-2 mb-1.5">
        <View className="flex-1 flex-row items-center gap-2">
          <TaskStatusDot status={task.status} size={8} />
          <Text
            className="flex-1 text-slate-900 dark:text-white text-sm font-medium"
            numberOfLines={1}
          >
            {task.title}
          </Text>
        </View>
        <View className="items-end gap-1">
          <View className="flex-row items-center gap-1">
            <TaskAvatarStack memberIds={memberIds} maxVisible={3} size={20} />
            <TaskPriorityIndicator priority={priority} size={14} />
          </View>
          <Text
            className={`text-[10px] font-medium ${
              isOverdue ? 'text-red-600 dark:text-red-400' : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            Due: {formatTaskDate(dueDate)}
          </Text>
        </View>
      </View>

      <View className="pl-4">
        <TaskEffortTimeline
          totalTU={task.estimatedTimeUnits}
          velocityPerWeek={netVelocity}
          estimatedWeeks={estimatedWeeks}
          completed={task.tusExpended || 0}
          showProgressBar={true}
        />
      </View>
    </Pressable>
  );
}
