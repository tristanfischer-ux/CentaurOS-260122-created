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
import { CollapsibleResourcePool } from '@/components/CollapsibleResourcePool';

const WHEN_HELP: HelpContent = {
  title: 'When',
  subtitle: 'Smart Timeline & Capacity Planning',
  description: 'The When tab is your visual planning center - a Gantt chart that shows all tasks across time with intelligent capacity-based scheduling. See when tasks start, end, who\'s working on them, and how capacity affects delivery dates.',
  tips: [
    '📅 Intelligent Scheduling: Tasks auto-schedule to the earliest week when team has available capacity',
    '📍 Blue "Today" Line: Vertical line shows current day for quick orientation',
    '📊 Week Separators: Clear visual dividers help you plan by week',
    '🎨 Color-Coded Status: Gray (Queued), Blue (In Progress), Red (Blocked), Green (Completed)',
    '👥 Team Avatars: See who\'s assigned to each task bar',
    '⚪ Greyed Out Pending: Tasks show dimmed until assignment is accepted',
    '⏰ Capacity-Based: If no TUs available this week, task auto-moves to next available week',
    '🔄 Auto-Scroll: Timeline automatically centers on current week',
    '📱 Tap Task Bar: View full details and edit in Tasks tab',
    '↔️ Swipe Timeline: Navigate past and future weeks smoothly',
  ],
  quickActions: [
    { label: 'View Timeline', description: 'See all tasks across weeks with capacity planning' },
    { label: 'Check Today', description: 'Blue line shows current day position' },
    { label: 'View Task Details', description: 'Tap any bar to see full task information' },
    { label: 'Navigate Time', description: 'Swipe left/right to explore past and future' },
    { label: 'Check Capacity', description: 'See how scheduling respects team availability' },
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
  const [selectedPersonId, setSelectedPersonId] = useState<string | null>(null);
  const [todayLinePosition, setTodayLinePosition] = useState<number>(0); // Track today line X position

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

    return {
      total: activeTasks.length,
      inProgress: inProgress.length,
      blocked: blocked.length,
      queued: queued.length,
      allocatedTUs: totalAllocatedTUs,
      totalCapacity: totalTeamCapacity,
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

      {/* Compact Header */}
      <LinearGradient
        colors={['#8b5cf6', '#7c3aed', '#6d28d9']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={{
          paddingHorizontal: 20,
          paddingTop: insets.top + 12,
          paddingBottom: 12,
        }}
      >
        <View className="flex-row items-center justify-between">
          <View>
            <Text className="text-white/70 text-xs font-medium uppercase tracking-wide">Timeline</Text>
            <Text className="text-white text-2xl font-bold">When</Text>
          </View>
          <View className="flex-row items-center gap-2">
            {/* Task Stats - Compact */}
            <View className="bg-white/10 rounded-lg px-2 py-1">
              <Text className="text-white/70 text-[9px]">Active</Text>
              <Text className="text-white font-bold text-sm">{taskStats.total}</Text>
            </View>
            <View className="bg-white/10 rounded-lg px-2 py-1">
              <Text className="text-white/70 text-[9px]">Doing</Text>
              <Text className="text-white font-bold text-sm">{taskStats.inProgress}</Text>
            </View>
            <View className="bg-white/10 rounded-lg px-2 py-1">
              <Text className="text-white/70 text-[9px]">Load</Text>
              <Text className="text-white font-bold text-sm">{taskStats.allocatedTUs}/{taskStats.totalCapacity}</Text>
            </View>
            <SettingsGearButton style="glass" />
            <HelpButton onPress={() => setShowHelp(true)} />
          </View>
        </View>
      </LinearGradient>

      {/* Full-height today line - rendered above all content */}
      {todayLinePosition > 0 && (
        <View
          className="absolute w-1 bg-blue-500 dark:bg-blue-400"
          style={{
            left: todayLinePosition,
            top: insets.top + 80, // Start below header
            bottom: 0, // Extend to bottom of screen
            zIndex: 10,
            pointerEvents: 'none',
          }}
        />
      )}

      {/* Gantt Chart - full height */}
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
          onTodayLinePositionChange={setTodayLinePosition}
        />
      </View>

      {/* Weekly Resource Pool Drawer */}
      <CollapsibleResourcePool
        selectedPersonId={selectedPersonId}
        onPersonSelect={setSelectedPersonId}
      />

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
