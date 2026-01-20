/**
 * TaskCardMedium - Tier 2 (Modal Version)
 *
 * Bottom sheet modal for quick task actions.
 * Same content as inline but in modal form.
 */

import { View, Text, Pressable, Modal, TextInput } from 'react-native';
import { useState } from 'react';
import {
  X,
  Play,
  Pause,
  CheckCircle2,
  AlertTriangle,
  ChevronRight,
} from 'lucide-react-native';
import type { WorkPlan } from '@/lib/state/work-plan-store';
import type { PriorityLevel } from '@/lib/ai-priority-scoring';
import { HapticPressable } from '@/components/HapticPressable';
import {
  TaskStatusDot,
  TaskProgressBar,
  TaskAvatarStack,
  TaskEffortTimeline,
} from './index';
import {
  calculateNetVelocity,
  calculateEstimatedWeeks,
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
  const [editingDescription, setEditingDescription] = useState(false);
  const [localDescription, setLocalDescription] = useState(task.description);

  // Calculate effort metrics
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

  const statusConfig = {
    'not-started': { icon: Pause, color: '#6b7280', label: 'Queue' },
    'in-progress': { icon: Play, color: '#3b82f6', label: 'Active' },
    blocked: { icon: AlertTriangle, color: '#ef4444', label: 'Blocked' },
    completed: { icon: CheckCircle2, color: '#10b981', label: 'Done' },
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable className="flex-1 bg-black/50" onPress={onClose}>
        <View className="flex-1" />
        <Pressable onPress={(e) => e.stopPropagation()}>
          <View
            className="bg-white dark:bg-slate-800 rounded-t-2xl overflow-hidden"
            style={
              priorityBorderColor
                ? { borderLeftWidth: 4, borderLeftColor: priorityBorderColor }
                : undefined
            }
          >
            <View className="p-4">
              {/* Header */}
              <View className="flex-row items-start justify-between mb-3">
                <View className="flex-1 mr-3">
                  <View className="flex-row items-center gap-2 mb-1">
                    <TaskStatusDot status={task.status} size={8} />
                    <Text className="text-slate-500 dark:text-slate-400 text-xs">
                      {task.function}
                    </Text>
                  </View>
                  <Text className="text-slate-900 dark:text-white font-semibold text-base" numberOfLines={2}>
                    {task.title}
                  </Text>
                </View>
                <HapticPressable onPress={onClose} className="w-8 h-8 items-center justify-center">
                  <X size={20} color="#64748B" />
                </HapticPressable>
              </View>

              {/* Task Info Row */}
              <View className="flex-row items-center justify-between mb-3 pb-3 border-b border-slate-100 dark:border-slate-700">
                <View className="flex-row items-center gap-3">
                  <TaskAvatarStack memberIds={memberIds} maxVisible={3} size={22} />
                  <TaskEffortTimeline
                    totalTU={task.estimatedTimeUnits}
                    velocityPerWeek={netVelocity}
                    estimatedWeeks={estimatedWeeks}
                    completed={completed}
                    showProgressBar={false}
                  />
                </View>
                <Text
                  className={`text-xs font-medium ${
                    isOverdue ? 'text-red-600 dark:text-red-400' : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  {formatTaskDate(dueDate)}
                </Text>
              </View>

              {/* Progress Bar */}
              <View className="mb-3">
                <TaskProgressBar
                  completed={completed}
                  total={task.estimatedTimeUnits}
                  showPercentage={true}
                  variant="thin"
                />
              </View>

              {/* Quick Status Row */}
              {onUpdateStatus && (
                <View className="flex-row gap-1.5 mb-3">
                  {(['not-started', 'in-progress', 'blocked', 'completed'] as const).map((status) => {
                    const isActive = task.status === status;
                    const { icon: Icon, color, label } = statusConfig[status];

                    return (
                      <HapticPressable
                        key={status}
                        onPress={() => onUpdateStatus(status)}
                        className="flex-1 flex-row items-center justify-center gap-1 py-2 rounded-md"
                        style={{
                          backgroundColor: isActive ? color + '15' : '#f1f5f9',
                          borderWidth: isActive ? 1 : 0,
                          borderColor: color,
                        }}
                      >
                        <Icon size={12} color={isActive ? color : '#9ca3af'} />
                        <Text
                          className="text-[10px] font-semibold"
                          style={{ color: isActive ? color : '#9ca3af' }}
                        >
                          {label}
                        </Text>
                      </HapticPressable>
                    );
                  })}
                </View>
              )}

              {/* Progress + Reschedule Row */}
              <View className="flex-row gap-2 mb-3">
                {onUpdateProgress && (
                  <View className="flex-1">
                    <Text className="text-[10px] font-medium text-slate-500 dark:text-slate-400 mb-1">
                      Progress
                    </Text>
                    <View className="flex-row gap-1">
                      {[25, 50, 75, 100].map((preset) => (
                        <HapticPressable
                          key={preset}
                          onPress={() => onUpdateProgress(preset)}
                          className="flex-1 py-1.5 rounded items-center"
                          style={{
                            backgroundColor: task.progress === preset ? '#3b82f6' : '#f1f5f9',
                          }}
                        >
                          <Text
                            className={`text-[10px] font-semibold ${
                              task.progress === preset ? 'text-white' : 'text-slate-600'
                            }`}
                          >
                            {preset}%
                          </Text>
                        </HapticPressable>
                      ))}
                    </View>
                  </View>
                )}

                {onRescheduleDays && (
                  <View className="flex-1">
                    <Text className="text-[10px] font-medium text-slate-500 dark:text-slate-400 mb-1">
                      Reschedule
                    </Text>
                    <View className="flex-row gap-1">
                      {[
                        { days: 1, label: '+1d' },
                        { days: 3, label: '+3d' },
                        { days: 7, label: '+1w' },
                      ].map(({ days, label }) => (
                        <HapticPressable
                          key={days}
                          onPress={() => onRescheduleDays(days)}
                          className="flex-1 py-1.5 bg-slate-100 dark:bg-slate-700 rounded items-center"
                        >
                          <Text className="text-slate-700 dark:text-slate-300 text-[10px] font-semibold">
                            {label}
                          </Text>
                        </HapticPressable>
                      ))}
                    </View>
                  </View>
                )}
              </View>

              {/* Description */}
              {editingDescription ? (
                <TextInput
                  value={localDescription}
                  onChangeText={setLocalDescription}
                  onBlur={() => {
                    setEditingDescription(false);
                    if (onUpdateDescription && localDescription !== task.description) {
                      onUpdateDescription(localDescription);
                    }
                  }}
                  autoFocus
                  multiline
                  numberOfLines={2}
                  className="text-slate-900 dark:text-white text-xs bg-slate-100 dark:bg-slate-700 rounded-md px-2.5 py-2 mb-3"
                  placeholder="Add notes..."
                  placeholderTextColor="#94a3b8"
                />
              ) : (
                <Pressable
                  onPress={() => setEditingDescription(true)}
                  className="bg-slate-50 dark:bg-slate-700/50 rounded-md px-2.5 py-2 mb-3"
                >
                  <Text
                    className="text-slate-600 dark:text-slate-400 text-xs"
                    numberOfLines={2}
                  >
                    {task.description || 'Tap to add notes...'}
                  </Text>
                </Pressable>
              )}

              {/* Footer: View Full Details */}
              <HapticPressable
                onPress={onViewFullDetails}
                className="flex-row items-center justify-center gap-1.5 bg-blue-500 rounded-lg py-3"
              >
                <Text className="text-white font-semibold text-sm">Full Details</Text>
                <ChevronRight size={16} color="#ffffff" />
              </HapticPressable>
            </View>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
