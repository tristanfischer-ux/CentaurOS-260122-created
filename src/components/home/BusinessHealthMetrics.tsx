/**
 * Business Health Metrics
 * Simplified version showing 3 large, readable metrics instead of 9 tiny KPI cards
 */

import { View, Text, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Users, Activity, TrendingUp, AlertTriangle, CheckCircle2 } from 'lucide-react-native';
import { useMemo } from 'react';
import { useWorkPlanStore } from '@/lib/state/work-plan-store';
import { useOrganizationStore } from '@/lib/state/organization-store';

export function BusinessHealthMetrics() {
  const router = useRouter();
  const workPlans = useWorkPlanStore((s) => s.workPlans);
  const members = useOrganizationStore((s) => s.members);

  const metrics = useMemo(() => {
    const activeTasks = workPlans.filter(
      wp => wp.status !== 'completed' && wp.status !== 'abandoned'
    );
    const inProgressTasks = workPlans.filter(wp => wp.status === 'in-progress');
    const blockedTasks = workPlans.filter(wp => wp.status === 'blocked');

    // Calculate team utilization
    const totalCapacity = members.reduce((sum, m) => {
      const maxCap = m.role === 'Founder' || m.role === 'Apprentice' ? 10 : (m.daysPerWeek || 2) * 2;
      return sum + maxCap;
    }, 0);

    const allocatedCapacity = activeTasks.reduce((sum, task) => {
      return sum + task.allocations.reduce((s, a) => s + a.squaresPerWeek, 0);
    }, 0);

    const utilizationPercent = totalCapacity > 0 ? Math.round((allocatedCapacity / totalCapacity) * 100) : 0;

    // Determine overall health
    const isHealthy = blockedTasks.length === 0 && utilizationPercent < 90;
    const isWarning = blockedTasks.length > 0 || utilizationPercent >= 90;
    const isCritical = blockedTasks.length > 3 || utilizationPercent > 100;

    return {
      teamUtilization: utilizationPercent,
      activeTasksCount: activeTasks.length,
      inProgressCount: inProgressTasks.length,
      blockedCount: blockedTasks.length,
      isHealthy,
      isWarning,
      isCritical,
    };
  }, [workPlans, members]);

  const getUtilizationColor = () => {
    if (metrics.teamUtilization >= 100) return { text: 'text-red-600 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-900/20', border: 'border-red-200 dark:border-red-800' };
    if (metrics.teamUtilization >= 90) return { text: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-900/20', border: 'border-amber-200 dark:border-amber-800' };
    return { text: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-900/20', border: 'border-emerald-200 dark:border-emerald-800' };
  };

  const getHealthStatus = () => {
    if (metrics.isCritical) return { icon: AlertTriangle, color: '#ef4444', label: 'Needs Attention', bg: 'bg-red-50 dark:bg-red-900/20', border: 'border-red-200 dark:border-red-800' };
    if (metrics.isWarning) return { icon: AlertTriangle, color: '#f59e0b', label: 'At Risk', bg: 'bg-amber-50 dark:bg-amber-900/20', border: 'border-amber-200 dark:border-amber-800' };
    return { icon: CheckCircle2, color: '#10b981', label: 'On Track', bg: 'bg-emerald-50 dark:bg-emerald-900/20', border: 'border-emerald-200 dark:border-emerald-800' };
  };

  const utilizationColor = getUtilizationColor();
  const healthStatus = getHealthStatus();
  const HealthIcon = healthStatus.icon;

  return (
    <View>
      {/* Header */}
      <Text className="text-slate-900 dark:text-white font-bold text-base mb-3">
        Business Health
      </Text>

      {/* 3 Column Grid */}
      <View className="flex-row gap-2">
        {/* Team Utilization */}
        <Pressable
          onPress={() => router.push('/(tabs)/people')}
          className={`flex-1 rounded-xl p-3 border ${utilizationColor.bg} ${utilizationColor.border} active:opacity-70`}
        >
          <View className="flex-row items-center gap-2 mb-2">
            <Users size={16} color={metrics.teamUtilization >= 100 ? '#ef4444' : metrics.teamUtilization >= 90 ? '#f59e0b' : '#10b981'} />
            <Text className="text-slate-600 dark:text-slate-400 text-xs font-medium">Team</Text>
          </View>
          <Text className={`font-bold text-3xl mb-1 ${utilizationColor.text}`}>
            {metrics.teamUtilization}%
          </Text>
          <Text className="text-slate-500 dark:text-slate-400 text-xs">
            Utilized
          </Text>
          {metrics.teamUtilization >= 90 && (
            <View className="mt-1.5 bg-amber-100 dark:bg-amber-900/30 rounded px-1.5 py-0.5">
              <Text className="text-amber-700 dark:text-amber-300 text-[10px] font-medium">
                {metrics.teamUtilization >= 100 ? '⚠️ Over capacity' : '🟡 Near capacity'}
              </Text>
            </View>
          )}
        </Pressable>

        {/* Active Tasks Progress */}
        <Pressable
          onPress={() => router.push('/(tabs)/tasks')}
          className="flex-1 bg-blue-50 dark:bg-blue-900/20 rounded-xl p-3 border border-blue-200 dark:border-blue-800 active:opacity-70"
        >
          <View className="flex-row items-center gap-2 mb-2">
            <Activity size={16} color="#3b82f6" />
            <Text className="text-slate-600 dark:text-slate-400 text-xs font-medium">Progress</Text>
          </View>
          <Text className="text-blue-600 dark:text-blue-400 font-bold text-3xl mb-1">
            {metrics.inProgressCount}/{metrics.activeTasksCount}
          </Text>
          <Text className="text-slate-500 dark:text-slate-400 text-xs">
            Active Tasks
          </Text>
          {metrics.blockedCount > 0 && (
            <View className="mt-1.5 bg-red-100 dark:bg-red-900/30 rounded px-1.5 py-0.5">
              <Text className="text-red-700 dark:text-red-300 text-[10px] font-medium">
                {metrics.blockedCount} blocked
              </Text>
            </View>
          )}
        </Pressable>

        {/* Overall Health */}
        <Pressable
          onPress={() => router.push('/(tabs)/tasks')}
          className={`flex-1 rounded-xl p-3 border ${healthStatus.bg} ${healthStatus.border} active:opacity-70`}
        >
          <View className="flex-row items-center gap-2 mb-2">
            <HealthIcon size={16} color={healthStatus.color} />
            <Text className="text-slate-600 dark:text-slate-400 text-xs font-medium">Health</Text>
          </View>
          <View className="mb-1">
            <HealthIcon size={36} color={healthStatus.color} />
          </View>
          <Text className="text-slate-700 dark:text-slate-300 text-xs font-semibold">
            {healthStatus.label}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
