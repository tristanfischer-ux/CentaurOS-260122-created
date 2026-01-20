/**
 * TaskCardMediumInline - Tier 2 (Inline Expansion)
 * Expanded card with quick actions that appears inline, not as modal
 *
 * Shows: Effort breakdown, team names, quick status/progress controls
 * Does NOT show: Coordination cost (only in Full view)
 *
 * Used on Home screen for dropdown expansion behavior
 */

import { View, Text, Pressable, ScrollView, TextInput } from 'react-native';
import { useState } from 'react';
import { ChevronDown, Edit3, Play, CheckCircle2, AlertTriangle, Clock, Minus, Plus } from 'lucide-react-native';
import Animated, { FadeIn, FadeOut, SlideInDown, SlideOutUp } from 'react-native-reanimated';
import type { WorkPlan } from '@/lib/state/work-plan-store';
import type { PriorityLevel } from '@/lib/ai-priority-scoring';
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

interface TaskCardMediumInlineProps {
  task: WorkPlan;
  onClose: () => void;
  onViewFullDetails: () => void;
  onUpdateStatus?: (status: WorkPlan['status']) => void;
  onUpdateProgress?: (progress: number) => void;
  onRescheduleDays?: (days: number) => void;
  onUpdateTitle?: (title: string) => void;
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
  onUpdateTitle,
  onUpdateDescription,
  priorityLevel,
  priorityReasoning,
}: TaskCardMediumInlineProps) {
  const members = useOrganizationStore((s) => s.members);

  // Local editing state
  const [editingTitle, setEditingTitle] = useState(false);
  const [editingDescription, setEditingDescription] = useState(false);
  const [localTitle, setLocalTitle] = useState(task.title);
  const [localDescription, setLocalDescription] = useState(task.description);

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
    <Animated.View
      entering={SlideInDown.springify()}
      exiting={SlideOutUp.springify()}
      className="bg-slate-50 dark:bg-slate-800 border-l-4 border-slate-300 dark:border-slate-600 mx-3 mb-2 rounded-lg overflow-hidden"
      style={{
        borderLeftColor: priorityLevel === 'critical' ? '#ef4444' : priorityLevel === 'high' ? '#f59e0b' : priorityLevel === 'important' ? '#3b82f6' : '#64748b',
      }}
    >
      <View className="p-4 gap-3">
        {/* Collapse button */}
        <Pressable onPress={onClose} className="flex-row items-center justify-between mb-2">
          <Text className="text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase">
            Quick Actions
          </Text>
          <ChevronDown size={16} color="#64748b" />
        </Pressable>

        {/* AI Priority Reasoning (if provided) */}
        {priorityReasoning && (
          <View className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-2 mb-1">
            <Text className="text-blue-700 dark:text-blue-300 text-xs">
              🤖 {priorityReasoning}
            </Text>
          </View>
        )}

        {/* Title - EDITABLE */}
        <View className="flex-row items-start justify-between gap-2">
          {editingTitle ? (
            <TextInput
              value={localTitle}
              onChangeText={setLocalTitle}
              onBlur={() => {
                setEditingTitle(false);
                if (onUpdateTitle && localTitle !== task.title) {
                  onUpdateTitle(localTitle);
                }
              }}
              autoFocus
              className="flex-1 text-slate-900 dark:text-white text-base font-bold bg-white dark:bg-slate-700 rounded px-2 py-1"
            />
          ) : (
            <Pressable onPress={() => setEditingTitle(true)} className="flex-1 flex-row items-center gap-2">
              <Text className="flex-1 text-slate-900 dark:text-white text-base font-bold">
                {task.title}
              </Text>
              <Edit3 size={14} color="#94A3B8" />
            </Pressable>
          )}
        </View>

        {/* Description - EDITABLE */}
        <View className="gap-1">
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
              className="text-slate-900 dark:text-white text-sm bg-white dark:bg-slate-700 rounded px-3 py-2"
              placeholder="Add description..."
            />
          ) : (
            <Pressable onPress={() => setEditingDescription(true)} className="flex-row items-start gap-2">
              <Text className="flex-1 text-slate-600 dark:text-slate-400 text-sm" numberOfLines={2}>
                {task.description || 'Tap to add description...'}
              </Text>
              <Edit3 size={12} color="#94A3B8" />
            </Pressable>
          )}
        </View>

        {/* Due Date */}
        <View>
          <Text
            className={`text-xs font-semibold ${
              isOverdue ? 'text-red-600 dark:text-red-400' : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            📅 {isOverdue ? `${daysOverdue} days overdue` : `Due ${formatTaskDate(dueDate)}`}
          </Text>
        </View>

        {/* Progress */}
        <View className="gap-2">
          <Text className="text-slate-900 dark:text-white text-xs font-semibold">Progress</Text>
          <TaskProgressBar
            completed={completed}
            total={task.estimatedTimeUnits}
            showPercentage={true}
          />
          {onUpdateProgress && (
            <View className="flex-row items-center justify-center gap-3">
              <Pressable
                onPress={() => onUpdateProgress(Math.max(0, task.progress - 10))}
                className="w-10 h-10 bg-slate-200 dark:bg-slate-700 rounded-lg items-center justify-center active:opacity-70"
              >
                <Minus size={16} color="#64748b" />
              </Pressable>
              {[25, 50, 75, 100].map((preset) => (
                <Pressable
                  key={preset}
                  onPress={() => onUpdateProgress(preset)}
                  className={`px-2 py-1 rounded ${
                    task.progress === preset
                      ? 'bg-blue-500 dark:bg-blue-600'
                      : 'bg-slate-200 dark:bg-slate-700'
                  } active:opacity-70`}
                >
                  <Text
                    className={`text-xs font-semibold ${
                      task.progress === preset
                        ? 'text-white'
                        : 'text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    {preset}%
                  </Text>
                </Pressable>
              ))}
              <Pressable
                onPress={() => onUpdateProgress(Math.min(100, task.progress + 10))}
                className="w-10 h-10 bg-slate-200 dark:bg-slate-700 rounded-lg items-center justify-center active:opacity-70"
              >
                <Plus size={16} color="#64748b" />
              </Pressable>
            </View>
          )}
        </View>

        {/* Status Selector */}
        {onUpdateStatus && (
          <View className="gap-2">
            <Text className="text-slate-900 dark:text-white text-xs font-semibold">Status</Text>
            <View className="flex-row gap-2">
              {(['not-started', 'in-progress', 'blocked', 'completed'] as const).map((status) => {
                const isActive = task.status === status;
                const icons = {
                  'not-started': Clock,
                  'in-progress': Play,
                  'blocked': AlertTriangle,
                  'completed': CheckCircle2,
                };
                const colors = {
                  'not-started': '#6b7280',
                  'in-progress': '#3b82f6',
                  'blocked': '#ef4444',
                  'completed': '#10b981',
                };
                const Icon = icons[status];
                const color = colors[status];

                return (
                  <Pressable
                    key={status}
                    onPress={() => onUpdateStatus(status)}
                    className={`flex-1 py-2 rounded-lg items-center justify-center ${
                      isActive ? '' : 'opacity-60'
                    } active:opacity-80`}
                    style={{
                      backgroundColor: isActive ? color + '20' : '#f3f4f6',
                      borderWidth: isActive ? 2 : 0,
                      borderColor: color,
                    }}
                  >
                    <Icon size={16} color={isActive ? color : '#9ca3af'} />
                  </Pressable>
                );
              })}
            </View>
          </View>
        )}

        {/* Reschedule */}
        {onRescheduleDays && (
          <View className="gap-2">
            <Text className="text-slate-900 dark:text-white text-xs font-semibold">Reschedule</Text>
            <View className="flex-row items-center justify-center gap-2">
              <Pressable
                onPress={() => onRescheduleDays(-7)}
                className="flex-1 py-2 bg-slate-200 dark:bg-slate-700 rounded-lg items-center active:opacity-70"
              >
                <Text className="text-slate-700 dark:text-slate-300 text-xs font-semibold">-1 Week</Text>
              </Pressable>
              <Pressable
                onPress={() => onRescheduleDays(-1)}
                className="flex-1 py-2 bg-slate-200 dark:bg-slate-700 rounded-lg items-center active:opacity-70"
              >
                <Text className="text-slate-700 dark:text-slate-300 text-xs font-semibold">-1 Day</Text>
              </Pressable>
              <Pressable
                onPress={() => onRescheduleDays(1)}
                className="flex-1 py-2 bg-slate-200 dark:bg-slate-700 rounded-lg items-center active:opacity-70"
              >
                <Text className="text-slate-700 dark:text-slate-300 text-xs font-semibold">+1 Day</Text>
              </Pressable>
              <Pressable
                onPress={() => onRescheduleDays(7)}
                className="flex-1 py-2 bg-slate-200 dark:bg-slate-700 rounded-lg items-center active:opacity-70"
              >
                <Text className="text-slate-700 dark:text-slate-300 text-xs font-semibold">+1 Week</Text>
              </Pressable>
            </View>
          </View>
        )}

        {/* Effort Summary - Compact */}
        <View className="bg-white dark:bg-slate-700 rounded-lg p-3 gap-1">
          <View className="flex-row justify-between">
            <Text className="text-slate-600 dark:text-slate-400 text-xs">Total / Completed:</Text>
            <Text className="text-slate-900 dark:text-white text-xs font-semibold">
              {task.estimatedTimeUnits} / {completed} TU
            </Text>
          </View>
          <View className="flex-row justify-between">
            <Text className="text-slate-600 dark:text-slate-400 text-xs">Net Velocity:</Text>
            <Text className="text-slate-900 dark:text-white text-xs font-semibold">
              {netVelocity.toFixed(1)} TU/wk
            </Text>
          </View>
          <View className="flex-row justify-between">
            <Text className="text-slate-600 dark:text-slate-400 text-xs">Est. Completion:</Text>
            <Text className="text-slate-900 dark:text-white text-xs font-semibold">
              ~{estimatedWeeks.toFixed(1)} wks
            </Text>
          </View>
        </View>

        {/* View Full Details Button */}
        <Pressable
          onPress={onViewFullDetails}
          className="bg-blue-500 dark:bg-blue-600 rounded-lg py-3 items-center active:opacity-80"
        >
          <Text className="text-white font-semibold text-sm">
            View Full Details & Coordination Cost
          </Text>
        </Pressable>
      </View>
    </Animated.View>
  );
}
