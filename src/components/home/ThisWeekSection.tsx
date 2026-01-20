/**
 * This Week Component
 * Shows upcoming milestones and deadlines for the current week
 * Forward-looking view to help with prioritization
 */

import { View, Text, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Calendar, ChevronRight, AlertCircle, Clock } from 'lucide-react-native';
import { useMemo } from 'react';
import { useWorkPlanStore } from '@/lib/state/work-plan-store';

export function ThisWeekSection() {
  const router = useRouter();
  const workPlans = useWorkPlanStore((s) => s.workPlans);

  const weekTasks = useMemo(() => {
    const now = new Date();
    const endOfWeek = new Date(now);
    endOfWeek.setDate(now.getDate() + (7 - now.getDay())); // End of this week (Sunday)

    const tasksThisWeek = workPlans
      .filter(wp => {
        if (wp.status === 'completed' || wp.status === 'abandoned') return false;
        const dueDate = new Date(wp.dueDate);
        return dueDate >= now && dueDate <= endOfWeek;
      })
      .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
      .slice(0, 4); // Show max 4 items

    const overdueTasks = workPlans.filter(wp => {
      if (wp.status === 'completed' || wp.status === 'abandoned') return false;
      return new Date(wp.dueDate) < now;
    }).length;

    const atRiskTasks = workPlans.filter(wp => {
      if (wp.status === 'completed' || wp.status === 'abandoned') return false;
      const dueDate = new Date(wp.dueDate);
      const daysUntilDue = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      return daysUntilDue <= 2 && daysUntilDue >= 0 && wp.progress < 50;
    }).length;

    return {
      tasks: tasksThisWeek,
      overdueCount: overdueTasks,
      atRiskCount: atRiskTasks,
    };
  }, [workPlans]);

  const getDayLabel = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(now.getDate() + 1);

    if (date.toDateString() === now.toDateString()) return 'Today';
    if (date.toDateString() === tomorrow.toDateString()) return 'Tomorrow';

    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return days[date.getDay()];
  };

  if (weekTasks.tasks.length === 0 && weekTasks.overdueCount === 0) {
    return (
      <View>
        <Text className="text-slate-900 dark:text-white font-bold text-base mb-3">
          📅 This Week
        </Text>
        <View className="bg-slate-50 dark:bg-slate-900 rounded-lg p-4">
          <Text className="text-slate-600 dark:text-slate-400 text-sm">
            No deadlines this week - smooth sailing ahead! ⛵
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View>
      {/* Header */}
      <View className="flex-row items-center justify-between mb-3">
        <Text className="text-slate-900 dark:text-white font-bold text-base">
          📅 This Week
        </Text>
        {(weekTasks.overdueCount > 0 || weekTasks.atRiskCount > 0) && (
          <View className="flex-row items-center gap-1 bg-amber-100 dark:bg-amber-900/30 px-2 py-1 rounded">
            <AlertCircle size={12} color="#f59e0b" />
            <Text className="text-amber-700 dark:text-amber-300 text-xs font-medium">
              {weekTasks.overdueCount > 0 ? `${weekTasks.overdueCount} overdue` : `${weekTasks.atRiskCount} at risk`}
            </Text>
          </View>
        )}
      </View>

      {/* Upcoming Tasks */}
      <View className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
        {weekTasks.tasks.map((task, index) => {
          const isOverdue = new Date(task.dueDate) < new Date();
          const dayLabel = getDayLabel(task.dueDate);

          return (
            <Pressable
              key={task.id}
              onPress={() => router.push({ pathname: '/(tabs)/tasks', params: { selectedTaskId: task.id } })}
              className={`flex-row items-center p-3 active:bg-slate-50 dark:active:bg-slate-800 ${
                index < weekTasks.tasks.length - 1 ? 'border-b border-slate-100 dark:border-slate-800' : ''
              }`}
            >
              {/* Day indicator */}
              <View className={`w-16 mr-3 ${isOverdue ? 'opacity-100' : ''}`}>
                <Text className={`text-xs font-bold ${isOverdue ? 'text-red-600 dark:text-red-400' : 'text-slate-900 dark:text-white'}`}>
                  {isOverdue ? 'Overdue' : dayLabel}
                </Text>
                <Text className="text-slate-500 dark:text-slate-400 text-[10px]">
                  {new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </Text>
              </View>

              {/* Task info */}
              <View className="flex-1">
                <Text className="text-slate-900 dark:text-white font-semibold text-sm mb-0.5" numberOfLines={1}>
                  {task.title}
                </Text>
                <View className="flex-row items-center gap-2">
                  {task.status === 'blocked' && (
                    <View className="flex-row items-center gap-1">
                      <AlertCircle size={10} color="#ef4444" />
                      <Text className="text-red-600 dark:text-red-400 text-[10px] font-medium">
                        Blocked
                      </Text>
                    </View>
                  )}
                  {task.progress > 0 && (
                    <Text className="text-slate-500 dark:text-slate-400 text-[10px]">
                      {task.progress}% complete
                    </Text>
                  )}
                </View>
              </View>

              {/* Chevron */}
              <ChevronRight size={16} color="#94a3b8" />
            </Pressable>
          );
        })}

        {/* View All Link */}
        {weekTasks.tasks.length > 0 && (
          <Pressable
            onPress={() => router.push('/(tabs)/when')}
            className="flex-row items-center justify-center p-2.5 bg-slate-50 dark:bg-slate-800 active:opacity-70"
          >
            <Text className="text-purple-600 dark:text-purple-400 text-xs font-semibold mr-1">
              View Full Timeline
            </Text>
            <ChevronRight size={14} color="#8b5cf6" />
          </Pressable>
        )}
      </View>
    </View>
  );
}
