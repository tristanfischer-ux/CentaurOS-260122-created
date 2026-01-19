/**
 * CurrentActivitiesSection
 * Shows in-progress tasks and upcoming activities for the next 1-2 weeks
 */

import { View, Text, Pressable } from 'react-native';
import { useMemo } from 'react';
import { useRouter } from 'expo-router';
import {
  Clock,
  ChevronRight,
  Play,
  Calendar,
  AlertTriangle,
  Users,
  CheckCircle2,
} from 'lucide-react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useWorkPlanStore, type WorkPlan } from '@/lib/state/work-plan-store';
import { useOrganizationStore } from '@/lib/state/organization-store';
import { useCurrentMembership } from '@/lib/state/app-store';
import { filterWorkPlansByRole } from '@/lib/role-utils';

const STATUS_COLORS = {
  'in-progress': '#3b82f6',
  'not-started': '#8b5cf6',
  'blocked': '#ef4444',
  'completed': '#10b981',
};

interface TaskItemProps {
  task: WorkPlan;
  index: number;
  onPress: () => void;
  showProgress?: boolean;
}

function TaskItem({ task, index, onPress, showProgress = true }: TaskItemProps) {
  const members = useOrganizationStore((s) => s.members);

  const assignedMembers = useMemo(() => {
    if (!task.assignedMemberIds) return [];
    return task.assignedMemberIds
      .map((id) => members.find((m) => m.id === id))
      .filter(Boolean);
  }, [task.assignedMemberIds, members]);

  const allocatedPerWeek = task.allocations?.reduce(
    (sum, alloc) => sum + (alloc.squaresPerWeek || 0),
    0
  ) || 0;

  // Calculate TU metrics
  const totalTUs = task.estimatedTimeUnits || 0;
  const completedTUs = Math.round((task.progress / 100) * totalTUs);
  const remainingTUs = totalTUs - completedTUs;
  const weeksToFinish = allocatedPerWeek > 0 ? Math.ceil(remainingTUs / allocatedPerWeek) : null;

  return (
    <Animated.View entering={FadeInDown.delay(index * 50).springify()}>
      <Pressable
        onPress={onPress}
        className="bg-white dark:bg-slate-800 rounded-xl p-3 mb-2 border border-slate-200 dark:border-slate-700 active:opacity-90"
      >
        <View className="flex-row items-start justify-between">
          <View className="flex-1 mr-3">
            {/* Title Row */}
            <View className="flex-row items-center gap-2 mb-1">
              <View
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: STATUS_COLORS[task.status as keyof typeof STATUS_COLORS] || '#64748b' }}
              />
              <Text className="text-slate-900 dark:text-white font-semibold text-sm flex-1" numberOfLines={1}>
                {task.title}
              </Text>
            </View>

            {/* Info Row */}
            <View className="flex-row items-center gap-3">
              {/* Function */}
              <Text className="text-slate-500 dark:text-slate-400 text-xs">
                {task.function}
              </Text>

              {/* Team Avatars */}
              {assignedMembers.length > 0 && (
                <View className="flex-row items-center gap-1">
                  <Users size={10} color="#64748b" />
                  <Text className="text-slate-500 dark:text-slate-400 text-xs">
                    {assignedMembers.length}
                  </Text>
                </View>
              )}

              {/* TU per week */}
              <Text className="text-slate-500 dark:text-slate-400 text-xs">
                {allocatedPerWeek} TU/wk
              </Text>
            </View>
          </View>

          {/* Progress & ETA */}
          <View className="items-end">
            {showProgress && (
              <>
                <Text className="text-slate-900 dark:text-white text-xs font-bold">
                  {completedTUs}/{totalTUs} TU
                </Text>
                {weeksToFinish !== null && (
                  <Text className="text-slate-500 dark:text-slate-400 text-xs">
                    ~{weeksToFinish} wk{weeksToFinish !== 1 ? 's' : ''} left
                  </Text>
                )}
              </>
            )}
            {!showProgress && (
              <View className="bg-purple-100 dark:bg-purple-900/30 px-2 py-0.5 rounded-full">
                <Text className="text-purple-600 dark:text-purple-400 text-xs font-semibold">
                  {task.estimatedTimeUnits} TU
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Progress Bar */}
        {showProgress && (
          <View className="mt-2 h-1 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
            <View
              className="h-full rounded-full"
              style={{
                width: `${task.progress}%`,
                backgroundColor: STATUS_COLORS[task.status as keyof typeof STATUS_COLORS] || '#64748b',
              }}
            />
          </View>
        )}
      </Pressable>
    </Animated.View>
  );
}

interface BottleneckAlertProps {
  blockedCount: number;
  overloadedMembers: string[];
}

function BottleneckAlert({ blockedCount, overloadedMembers }: BottleneckAlertProps) {
  const router = useRouter();

  if (blockedCount === 0 && overloadedMembers.length === 0) return null;

  return (
    <Pressable
      onPress={() => router.push('/(tabs)/what')}
      className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-3 mb-3"
    >
      <View className="flex-row items-center gap-2 mb-1">
        <AlertTriangle size={14} color="#f59e0b" />
        <Text className="text-amber-700 dark:text-amber-400 font-semibold text-sm">
          Activity Bottlenecks
        </Text>
      </View>
      <View className="gap-1">
        {blockedCount > 0 && (
          <Text className="text-amber-600 dark:text-amber-400 text-xs">
            • {blockedCount} task{blockedCount > 1 ? 's' : ''} blocked and waiting
          </Text>
        )}
        {overloadedMembers.length > 0 && (
          <Text className="text-amber-600 dark:text-amber-400 text-xs">
            • {overloadedMembers.join(', ')} at capacity
          </Text>
        )}
      </View>
    </Pressable>
  );
}

export function CurrentActivitiesSection() {
  const router = useRouter();
  const workPlans = useWorkPlanStore((s) => s.workPlans);
  const members = useOrganizationStore((s) => s.members);
  const currentMembership = useCurrentMembership();

  // Apply role-based filtering FIRST
  const roleFilteredWorkPlans = useMemo(() => {
    if (!currentMembership?.role) return workPlans;
    return filterWorkPlansByRole(
      workPlans,
      currentMembership.role,
      currentMembership.function,
      currentMembership.id
    );
  }, [workPlans, currentMembership]);

  // Filter tasks by status from role-filtered data
  const inProgressTasks = useMemo(
    () => roleFilteredWorkPlans.filter((wp) => wp.status === 'in-progress'),
    [roleFilteredWorkPlans]
  );

  const upcomingTasks = useMemo(
    () => roleFilteredWorkPlans.filter((wp) => wp.status === 'not-started').slice(0, 5),
    [roleFilteredWorkPlans]
  );

  const blockedTasks = useMemo(
    () => roleFilteredWorkPlans.filter((wp) => wp.status === 'blocked'),
    [roleFilteredWorkPlans]
  );

  // Calculate overloaded members (from role-filtered workplans)
  const overloadedMembers = useMemo(() => {
    const memberLoads: Record<string, number> = {};
    const memberCapacity: Record<string, number> = {};

    members.forEach((m) => {
      memberCapacity[m.id] = m.role === 'Founder' || m.role === 'Apprentice' ? 10 : (m.daysPerWeek || 2) * 2;
      memberLoads[m.id] = 0;
    });

    roleFilteredWorkPlans
      .filter((wp) => wp.status === 'in-progress' || wp.status === 'not-started')
      .forEach((wp) => {
        wp.allocations?.forEach((alloc) => {
          if (memberLoads[alloc.memberId] !== undefined) {
            memberLoads[alloc.memberId] += alloc.squaresPerWeek || 0;
          }
        });
      });

    return members
      .filter((m) => memberLoads[m.id] >= memberCapacity[m.id])
      .map((m) => m.name.split(' ')[0]);
  }, [members, roleFilteredWorkPlans]);

  if (inProgressTasks.length === 0 && upcomingTasks.length === 0) {
    return (
      <View className="px-5 mb-4">
        <View className="flex-row items-center gap-2 mb-3">
          <View className="bg-blue-500 p-1.5 rounded-lg">
            <Play size={16} color="white" />
          </View>
          <Text className="text-slate-900 dark:text-white font-bold text-base">
            Current Activities
          </Text>
        </View>
        <View className="bg-slate-100 dark:bg-slate-800 rounded-xl p-6 items-center">
          <Clock size={32} color="#64748b" />
          <Text className="text-slate-600 dark:text-slate-400 text-sm mt-2 text-center">
            No active tasks. Go to the What tab to start work.
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View className="px-5 mb-4">
      {/* Section Header */}
      <View className="flex-row items-center justify-between mb-3">
        <View className="flex-row items-center gap-2">
          <View className="bg-blue-500 p-1.5 rounded-lg">
            <Play size={16} color="white" />
          </View>
          <Text className="text-slate-900 dark:text-white font-bold text-base">
            Current Activities
          </Text>
        </View>
        <Pressable
          onPress={() => router.push('/(tabs)/what')}
          className="flex-row items-center gap-1"
        >
          <Text className="text-blue-600 dark:text-blue-400 text-xs font-semibold">
            View All
          </Text>
          <ChevronRight size={14} color="#3b82f6" />
        </Pressable>
      </View>

      {/* Bottleneck Alert */}
      <BottleneckAlert
        blockedCount={blockedTasks.length}
        overloadedMembers={overloadedMembers}
      />

      {/* In Progress Tasks */}
      {inProgressTasks.length > 0 && (
        <View className="mb-4">
          <View className="flex-row items-center justify-between mb-2">
            <View className="flex-row items-center gap-2">
              <View className="w-2 h-2 rounded-full bg-blue-500" />
              <Text className="text-slate-600 dark:text-slate-400 text-xs font-semibold uppercase">
                In Progress
              </Text>
            </View>
            <Text className="text-slate-500 dark:text-slate-500 text-xs">
              {inProgressTasks.length} tasks
            </Text>
          </View>

          {inProgressTasks.slice(0, 4).map((task, index) => (
            <TaskItem
              key={task.id}
              task={task}
              index={index}
              onPress={() => router.push('/(tabs)/what')}
              showProgress={true}
            />
          ))}

          {inProgressTasks.length > 4 && (
            <Pressable
              onPress={() => router.push('/(tabs)/what')}
              className="py-2 items-center"
            >
              <Text className="text-blue-600 dark:text-blue-400 text-xs font-semibold">
                +{inProgressTasks.length - 4} more in progress
              </Text>
            </Pressable>
          )}
        </View>
      )}

      {/* Upcoming Activities */}
      {upcomingTasks.length > 0 && (
        <View>
          <View className="flex-row items-center justify-between mb-2">
            <View className="flex-row items-center gap-2">
              <Calendar size={14} color="#8b5cf6" />
              <Text className="text-slate-600 dark:text-slate-400 text-xs font-semibold uppercase">
                Upcoming (Next 1-2 Weeks)
              </Text>
            </View>
            <Text className="text-slate-500 dark:text-slate-500 text-xs">
              {upcomingTasks.length} queued
            </Text>
          </View>

          {upcomingTasks.slice(0, 3).map((task, index) => (
            <TaskItem
              key={task.id}
              task={task}
              index={index}
              onPress={() => router.push('/(tabs)/decide')}
              showProgress={false}
            />
          ))}

          {upcomingTasks.length > 3 && (
            <Pressable
              onPress={() => router.push('/(tabs)/decide')}
              className="py-2 items-center"
            >
              <Text className="text-purple-600 dark:text-purple-400 text-xs font-semibold">
                +{upcomingTasks.length - 3} more queued
              </Text>
            </Pressable>
          )}
        </View>
      )}
    </View>
  );
}
