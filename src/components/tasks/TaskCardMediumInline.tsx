/**
 * TaskCardMediumInline - Tier 2 (Inline Expansion)
 *
 * Connected dropdown expansion from Compact card.
 * Compact design - shows quick actions without wasting space.
 */

import { View, Text, Pressable, TextInput } from 'react-native';
import { useState } from 'react';
import {
  Play,
  Pause,
  CheckCircle2,
  AlertTriangle,
  ChevronUp,
  ChevronRight,
  CalendarClock,
} from 'lucide-react-native';
import Animated, { SlideInDown, SlideOutUp } from 'react-native-reanimated';
import type { WorkPlan } from '@/lib/state/work-plan-store';
import type { PriorityLevel } from '@/lib/ai-priority-scoring';
import { HapticPressable } from '@/components/HapticPressable';

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
  const [editingDescription, setEditingDescription] = useState(false);
  const [localDescription, setLocalDescription] = useState(task.description);

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

  const statusConfig = {
    'not-started': { icon: Pause, color: '#6b7280', label: 'Queue' },
    'in-progress': { icon: Play, color: '#3b82f6', label: 'Active' },
    blocked: { icon: AlertTriangle, color: '#ef4444', label: 'Blocked' },
    completed: { icon: CheckCircle2, color: '#10b981', label: 'Done' },
  };

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
      <View className="p-3">
        {/* AI Priority insight (compact) */}
        {priorityReasoning && (
          <View className="bg-purple-50 dark:bg-purple-900/30 rounded-md px-2.5 py-1.5 mb-2.5">
            <Text className="text-purple-700 dark:text-purple-300 text-[11px] leading-tight">
              {priorityReasoning}
            </Text>
          </View>
        )}

        {/* Quick Status Row - Horizontal compact buttons */}
        {onUpdateStatus && (
          <View className="flex-row gap-1.5 mb-2.5">
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

        {/* Progress + Reschedule Row - Side by side */}
        <View className="flex-row gap-2 mb-2.5">
          {/* Progress Quick Set */}
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

          {/* Reschedule Quick Set */}
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

        {/* Description - Inline editable, compact */}
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
            className="text-slate-900 dark:text-white text-xs bg-slate-100 dark:bg-slate-700 rounded-md px-2.5 py-2 mb-2.5"
            placeholder="Add notes..."
            placeholderTextColor="#94a3b8"
          />
        ) : (
          <Pressable
            onPress={() => setEditingDescription(true)}
            className="bg-slate-50 dark:bg-slate-700/50 rounded-md px-2.5 py-2 mb-2.5"
          >
            <Text
              className="text-slate-600 dark:text-slate-400 text-xs"
              numberOfLines={2}
            >
              {task.description || 'Tap to add notes...'}
            </Text>
          </Pressable>
        )}

        {/* Footer: View Details + Collapse */}
        <View className="flex-row items-center gap-2">
          <HapticPressable
            onPress={onViewFullDetails}
            className="flex-1 flex-row items-center justify-center gap-1.5 bg-blue-500 rounded-md py-2"
          >
            <Text className="text-white font-semibold text-xs">Full Details</Text>
            <ChevronRight size={14} color="#ffffff" />
          </HapticPressable>

          <HapticPressable
            onPress={onClose}
            className="w-10 h-8 items-center justify-center bg-slate-100 dark:bg-slate-700 rounded-md"
          >
            <ChevronUp size={16} color="#64748b" />
          </HapticPressable>
        </View>
      </View>
    </Animated.View>
  );
}
