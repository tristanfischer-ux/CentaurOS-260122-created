/**
 * When Tab - Full Task Timeline (Gantt Chart)
 * Shows all tasks across time in a Gantt chart view
 *
 * MIGRATION: Timeline/Gantt features moved here from 'what' tab
 * Anti-bloat: No duplicate task lists; link to Tasks for details
 *
 * IMPORTANT: This tab ONLY shows confirmed real tasks from WorkPlan store.
 * Drafts (from Draft store) are NOT shown here - they must be confirmed first.
 */

import { View, Text, Pressable } from 'react-native';
import { useState, useMemo } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import {
  Calendar,
  Clock,
  Users,
  TrendingUp,
  AlertTriangle,
} from 'lucide-react-native';
import { useOrganizationStore } from '@/lib/state/organization-store';
import { useWorkPlanStore, type WorkPlan } from '@/lib/state/work-plan-store';
import { useCurrentMembership, useCurrentWorkspace } from '@/lib/state/app-store';
import { HelpModal, HelpButton, type HelpContent } from '@/components/HelpModal';
import { SettingsGearButton } from '@/components/SettingsGearButton';
import { MiniGanttChart } from '@/components/MiniGanttChart';

const WHEN_HELP: HelpContent = {
  title: 'When',
  subtitle: 'Task timeline & delivery dates',
  description: 'The When tab shows a Gantt chart view of all your tasks across time. See when tasks start, end, and who is working on them.',
  tips: [
    'Each horizontal bar represents a task spanning across weeks',
    'Color coding shows task status: Queued (gray), In Progress (blue), Blocked (red)',
    'Tap any task to see full details and edit in the Tasks tab',
    'Timeline automatically scrolls to show current week',
    'Team member avatars show who\'s assigned to each task',
  ],
  quickActions: [
    { label: 'Task Timeline', description: 'See all tasks across weeks' },
    { label: 'Scroll Timeline', description: 'Swipe left/right to view past and future' },
    { label: 'View Task', description: 'Tap any task bar to see details' },
  ],
};

export default function WhenScreen() {
  const insets = useSafeAreaInsets();
  const currentMembership = useCurrentMembership();
  const currentWorkspace = useCurrentWorkspace();

  // Stores
  const members = useOrganizationStore(s => s.members);
  const workPlans = useWorkPlanStore(s => s.workPlans);

  // State
  const [showHelp, setShowHelp] = useState(false);

  // Calculate task stats
  const taskStats = useMemo(() => {
    const activeTasks = workPlans.filter(wp => wp.status !== 'completed' && wp.status !== 'abandoned');
    const inProgress = activeTasks.filter(wp => wp.status === 'in-progress');
    const blocked = activeTasks.filter(wp => wp.status === 'blocked');
    const queued = activeTasks.filter(wp => wp.status === 'not-started');

    // Calculate team utilization
    const totalAllocatedTUs = activeTasks.reduce((sum, task) => {
      const allocated = task.allocations?.reduce((taskSum, alloc) => taskSum + (alloc.squaresPerWeek || 0), 0) || 0;
      return sum + allocated;
    }, 0);

    // Calculate total team capacity (assume 10 TU per person per week as baseline)
    const totalTeamCapacity = members.filter(m => m.status === 'active').length * 10;
    const utilization = totalTeamCapacity > 0 ? Math.round((totalAllocatedTUs / totalTeamCapacity) * 100) : 0;

    return {
      total: activeTasks.length,
      inProgress: inProgress.length,
      blocked: blocked.length,
      queued: queued.length,
      utilization,
    };
  }, [workPlans, members]);

  return (
    <View className="flex-1 bg-white dark:bg-slate-950">
      {/* Help Modal */}
      <HelpModal
        visible={showHelp}
        onClose={() => setShowHelp(false)}
        content={WHEN_HELP}
        gradientColors={['#8b5cf6', '#7c3aed']}
      />

      {/* Header */}
      <LinearGradient
        colors={['#8b5cf6', '#7c3aed', '#6d28d9']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={{
          paddingHorizontal: 20,
          paddingTop: insets.top + 12,
          paddingBottom: 16,
        }}
      >
        <View className="flex-row items-center justify-between mb-4">
          <View>
            <Text className="text-white/70 text-xs font-medium uppercase tracking-wide">Timeline</Text>
            <Text className="text-white text-2xl font-bold">When</Text>
          </View>
          <View className="flex-row items-center gap-2">
            <SettingsGearButton style="glass" />
            <HelpButton onPress={() => setShowHelp(true)} />
          </View>
        </View>

        {/* Task Stats */}
        <View className="flex-row gap-2 mb-3">
          <View className="flex-1 bg-white/10 rounded-xl p-3">
            <View className="flex-row items-center gap-2 mb-1">
              <Calendar size={14} color="white" />
              <Text className="text-white/70 text-xs">Active Tasks</Text>
            </View>
            <Text className="text-white font-bold text-xl">
              {taskStats.total}
            </Text>
          </View>

          <View className="flex-1 bg-white/10 rounded-xl p-3">
            <View className="flex-row items-center gap-2 mb-1">
              <Clock size={14} color="white" />
              <Text className="text-white/70 text-xs">In Progress</Text>
            </View>
            <Text className="text-white font-bold text-xl">
              {taskStats.inProgress}
            </Text>
          </View>

          <View className="flex-1 bg-white/10 rounded-xl p-3">
            <View className="flex-row items-center gap-2 mb-1">
              <TrendingUp size={14} color="white" />
              <Text className="text-white/70 text-xs">Utilization</Text>
            </View>
            <Text className="text-white font-bold text-xl">
              {taskStats.utilization}%
            </Text>
          </View>
        </View>

        {/* Blocked Tasks Alert (if any) */}
        {taskStats.blocked > 0 && (
          <Pressable
            onPress={() => router.push('/(tabs)/tasks')}
            className="bg-red-500/20 border border-red-400/30 rounded-xl p-3 flex-row items-center gap-2 active:opacity-80"
          >
            <AlertTriangle size={16} color="#fca5a5" />
            <Text className="text-white text-sm font-semibold flex-1">
              {taskStats.blocked} task{taskStats.blocked !== 1 ? 's' : ''} blocked
            </Text>
            <Text className="text-white/70 text-xs">View →</Text>
          </Pressable>
        )}
      </LinearGradient>

      {/* Full-screen Gantt Chart */}
      <View className="flex-1">
        <MiniGanttChart
          workPlans={workPlans}
          members={members}
          onTaskPress={(taskId) => {
            router.push({
              pathname: '/(tabs)/tasks',
              params: { selectedTaskId: taskId },
            });
          }}
          fillAvailableSpace
        />
      </View>

      {/* Empty state */}
      {workPlans.filter(wp => wp.status !== 'completed' && wp.status !== 'abandoned').length === 0 && (
        <View className="absolute inset-0 items-center justify-center" style={{ top: insets.top + 200 }}>
          <Calendar size={64} color="#cbd5e1" />
          <Text className="text-slate-500 dark:text-slate-400 text-center mt-4 text-lg font-medium">
            No active tasks
          </Text>
          <Text className="text-slate-400 dark:text-slate-500 text-center mt-2 text-sm px-8">
            Create tasks in the Tasks tab to see them on the timeline
          </Text>
          <Pressable
            onPress={() => router.push('/(tabs)/tasks')}
            className="mt-6 bg-purple-500 px-6 py-3 rounded-xl active:opacity-80"
          >
            <Text className="text-white font-semibold">Go to Tasks</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}
