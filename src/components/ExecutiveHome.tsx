/**
 * Executive Home Dashboard
 * Multi-company view with domain-specific access for fractional executives
 */

import { View, Text, ScrollView, Pressable, RefreshControl, Modal } from 'react-native';
import { useState, useMemo } from 'react';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Briefcase,
  Clock,
  Users,
  Target,
  ChevronRight,
  Calendar,
  DollarSign,
  TrendingUp,
  CheckSquare,
  AlertCircle,
  Play,
  MessageSquare,
  User,
  Building2,
  Settings,
  BarChart3,
  Zap,
} from 'lucide-react-native';

// Stores
import { useWorkPlanStore } from '@/lib/state/work-plan-store';
import { useOrganizationStore } from '@/lib/state/organization-store';
import { useOKRStore } from '@/lib/state/okr-store';
import { useAppStore, useCurrentWorkspace } from '@/lib/state/app-store';
import { useAllocationRequestStore } from '@/lib/state/allocation-request-store';

// Components
import { ExecutiveTeamDashboard } from '@/components/ExecutiveTeamDashboard';

// Mock data for multi-company engagements (would come from backend in real app)
const MOCK_ENGAGEMENTS = [
  {
    id: 'eng-1',
    companyName: 'TechStart Inc',
    role: 'VP Finance',
    daysPerWeek: 2,
    status: 'active' as const,
    hoursThisWeek: 12,
    pendingTasks: 3,
    color: '#3b82f6',
  },
  {
    id: 'eng-2',
    companyName: 'GreenEnergy Co',
    role: 'Fractional CFO',
    daysPerWeek: 1,
    status: 'active' as const,
    hoursThisWeek: 6,
    pendingTasks: 1,
    color: '#10b981',
  },
];

export function ExecutiveHome() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);
  const [showTeamDashboard, setShowTeamDashboard] = useState(false);

  // Get current user and workspace
  const currentUser = useAppStore((s) => s.currentUser);
  const currentWorkspace = useCurrentWorkspace();

  // Get work plans
  const workPlans = useWorkPlanStore((s) => s.workPlans);
  const members = useOrganizationStore((s) => s.members);
  const okrs = useOKRStore((s) => s.okrs);

  // Get pending allocation requests
  const myRequests = useAllocationRequestStore((s) => s.getRequestsByRequester(currentUser?.id || ''));

  // Find the current user's member profile
  const myMember = useMemo(() => {
    return members.find(m =>
      m.name.toLowerCase().includes(currentUser?.name?.toLowerCase() || '') ||
      m.email?.toLowerCase() === currentUser?.email?.toLowerCase()
    );
  }, [members, currentUser]);

  // Get apprentices I'm mentoring
  const myApprentices = useMemo(() => {
    if (!myMember) return [];
    return members.filter(m =>
      m.role === 'Apprentice' && m.function === myMember.function
    );
  }, [members, myMember]);

  // Get tasks in my function
  const functionTasks = useMemo(() => {
    if (!myMember) return [];
    return workPlans.filter(wp => wp.function === myMember.function);
  }, [workPlans, myMember]);

  const activeTasks = functionTasks.filter(t => t.status === 'in-progress');
  // Note: Work plans use different statuses - 'blocked' is valid, 'in-review' is not
  const pendingVerifications = functionTasks.filter(t => t.status === 'blocked');
  const blockedTasks = functionTasks.filter(t => t.status === 'blocked');

  // Get OKRs for my function
  const functionOKRs = useMemo(() => {
    if (!myMember) return [];
    return okrs.filter(o => o.function === myMember.function || o.owner === myMember.id);
  }, [okrs, myMember]);

  // Calculate total hours this week across all engagements
  const totalHoursThisWeek = MOCK_ENGAGEMENTS.reduce((sum, e) => sum + e.hoursThisWeek, 0);
  const totalDaysCommitted = MOCK_ENGAGEMENTS.reduce((sum, e) => sum + e.daysPerWeek, 0);

  const handleRefresh = async () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  };

  return (
    <View className="flex-1 bg-slate-50 dark:bg-slate-950">
      {/* Header */}
      <LinearGradient
        colors={['#7c3aed', '#6d28d9', '#5b21b6']}
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
              Executive Dashboard
            </Text>
            <Text className="text-white text-2xl font-bold">
              Welcome, {currentUser?.name?.split(' ')[0] || 'Executive'}
            </Text>
          </View>
          <Pressable
            onPress={() => router.push('/settings')}
            className="bg-white/20 p-3 rounded-full"
          >
            <Settings size={20} color="white" />
          </Pressable>
        </View>

        {/* Quick Stats */}
        <View className="flex-row gap-3">
          <View className="flex-1 bg-white/20 rounded-xl p-3">
            <Text className="text-white/80 text-xs mb-1">Engagements</Text>
            <Text className="text-white text-2xl font-bold">{MOCK_ENGAGEMENTS.length}</Text>
          </View>
          <View className="flex-1 bg-white/20 rounded-xl p-3">
            <Text className="text-white/80 text-xs mb-1">Days/Week</Text>
            <Text className="text-white text-2xl font-bold">{totalDaysCommitted}</Text>
          </View>
          <View className="flex-1 bg-white/20 rounded-xl p-3">
            <Text className="text-white/80 text-xs mb-1">Hours Logged</Text>
            <Text className="text-white text-2xl font-bold">{totalHoursThisWeek}</Text>
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
        {/* Company Engagements */}
        <View className="px-5 pt-5">
          <View className="flex-row items-center justify-between mb-3">
            <View className="flex-row items-center gap-2">
              <Building2 size={18} color="#7c3aed" />
              <Text className="text-slate-900 dark:text-white text-base font-bold">
                My Companies
              </Text>
            </View>
            <Pressable onPress={() => router.push('/engagements')}>
              <Text className="text-purple-600 dark:text-purple-400 text-sm font-semibold">
                View All
              </Text>
            </Pressable>
          </View>

          <View className="gap-3">
            {MOCK_ENGAGEMENTS.map((engagement) => (
              <Pressable
                key={engagement.id}
                onPress={() => router.push('/engagements')}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 active:opacity-70"
              >
                <View className="flex-row items-center gap-3">
                  <View
                    className="w-12 h-12 rounded-xl items-center justify-center"
                    style={{ backgroundColor: `${engagement.color}20` }}
                  >
                    <Building2 size={24} color={engagement.color} />
                  </View>
                  <View className="flex-1">
                    <Text className="text-slate-900 dark:text-white font-bold text-base">
                      {engagement.companyName}
                    </Text>
                    <Text className="text-slate-600 dark:text-slate-400 text-sm">
                      {engagement.role} • {engagement.daysPerWeek} days/week
                    </Text>
                  </View>
                  <View className="items-end">
                    <View className="bg-emerald-100 dark:bg-emerald-900/30 px-2 py-1 rounded-full mb-1">
                      <Text className="text-emerald-600 dark:text-emerald-400 text-xs font-bold">
                        Active
                      </Text>
                    </View>
                    {engagement.pendingTasks > 0 && (
                      <Text className="text-slate-500 dark:text-slate-500 text-xs">
                        {engagement.pendingTasks} tasks
                      </Text>
                    )}
                  </View>
                </View>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Current Company Focus (selected workspace) */}
        {currentWorkspace && (
          <View className="px-5 pt-5">
            <View className="bg-purple-50 dark:bg-purple-900/10 border-2 border-purple-200 dark:border-purple-800 rounded-2xl p-4">
              <View className="flex-row items-center gap-2 mb-3">
                <Zap size={16} color="#7c3aed" />
                <Text className="text-purple-600 dark:text-purple-400 text-xs font-bold uppercase">
                  Currently Viewing
                </Text>
              </View>
              <Text className="text-slate-900 dark:text-white text-xl font-bold mb-1">
                {currentWorkspace.name}
              </Text>
              <Text className="text-slate-600 dark:text-slate-400 text-sm">
                {myMember?.function || 'General'} Function • {activeTasks.length} active tasks
              </Text>
            </View>
          </View>
        )}

        {/* My Apprentices */}
        {myApprentices.length > 0 && (
          <View className="px-5 pt-5">
            <View className="flex-row items-center justify-between mb-3">
              <View className="flex-row items-center gap-2">
                <Users size={18} color="#10b981" />
                <Text className="text-slate-900 dark:text-white text-base font-bold">
                  My Apprentices
                </Text>
              </View>
              <Pressable
                onPress={() => setShowTeamDashboard(true)}
                className="bg-emerald-100 dark:bg-emerald-900/30 px-3 py-1 rounded-full"
              >
                <Text className="text-emerald-600 dark:text-emerald-400 text-xs font-bold">
                  Manage Team
                </Text>
              </Pressable>
            </View>

            <View className="flex-row gap-3">
              {myApprentices.slice(0, 3).map((apprentice) => {
                const apprenticeTasks = functionTasks.filter(t =>
                  t.assignedMemberIds?.includes(apprentice.id)
                );
                const completedCount = apprenticeTasks.filter(t => t.status === 'completed').length;

                return (
                  <Pressable
                    key={apprentice.id}
                    onPress={() => router.push('/learning')}
                    className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3 active:opacity-70"
                  >
                    <View className="bg-emerald-100 dark:bg-emerald-900/30 w-10 h-10 rounded-full items-center justify-center mb-2">
                      <User size={20} color="#10b981" />
                    </View>
                    <Text className="text-slate-900 dark:text-white font-bold text-sm" numberOfLines={1}>
                      {apprentice.name.split(' ')[0]}
                    </Text>
                    <Text className="text-slate-500 dark:text-slate-500 text-xs">
                      {completedCount} done
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        )}

        {/* Pending Verifications */}
        {pendingVerifications.length > 0 && (
          <View className="px-5 pt-5">
            <Pressable
              onPress={() => router.push('/(tabs)/what')}
              className="active:opacity-70"
            >
              <LinearGradient
                colors={['#f59e0b', '#d97706']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={{ borderRadius: 16, padding: 16, flexDirection: 'row', alignItems: 'center' }}
              >
                <View className="bg-white/20 p-3 rounded-full">
                  <CheckSquare size={24} color="white" />
                </View>
                <View className="flex-1 ml-3">
                  <Text className="text-white font-bold text-base">
                    {pendingVerifications.length} Pending Verification{pendingVerifications.length !== 1 ? 's' : ''}
                  </Text>
                  <Text className="text-white/80 text-sm mt-0.5">
                    Review apprentice work
                  </Text>
                </View>
                <ChevronRight size={20} color="white" />
              </LinearGradient>
            </Pressable>
          </View>
        )}

        {/* Function OKRs */}
        <View className="px-5 pt-5">
          <View className="flex-row items-center justify-between mb-3">
            <View className="flex-row items-center gap-2">
              <Target size={18} color="#3b82f6" />
              <Text className="text-slate-900 dark:text-white text-base font-bold">
                {myMember?.function || 'My'} OKRs
              </Text>
            </View>
            <Pressable onPress={() => router.push('/(tabs)/why')}>
              <Text className="text-blue-600 dark:text-blue-400 text-sm font-semibold">
                View All
              </Text>
            </Pressable>
          </View>

          {functionOKRs.length === 0 ? (
            <View className="bg-slate-100 dark:bg-slate-900 rounded-2xl p-4">
              <Text className="text-slate-600 dark:text-slate-400 text-sm text-center">
                No OKRs assigned to your function yet
              </Text>
            </View>
          ) : (
            <View className="gap-3">
              {functionOKRs.slice(0, 2).map((okr) => {
                // Calculate average progress from objectives
                const totalObjectives = okr.objectives?.length || 0;
                const avgProgress = totalObjectives > 0
                  ? Math.round(okr.objectives.reduce((sum, o) => sum + (o.progress || 0), 0) / totalObjectives)
                  : 0;

                return (
                  <View
                    key={okr.id}
                    className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4"
                  >
                    <Text className="text-slate-900 dark:text-white font-bold text-base mb-2" numberOfLines={2}>
                      {okr.title}
                    </Text>
                    <View className="flex-row items-center gap-2">
                      <View className="flex-1 h-2 bg-slate-200 dark:bg-slate-800 rounded-full">
                        <View
                          className="h-full bg-blue-500 rounded-full"
                          style={{ width: `${avgProgress}%` }}
                        />
                      </View>
                      <Text className="text-slate-600 dark:text-slate-400 text-sm font-semibold">
                        {avgProgress}%
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </View>

        {/* Active Tasks in Function */}
        <View className="px-5 pt-5">
          <View className="flex-row items-center justify-between mb-3">
            <View className="flex-row items-center gap-2">
              <Play size={18} color="#f59e0b" />
              <Text className="text-slate-900 dark:text-white text-base font-bold">
                Active Work
              </Text>
            </View>
            <Text className="text-slate-500 dark:text-slate-500 text-sm">
              {activeTasks.length} in progress
            </Text>
          </View>

          {activeTasks.length === 0 ? (
            <View className="bg-slate-100 dark:bg-slate-900 rounded-2xl p-4">
              <Text className="text-slate-600 dark:text-slate-400 text-sm text-center">
                No active tasks in your function
              </Text>
            </View>
          ) : (
            <View className="gap-2">
              {activeTasks.slice(0, 3).map((task) => {
                const assignee = members.find(m => task.assignedMemberIds?.includes(m.id));
                return (
                  <Pressable
                    key={task.id}
                    onPress={() => router.push('/(tabs)/what')}
                    className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3 flex-row items-center active:opacity-70"
                  >
                    <View className="bg-amber-100 dark:bg-amber-900/30 w-2 h-2 rounded-full mr-3" />
                    <View className="flex-1">
                      <Text className="text-slate-900 dark:text-white font-medium" numberOfLines={1}>
                        {task.title}
                      </Text>
                      <Text className="text-slate-500 dark:text-slate-500 text-xs">
                        {assignee?.name || 'Unassigned'} • {task.estimatedTimeUnits} TU
                      </Text>
                    </View>
                    <ChevronRight size={16} color="#64748b" />
                  </Pressable>
                );
              })}
            </View>
          )}
        </View>

        {/* Quick Actions */}
        <View className="px-5 pt-5">
          <Text className="text-slate-500 dark:text-slate-500 text-xs font-semibold mb-3 uppercase tracking-wider">
            Quick Actions
          </Text>

          <View className="flex-row gap-3">
            <Pressable
              onPress={() => router.push('/utilization')}
              className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 active:opacity-70"
            >
              <BarChart3 size={24} color="#3b82f6" />
              <Text className="text-slate-900 dark:text-white font-bold mt-2">Utilization</Text>
              <Text className="text-slate-500 dark:text-slate-500 text-xs mt-1">
                Track hours
              </Text>
            </Pressable>

            <Pressable
              onPress={() => router.push('/reports')}
              className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 active:opacity-70"
            >
              <DollarSign size={24} color="#10b981" />
              <Text className="text-slate-900 dark:text-white font-bold mt-2">Reports</Text>
              <Text className="text-slate-500 dark:text-slate-500 text-xs mt-1">
                Performance
              </Text>
            </Pressable>

            <Pressable
              onPress={() => router.push('/calendar')}
              className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 active:opacity-70"
            >
              <Calendar size={24} color="#8b5cf6" />
              <Text className="text-slate-900 dark:text-white font-bold mt-2">Calendar</Text>
              <Text className="text-slate-500 dark:text-slate-500 text-xs mt-1">
                Schedule
              </Text>
            </Pressable>
          </View>
        </View>

        {/* Time Tracking Reminder */}
        <View className="px-5 pt-5">
          <Pressable
            onPress={() => router.push('/utilization')}
            className="active:opacity-70"
          >
            <LinearGradient
              colors={['#3b82f6', '#2563eb']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{ borderRadius: 16, padding: 16 }}
            >
              <View className="flex-row items-center gap-3">
                <View className="bg-white/20 p-3 rounded-full">
                  <Clock size={24} color="white" />
                </View>
                <View className="flex-1">
                  <Text className="text-white font-bold text-base">
                    Log Your Hours
                  </Text>
                  <Text className="text-white/80 text-sm mt-0.5">
                    {totalHoursThisWeek}h logged this week across {MOCK_ENGAGEMENTS.length} companies
                  </Text>
                </View>
                <ChevronRight size={20} color="white" />
              </View>
            </LinearGradient>
          </Pressable>
        </View>
      </ScrollView>

      {/* Team Dashboard Modal */}
      <Modal
        visible={showTeamDashboard}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowTeamDashboard(false)}
      >
        <View className="flex-1 bg-slate-50 dark:bg-slate-950">
          {/* Modal Header */}
          <View className="flex-row items-center justify-between px-4 py-4 border-b border-gray-200 dark:border-slate-800">
            <Text className="text-gray-900 dark:text-white font-bold text-lg">
              Team Management
            </Text>
            <Pressable
              onPress={() => setShowTeamDashboard(false)}
              className="bg-gray-100 dark:bg-slate-800 px-4 py-2 rounded-full"
            >
              <Text className="text-gray-700 dark:text-slate-300 font-medium">Done</Text>
            </Pressable>
          </View>

          {/* Executive Team Dashboard */}
          <ExecutiveTeamDashboard />
        </View>
      </Modal>
    </View>
  );
}
