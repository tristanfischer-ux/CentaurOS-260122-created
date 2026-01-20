/**
 * AI Insights Panel
 * Replaces Focus Today with actionable insights instead of task cards
 * Shows WHY something matters and WHAT to do about it
 */

import { View, Text, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Sparkles, Target, Zap, AlertTriangle, ChevronRight } from 'lucide-react-native';
import { useMemo } from 'react';
import { useWorkPlanStore } from '@/lib/state/work-plan-store';
import { useOrganizationStore } from '@/lib/state/organization-store';
import { getFocusTodayTasks } from '@/lib/ai-priority-scoring';

export function AIInsightsPanel() {
  const router = useRouter();
  const workPlans = useWorkPlanStore((s) => s.workPlans);
  const members = useOrganizationStore((s) => s.members);

  const insights = useMemo(() => {
    const priorityTasks = getFocusTodayTasks(workPlans, members, 5);

    // Top Priority - Critical or High priority task
    const topPriority = priorityTasks.find(t => t.level === 'critical' || t.level === 'high');

    // Quick Win - Tasks with < 5 TUs and important priority
    const quickWin = workPlans.find(wp =>
      wp.status !== 'completed' &&
      wp.status !== 'abandoned' &&
      wp.estimatedTimeUnits <= 5 &&
      wp.estimatedTimeUnits > 0
    );

    // At Risk - Blocked tasks or overdue
    const atRisk = workPlans.find(wp =>
      wp.status === 'blocked' ||
      (wp.status !== 'completed' && wp.status !== 'abandoned' && new Date(wp.dueDate) < new Date())
    );

    return {
      topPriority,
      quickWin,
      atRisk
    };
  }, [workPlans, members]);

  const hasAnyInsights = insights.topPriority || insights.quickWin || insights.atRisk;

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

      {/* Insights */}
      {!hasAnyInsights ? (
        <View className="bg-emerald-50 dark:bg-emerald-900/20 rounded-lg p-4">
          <Text className="text-emerald-700 dark:text-emerald-300 font-semibold text-sm mb-1">
            ✨ All Clear!
          </Text>
          <Text className="text-emerald-600 dark:text-emerald-400 text-xs">
            No urgent items need your attention right now. Great work!
          </Text>
        </View>
      ) : (
        <View className="gap-2">
          {/* Top Priority */}
          {insights.topPriority && (
            <Pressable
              onPress={() => router.push({ pathname: '/(tabs)/tasks', params: { selectedTaskId: insights.topPriority!.task.id } })}
              className="bg-white dark:bg-slate-900 rounded-lg p-3 border-l-4 border-red-500 active:opacity-70"
              style={{ borderLeftWidth: 4, borderLeftColor: '#ef4444' }}
            >
              <View className="flex-row items-start gap-2 mb-2">
                <View className="bg-red-100 dark:bg-red-900/30 p-1.5 rounded-lg mt-0.5">
                  <Target size={14} color="#ef4444" />
                </View>
                <View className="flex-1">
                  <Text className="text-slate-900 dark:text-white font-bold text-sm mb-1">
                    🎯 Top Priority
                  </Text>
                  <Text className="text-slate-900 dark:text-white font-semibold text-sm mb-1">
                    {insights.topPriority.task.title}
                  </Text>
                  <Text className="text-slate-600 dark:text-slate-400 text-xs">
                    {insights.topPriority.reasoning}
                  </Text>
                </View>
              </View>
            </Pressable>
          )}

          {/* Quick Win */}
          {insights.quickWin && (
            <Pressable
              onPress={() => router.push({ pathname: '/(tabs)/tasks', params: { selectedTaskId: insights.quickWin!.id } })}
              className="bg-white dark:bg-slate-900 rounded-lg p-3 border-l-4 border-emerald-500 active:opacity-70"
              style={{ borderLeftWidth: 4, borderLeftColor: '#10b981' }}
            >
              <View className="flex-row items-start gap-2">
                <View className="bg-emerald-100 dark:bg-emerald-900/30 p-1.5 rounded-lg mt-0.5">
                  <Zap size={14} color="#10b981" />
                </View>
                <View className="flex-1">
                  <Text className="text-slate-900 dark:text-white font-bold text-sm mb-1">
                    ⚡ Quick Win
                  </Text>
                  <Text className="text-slate-900 dark:text-white font-semibold text-sm mb-1">
                    {insights.quickWin!.title}
                  </Text>
                  <Text className="text-slate-600 dark:text-slate-400 text-xs">
                    ~{insights.quickWin!.estimatedTimeUnits * 0.5}h • Easy progress boost
                  </Text>
                </View>
              </View>
            </Pressable>
          )}

          {/* At Risk */}
          {insights.atRisk && (
            <Pressable
              onPress={() => router.push({ pathname: '/(tabs)/tasks', params: { selectedTaskId: insights.atRisk!.id } })}
              className="bg-white dark:bg-slate-900 rounded-lg p-3 border-l-4 border-amber-500 active:opacity-70"
              style={{ borderLeftWidth: 4, borderLeftColor: '#f59e0b' }}
            >
              <View className="flex-row items-start gap-2">
                <View className="bg-amber-100 dark:bg-amber-900/30 p-1.5 rounded-lg mt-0.5">
                  <AlertTriangle size={14} color="#f59e0b" />
                </View>
                <View className="flex-1">
                  <Text className="text-slate-900 dark:text-white font-bold text-sm mb-1">
                    🚨 At Risk
                  </Text>
                  <Text className="text-slate-900 dark:text-white font-semibold text-sm mb-1">
                    {insights.atRisk!.title}
                  </Text>
                  <Text className="text-slate-600 dark:text-slate-400 text-xs">
                    {insights.atRisk!.status === 'blocked' ? 'Blocked - needs unblocking' : 'Overdue - needs attention'}
                  </Text>
                </View>
              </View>
            </Pressable>
          )}
        </View>
      )}
    </View>
  );
}
