/**
 * TaskCardMediumInline - Tier 2 (Inline Expansion)
 *
 * Appears DIRECTLY below TaskCardCompact as a connected expansion.
 * Shows ONLY new information not in Compact view:
 * - Description (editable)
 * - Status/Progress/Reschedule quick actions
 * - "View Full Details" button
 *
 * NO duplicate: title, due date, progress bar, effort timeline
 */

import { View, Text, Pressable } from 'react-native';
import { ChevronUp } from 'lucide-react-native';
import Animated, { SlideInDown, SlideOutUp } from 'react-native-reanimated';
import type { WorkPlan } from '@/lib/state/work-plan-store';
import type { PriorityLevel } from '@/lib/ai-priority-scoring';
import { TaskQuickActions } from './TaskQuickActions';

interface TaskCardMediumInlineProps {
  task: WorkPlan;
  onClose: () => void;
  onViewFullDetails: () => void;
  onUpdateStatus?: (status: WorkPlan['status']) => void;
  onUpdateProgress?: (progress: number) => void;
  onRescheduleDays?: (days: number) => void;
  onUpdateDescription?: (description: string) => void;
  priorityLevel?: PriorityLevel;
  priorityReasoning?: string;
}

export function TaskCardMediumInline({
  task,
  onClose,
  onViewFullDetails,
  onUpdateStatus,
  onUpdateProgress,
  onRescheduleDays,
  onUpdateDescription,
  priorityLevel,
  priorityReasoning,
}: TaskCardMediumInlineProps) {
  // Priority border color (matches Compact card)
  const priorityBorderColor = priorityLevel
    ? priorityLevel === 'critical'
      ? '#ef4444'
      : priorityLevel === 'high'
      ? '#f59e0b'
      : priorityLevel === 'important'
      ? '#3b82f6'
      : '#e2e8f0'
    : '#e2e8f0';

  return (
    <Animated.View
      entering={SlideInDown.duration(200)}
      exiting={SlideOutUp.duration(150)}
      className="bg-white dark:bg-slate-800 border border-t-0 border-slate-200 dark:border-slate-700 rounded-b-lg mb-2 overflow-hidden"
      style={{
        borderLeftWidth: priorityLevel ? 4 : 1,
        borderLeftColor: priorityBorderColor,
      }}
    >
      {/* Separator line */}
      <View className="h-px bg-slate-200 dark:bg-slate-700 mx-3" />

      <View className="p-3 gap-3">
        {/* AI Priority Reasoning (if provided) */}
        {priorityReasoning && (
          <View className="bg-purple-50 dark:bg-purple-900/20 rounded px-3 py-2">
            <Text className="text-purple-700 dark:text-purple-300 text-[10px]">
              AI: {priorityReasoning}
            </Text>
          </View>
        )}

        {/* Quick Actions */}
        <TaskQuickActions
          task={task}
          onUpdateStatus={onUpdateStatus}
          onUpdateProgress={onUpdateProgress}
          onRescheduleDays={onRescheduleDays}
          onUpdateDescription={onUpdateDescription}
          onViewFullDetails={onViewFullDetails}
          showDescription={true}
        />

        {/* Collapse indicator */}
        <Pressable
          onPress={onClose}
          className="flex-row items-center justify-center gap-1 py-1 active:opacity-70"
        >
          <ChevronUp size={14} color="#94a3b8" />
          <Text className="text-slate-400 dark:text-slate-500 text-[10px] font-medium">
            tap to collapse
          </Text>
        </Pressable>
      </View>
    </Animated.View>
  );
}
