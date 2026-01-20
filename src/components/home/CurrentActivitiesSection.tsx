/**
 * CurrentActivitiesSection
 * Shows in-progress tasks and upcoming activities using standardized TaskCardCompact
 */

import { View, Text, Pressable } from 'react-native';
import { useMemo } from 'react';
import { useRouter } from 'expo-router';
import {
  Play,
  AlertTriangle,
} from 'lucide-react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useWorkPlanStore, type WorkPlan } from '@/lib/state/work-plan-store';
import { useOrganizationStore } from '@/lib/state/organization-store';
import { useCurrentMembership } from '@/lib/state/app-store';
import { filterWorkPlansByRole } from '@/lib/role-utils';
import { TaskCardCompact, TaskCardMediumInline, TaskCardFull } from '@/components/tasks';

interface CurrentActivitiesSectionProps {
  expandedTaskId?: string | null;
  onExpandTask?: (taskId: string | null) => void;
  selectedTask?: WorkPlan | null;
  showFullModal?: boolean;
  onShowFullModal?: (show: boolean, task: WorkPlan | null) => void;
}

export function CurrentActivitiesSection({
  expandedTaskId,
  onExpandTask,
  selectedTask,
  showFullModal,
  onShowFullModal,
}: CurrentActivitiesSectionProps) {
  const router = useRouter();
  const workPlans = useWorkPlanStore((s) => s.workPlans);
  const updateWorkPlan = useWorkPlanStore((s) => s.updateWorkPlan);
  const members = useOrganizationStore((s) => s.members);
  const currentMembership = useCurrentMembership();

  // Filter by role
  const roleFilteredPlans = useMemo(() => {
    if (!currentMembership) return workPlans;
    return filterWorkPlansByRole(workPlans, currentMembership.role, undefined, currentMembership.userId);
  }, [workPlans, currentMembership]);

  // Get in-progress and upcoming tasks
  const { inProgress, upcoming, blocked } = useMemo(() => {
    const now = new Date();
    const twoWeeksFromNow = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);

    const inProgress = roleFilteredPlans.filter((wp) => wp.status === 'in-progress');
    const blocked = roleFilteredPlans.filter((wp) => wp.status === 'blocked');
    const upcoming = roleFilteredPlans.filter((wp) => {
      if (wp.status !== 'not-started') return false;
      const dueDate = new Date(wp.dueDate);
      return dueDate <= twoWeeksFromNow;
    });

    return { inProgress, upcoming, blocked };
  }, [roleFilteredPlans]);

  // Detect bottlenecks
  const bottlenecks = useMemo(() => {
    const overloadedMembers = members.filter((m) => {
      const assignedTUs = workPlans
        .filter((wp) => wp.status === 'in-progress' || wp.status === 'not-started')
        .flatMap((wp) => wp.allocations || [])
        .filter((alloc) => alloc.memberId === m.id)
        .reduce((sum, alloc) => sum + alloc.squaresPerWeek, 0);

      // Assume 5 TU per day as max capacity
      const maxCapacity = (m.daysPerWeek || 5) * 5;
      return assignedTUs > maxCapacity;
    });

    return {
      blockedCount: blocked.length,
      overloadedMembers: overloadedMembers.map((m) => m.name),
    };
  }, [members, workPlans, blocked]);

  const handleTaskPress = (taskId: string) => {
    const task = workPlans.find(wp => wp.id === taskId);
    if (!task) return;

    if (onExpandTask) {
      // If already expanded, collapse; otherwise expand
      if (expandedTaskId === taskId) {
        onExpandTask(null);
      } else {
        onExpandTask(taskId);
      }
    }
  };

  if (inProgress.length === 0 && upcoming.length === 0 && blocked.length === 0) {
    return null;
  }

  return (
    <View className="mt-4">
      {/* Bottleneck Alert */}
      {(bottlenecks.blockedCount > 0 || bottlenecks.overloadedMembers.length > 0) && (
        <Animated.View entering={FadeInDown.delay(100).springify()}>
          <Pressable
            onPress={() => router.push('/(tabs)/people')}
            className="mx-5 mb-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 active:opacity-80"
          >
            <View className="flex-row items-center gap-3">
              <View className="w-10 h-10 bg-red-100 dark:bg-red-900/40 rounded-full items-center justify-center">
                <AlertTriangle size={20} color="#ef4444" />
              </View>
              <View className="flex-1">
                <Text className="text-red-900 dark:text-red-100 font-bold text-sm">
                  ⚠️ Potential Bottlenecks
                </Text>
                <Text className="text-red-700 dark:text-red-300 text-xs mt-0.5">
                  {bottlenecks.blockedCount > 0 && `${bottlenecks.blockedCount} blocked tasks`}
                  {bottlenecks.blockedCount > 0 && bottlenecks.overloadedMembers.length > 0 && ' • '}
                  {bottlenecks.overloadedMembers.length > 0 &&
                    `${bottlenecks.overloadedMembers.length} team members overloaded`}
                </Text>
              </View>
            </View>
          </Pressable>
        </Animated.View>
      )}

      {/* In Progress Section */}
      {inProgress.length > 0 && (
        <View className="mb-4">
          <View className="flex-row items-center gap-2 px-5 mb-2">
            <Play size={16} color="#3b82f6" fill="#3b82f6" />
            <Text className="text-slate-900 dark:text-white font-bold text-sm">
              In Progress ({inProgress.length})
            </Text>
          </View>
          {inProgress.map((task, index) => {
            const isExpanded = expandedTaskId === task.id;
            return (
              <View key={task.id}>
                <Animated.View entering={FadeInDown.delay(index * 50).springify()}>
                  <View className="px-5">
                    <TaskCardCompact task={task} onPress={() => handleTaskPress(task.id)} />
                  </View>
                </Animated.View>

                {/* Inline Expansion */}
                {isExpanded && (
                  <TaskCardMediumInline
                    task={task}
                    onClose={() => onExpandTask?.(null)}
                    onViewFullDetails={() => {
                      onExpandTask?.(null);
                      onShowFullModal?.(true, task);
                    }}
                    onUpdateStatus={(status) => updateWorkPlan(task.id, { status })}
                    onUpdateProgress={(progress) => updateWorkPlan(task.id, { progress })}
                    onRescheduleDays={(days) => {
                      const currentDate = new Date(task.dueDate);
                      currentDate.setDate(currentDate.getDate() + days);
                      updateWorkPlan(task.id, {
                        dueDate: currentDate.toISOString().split('T')[0],
                      });
                    }}
                    onUpdateTitle={(title) => updateWorkPlan(task.id, { title })}
                    onUpdateDescription={(description) =>
                      updateWorkPlan(task.id, { description })
                    }
                  />
                )}
              </View>
            );
          })}
        </View>
      )}

      {/* Blocked Section */}
      {blocked.length > 0 && (
        <View className="mb-4">
          <View className="flex-row items-center gap-2 px-5 mb-2">
            <AlertTriangle size={16} color="#ef4444" />
            <Text className="text-slate-900 dark:text-white font-bold text-sm">
              Blocked ({blocked.length})
            </Text>
          </View>
          {blocked.map((task, index) => {
            const isExpanded = expandedTaskId === task.id;
            return (
              <View key={task.id}>
                <Animated.View entering={FadeInDown.delay(index * 50).springify()}>
                  <View className="px-5">
                    <TaskCardCompact task={task} onPress={() => handleTaskPress(task.id)} />
                  </View>
                </Animated.View>

                {/* Inline Expansion */}
                {isExpanded && (
                  <TaskCardMediumInline
                    task={task}
                    onClose={() => onExpandTask?.(null)}
                    onViewFullDetails={() => {
                      onExpandTask?.(null);
                      onShowFullModal?.(true, task);
                    }}
                    onUpdateStatus={(status) => updateWorkPlan(task.id, { status })}
                    onUpdateProgress={(progress) => updateWorkPlan(task.id, { progress })}
                    onRescheduleDays={(days) => {
                      const currentDate = new Date(task.dueDate);
                      currentDate.setDate(currentDate.getDate() + days);
                      updateWorkPlan(task.id, {
                        dueDate: currentDate.toISOString().split('T')[0],
                      });
                    }}
                    onUpdateTitle={(title) => updateWorkPlan(task.id, { title })}
                    onUpdateDescription={(description) =>
                      updateWorkPlan(task.id, { description })
                    }
                  />
                )}
              </View>
            );
          })}
        </View>
      )}

      {/* Upcoming Section */}
      {upcoming.length > 0 && (
        <View className="mb-4">
          <View className="flex-row items-center gap-2 px-5 mb-2">
            <Text className="text-slate-900 dark:text-white font-bold text-sm">
              Starting Soon ({upcoming.length})
            </Text>
          </View>
          {upcoming.slice(0, 3).map((task, index) => {
            const isExpanded = expandedTaskId === task.id;
            return (
              <View key={task.id}>
                <Animated.View entering={FadeInDown.delay(index * 50).springify()}>
                  <View className="px-5">
                    <TaskCardCompact task={task} onPress={() => handleTaskPress(task.id)} />
                  </View>
                </Animated.View>

                {/* Inline Expansion */}
                {isExpanded && (
                  <TaskCardMediumInline
                    task={task}
                    onClose={() => onExpandTask?.(null)}
                    onViewFullDetails={() => {
                      onExpandTask?.(null);
                      onShowFullModal?.(true, task);
                    }}
                    onUpdateStatus={(status) => updateWorkPlan(task.id, { status })}
                    onUpdateProgress={(progress) => updateWorkPlan(task.id, { progress })}
                    onRescheduleDays={(days) => {
                      const currentDate = new Date(task.dueDate);
                      currentDate.setDate(currentDate.getDate() + days);
                      updateWorkPlan(task.id, {
                        dueDate: currentDate.toISOString().split('T')[0],
                      });
                    }}
                    onUpdateTitle={(title) => updateWorkPlan(task.id, { title })}
                    onUpdateDescription={(description) =>
                      updateWorkPlan(task.id, { description })
                    }
                  />
                )}
              </View>
            );
          })}
          {upcoming.length > 3 && (
            <Pressable
              onPress={() => router.push('/(tabs)/tasks')}
              className="mx-5 mt-2 py-2 items-center active:opacity-70"
            >
              <Text className="text-blue-500 dark:text-blue-400 font-semibold text-sm">
                View all {upcoming.length} upcoming tasks
              </Text>
            </Pressable>
          )}
        </View>
      )}

      {/* Full Modal */}
      {selectedTask && showFullModal && onShowFullModal && (
        <TaskCardFull
          task={selectedTask}
          visible={showFullModal}
          onClose={() => onShowFullModal(false, null)}
          onSave={(updates) => {
            updateWorkPlan(selectedTask.id, updates);
            onShowFullModal(false, null);
          }}
        />
      )}
    </View>
  );
}
