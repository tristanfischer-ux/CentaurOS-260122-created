/**
 * TaskCardMedium - Tier 2 (Modal Version)
 *
 * Bottom sheet modal with same content as inline version.
 * Includes Compact-equivalent header at top (since no Compact card above).
 *
 * Shows: Header with status/title/avatars, effort timeline, progress bar,
 * then quick actions (description, status, progress, reschedule)
 */

import { View, Text, Pressable, Modal, ScrollView } from 'react-native';
import { X } from 'lucide-react-native';
import type { WorkPlan } from '@/lib/state/work-plan-store';
import type { PriorityLevel } from '@/lib/ai-priority-scoring';
import {
  TaskStatusBadge,
  TaskProgressBar,
  TaskPriorityIndicator,
  TaskAvatarStack,
  TaskEffortTimeline,
  TaskQuickActions,
} from './index';
import {
  calculateNetVelocity,
  calculateEstimatedWeeks,
  formatTaskDate,
} from '@/lib/task-calculations';

// Standardized typography (matches Compact)
const TYPOGRAPHY = {
  title: 'text-sm font-semibold text-slate-900 dark:text-white',
  smallValue: 'text-[10px] font-medium',
  label: 'text-xs font-medium text-slate-500 dark:text-slate-400',
};

interface TaskCardMediumProps {
  task: WorkPlan;
  visible: boolean;
  onClose: () => void;
  onViewFullDetails: () => void;
  onUpdateStatus?: (status: WorkPlan['status']) => void;
  onUpdateProgress?: (progress: number) => void;
  onRescheduleDays?: (days: number) => void;
  onUpdateDescription?: (description: string) => void;
  priorityLevel?: PriorityLevel;
}

export function TaskCardMedium({
  task,
  visible,
  onClose,
  onViewFullDetails,
  onUpdateStatus,
  onUpdateProgress,
  onRescheduleDays,
  onUpdateDescription,
  priorityLevel,
}: TaskCardMediumProps) {
  // Calculate effort metrics (same as Compact)
  const rawVelocity = task.allocations.reduce((sum, a) => sum + a.squaresPerWeek, 0);
  const teamSize = task.allocations.length;
  const netVelocity = calculateNetVelocity(teamSize, rawVelocity);
  const completed = task.tusExpended || 0;
  const remaining = Math.max(0, task.estimatedTimeUnits - completed);
  const estimatedWeeks = calculateEstimatedWeeks(remaining, netVelocity);

  // Get member IDs for avatars
  const memberIds = task.allocations.map((a) => a.memberId);

  // Check if overdue
  const dueDate = new Date(task.dueDate);
  const isOverdue = dueDate < new Date() && task.status !== 'completed';

  // Priority placeholder
  const priority: 'normal' | 'high' | 'critical' = 'normal';

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
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable className="flex-1 bg-black/50" onPress={onClose}>
        <View className="flex-1" />
        <Pressable onPress={(e) => e.stopPropagation()} style={{ maxHeight: '85%' }}>
          <ScrollView
            className="bg-white dark:bg-slate-800 rounded-t-2xl"
            contentContainerStyle={{ flexGrow: 1 }}
            style={
              priorityBorderColor
                ? { borderLeftWidth: 4, borderLeftColor: priorityBorderColor }
                : undefined
            }
          >
            <View className="p-4">
              {/* Header with close button */}
              <View className="flex-row items-center justify-between mb-3">
                <View className="flex-row items-center gap-2">
                  <TaskStatusBadge status={task.status} size="small" />
                  <Text className={TYPOGRAPHY.label}>{task.function}</Text>
                </View>
                <Pressable onPress={onClose} className="p-1 -mr-1">
                  <X size={20} color="#64748B" />
                </Pressable>
              </View>

              {/* Compact-equivalent content */}
              <View className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-3 mb-3">
                {/* Line 1: Title, Avatars, Priority */}
                <View className="flex-row items-center gap-2">
                  <Text className={TYPOGRAPHY.title} numberOfLines={2} style={{ flex: 1 }}>
                    {task.title}
                  </Text>
                  <View className="flex-row items-center gap-2">
                    <TaskAvatarStack memberIds={memberIds} maxVisible={3} size={20} />
                    <TaskPriorityIndicator priority={priority} size={14} />
                  </View>
                </View>

                {/* Line 2: Effort timeline, Due date */}
                <View className="mt-2 flex-row items-center justify-between gap-2">
                  <TaskEffortTimeline
                    totalTU={task.estimatedTimeUnits}
                    velocityPerWeek={netVelocity}
                    estimatedWeeks={estimatedWeeks}
                    completed={completed}
                    showProgressBar={false}
                  />
                  <Text
                    className={`${TYPOGRAPHY.smallValue} ${
                      isOverdue ? 'text-red-600 dark:text-red-400' : 'text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    Due {formatTaskDate(dueDate)}
                  </Text>
                </View>

                {/* Line 3: Progress bar */}
                <View className="mt-2">
                  <TaskProgressBar
                    completed={completed}
                    total={task.estimatedTimeUnits}
                    showPercentage={false}
                    variant="thin"
                  />
                </View>
              </View>

              {/* Separator */}
              <View className="h-px bg-slate-200 dark:bg-slate-700 mb-3" />

              {/* Quick Actions (same as inline version) */}
              <TaskQuickActions
                task={task}
                onUpdateStatus={onUpdateStatus}
                onUpdateProgress={onUpdateProgress}
                onRescheduleDays={onRescheduleDays}
                onUpdateDescription={onUpdateDescription}
                onViewFullDetails={onViewFullDetails}
                showDescription={true}
              />
            </View>
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
