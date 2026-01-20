/**
 * AI Insights Panel - Redesigned
 * Shows high-level insights without navigation chaos
 * Focuses on information, not action
 */

import { View, Text, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Sparkles, Target, Zap, AlertTriangle, ChevronRight, TrendingUp } from 'lucide-react-native';
import { useMemo } from 'react';
import { useWorkPlanStore } from '@/lib/state/work-plan-store';
import { useOrganizationStore } from '@/lib/state/organization-store';
import { getFocusTodayTasks } from '@/lib/ai-priority-scoring';

export function AIInsightsPanel() {
  const router = useRouter();
  const workPlans = useWorkPlanStore((s) => s.workPlans);
  const members = useOrganizationStore((s) => s.members);

  const insights = useMemo(() => {
    const activeTasks = workPlans.filter(
      wp => wp.status !== 'completed' && wp.status !== 'abandoned'
    );

    // Count critical items
    const blockedCount = activeTasks.filter(wp => wp.status === 'blocked').length;
    const overdueCount = activeTasks.filter(wp => new Date(wp.dueDate) < new Date()).length;
    const criticalCount = getFocusTodayTasks(workPlans, members, 10).filter(t => t.level === 'critical').length;

    // Count quick wins (small tasks that can be done quickly)
    const quickWinCount = activeTasks.filter(wp =>
      wp.estimatedTimeUnits > 0 &&
      wp.estimatedTimeUnits <= 3 &&
      wp.status === 'not-started'
    ).length;

    // Calculate momentum (in-progress tasks)
    const inProgressCount = activeTasks.filter(wp => wp.status === 'in-progress').length;

    return {
      blockedCount,
      overdueCount,
      criticalCount,
      quickWinCount,
      inProgressCount,
      hasIssues: blockedCount > 0 || overdueCount > 0 || criticalCount > 0,
    };
  }, [workPlans, members]);

  return (
    <View>
      {/* Header */}
      <View className="flex-row items-center justify-between mb-3">
        <View className="flex-row items-center gap-2">
          <View className="w-7 h-7 rounded-full bg-purple-100 dark:bg-purple-900/30 items-center justify-center">
            <Sparkles size={14} color="#8b5cf6" />
          </View>
          <Text className="text-slate-900 dark:text-white font-bold text-base">
            AI Insights
          </Text>
        </View>
        <Pressable
          onPress={() => router.push('/(tabs)/tasks')}
          className="flex-row items-center gap-1"
        >
          <Text className="text-purple-600 dark:text-purple-400 text-sm font-semibold">View Tasks</Text>
          <ChevronRight size={16} color="#8b5cf6" />
        </Pressable>
      </View>

      {/* Insights Grid */}
      {!insights.hasIssues && insights.inProgressCount > 0 ? (
        <View className="bg-emerald-50 dark:bg-emerald-900/20 rounded-lg p-4">
          <View className="flex-row items-center gap-2 mb-1">
            <TrendingUp size={16} color="#10b981" />
            <Text className="text-emerald-700 dark:text-emerald-300 font-bold text-sm">
              Good Momentum
            </Text>
          </View>
          <Text className="text-emerald-600 dark:text-emerald-400 text-xs">
            {insights.inProgressCount} tasks in progress, no blockers
          </Text>
        </View>
      ) : (
        <View className="gap-2">
          {/* Issues Row */}
          {insights.hasIssues && (
            <View className="flex-row gap-2">
              {insights.criticalCount > 0 && (
                <View className="flex-1 bg-red-50 dark:bg-red-900/20 rounded-lg p-3 border border-red-200 dark:border-red-800">
                  <Target size={14} color="#ef4444" />
                  <Text className="text-red-600 dark:text-red-400 font-bold text-2xl mt-1">
                    {insights.criticalCount}
                  </Text>
                  <Text className="text-red-700 dark:text-red-300 text-xs font-medium">
                    Critical
                  </Text>
                </View>
              )}

              {insights.blockedCount > 0 && (
                <View className="flex-1 bg-amber-50 dark:bg-amber-900/20 rounded-lg p-3 border border-amber-200 dark:border-amber-800">
                  <AlertTriangle size={14} color="#f59e0b" />
                  <Text className="text-amber-600 dark:text-amber-400 font-bold text-2xl mt-1">
                    {insights.blockedCount}
                  </Text>
                  <Text className="text-amber-700 dark:text-amber-300 text-xs font-medium">
                    Blocked
                  </Text>
                </View>
              )}

              {insights.overdueCount > 0 && (
                <View className="flex-1 bg-orange-50 dark:bg-orange-900/20 rounded-lg p-3 border border-orange-200 dark:border-orange-800">
                  <AlertTriangle size={14} color="#f97316" />
                  <Text className="text-orange-600 dark:text-orange-400 font-bold text-2xl mt-1">
                    {insights.overdueCount}
                  </Text>
                  <Text className="text-orange-700 dark:text-orange-300 text-xs font-medium">
                    Overdue
                  </Text>
                </View>
              )}
            </View>
          )}

          {/* Opportunities Row */}
          <View className="flex-row gap-2">
            <View className="flex-1 bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 border border-blue-200 dark:border-blue-800">
              <TrendingUp size={14} color="#3b82f6" />
              <Text className="text-blue-600 dark:text-blue-400 font-bold text-2xl mt-1">
                {insights.inProgressCount}
              </Text>
              <Text className="text-blue-700 dark:text-blue-300 text-xs font-medium">
                In Progress
              </Text>
            </View>

            {insights.quickWinCount > 0 && (
              <View className="flex-1 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg p-3 border border-emerald-200 dark:border-emerald-800">
                <Zap size={14} color="#10b981" />
                <Text className="text-emerald-600 dark:text-emerald-400 font-bold text-2xl mt-1">
                  {insights.quickWinCount}
                </Text>
                <Text className="text-emerald-700 dark:text-emerald-300 text-xs font-medium">
                  Quick Wins
                </Text>
              </View>
            )}
          </View>
        </View>
      )}
    </View>
  );
}
