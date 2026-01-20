/**
 * Focus Today Section - Progressive Inline Disclosure
 * AI-Powered Priority Task Surfacing
 * Click once for Medium (quick actions), click again for Full (resource planning)
 */

import { View, Text, Pressable } from 'react-native';
import { Sparkles, CheckCircle, ChevronRight, AlertCircle, Clock, Users } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { useRouter } from 'expo-router';
import { useWorkPlanStore, type WorkPlan } from '@/lib/state/work-plan-store';
import { useOrganizationStore } from '@/lib/state/organization-store';
import { getFocusTodayTasks } from '@/lib/ai-priority-scoring';
import { useTheme } from '@/lib/ThemeContext';
import { TaskCardCompact, TaskCardExpansion } from '@/components/tasks';

type ExpansionLevel = 'medium' | 'full' | null;

interface TaskExpansionState {
  taskId: string;
  level: ExpansionLevel;
}

interface FocusTodaySectionProps {
  onTaskPress?: (taskId: string) => void;
  compact?: boolean;
  maxTasks?: number;
}

export function FocusTodaySection({ onTaskPress, compact = false, maxTasks }: FocusTodaySectionProps) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const router = useRouter();
  const workPlans = useWorkPlanStore((s) => s.workPlans);
  const updateWorkPlan = useWorkPlanStore((s) => s.updateWorkPlan);
  const members = useOrganizationStore((s) => s.members);

  const [expansionState, setExpansionState] = useState<TaskExpansionState | null>(null);

  const priorityTasks = useMemo(() => {
    const allPriority = getFocusTodayTasks(workPlans, members, maxTasks || 3);
    return maxTasks ? allPriority.slice(0, maxTasks) : allPriority;
  }, [workPlans, members, maxTasks]);

  const handleTaskPress = (taskId: string) => {
    if (onTaskPress) {
      onTaskPress(taskId);
    }

    // Toggle or expand
    if (expansionState?.taskId === taskId) {
      if (expansionState.level === 'medium') {
        // Go from medium → full
        setExpansionState({ taskId, level: 'full' });
      } else {
        // Collapse from full
        setExpansionState(null);
      }
    } else {
      // Expand to medium
      setExpansionState({ taskId, level: 'medium' });
    }
  };

  const handleExpandMore = (taskId: string) => {
    setExpansionState({ taskId, level: 'full' });
  };

  const handleClose = () => {
    setExpansionState(null);
  };

  if (priorityTasks.length === 0) {
    if (compact) {
      return (
        <View className="bg-emerald-50 dark:bg-emerald-900/20 rounded-lg p-3 flex-row items-center gap-3">
          <View className="bg-emerald-100 dark:bg-emerald-900/30 p-2 rounded-lg">
            <CheckCircle size={16} color="#10b981" />
          </View>
          <Text className="text-emerald-700 dark:text-emerald-300 text-sm flex-1 font-medium">
            All clear - no urgent tasks right now
          </Text>
        </View>
      );
    }

    return (
      <View style={{ paddingHorizontal: 20, paddingVertical: 12 }}>
        <View
          style={{
            backgroundColor: isDark ? 'rgba(16, 185, 129, 0.1)' : '#ecfdf5',
            borderRadius: 12,
            padding: 16,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 12,
          }}
        >
          <CheckCircle size={32} color="#10b981" />
          <View style={{ flex: 1 }}>
            <Text
              style={{
                fontSize: 14,
                fontWeight: '700',
                color: isDark ? '#ffffff' : '#0f172a',
              }}
            >
              All Caught Up!
            </Text>
            <Text
              style={{
                fontSize: 12,
                color: isDark ? '#94a3b8' : '#64748b',
              }}
            >
              No critical tasks need attention right now.
            </Text>
          </View>
        </View>
      </View>
    );
  }

  // Compact mode: Show summary cards with link to Tasks tab
  if (compact) {
    return (
      <View>
        {/* Header */}
        <View className="flex-row items-center justify-between mb-3">
          <View className="flex-row items-center gap-2">
            <View className="w-7 h-7 rounded-full bg-purple-100 dark:bg-purple-900/30 items-center justify-center">
              <Sparkles size={14} color="#8b5cf6" />
            </View>
            <Text className="text-slate-900 dark:text-white font-bold text-base">
              Focus Today
            </Text>
            <View className="bg-purple-100 dark:bg-purple-900/30 px-2 py-0.5 rounded">
              <Text className="text-purple-600 dark:text-purple-400 text-xs font-bold">AI</Text>
            </View>
          </View>
          <Pressable
            onPress={() => router.push('/(tabs)/tasks')}
            className="flex-row items-center gap-1"
          >
            <Text className="text-purple-600 dark:text-purple-400 text-sm font-semibold">View All</Text>
            <ChevronRight size={16} color="#8b5cf6" />
          </Pressable>
        </View>

        {/* Compact Task Cards */}
        <View className="gap-2">
          {priorityTasks.map((priorityScore) => {
            const task = priorityScore.task;
            const priorityColor =
              priorityScore.level === 'critical'
                ? '#ef4444'
                : priorityScore.level === 'high'
                ? '#f59e0b'
                : priorityScore.level === 'important'
                ? '#3b82f6'
                : '#64748b';

            const priorityBg =
              priorityScore.level === 'critical'
                ? isDark ? 'rgba(239, 68, 68, 0.1)' : '#fee2e2'
                : priorityScore.level === 'high'
                ? isDark ? 'rgba(245, 158, 11, 0.1)' : '#fef3c7'
                : priorityScore.level === 'important'
                ? isDark ? 'rgba(59, 130, 246, 0.1)' : '#dbeafe'
                : isDark ? 'rgba(100, 116, 139, 0.1)' : '#f1f5f9';

            return (
              <Pressable
                key={task.id}
                onPress={() => router.push({ pathname: '/(tabs)/tasks', params: { selectedTaskId: task.id } })}
                className="bg-white dark:bg-slate-900 rounded-lg p-3 border border-slate-200 dark:border-slate-700 active:opacity-70"
                style={{ borderLeftWidth: 3, borderLeftColor: priorityColor }}
              >
                <View className="flex-row items-start justify-between mb-2">
                  <Text className="text-slate-900 dark:text-white font-semibold text-sm flex-1" numberOfLines={1}>
                    {task.title}
                  </Text>
                  <View
                    className="px-2 py-0.5 rounded ml-2"
                    style={{ backgroundColor: priorityBg }}
                  >
                    <Text className="text-xs font-bold" style={{ color: priorityColor }}>
                      {priorityScore.level.toUpperCase()}
                    </Text>
                  </View>
                </View>

                <Text className="text-slate-600 dark:text-slate-400 text-xs mb-2" numberOfLines={2}>
                  {priorityScore.reasoning}
                </Text>

                <View className="flex-row items-center gap-3">
                  <View className="flex-row items-center gap-1">
                    <Clock size={12} color="#64748b" />
                    <Text className="text-slate-500 dark:text-slate-400 text-xs">
                      {new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </Text>
                  </View>
                  {task.allocations.length > 0 && (
                    <View className="flex-row items-center gap-1">
                      <Users size={12} color="#64748b" />
                      <Text className="text-slate-500 dark:text-slate-400 text-xs">
                        {task.allocations.length} {task.allocations.length === 1 ? 'person' : 'people'}
                      </Text>
                    </View>
                  )}
                  {task.status === 'blocked' && (
                    <View className="flex-row items-center gap-1">
                      <AlertCircle size={12} color="#ef4444" />
                      <Text className="text-red-600 dark:text-red-400 text-xs font-medium">
                        Blocked
                      </Text>
                    </View>
                  )}
                </View>
              </Pressable>
            );
          })}
        </View>
      </View>
    );
  }

  // Full mode: Show expandable task cards
  return (
    <View style={{ paddingHorizontal: 20, paddingVertical: 8 }}>
      {/* Header */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 10,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <View
            style={{
              width: 28,
              height: 28,
              borderRadius: 14,
              backgroundColor: isDark ? 'rgba(139, 92, 246, 0.2)' : '#f3e8ff',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Sparkles size={14} color="#8b5cf6" />
          </View>
          <Text
            style={{
              fontSize: 15,
              fontWeight: '700',
              color: isDark ? '#ffffff' : '#0f172a',
            }}
          >
            Focus Today
          </Text>
          <View
            style={{
              backgroundColor: isDark ? 'rgba(139, 92, 246, 0.2)' : '#f3e8ff',
              paddingHorizontal: 6,
              paddingVertical: 2,
              borderRadius: 8,
            }}
          >
            <Text style={{ fontSize: 10, fontWeight: '700', color: '#8b5cf6' }}>AI</Text>
          </View>
        </View>
        <View
          style={{
            backgroundColor: isDark ? '#1e293b' : '#f1f5f9',
            paddingHorizontal: 8,
            paddingVertical: 4,
            borderRadius: 10,
          }}
        >
          <Text
            style={{
              fontSize: 11,
              fontWeight: '600',
              color: isDark ? '#94a3b8' : '#64748b',
            }}
          >
            {priorityTasks.length} priority
          </Text>
        </View>
      </View>

      {/* Task List with Progressive Disclosure */}
      {priorityTasks.map((priorityScore) => {
        const task = priorityScore.task;
        const isExpanded = expansionState?.taskId === task.id;
        const expansionLevel = expansionState?.taskId === task.id ? expansionState.level : null;

        return (
          <View key={task.id}>
            {/* Compact card */}
            <TaskCardCompact
              task={task}
              priorityLevel={priorityScore.level}
              isExpanded={isExpanded}
              onPress={() => handleTaskPress(task.id)}
            />

            {/* Progressive inline expansion */}
            {isExpanded && expansionLevel && (
              <TaskCardExpansion
                task={task}
                level={expansionLevel}
                onClose={handleClose}
                onExpandMore={() => handleExpandMore(task.id)}
                onUpdateStatus={(status) => {
                  updateWorkPlan(task.id, { status });
                }}
                onUpdateProgress={(progress) => {
                  updateWorkPlan(task.id, { progress });
                }}
                onRescheduleDays={(days) => {
                  const currentDate = new Date(task.dueDate);
                  currentDate.setDate(currentDate.getDate() + days);
                  updateWorkPlan(task.id, {
                    dueDate: currentDate.toISOString().split('T')[0],
                  });
                }}
                onUpdateDescription={(description) => {
                  updateWorkPlan(task.id, { description });
                }}
                onSave={(updates) => {
                  updateWorkPlan(task.id, updates);
                }}
                priorityLevel={priorityScore.level}
                priorityReasoning={priorityScore.reasoning}
              />
            )}
          </View>
        );
      })}
    </View>
  );
}
