// Utilization Dashboard for Fractional Executives to see team time tracking

import { View, Text, ScrollView, ActivityIndicator, Pressable } from 'react-native';
import { useState } from 'react';
import { Clock, User, TrendingUp, Calendar } from 'lucide-react-native';
import { useQuery } from '@tanstack/react-query';
import { useCurrentWorkspace, useCurrentMembership, useAppStore } from '@/lib/state/app-store';
import { timeEntryApi } from '@/lib/api/operations';
import type { TimeEntry, User as UserType } from '@/types';

export default function UtilizationScreen() {
  const currentWorkspace = useCurrentWorkspace();
  const currentMembership = useCurrentMembership();
  const users = useAppStore((s) => s.users);
  const memberships = useAppStore((s) => s.memberships);

  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'all'>('week');

  // Only Fractional Execs and Founders should see this
  const canView = currentMembership?.role === 'FractionalExec' || currentMembership?.role === 'Founder';

  const workspaceId = currentWorkspace?.id;

  const { data: timeEntries = [], isLoading } = useQuery<TimeEntry[]>({
    queryKey: ['timeEntries', 'workspace', workspaceId, timeRange],
    queryFn: async () => {
      if (!workspaceId) return [];

      const now = new Date();
      let startDate: string | undefined;

      if (timeRange === 'week') {
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        startDate = weekAgo.toISOString().split('T')[0];
      } else if (timeRange === 'month') {
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        startDate = monthAgo.toISOString().split('T')[0];
      }

      return await timeEntryApi.getByWorkspace(workspaceId, startDate);
    },
    enabled: !!workspaceId && canView,
  });

  if (!canView) {
    return (
      <View className="flex-1 bg-white dark:bg-slate-950 items-center justify-center p-6">
        <Clock size={64} color="#475569" />
        <Text className="text-gray-900 dark:text-white text-xl font-semibold mt-4 mb-2">Access Restricted</Text>
        <Text className="text-gray-600 dark:text-slate-400 text-center">
          Only Fractional Executives and Founders can view utilization data.
        </Text>
      </View>
    );
  }

  if (isLoading) {
    return (
      <View className="flex-1 bg-white dark:bg-slate-950 items-center justify-center">
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  // Calculate utilization by user
  const utilizationByUser = timeEntries.reduce((acc, entry) => {
    if (!acc[entry.userId]) {
      const user = users[entry.userId];
      const membership = Object.values(memberships).find(
        (m: any) => m.userId === entry.userId && m.workspaceId === currentWorkspace?.id
      );

      acc[entry.userId] = {
        user,
        role: membership?.role ?? 'Unknown',
        hours: 0,
        taskCount: new Set<string>(),
        lastEntry: entry.date,
      };
    }

    acc[entry.userId].hours += entry.hours;
    acc[entry.userId].taskCount.add(entry.taskId);

    if (entry.date > acc[entry.userId].lastEntry) {
      acc[entry.userId].lastEntry = entry.date;
    }

    return acc;
  }, {} as Record<string, { user: UserType; role: string; hours: number; taskCount: Set<string>; lastEntry: string }>);

  const utilization = Object.values(utilizationByUser)
    .map((data) => ({
      ...data,
      taskCount: data.taskCount.size,
    }))
    .sort((a, b) => b.hours - a.hours);

  const totalHours = timeEntries.reduce((sum, entry) => sum + entry.hours, 0);
  const avgHoursPerUser = utilization.length > 0 ? totalHours / utilization.length : 0;

  return (
    <View className="flex-1 bg-white dark:bg-slate-950">
      {/* Header */}
      <View className="p-6 pb-4">
        <Text className="text-gray-900 dark:text-white text-2xl font-bold">Team Utilization</Text>
        <Text className="text-gray-600 dark:text-slate-400 text-sm mt-1">Track team hours and productivity</Text>

        {/* Time Range Selector */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mt-4" style={{ flexGrow: 0 }}>
          <View className="flex-row gap-2">
            {[
              { value: 'week' as const, label: 'Last 7 Days' },
              { value: 'month' as const, label: 'Last 30 Days' },
              { value: 'all' as const, label: 'All Time' },
            ].map((range) => (
              <Pressable
                key={range.value}
                onPress={() => setTimeRange(range.value)}
                className={`px-4 py-2 rounded-full ${
                  timeRange === range.value
                    ? 'bg-blue-500'
                    : 'bg-slate-800 border border-slate-700'
                }`}
              >
                <Text
                  className={`text-sm font-medium ${
                    timeRange === range.value ? 'text-white' : 'text-gray-600 dark:text-slate-400'
                  }`}
                >
                  {range.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </ScrollView>
      </View>

      <ScrollView className="flex-1 px-6">
        {/* Summary Cards */}
        <View className="flex-row gap-3 mb-6">
          <View className="flex-1 bg-gradient-to-br from-blue-500/20 to-blue-600/10 border border-blue-500/30 rounded-xl p-4">
            <Clock size={20} color="#3B82F6" />
            <Text className="text-blue-400 text-sm mt-2">Total Hours</Text>
            <Text className="text-gray-900 dark:text-white text-2xl font-bold mt-1">{totalHours.toFixed(1)}</Text>
          </View>

          <View className="flex-1 bg-gradient-to-br from-green-500/20 to-green-600/10 border border-green-500/30 rounded-xl p-4">
            <User size={20} color="#10B981" />
            <Text className="text-green-400 text-sm mt-2">Team Members</Text>
            <Text className="text-gray-900 dark:text-white text-2xl font-bold mt-1">{utilization.length}</Text>
          </View>
        </View>

        <View className="bg-gradient-to-br from-purple-500/20 to-purple-600/10 border border-purple-500/30 rounded-xl p-4 mb-6">
          <TrendingUp size={20} color="#A855F7" />
          <Text className="text-purple-400 text-sm mt-2">Avg Hours / Member</Text>
          <Text className="text-gray-900 dark:text-white text-2xl font-bold mt-1">{avgHoursPerUser.toFixed(1)}</Text>
        </View>

        {/* Utilization by User */}
        <Text className="text-gray-900 dark:text-white text-lg font-semibold mb-3">Team Members</Text>

        {utilization.length === 0 ? (
          <View className="items-center justify-center py-12">
            <Clock size={64} color="#475569" />
            <Text className="text-gray-900 dark:text-white text-xl font-semibold mt-4 mb-2">No Time Entries</Text>
            <Text className="text-gray-600 dark:text-slate-400 text-center">
              No time has been logged in the selected period.
            </Text>
          </View>
        ) : (
          <View className="gap-3 pb-6">
            {utilization.map(({ user, role, hours, taskCount, lastEntry }) => (
              <View
                key={user.id}
                className="bg-gray-100 dark:bg-slate-900 rounded-2xl p-4 border border-slate-800"
              >
                {/* User Header */}
                <View className="flex-row items-center justify-between mb-3">
                  <View className="flex-row items-center flex-1">
                    <View className="w-12 h-12 bg-blue-500 rounded-full items-center justify-center mr-3">
                      <Text className="text-gray-900 dark:text-white text-lg font-bold">
                        {user.name.charAt(0)}
                      </Text>
                    </View>
                    <View className="flex-1">
                      <Text className="text-gray-900 dark:text-white font-semibold text-base">{user.name}</Text>
                      <Text className="text-gray-600 dark:text-slate-400 text-xs">{role}</Text>
                    </View>
                  </View>

                  <View className="bg-blue-500/20 px-3 py-1 rounded-lg">
                    <Text className="text-blue-400 text-lg font-bold">{hours.toFixed(1)}h</Text>
                  </View>
                </View>

                {/* User Stats */}
                <View className="flex-row items-center gap-4">
                  <View className="flex-row items-center">
                    <User size={14} color="#64748b" />
                    <Text className="text-gray-600 dark:text-slate-400 text-xs ml-1">
                      {taskCount} task{taskCount !== 1 ? 's' : ''}
                    </Text>
                  </View>

                  <Text className="text-slate-600">•</Text>

                  <View className="flex-row items-center">
                    <Calendar size={14} color="#64748b" />
                    <Text className="text-gray-600 dark:text-slate-400 text-xs ml-1">
                      Last: {new Date(lastEntry).toLocaleDateString()}
                    </Text>
                  </View>
                </View>

                {/* Progress Bar */}
                <View className="mt-3 bg-slate-800 h-2 rounded-full overflow-hidden">
                  <View
                    className="bg-blue-500 h-full rounded-full"
                    style={{
                      width: `${Math.min((hours / (totalHours || 1)) * 100, 100)}%`,
                    }}
                  />
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}
