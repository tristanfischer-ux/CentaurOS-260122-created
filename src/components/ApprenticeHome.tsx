/**
 * Apprentice Home Dashboard
 * Task-focused, learning-oriented view for apprentices
 */

import { View, Text, ScrollView, Pressable, RefreshControl } from 'react-native';
import { useState, useMemo } from 'react';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import {
  CheckSquare,
  Clock,
  Target,
  BookOpen,
  MessageSquare,
  ChevronRight,
  Award,
  TrendingUp,
  Zap,
  User,
  CheckCircle2,
  AlertCircle,
  Play,
  Star,
  Calendar,
} from 'lucide-react-native';

// Stores
import { useWorkPlanStore } from '@/lib/state/work-plan-store';
import { useOrganizationStore } from '@/lib/state/organization-store';
import { useAppStore } from '@/lib/state/app-store';

// Components
import { RoleSwitcher } from '@/components/RoleSwitcher';
import { filterWorkPlansByRole } from '@/lib/role-utils';

export function ApprenticeHome() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);

  // Get current user
  const currentUser = useAppStore((s) => s.currentUser);

  // Get work plans and filter for apprentice's tasks
  const workPlans = useWorkPlanStore((s) => s.workPlans);
  const members = useOrganizationStore((s) => s.members);

  // Find the current user's member profile
  const myMember = useMemo(() => {
    return members.find(m =>
      m.name.toLowerCase().includes(currentUser?.name?.toLowerCase() || '') ||
      m.email?.toLowerCase() === currentUser?.email?.toLowerCase()
    );
  }, [members, currentUser]);

  // Get tasks assigned to this apprentice using centralized filtering
  const myTasks = useMemo(() => {
    if (!myMember) return [];
    return filterWorkPlansByRole(workPlans, 'Apprentice', myMember.function as any, myMember.id);
  }, [workPlans, myMember]);

  const activeTasks = myTasks.filter(t => t.status === 'in-progress');
  const pendingTasks = myTasks.filter(t => t.status === 'not-started');
  const completedTasks = myTasks.filter(t => t.status === 'completed');
  const blockedTasks = myTasks.filter(t => t.status === 'blocked');

  // Find my executive mentor
  const myExecutive = useMemo(() => {
    return members.find(m => m.role === 'FractionalExec' && m.function === myMember?.function);
  }, [members, myMember]);

  // Calculate this week's allocated TU
  const weeklyTU = useMemo(() => {
    return myTasks
      .filter(t => t.status !== 'completed' && t.status !== 'abandoned')
      .reduce((sum, t) => {
        const myAllocation = t.allocations?.find(a => a.memberId === myMember?.id);
        return sum + (myAllocation?.squaresPerWeek || 0);
      }, 0);
  }, [myTasks, myMember]);

  const handleRefresh = async () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  };

  // Calculate progress stats
  const completionRate = myTasks.length > 0
    ? Math.round((completedTasks.length / myTasks.length) * 100)
    : 0;

  return (
    <View className="flex-1 bg-slate-50 dark:bg-slate-950">
      {/* Header */}
      <LinearGradient
        colors={['#10b981', '#059669', '#047857']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={{
          paddingHorizontal: 24,
          paddingTop: insets.top + 16,
          paddingBottom: 20,
        }}
      >
        <View className="flex-row items-center justify-between mb-3">
          <View>
            <Text className="text-white/70 text-xs font-medium uppercase tracking-wide">
              Apprentice Dashboard
            </Text>
            <Text className="text-white text-2xl font-bold">
              Welcome, {currentUser?.name?.split(' ')[0] || 'Apprentice'}
            </Text>
          </View>
          <View className="flex-row items-center gap-2">
            <RoleSwitcher compact />
            <Pressable
              onPress={() => router.push('/profile')}
              className="bg-white/20 p-3 rounded-full"
            >
              <User size={20} color="white" />
            </Pressable>
          </View>
        </View>

        {/* Quick Stats */}
        <View className="flex-row gap-3">
          <View className="flex-1 bg-white/20 rounded-xl p-3">
            <Text className="text-white/80 text-xs mb-1">Active Tasks</Text>
            <Text className="text-white text-2xl font-bold">{activeTasks.length}</Text>
          </View>
          <View className="flex-1 bg-white/20 rounded-xl p-3">
            <Text className="text-white/80 text-xs mb-1">This Week</Text>
            <Text className="text-white text-2xl font-bold">{weeklyTU} TU</Text>
          </View>
          <View className="flex-1 bg-white/20 rounded-xl p-3">
            <Text className="text-white/80 text-xs mb-1">Completed</Text>
            <Text className="text-white text-2xl font-bold">{completedTasks.length}</Text>
          </View>
        </View>
      </LinearGradient>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {/* My Mentor Section */}
        {myExecutive && (
          <View className="px-5 pt-5">
            <Pressable
              onPress={() => router.push('/messages')}
              className="bg-white dark:bg-slate-900 border-2 border-emerald-200 dark:border-emerald-800 rounded-2xl p-4 active:opacity-70"
            >
              <View className="flex-row items-center gap-3">
                <View className="bg-emerald-100 dark:bg-emerald-900/30 p-3 rounded-full">
                  <User size={24} color="#10b981" />
                </View>
                <View className="flex-1">
                  <Text className="text-slate-600 dark:text-slate-400 text-xs font-medium uppercase">
                    Your Mentor
                  </Text>
                  <Text className="text-slate-900 dark:text-white text-lg font-bold">
                    {myExecutive.name}
                  </Text>
                  <Text className="text-emerald-600 dark:text-emerald-400 text-sm">
                    {myExecutive.function} Executive
                  </Text>
                </View>
                <MessageSquare size={20} color="#10b981" />
              </View>
            </Pressable>
          </View>
        )}

        {/* Active Tasks - Priority Section */}
        <View className="px-5 pt-5">
          <View className="flex-row items-center justify-between mb-3">
            <View className="flex-row items-center gap-2">
              <Zap size={18} color="#f59e0b" />
              <Text className="text-slate-900 dark:text-white text-base font-bold">
                Focus Now
              </Text>
            </View>
            {activeTasks.length > 0 && (
              <View className="bg-amber-100 dark:bg-amber-900/30 px-2 py-1 rounded-full">
                <Text className="text-amber-600 dark:text-amber-400 text-xs font-bold">
                  {activeTasks.length} Active
                </Text>
              </View>
            )}
          </View>

          {activeTasks.length === 0 ? (
            <View className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 items-center">
              <CheckCircle2 size={48} color="#10b981" />
              <Text className="text-slate-900 dark:text-white font-bold text-lg mt-3">
                All Caught Up!
              </Text>
              <Text className="text-slate-600 dark:text-slate-400 text-sm text-center mt-1">
                No active tasks. Check your queue for new work.
              </Text>
            </View>
          ) : (
            <View className="gap-3">
              {activeTasks.slice(0, 3).map((task) => (
                <Pressable
                  key={task.id}
                  onPress={() => router.push('/(tabs)/what')}
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 active:opacity-70"
                >
                  <View className="flex-row items-start justify-between">
                    <View className="flex-1">
                      <View className="flex-row items-center gap-2 mb-1">
                        <View className="bg-amber-500 w-2 h-2 rounded-full" />
                        <Text className="text-amber-600 dark:text-amber-400 text-xs font-bold uppercase">
                          In Progress
                        </Text>
                      </View>
                      <Text className="text-slate-900 dark:text-white font-bold text-base mb-1" numberOfLines={2}>
                        {task.title}
                      </Text>
                      <Text className="text-slate-500 dark:text-slate-500 text-sm">
                        {task.function} • {task.estimatedTimeUnits} TU
                      </Text>
                    </View>
                    <ChevronRight size={20} color="#64748b" />
                  </View>
                </Pressable>
              ))}
            </View>
          )}
        </View>

        {/* Blocked Tasks Alert */}
        {blockedTasks.length > 0 && (
          <View className="px-5 pt-4">
            <Pressable
              onPress={() => router.push('/(tabs)/what')}
              className="active:opacity-70"
            >
              <LinearGradient
                colors={['#ef4444', '#dc2626']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={{ borderRadius: 16, padding: 16, flexDirection: 'row', alignItems: 'center' }}
              >
                <AlertCircle size={24} color="white" />
                <View className="flex-1 ml-3">
                  <Text className="text-white font-bold">
                    {blockedTasks.length} Task{blockedTasks.length !== 1 ? 's' : ''} Blocked
                  </Text>
                  <Text className="text-white/80 text-xs mt-0.5">
                    Contact your mentor for help
                  </Text>
                </View>
                <ChevronRight size={20} color="white" />
              </LinearGradient>
            </Pressable>
          </View>
        )}

        {/* Up Next - Task Queue */}
        <View className="px-5 pt-5">
          <View className="flex-row items-center justify-between mb-3">
            <View className="flex-row items-center gap-2">
              <Clock size={18} color="#3b82f6" />
              <Text className="text-slate-900 dark:text-white text-base font-bold">
                Up Next
              </Text>
            </View>
            <Text className="text-slate-500 dark:text-slate-500 text-sm">
              {pendingTasks.length} queued
            </Text>
          </View>

          {pendingTasks.length === 0 ? (
            <View className="bg-slate-100 dark:bg-slate-900 rounded-2xl p-4">
              <Text className="text-slate-600 dark:text-slate-400 text-sm text-center">
                No pending tasks. Your mentor will assign new work soon.
              </Text>
            </View>
          ) : (
            <View className="gap-2">
              {pendingTasks.slice(0, 3).map((task, index) => (
                <View
                  key={task.id}
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3 flex-row items-center"
                >
                  <View className="bg-blue-100 dark:bg-blue-900/30 w-8 h-8 rounded-full items-center justify-center mr-3">
                    <Text className="text-blue-600 dark:text-blue-400 font-bold">{index + 1}</Text>
                  </View>
                  <View className="flex-1">
                    <Text className="text-slate-900 dark:text-white font-medium" numberOfLines={1}>
                      {task.title}
                    </Text>
                    <Text className="text-slate-500 dark:text-slate-500 text-xs">
                      {task.estimatedTimeUnits} TU • {task.function}
                    </Text>
                  </View>
                </View>
              ))}

              {pendingTasks.length > 3 && (
                <Pressable
                  onPress={() => router.push('/(tabs)/what')}
                  className="pt-2"
                >
                  <Text className="text-blue-600 dark:text-blue-400 text-sm font-bold text-center">
                    View all {pendingTasks.length} tasks →
                  </Text>
                </Pressable>
              )}
            </View>
          )}
        </View>

        {/* Progress & Learning */}
        <View className="px-5 pt-5">
          <View className="flex-row items-center gap-2 mb-3">
            <TrendingUp size={18} color="#8b5cf6" />
            <Text className="text-slate-900 dark:text-white text-base font-bold">
              Your Progress
            </Text>
          </View>

          <View className="flex-row gap-3">
            {/* Completion Rate */}
            <View className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4">
              <View className="items-center">
                <Text className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                  {completionRate}%
                </Text>
                <Text className="text-slate-600 dark:text-slate-400 text-xs mt-1">
                  Completion Rate
                </Text>
                <View className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-full mt-3">
                  <View
                    className="h-full bg-purple-500 rounded-full"
                    style={{ width: `${completionRate}%` }}
                  />
                </View>
              </View>
            </View>

            {/* Total Tasks */}
            <View className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4">
              <View className="items-center">
                <Text className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">
                  {completedTasks.length}
                </Text>
                <Text className="text-slate-600 dark:text-slate-400 text-xs mt-1">
                  Tasks Done
                </Text>
                <View className="flex-row items-center justify-center gap-1 mt-3">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      size={14}
                      color={completedTasks.length >= star * 2 ? '#fbbf24' : '#e2e8f0'}
                      fill={completedTasks.length >= star * 2 ? '#fbbf24' : 'transparent'}
                    />
                  ))}
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* Quick Actions */}
        <View className="px-5 pt-5">
          <Text className="text-slate-500 dark:text-slate-500 text-xs font-semibold mb-3 uppercase tracking-wider">
            Quick Actions
          </Text>

          <View className="flex-row gap-3">
            <Pressable
              onPress={() => router.push('/learning')}
              className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 active:opacity-70"
            >
              <BookOpen size={24} color="#8b5cf6" />
              <Text className="text-slate-900 dark:text-white font-bold mt-2">Learning</Text>
              <Text className="text-slate-500 dark:text-slate-500 text-xs mt-1">
                Courses & guides
              </Text>
            </Pressable>

            <Pressable
              onPress={() => router.push('/calendar')}
              className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 active:opacity-70"
            >
              <Calendar size={24} color="#3b82f6" />
              <Text className="text-slate-900 dark:text-white font-bold mt-2">Calendar</Text>
              <Text className="text-slate-500 dark:text-slate-500 text-xs mt-1">
                Meetings & events
              </Text>
            </Pressable>

            <Pressable
              onPress={() => router.push('/messages')}
              className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 active:opacity-70"
            >
              <MessageSquare size={24} color="#10b981" />
              <Text className="text-slate-900 dark:text-white font-bold mt-2">Messages</Text>
              <Text className="text-slate-500 dark:text-slate-500 text-xs mt-1">
                Team chat
              </Text>
            </Pressable>
          </View>
        </View>

        {/* Learning Goals Reminder */}
        <View className="px-5 pt-5">
          <Pressable
            onPress={() => router.push('/learning')}
            className="active:opacity-70"
          >
            <LinearGradient
              colors={['#8b5cf6', '#7c3aed']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{ borderRadius: 16, padding: 16 }}
            >
              <View className="flex-row items-center gap-3">
                <View className="bg-white/20 p-3 rounded-full">
                  <Award size={24} color="white" />
                </View>
                <View className="flex-1">
                  <Text className="text-white font-bold text-base">
                    Keep Learning
                  </Text>
                  <Text className="text-white/80 text-sm mt-0.5">
                    Check out new courses and skill-building resources
                  </Text>
                </View>
                <ChevronRight size={20} color="white" />
              </View>
            </LinearGradient>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}
