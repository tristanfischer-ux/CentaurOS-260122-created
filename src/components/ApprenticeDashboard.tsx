/**
 * Apprentice Dashboard
 *
 * Task-focused view for apprentices showing:
 * - Their assigned tasks and current status
 * - Their squad assignment and team members
 * - General company activity (high-level awareness)
 *
 * Notably HIDES:
 * - Personnel costs
 * - Budget information
 * - Financial metrics
 */

import React, { useMemo, useState } from 'react';
import { View, Text, ScrollView, Pressable, RefreshControl } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  CheckCircle2,
  Clock,
  AlertTriangle,
  Users,
  Target,
  ChevronRight,
  Play,
  Pause,
  Star,
} from 'lucide-react-native';
import { useCurrentMembership } from '@/lib/state/app-store';
import { useOrganizationStore } from '@/lib/state/organization-store';
import { useWorkPlanStore } from '@/lib/state/work-plan-store';
import { useSquadStore } from '@/lib/state/squad-store';
import type { OrganizationMember } from '@/lib/organization-seed';
import type { WorkPlan } from '@/lib/state/work-plan-store';

interface TaskCardProps {
  task: WorkPlan;
  onPress?: () => void;
}

function TaskCard({ task, onPress }: TaskCardProps) {
  const statusConfig = {
    'in-progress': { color: '#3b82f6', bg: '#3b82f620', icon: Play, label: 'In Progress' },
    'not-started': { color: '#64748b', bg: '#64748b20', icon: Clock, label: 'Not Started' },
    completed: { color: '#10b981', bg: '#10b98120', icon: CheckCircle2, label: 'Completed' },
    blocked: { color: '#ef4444', bg: '#ef444420', icon: AlertTriangle, label: 'Blocked' },
    abandoned: { color: '#f59e0b', bg: '#f59e0b20', icon: Pause, label: 'Abandoned' },
  };

  const config = statusConfig[task.status] || statusConfig['not-started'];
  const Icon = config.icon;

  return (
    <Pressable
      onPress={onPress}
      className="bg-white dark:bg-slate-800 rounded-xl p-4 mb-3 border border-gray-200 dark:border-slate-700 active:opacity-90"
    >
      <View className="flex-row items-start justify-between">
        <View className="flex-1 mr-3">
          <View className="flex-row items-center gap-2 mb-2">
            <View
              className="w-8 h-8 rounded-lg items-center justify-center"
              style={{ backgroundColor: config.bg }}
            >
              <Icon size={16} color={config.color} />
            </View>
            <View className="flex-1">
              <Text className="text-gray-900 dark:text-white font-semibold" numberOfLines={1}>
                {task.title}
              </Text>
              <Text className="text-gray-500 dark:text-slate-400 text-xs">
                {config.label}
              </Text>
            </View>
          </View>

          {task.description && (
            <Text
              className="text-gray-600 dark:text-slate-400 text-sm mb-3"
              numberOfLines={2}
            >
              {task.description}
            </Text>
          )}

          {/* Progress */}
          <View className="flex-row items-center gap-2">
            <View className="flex-1 bg-gray-200 dark:bg-slate-700 rounded-full h-2 overflow-hidden">
              <View
                className="h-full rounded-full"
                style={{
                  width: `${task.progress}%`,
                  backgroundColor: config.color,
                }}
              />
            </View>
            <Text className="text-gray-600 dark:text-slate-400 text-xs font-medium">
              {task.progress}%
            </Text>
          </View>
        </View>

        <ChevronRight size={20} color="#94a3b8" />
      </View>

      {/* Time allocation */}
      <View className="flex-row items-center gap-4 mt-3 pt-3 border-t border-gray-100 dark:border-slate-700">
        <View className="flex-row items-center gap-1">
          <Clock size={12} color="#64748b" />
          <Text className="text-gray-500 dark:text-slate-400 text-xs">
            {task.estimatedTimeUnits}□ total
          </Text>
        </View>
        {task.dueDate && (
          <Text className="text-gray-500 dark:text-slate-400 text-xs">
            Due: {new Date(task.dueDate).toLocaleDateString()}
          </Text>
        )}
      </View>
    </Pressable>
  );
}

interface SquadMemberChipProps {
  member: OrganizationMember;
  isCurrentUser: boolean;
}

function SquadMemberChip({ member, isCurrentUser }: SquadMemberChipProps) {
  const getRoleColor = (role: string) => {
    switch (role) {
      case 'Founder':
        return '#8b5cf6';
      case 'FractionalExec':
        return '#3b82f6';
      case 'Apprentice':
        return '#10b981';
      default:
        return '#64748b';
    }
  };

  return (
    <View
      className={`flex-row items-center gap-2 px-3 py-2 rounded-xl mr-2 mb-2 ${
        isCurrentUser ? 'bg-emerald-100 dark:bg-emerald-900/30' : 'bg-gray-100 dark:bg-slate-800'
      }`}
    >
      <View
        className="w-6 h-6 rounded-full items-center justify-center"
        style={{ backgroundColor: getRoleColor(member.role) }}
      >
        <Text className="text-white text-[10px] font-bold">
          {member.name.split(' ').map((n) => n[0]).join('')}
        </Text>
      </View>
      <View>
        <Text
          className={`text-sm font-medium ${
            isCurrentUser
              ? 'text-emerald-700 dark:text-emerald-400'
              : 'text-gray-700 dark:text-slate-300'
          }`}
        >
          {member.name.split(' ')[0]}
          {isCurrentUser && ' (You)'}
        </Text>
        <Text className="text-gray-500 dark:text-slate-500 text-[10px]">
          {member.role === 'FractionalExec' ? 'Executive' : member.role}
        </Text>
      </View>
    </View>
  );
}

export function ApprenticeDashboard() {
  const [refreshing, setRefreshing] = useState(false);

  const membership = useCurrentMembership();
  const members = useOrganizationStore((s) => s.members);
  const workPlans = useWorkPlanStore((s) => s.workPlans);
  const squads = useSquadStore((s) => s.squads);

  const currentMember = useMemo(
    () => members.find((m) => m.id === membership?.userId),
    [members, membership]
  );

  // Get tasks assigned to this apprentice
  const myTasks = useMemo(() => {
    if (!currentMember) return [];
    return workPlans.filter(
      (wp) =>
        wp.assignedMemberIds?.includes(currentMember.id) ||
        wp.allocations?.some((a) => a.memberId === currentMember.id)
    );
  }, [workPlans, currentMember]);

  // Get squads this apprentice is in
  const mySquads = useMemo(() => {
    if (!currentMember) return [];
    return squads.filter((s) => s.memberIds.includes(currentMember.id));
  }, [squads, currentMember]);

  // Get manager (who they report to)
  const manager = useMemo(() => {
    if (!currentMember?.reportsTo) return null;
    return members.find((m) => m.id === currentMember.reportsTo);
  }, [members, currentMember]);

  // Categorize tasks
  const tasksByStatus = useMemo(() => {
    return {
      inProgress: myTasks.filter((t) => t.status === 'in-progress'),
      blocked: myTasks.filter((t) => t.status === 'blocked'),
      notStarted: myTasks.filter((t) => t.status === 'not-started'),
      completed: myTasks.filter((t) => t.status === 'completed'),
    };
  }, [myTasks]);

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  };

  if (!currentMember) {
    return (
      <View className="flex-1 items-center justify-center">
        <Text className="text-gray-500 dark:text-slate-400">Loading...</Text>
      </View>
    );
  }

  const totalTasks = myTasks.length;
  const completedTasks = tasksByStatus.completed.length;
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  return (
    <ScrollView
      className="flex-1 bg-gray-50 dark:bg-slate-950"
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Welcome Header */}
      <LinearGradient
        colors={['#10b981', '#059669']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          paddingHorizontal: 16,
          paddingTop: 20,
          paddingBottom: 24,
          marginHorizontal: 16,
          marginTop: 16,
          borderRadius: 16,
        }}
      >
        <Text className="text-white/80 text-sm">Welcome back,</Text>
        <Text className="text-white font-bold text-2xl mb-4">
          {currentMember.name.split(' ')[0]}
        </Text>

        {/* Stats */}
        <View className="flex-row gap-3">
          <View className="flex-1 bg-white/15 rounded-xl p-3">
            <Text className="text-white/70 text-xs">Active Tasks</Text>
            <Text className="text-white font-bold text-xl">
              {tasksByStatus.inProgress.length}
            </Text>
          </View>
          <View className="flex-1 bg-white/15 rounded-xl p-3">
            <Text className="text-white/70 text-xs">Completion</Text>
            <Text className="text-white font-bold text-xl">{completionRate}%</Text>
          </View>
          <View className="flex-1 bg-white/15 rounded-xl p-3">
            <Text className="text-white/70 text-xs">Squads</Text>
            <Text className="text-white font-bold text-xl">{mySquads.length}</Text>
          </View>
        </View>
      </LinearGradient>

      <View className="px-4 pt-6">
        {/* Manager Card */}
        {manager && (
          <View className="mb-6">
            <Text className="text-gray-500 dark:text-slate-400 text-xs font-bold mb-3">
              YOUR MANAGER
            </Text>
            <Pressable className="bg-white dark:bg-slate-800 rounded-xl p-4 flex-row items-center border border-gray-200 dark:border-slate-700">
              <View className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 items-center justify-center mr-3">
                <Text className="text-blue-600 dark:text-blue-400 font-bold">
                  {manager.name.split(' ').map((n) => n[0]).join('')}
                </Text>
              </View>
              <View className="flex-1">
                <Text className="text-gray-900 dark:text-white font-semibold">
                  {manager.name}
                </Text>
                <Text className="text-gray-500 dark:text-slate-400 text-sm">
                  {manager.function} • {manager.role === 'FractionalExec' ? 'Executive' : manager.role}
                </Text>
              </View>
              <ChevronRight size={20} color="#94a3b8" />
            </Pressable>
          </View>
        )}

        {/* Active Tasks */}
        {tasksByStatus.inProgress.length > 0 && (
          <View className="mb-6">
            <View className="flex-row items-center gap-2 mb-3">
              <Play size={16} color="#3b82f6" />
              <Text className="text-gray-900 dark:text-white font-semibold">
                In Progress ({tasksByStatus.inProgress.length})
              </Text>
            </View>
            {tasksByStatus.inProgress.map((task) => (
              <TaskCard key={task.id} task={task} />
            ))}
          </View>
        )}

        {/* Blocked Tasks */}
        {tasksByStatus.blocked.length > 0 && (
          <View className="mb-6">
            <View className="flex-row items-center gap-2 mb-3">
              <AlertTriangle size={16} color="#ef4444" />
              <Text className="text-gray-900 dark:text-white font-semibold">
                Blocked ({tasksByStatus.blocked.length})
              </Text>
            </View>
            <View className="bg-red-50 dark:bg-red-900/20 rounded-xl p-3 mb-3">
              <Text className="text-red-700 dark:text-red-400 text-sm">
                Talk to your manager about unblocking these tasks
              </Text>
            </View>
            {tasksByStatus.blocked.map((task) => (
              <TaskCard key={task.id} task={task} />
            ))}
          </View>
        )}

        {/* Queued Tasks */}
        {tasksByStatus.notStarted.length > 0 && (
          <View className="mb-6">
            <View className="flex-row items-center gap-2 mb-3">
              <Clock size={16} color="#64748b" />
              <Text className="text-gray-900 dark:text-white font-semibold">
                Up Next ({tasksByStatus.notStarted.length})
              </Text>
            </View>
            {tasksByStatus.notStarted.slice(0, 3).map((task) => (
              <TaskCard key={task.id} task={task} />
            ))}
            {tasksByStatus.notStarted.length > 3 && (
              <Pressable className="py-2">
                <Text className="text-blue-500 text-sm text-center">
                  View {tasksByStatus.notStarted.length - 3} more
                </Text>
              </Pressable>
            )}
          </View>
        )}

        {/* Squads */}
        {mySquads.length > 0 && (
          <View className="mb-6">
            <View className="flex-row items-center gap-2 mb-3">
              <Users size={16} color="#8b5cf6" />
              <Text className="text-gray-900 dark:text-white font-semibold">
                Your Squads ({mySquads.length})
              </Text>
            </View>
            {mySquads.map((squad) => {
              const squadMembers = members.filter((m) =>
                squad.memberIds.includes(m.id)
              );
              return (
                <View
                  key={squad.id}
                  className="bg-white dark:bg-slate-800 rounded-xl p-4 mb-3 border border-gray-200 dark:border-slate-700"
                >
                  <View className="flex-row items-center gap-2 mb-3">
                    <View
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: squad.color || '#8b5cf6' }}
                    />
                    <Text className="text-gray-900 dark:text-white font-semibold">
                      {squad.name}
                    </Text>
                    <View className="bg-gray-100 dark:bg-slate-700 px-2 py-0.5 rounded">
                      <Text className="text-gray-600 dark:text-slate-400 text-[10px] font-bold">
                        {squad.type.toUpperCase()}
                      </Text>
                    </View>
                  </View>
                  <View className="flex-row flex-wrap">
                    {squadMembers.map((member) => (
                      <SquadMemberChip
                        key={member.id}
                        member={member}
                        isCurrentUser={member.id === currentMember.id}
                      />
                    ))}
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {/* Completed Tasks */}
        {tasksByStatus.completed.length > 0 && (
          <View className="mb-6">
            <View className="flex-row items-center gap-2 mb-3">
              <CheckCircle2 size={16} color="#10b981" />
              <Text className="text-gray-900 dark:text-white font-semibold">
                Completed ({tasksByStatus.completed.length})
              </Text>
            </View>
            {tasksByStatus.completed.slice(0, 2).map((task) => (
              <TaskCard key={task.id} task={task} />
            ))}
          </View>
        )}

        {/* Empty State */}
        {myTasks.length === 0 && (
          <View className="bg-white dark:bg-slate-800 rounded-xl p-8 items-center">
            <Target size={48} color="#94a3b8" />
            <Text className="text-gray-900 dark:text-white font-semibold text-lg mt-4">
              No Tasks Yet
            </Text>
            <Text className="text-gray-500 dark:text-slate-400 text-center mt-2">
              Your manager will assign tasks to you soon. Check back later!
            </Text>
          </View>
        )}

        <View className="h-8" />
      </View>
    </ScrollView>
  );
}
