/**
 * TaskQuickActions - Shared Quick Action Controls
 *
 * Reusable component for status, progress, and reschedule buttons
 * Used by both TaskCardMediumInline (Home) and TaskCardMedium (Tasks modal)
 */

import { View, Text, Pressable, TextInput } from 'react-native';
import { useState } from 'react';
import { Play, CheckCircle2, AlertTriangle, Clock, Minus, Plus, Edit3 } from 'lucide-react-native';
import type { WorkPlan } from '@/lib/state/work-plan-store';

// Standardized typography
const TYPOGRAPHY = {
  label: 'text-xs font-medium text-slate-500 dark:text-slate-400',
  value: 'text-xs font-semibold text-slate-900 dark:text-white',
  button: 'text-xs font-semibold',
};

interface TaskQuickActionsProps {
  task: WorkPlan;
  onUpdateStatus?: (status: WorkPlan['status']) => void;
  onUpdateProgress?: (progress: number) => void;
  onRescheduleDays?: (days: number) => void;
  onUpdateDescription?: (description: string) => void;
  onViewFullDetails: () => void;
  showDescription?: boolean;
}

export function TaskQuickActions({
  task,
  onUpdateStatus,
  onUpdateProgress,
  onRescheduleDays,
  onUpdateDescription,
  onViewFullDetails,
  showDescription = true,
}: TaskQuickActionsProps) {
  const [editingDescription, setEditingDescription] = useState(false);
  const [localDescription, setLocalDescription] = useState(task.description);

  return (
    <View className="gap-3">
      {/* Description - EDITABLE */}
      {showDescription && (
        <View className="gap-1">
          <Text className={TYPOGRAPHY.label}>Description</Text>
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
              className="text-slate-900 dark:text-white text-xs bg-slate-100 dark:bg-slate-700 rounded px-3 py-2"
              placeholder="Add description..."
            />
          ) : (
            <Pressable
              onPress={() => setEditingDescription(true)}
              className="flex-row items-start gap-2 bg-slate-50 dark:bg-slate-700/50 rounded px-3 py-2"
            >
              <Text
                className="flex-1 text-slate-600 dark:text-slate-400 text-xs"
                numberOfLines={2}
              >
                {task.description || 'Tap to add description...'}
              </Text>
              <Edit3 size={12} color="#94A3B8" />
            </Pressable>
          )}
        </View>
      )}

      {/* Status Selector */}
      {onUpdateStatus && (
        <View className="gap-1">
          <Text className={TYPOGRAPHY.label}>Status</Text>
          <View className="flex-row gap-2">
            {(['not-started', 'in-progress', 'blocked', 'completed'] as const).map((status) => {
              const isActive = task.status === status;
              const config = {
                'not-started': { Icon: Clock, color: '#6b7280', label: 'Queue' },
                'in-progress': { Icon: Play, color: '#3b82f6', label: 'Start' },
                'blocked': { Icon: AlertTriangle, color: '#ef4444', label: 'Block' },
                'completed': { Icon: CheckCircle2, color: '#10b981', label: 'Done' },
              };
              const { Icon, color, label } = config[status];

              return (
                <Pressable
                  key={status}
                  onPress={() => onUpdateStatus(status)}
                  className="flex-1 py-2 rounded-lg items-center justify-center active:opacity-80"
                  style={{
                    backgroundColor: isActive ? color + '20' : '#f1f5f9',
                    borderWidth: isActive ? 1.5 : 0,
                    borderColor: color,
                  }}
                >
                  <Icon size={14} color={isActive ? color : '#9ca3af'} />
                  <Text
                    className={`text-[10px] font-medium mt-0.5`}
                    style={{ color: isActive ? color : '#9ca3af' }}
                  >
                    {label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      )}

      {/* Progress Controls */}
      {onUpdateProgress && (
        <View className="gap-1">
          <Text className={TYPOGRAPHY.label}>Progress</Text>
          <View className="flex-row items-center justify-between gap-1">
            <Pressable
              onPress={() => onUpdateProgress(Math.max(0, task.progress - 10))}
              className="w-8 h-8 bg-slate-100 dark:bg-slate-700 rounded items-center justify-center active:opacity-70"
            >
              <Minus size={14} color="#64748b" />
            </Pressable>
            {[25, 50, 75, 100].map((preset) => (
              <Pressable
                key={preset}
                onPress={() => onUpdateProgress(preset)}
                className="flex-1 h-8 rounded items-center justify-center active:opacity-70"
                style={{
                  backgroundColor: task.progress === preset ? '#3b82f6' : '#f1f5f9',
                }}
              >
                <Text
                  className={`text-[10px] font-semibold ${
                    task.progress === preset ? 'text-white' : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  {preset}%
                </Text>
              </Pressable>
            ))}
            <Pressable
              onPress={() => onUpdateProgress(Math.min(100, task.progress + 10))}
              className="w-8 h-8 bg-slate-100 dark:bg-slate-700 rounded items-center justify-center active:opacity-70"
            >
              <Plus size={14} color="#64748b" />
            </Pressable>
          </View>
        </View>
      )}

      {/* Reschedule */}
      {onRescheduleDays && (
        <View className="gap-1">
          <Text className={TYPOGRAPHY.label}>Reschedule</Text>
          <View className="flex-row gap-2">
            {[
              { days: -7, label: '-1 Wk' },
              { days: -1, label: '-1 Day' },
              { days: 1, label: '+1 Day' },
              { days: 7, label: '+1 Wk' },
            ].map(({ days, label }) => (
              <Pressable
                key={days}
                onPress={() => onRescheduleDays(days)}
                className="flex-1 py-2 bg-slate-100 dark:bg-slate-700 rounded items-center active:opacity-70"
              >
                <Text className="text-slate-700 dark:text-slate-300 text-[10px] font-semibold">
                  {label}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
      )}

      {/* View Full Details Button */}
      <Pressable
        onPress={onViewFullDetails}
        className="bg-blue-500 dark:bg-blue-600 rounded-lg py-3 items-center active:opacity-80 mt-1"
      >
        <Text className="text-white font-semibold text-xs">
          View Full Details & Coordination Cost
        </Text>
      </Pressable>
    </View>
  );
}
