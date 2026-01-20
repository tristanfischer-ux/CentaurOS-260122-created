/**
 * TaskCardMedium - Tier 2
 * Expanded card with quick actions
 *
 * Shows: Effort breakdown, team names, quick status/progress controls
 * Does NOT show: Coordination cost (only in Full view)
 */

import { View, Text, Pressable, Modal, ScrollView } from 'react-native';
import { useState } from 'react';
import { X } from 'lucide-react-native';
import type { WorkPlan } from '@/lib/state/work-plan-store';
import { useOrganizationStore } from '@/lib/state/organization-store';
import {
  TaskStatusBadge,
  TaskProgressBar,
  TaskPriorityIndicator,
  TaskAvatarStack,
} from './index';
import {
  calculateNetVelocity,
  calculateEstimatedWeeks,
  calculateEstimatedDate,
  formatTaskDate,
} from '@/lib/task-calculations';

interface TaskCardMediumProps {
  task: WorkPlan;
  visible: boolean;
  onClose: () => void;
  onViewFullDetails: () => void;
  onUpdateStatus?: (status: WorkPlan['status']) => void;
  onUpdateProgress?: (progress: number) => void;
  onRescheduleDays?: (days: number) => void;
}

export function TaskCardMedium({
  task,
  visible,
  onClose,
  onViewFullDetails,
  onUpdateStatus,
  onUpdateProgress,
  onRescheduleDays,
}: TaskCardMediumProps) {
  const members = useOrganizationStore((s) => s.members);

  // Calculate effort metrics
  const rawVelocity = task.allocations.reduce((sum, a) => sum + a.squaresPerWeek, 0);
  const teamSize = task.allocations.length;
  const netVelocity = calculateNetVelocity(teamSize, rawVelocity);
  const completed = task.tusExpended || 0;
  const remaining = Math.max(0, task.estimatedTimeUnits - completed);
  const estimatedWeeks = calculateEstimatedWeeks(remaining, netVelocity);
  const estimatedDate = calculateEstimatedDate(new Date(), estimatedWeeks);

  // Check if overdue
  const dueDate = new Date(task.dueDate);
  const isOverdue = dueDate < new Date() && task.status !== 'completed';
  const daysOverdue = isOverdue
    ? Math.ceil((new Date().getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24))
    : 0;

  // Priority placeholder
  const priority: 'normal' | 'high' | 'critical' = 'normal';

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable className="flex-1 bg-black/70" onPress={onClose}>
        <View className="flex-1" />
        <Pressable onPress={(e) => e.stopPropagation()} style={{ maxHeight: '90%' }}>
          <ScrollView
            className="bg-white dark:bg-slate-900 rounded-t-3xl"
            contentContainerStyle={{ flexGrow: 1 }}
          >
            <View className="p-5 gap-4">
              {/* Header */}
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center gap-2">
                  <TaskStatusBadge status={task.status} size="small" />
                  <Text className="text-slate-500 dark:text-slate-400 text-xs">
                    {task.function}
                  </Text>
                </View>
                <Pressable onPress={onClose} className="p-1">
                  <X size={24} color="#64748B" />
                </Pressable>
              </View>

              {/* Title with avatars and priority */}
              <View className="flex-row items-start justify-between gap-2">
                <Text className="flex-1 text-slate-900 dark:text-white text-lg font-bold">
                  {task.title}
                </Text>
                <View className="flex-row items-center gap-2">
                  <TaskAvatarStack memberIds={task.allocations.map(a => a.memberId)} maxVisible={3} size={24} />
                  <TaskPriorityIndicator priority={priority} size={20} />
                </View>
              </View>

              {/* Due Date */}
              <View>
                <Text
                  className={`text-sm font-semibold ${
                    isOverdue ? 'text-red-600 dark:text-red-400' : 'text-slate-700 dark:text-slate-300'
                  }`}
                >
                  📅 {isOverdue ? `${daysOverdue} days overdue` : `Due ${formatTaskDate(dueDate)}`}
                </Text>
              </View>

              {/* Progress */}
              <View className="gap-2">
                <Text className="text-slate-900 dark:text-white text-sm font-semibold">Progress</Text>
                <TaskProgressBar
                  completed={completed}
                  total={task.estimatedTimeUnits}
                  showPercentage={true}
                />
              </View>

              {/* Effort Breakdown */}
              <View className="bg-slate-100 dark:bg-slate-800 rounded-lg p-3 gap-2">
                <Text className="text-slate-900 dark:text-white text-sm font-bold mb-1">
                  EFFORT BREAKDOWN
                </Text>
                <View className="flex-row justify-between">
                  <Text className="text-slate-600 dark:text-slate-400 text-xs">Total Required:</Text>
                  <Text className="text-slate-900 dark:text-white text-xs font-semibold">
                    {task.estimatedTimeUnits} TU
                  </Text>
                </View>
                <View className="flex-row justify-between">
                  <Text className="text-slate-600 dark:text-slate-400 text-xs">Completed:</Text>
                  <Text className="text-slate-900 dark:text-white text-xs font-semibold">
                    {completed} TU
                  </Text>
                </View>
                <View className="flex-row justify-between">
                  <Text className="text-slate-600 dark:text-slate-400 text-xs">Remaining:</Text>
                  <Text className="text-slate-900 dark:text-white text-xs font-semibold">
                    {remaining} TU
                  </Text>
                </View>
                <View className="h-px bg-slate-300 dark:bg-slate-600 my-1" />
                <View className="flex-row justify-between">
                  <Text className="text-slate-600 dark:text-slate-400 text-xs">Team Velocity:</Text>
                  <Text className="text-blue-600 dark:text-blue-400 text-xs font-semibold">
                    {netVelocity.toFixed(1)} TU/week
                  </Text>
                </View>
                <View className="flex-row justify-between">
                  <Text className="text-slate-600 dark:text-slate-400 text-xs">Est. Completion:</Text>
                  <Text className="text-slate-900 dark:text-white text-xs font-semibold">
                    ~{estimatedWeeks.toFixed(1)} weeks ({formatTaskDate(estimatedDate)})
                  </Text>
                </View>
              </View>

              {/* Team Preview */}
              <View className="gap-2">
                <Text className="text-slate-900 dark:text-white text-sm font-semibold">
                  Team ({teamSize} members)
                </Text>
                <View className="flex-row flex-wrap gap-2">
                  {task.allocations.slice(0, 3).map((allocation) => {
                    const member = members.find((m) => m.id === allocation.memberId);
                    if (!member) return null;
                    return (
                      <Text
                        key={allocation.memberId}
                        className="text-slate-600 dark:text-slate-400 text-xs"
                      >
                        👤 {member.name}
                      </Text>
                    );
                  })}
                  {teamSize > 3 && (
                    <Text className="text-slate-500 dark:text-slate-500 text-xs">
                      +{teamSize - 3} more
                    </Text>
                  )}
                </View>
              </View>

              {/* Quick Status Change */}
              {onUpdateStatus && (
                <View className="gap-2">
                  <Text className="text-slate-900 dark:text-white text-sm font-semibold">
                    Quick Status Change
                  </Text>
                  <View className="flex-row gap-2">
                    {(['not-started', 'in-progress', 'blocked', 'completed'] as const).map((status) => {
                      const labels = {
                        'not-started': 'Queue',
                        'in-progress': 'Start',
                        blocked: 'Block',
                        completed: 'Done',
                      };
                      return (
                        <Pressable
                          key={status}
                          onPress={() => onUpdateStatus(status)}
                          className="flex-1 bg-slate-200 dark:bg-slate-700 rounded-lg py-2 items-center active:opacity-70"
                        >
                          <Text className="text-slate-900 dark:text-white text-xs font-semibold">
                            {labels[status]}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </View>
              )}

              {/* Progress Adjustment */}
              {onUpdateProgress && (
                <View className="gap-2">
                  <Text className="text-slate-900 dark:text-white text-sm font-semibold">
                    Adjust Progress
                  </Text>
                  <View className="flex-row gap-2">
                    <Pressable
                      onPress={() => onUpdateProgress(Math.max(0, task.progress - 10))}
                      className="bg-slate-200 dark:bg-slate-700 rounded-lg px-3 py-2 active:opacity-70"
                    >
                      <Text className="text-slate-900 dark:text-white text-xs font-semibold">-10%</Text>
                    </Pressable>
                    {[25, 50, 75, 100].map((percent) => (
                      <Pressable
                        key={percent}
                        onPress={() => onUpdateProgress(percent)}
                        className="flex-1 bg-slate-200 dark:bg-slate-700 rounded-lg py-2 items-center active:opacity-70"
                      >
                        <Text className="text-slate-900 dark:text-white text-xs font-semibold">
                          {percent}%
                        </Text>
                      </Pressable>
                    ))}
                    <Pressable
                      onPress={() => onUpdateProgress(Math.min(100, task.progress + 10))}
                      className="bg-slate-200 dark:bg-slate-700 rounded-lg px-3 py-2 active:opacity-70"
                    >
                      <Text className="text-slate-900 dark:text-white text-xs font-semibold">+10%</Text>
                    </Pressable>
                  </View>
                </View>
              )}

              {/* Reschedule */}
              {onRescheduleDays && (
                <View className="gap-2">
                  <Text className="text-slate-900 dark:text-white text-sm font-semibold">
                    Reschedule Due Date
                  </Text>
                  <View className="flex-row gap-2">
                    <Pressable
                      onPress={() => onRescheduleDays(-7)}
                      className="flex-1 bg-slate-200 dark:bg-slate-700 rounded-lg py-2 items-center active:opacity-70"
                    >
                      <Text className="text-slate-900 dark:text-white text-xs font-semibold">-1 Wk</Text>
                    </Pressable>
                    <Pressable
                      onPress={() => onRescheduleDays(-1)}
                      className="flex-1 bg-slate-200 dark:bg-slate-700 rounded-lg py-2 items-center active:opacity-70"
                    >
                      <Text className="text-slate-900 dark:text-white text-xs font-semibold">-1 Day</Text>
                    </Pressable>
                    <Pressable
                      onPress={() => onRescheduleDays(0)}
                      className="flex-1 bg-slate-200 dark:bg-slate-700 rounded-lg py-2 items-center active:opacity-70"
                    >
                      <Text className="text-slate-900 dark:text-white text-xs font-semibold">↺</Text>
                    </Pressable>
                    <Pressable
                      onPress={() => onRescheduleDays(1)}
                      className="flex-1 bg-slate-200 dark:bg-slate-700 rounded-lg py-2 items-center active:opacity-70"
                    >
                      <Text className="text-slate-900 dark:text-white text-xs font-semibold">+1 Day</Text>
                    </Pressable>
                    <Pressable
                      onPress={() => onRescheduleDays(7)}
                      className="flex-1 bg-slate-200 dark:bg-slate-700 rounded-lg py-2 items-center active:opacity-70"
                    >
                      <Text className="text-slate-900 dark:text-white text-xs font-semibold">+1 Wk</Text>
                    </Pressable>
                  </View>
                </View>
              )}

              {/* View Full Details Button */}
              <Pressable
                onPress={onViewFullDetails}
                className="bg-blue-500 rounded-lg py-3 items-center active:opacity-70 mt-2"
              >
                <Text className="text-white text-sm font-bold">View Full Details</Text>
              </Pressable>
            </View>
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
