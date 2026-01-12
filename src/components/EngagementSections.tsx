import { View, Text, Pressable, ScrollView, Alert } from 'react-native';
import { useState, useEffect } from 'react';
import {
  Flame,
  TrendingUp,
  CheckCircle2,
  Clock,
  User,
  Target,
  AlertCircle,
  Trophy,
  Zap,
  ArrowRight,
  ThumbsUp,
  FileCheck,
  UserPlus,
  Activity
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { getStreakData, getActivityFeed, type StreakData, type ActivityItem } from '@/lib/engagement-tracking';
import { router } from 'expo-router';
import type { Task } from '@/types';

interface EngagementSectionsProps {
  role: 'Founder' | 'FractionalExec' | 'Apprentice';
  tasks?: Task[];
  userName?: string;
}

export function EngagementSections({ role, tasks = [], userName }: EngagementSectionsProps) {
  const [streakData, setStreakData] = useState<StreakData | null>(null);
  const [activityFeed, setActivityFeed] = useState<ActivityItem[]>([]);

  useEffect(() => {
    loadEngagementData();
  }, []);

  const loadEngagementData = async () => {
    const streak = await getStreakData();
    const feed = await getActivityFeed(5);
    setStreakData(streak);
    setActivityFeed(feed);
  };

  // Get today's priority tasks
  const todayTasks = tasks
    .filter(t => t.status !== 'done')
    .sort((a, b) => {
      const priorityOrder: Record<string, number> = {
        urgent: 4,
        high: 3,
        medium: 2,
        low: 1,
      };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    })
    .slice(0, 3);

  const completedToday = streakData?.todayCompletions || 0;
  const pendingCount = tasks.filter(t => t.status === 'todo' || t.status === 'in_progress').length;

  const getActivityIcon = (type: ActivityItem['type']) => {
    switch (type) {
      case 'task_completed':
        return <CheckCircle2 size={16} color="#10b981" />;
      case 'task_assigned':
        return <UserPlus size={16} color="#3b82f6" />;
      case 'review_approved':
        return <ThumbsUp size={16} color="#10b981" />;
      case 'review_requested':
        return <FileCheck size={16} color="#f59e0b" />;
      case 'okr_updated':
        return <Target size={16} color="#8b5cf6" />;
      case 'milestone_achieved':
        return <Trophy size={16} color="#eab308" />;
      default:
        return <Activity size={16} color="#64748b" />;
    }
  };

  const getActivityColor = (type: ActivityItem['type']) => {
    switch (type) {
      case 'task_completed':
      case 'review_approved':
        return 'text-emerald-400';
      case 'task_assigned':
        return 'text-blue-400';
      case 'review_requested':
        return 'text-amber-400';
      case 'okr_updated':
        return 'text-purple-400';
      case 'milestone_achieved':
        return 'text-yellow-400';
      default:
        return 'text-slate-400';
    }
  };

  const formatActivityTime = (timestamp: string) => {
    const now = new Date();
    const activityTime = new Date(timestamp);
    const diffMs = now.getTime() - activityTime.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return 'Yesterday';
  };

  return (
    <View className="px-6 pb-4">
      {/* Streak & Quick Stats */}
      <View className="flex-row gap-3 mb-4">
        {/* Streak Card */}
        <Pressable
          onPress={() => {
            Alert.alert(
              '🔥 Streak Stats',
              `Current: ${streakData?.currentStreak || 0} days\nLongest: ${streakData?.longestStreak || 0} days\n\nComplete tasks daily to maintain your streak!`
            );
          }}
          className="flex-1 bg-gradient-to-br from-orange-500/20 to-red-500/20 rounded-2xl p-4 border border-orange-500/30 active:opacity-70"
        >
          <View className="flex-row items-center justify-between">
            <View>
              <View className="flex-row items-center gap-2 mb-1">
                <Flame size={20} color="#f97316" />
                <Text className="text-orange-400 text-xs font-semibold">Streak</Text>
              </View>
              <Text className="text-gray-900 dark:text-white text-3xl font-bold">
                {streakData?.currentStreak || 0}
              </Text>
              <Text className="text-gray-600 dark:text-slate-400 text-xs mt-1">
                Best: {streakData?.longestStreak || 0} days
              </Text>
            </View>
            {(streakData?.currentStreak || 0) > 0 && (
              <View className="bg-orange-500/20 px-3 py-1.5 rounded-full">
                <Text className="text-orange-400 text-lg font-bold">🔥</Text>
              </View>
            )}
          </View>
        </Pressable>

        {/* Quick Win Counter */}
        <Pressable
          onPress={() => router.push('/(tabs)/work')}
          className="flex-1 bg-gray-100 dark:bg-slate-900 rounded-2xl p-4 border border-gray-300 dark:border-slate-800 active:opacity-70"
        >
          <View className="flex-row items-center gap-2 mb-1">
            <Zap size={20} color="#eab308" />
            <Text className="text-gray-600 dark:text-slate-400 text-xs font-semibold">Today</Text>
          </View>
          <Text className="text-gray-900 dark:text-white text-3xl font-bold">{completedToday}</Text>
          <Text className="text-gray-600 dark:text-slate-400 text-xs mt-1">
            {pendingCount} pending
          </Text>
        </Pressable>
      </View>

      {/* Today's Focus */}
      {todayTasks.length > 0 && (
        <View className="mb-4">
          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-gray-900 dark:text-white text-lg font-semibold">Today's Focus</Text>
            <Pressable onPress={() => router.push('/(tabs)/work')} className="active:opacity-70">
              <Text className="text-blue-400 text-sm">View All</Text>
            </Pressable>
          </View>

          <View className="gap-2">
            {todayTasks.map((task, index) => {
              const priorityColors: Record<string, { bg: string; text: string; border: string }> = {
                urgent: { bg: 'bg-red-500/10', text: 'text-red-400', border: 'border-red-500/30' },
                high: { bg: 'bg-orange-500/10', text: 'text-orange-400', border: 'border-orange-500/30' },
                medium: { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/30' },
                low: { bg: 'bg-slate-500/10', text: 'text-slate-400', border: 'border-slate-500/30' },
              };

              const colors = priorityColors[task.priority] || priorityColors.medium;

              return (
                <Pressable
                  key={task.id}
                  onPress={() => router.push('/(tabs)/work')}
                  className={`${colors.bg} rounded-xl p-3 border ${colors.border} active:opacity-70`}
                >
                  <View className="flex-row items-center justify-between">
                    <View className="flex-1 mr-3">
                      <View className="flex-row items-center gap-2 mb-1">
                        <View className={`${colors.bg} px-2 py-0.5 rounded`}>
                          <Text className={`${colors.text} text-xs font-semibold uppercase`}>
                            {task.priority}
                          </Text>
                        </View>
                        <Text className="text-gray-600 dark:text-slate-500 text-xs">{task.function}</Text>
                      </View>
                      <Text className="text-gray-900 dark:text-white font-medium" numberOfLines={1}>
                        {task.title}
                      </Text>
                    </View>
                    <ArrowRight size={20} color="#64748b" />
                  </View>
                </Pressable>
              );
            })}
          </View>
        </View>
      )}

      {/* Recent Activity Feed */}
      {activityFeed.length > 0 && (
        <View className="mb-4">
          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-gray-900 dark:text-white text-lg font-semibold">Recent Activity</Text>
            <View className="flex-row items-center gap-1">
              <Activity size={16} color="#64748b" />
              <Text className="text-gray-600 dark:text-slate-400 text-sm">Live</Text>
            </View>
          </View>

          <View className="bg-gray-100 dark:bg-slate-900 rounded-2xl border border-gray-300 dark:border-slate-800 overflow-hidden">
            {activityFeed.map((item, index) => (
              <View
                key={item.id}
                className={`p-3 flex-row items-start gap-3 ${
                  index < activityFeed.length - 1 ? 'border-b border-slate-800' : ''
                }`}
              >
                <View className="mt-0.5">{getActivityIcon(item.type)}</View>
                <View className="flex-1">
                  <Text className={`${getActivityColor(item.type)} font-medium text-sm mb-0.5`}>
                    {item.title}
                  </Text>
                  <Text className="text-gray-600 dark:text-slate-400 text-xs" numberOfLines={1}>
                    {item.description}
                  </Text>
                  <Text className="text-gray-600 dark:text-slate-500 text-xs mt-1">
                    {item.userName} • {formatActivityTime(item.timestamp)}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Motivational Quick Actions */}
      <View className="flex-row gap-3">
        <Pressable
          onPress={() => router.push('/(tabs)/work')}
          className="flex-1 active:opacity-70"
        >
          <LinearGradient
            colors={['#3b82f6', '#2563eb']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{
              borderRadius: 16,
              padding: 16,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
            }}
          >
            <CheckCircle2 size={20} color="#fff" />
            <Text className="text-gray-900 dark:text-white font-bold">Complete Task</Text>
          </LinearGradient>
        </Pressable>

        <Pressable
          onPress={() => router.push('/(tabs)/okrs')}
          className="flex-1 active:opacity-70"
        >
          <View className="bg-gray-100 dark:bg-slate-900 rounded-2xl p-4 border border-gray-300 dark:border-slate-800 flex-row items-center justify-center gap-2">
            <Target size={20} color="#8b5cf6" />
            <Text className="text-gray-700 dark:text-slate-300 font-bold">Update OKRs</Text>
          </View>
        </Pressable>
      </View>
    </View>
  );
}
