/**
 * When Tab - Timeline & Capacity View
 * Week view grid: rows=people, cols=Mon–Sun
 *
 * MIGRATION: Timeline/Gantt features moved here from 'what' tab
 * Anti-bloat: No duplicate task lists; link to Tasks for details
 *
 * IMPORTANT: This tab ONLY shows confirmed real tasks from WorkPlan store.
 * Drafts (from Draft store) are NOT shown here - they must be confirmed first.
 */

import { View, Text, ScrollView, Pressable } from 'react-native';
import { useState, useMemo } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { router } from 'expo-router';
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Clock,
  Users,
  Target,
} from 'lucide-react-native';
import { useOrganizationStore } from '@/lib/state/organization-store';
import { useWorkPlanStore, type WorkPlan } from '@/lib/state/work-plan-store';
import { useCurrentMembership, useCurrentWorkspace } from '@/lib/state/app-store';
import { HelpModal, HelpButton, type HelpContent } from '@/components/HelpModal';
import { SettingsGearButton } from '@/components/SettingsGearButton';

const WHEN_HELP: HelpContent = {
  title: 'When',
  subtitle: 'Timeline & capacity',
  description: 'The When tab shows who is doing what and when. View weekly capacity allocation across your team.',
  tips: [
    'Each row is a team member, each column is a day of the week',
    'Colored blocks show allocated tasks for that person',
    'Tap a block to see task details in the Tasks tab',
    'Use arrows to navigate between weeks',
    'Check capacity utilization to avoid overallocation',
  ],
  quickActions: [
    { label: 'Week View', description: 'See the current week\'s allocations' },
    { label: 'Navigate Weeks', description: 'Move forward/backward through time' },
    { label: 'View Task', description: 'Tap any allocation to see task details' },
  ],
};

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export default function WhenScreen() {
  const insets = useSafeAreaInsets();
  const currentMembership = useCurrentMembership();
  const currentWorkspace = useCurrentWorkspace();

  // Stores
  const members = useOrganizationStore(s => s.members);
  const workPlans = useWorkPlanStore(s => s.workPlans);

  // State
  const [showHelp, setShowHelp] = useState(false);
  const [weekOffset, setWeekOffset] = useState(0);

  // Get current week dates
  const weekDates = useMemo(() => {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const monday = new Date(today);
    monday.setDate(today.getDate() + mondayOffset + (weekOffset * 7));

    return DAYS.map((_, i) => {
      const date = new Date(monday);
      date.setDate(monday.getDate() + i);
      return date;
    });
  }, [weekOffset]);

  const weekLabel = useMemo(() => {
    const start = weekDates[0];
    const end = weekDates[6];
    const startMonth = start.toLocaleDateString('en-GB', { month: 'short' });
    const endMonth = end.toLocaleDateString('en-GB', { month: 'short' });

    if (startMonth === endMonth) {
      return `${start.getDate()} - ${end.getDate()} ${startMonth}`;
    }
    return `${start.getDate()} ${startMonth} - ${end.getDate()} ${endMonth}`;
  }, [weekDates]);

  // Get tasks allocated to each member for the current week
  const memberAllocations = useMemo(() => {
    return members.map(member => {
      const memberTasks = workPlans.filter(wp => {
        // Check if member is allocated to this task
        const isAllocated = wp.allocations?.some(a => a.memberId === member.id) ||
          wp.assignedMemberIds?.includes(member.id);

        if (!isAllocated) return false;

        // Check if task overlaps with current week
        const taskStart = new Date(wp.startDate);
        const taskEnd = new Date(wp.dueDate);
        const weekStart = weekDates[0];
        const weekEnd = weekDates[6];

        return taskStart <= weekEnd && taskEnd >= weekStart;
      });

      return {
        member,
        tasks: memberTasks,
        hoursAllocated: memberTasks.reduce((sum, t) => {
          const allocation = t.allocations?.find(a => a.memberId === member.id);
          return sum + (allocation?.squaresPerWeek || t.estimatedTimeUnits / 4 || 0);
        }, 0),
      };
    });
  }, [members, workPlans, weekDates]);

  // Calculate total capacity
  const totalCapacity = useMemo(() => {
    const allocated = memberAllocations.reduce((sum, m) => sum + m.hoursAllocated, 0);
    const available = members.reduce((sum, m) => sum + ((m.daysPerWeek || 5) * 8), 0);
    return { allocated, available, utilization: available > 0 ? (allocated / available) * 100 : 0 };
  }, [memberAllocations, members]);

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'Founder': return '#3b82f6';
      case 'FractionalExec': return '#8b5cf6';
      case 'Apprentice': return '#10b981';
      default: return '#64748b';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'in-progress': return '#3b82f6';
      case 'blocked': return '#ef4444';
      case 'completed': return '#10b981';
      default: return '#64748b';
    }
  };

  return (
    <View className="flex-1 bg-slate-50 dark:bg-slate-950">
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

        {/* Week Navigation */}
        <View className="flex-row items-center justify-between bg-white/10 rounded-xl p-3">
          <Pressable
            onPress={() => setWeekOffset(w => w - 1)}
            className="p-2 bg-white/10 rounded-lg active:opacity-70"
          >
            <ChevronLeft size={20} color="white" />
          </Pressable>

          <View className="items-center">
            <Text className="text-white font-bold text-lg">{weekLabel}</Text>
            <Text className="text-white/70 text-xs">
              {weekOffset === 0 ? 'This Week' : weekOffset > 0 ? `${weekOffset} week${weekOffset > 1 ? 's' : ''} ahead` : `${Math.abs(weekOffset)} week${Math.abs(weekOffset) > 1 ? 's' : ''} ago`}
            </Text>
          </View>

          <Pressable
            onPress={() => setWeekOffset(w => w + 1)}
            className="p-2 bg-white/10 rounded-lg active:opacity-70"
          >
            <ChevronRight size={20} color="white" />
          </Pressable>
        </View>

        {/* Capacity Summary */}
        <View className="flex-row mt-3 gap-3">
          <View className="flex-1 bg-white/10 rounded-xl p-3">
            <Text className="text-white/70 text-xs">Capacity Used</Text>
            <Text className="text-white font-bold text-lg">
              {Math.round(totalCapacity.utilization)}%
            </Text>
          </View>
          <View className="flex-1 bg-white/10 rounded-xl p-3">
            <Text className="text-white/70 text-xs">Hours Allocated</Text>
            <Text className="text-white font-bold text-lg">
              {totalCapacity.allocated}h
            </Text>
          </View>
          <View className="flex-1 bg-white/10 rounded-xl p-3">
            <Text className="text-white/70 text-xs">Available</Text>
            <Text className="text-white font-bold text-lg">
              {totalCapacity.available}h
            </Text>
          </View>
        </View>
      </LinearGradient>

      {/* Week Grid Header */}
      <View className="flex-row px-5 py-3 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
        <View className="w-24" />
        {weekDates.map((date, i) => {
          const isToday = date.toDateString() === new Date().toDateString();
          return (
            <View key={i} className="flex-1 items-center">
              <Text className={`text-xs font-medium ${isToday ? 'text-purple-600 dark:text-purple-400' : 'text-slate-500 dark:text-slate-400'}`}>
                {DAYS[i]}
              </Text>
              <Text className={`text-sm font-bold ${isToday ? 'text-purple-600 dark:text-purple-400' : 'text-slate-900 dark:text-white'}`}>
                {date.getDate()}
              </Text>
            </View>
          );
        })}
      </View>

      {/* Content - Team Grid */}
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
      >
        {memberAllocations.map((allocation, index) => (
          <Animated.View
            key={allocation.member.id}
            entering={FadeInDown.delay(index * 30).springify()}
            className="flex-row px-5 py-3 border-b border-slate-100 dark:border-slate-800"
          >
            {/* Member Info */}
            <Pressable
              onPress={() => router.push('/(tabs)/people')}
              className="w-24 active:opacity-70"
            >
              <View className="flex-row items-center gap-2">
                <View
                  className="w-8 h-8 rounded-full items-center justify-center"
                  style={{ backgroundColor: getRoleColor(allocation.member.role) + '20' }}
                >
                  <Text
                    className="text-xs font-bold"
                    style={{ color: getRoleColor(allocation.member.role) }}
                  >
                    {allocation.member.name.split(' ').map(n => n[0]).join('')}
                  </Text>
                </View>
              </View>
              <Text className="text-slate-900 dark:text-white text-xs font-medium mt-1" numberOfLines={1}>
                {allocation.member.name.split(' ')[0]}
              </Text>
              <Text className="text-slate-500 dark:text-slate-400 text-xs">
                {allocation.hoursAllocated}h
              </Text>
            </Pressable>

            {/* Day Columns */}
            {weekDates.map((date, dayIndex) => {
              // Find tasks active on this day
              const dayTasks = allocation.tasks.filter(t => {
                const start = new Date(t.startDate);
                const end = new Date(t.dueDate);
                return date >= start && date <= end;
              });

              return (
                <View key={dayIndex} className="flex-1 px-0.5">
                  {dayTasks.length > 0 ? (
                    <Pressable
                      onPress={() => router.push('/(tabs)/tasks')}
                      className="flex-1 min-h-[48px] rounded-lg items-center justify-center active:opacity-70"
                      style={{ backgroundColor: getStatusColor(dayTasks[0].status) + '20' }}
                    >
                      <View
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: getStatusColor(dayTasks[0].status) }}
                      />
                      {dayTasks.length > 1 && (
                        <Text className="text-xs mt-0.5" style={{ color: getStatusColor(dayTasks[0].status) }}>
                          +{dayTasks.length - 1}
                        </Text>
                      )}
                    </Pressable>
                  ) : (
                    <View className="flex-1 min-h-[48px] rounded-lg bg-slate-50 dark:bg-slate-800/50" />
                  )}
                </View>
              );
            })}
          </Animated.View>
        ))}

        {/* Empty state */}
        {members.length === 0 && (
          <View className="items-center py-12 px-5">
            <Users size={48} color="#94a3b8" />
            <Text className="text-slate-500 dark:text-slate-400 text-center mt-4 text-base">
              No team members yet
            </Text>
            <Pressable
              onPress={() => router.push('/(tabs)/people')}
              className="mt-4 bg-purple-500 px-6 py-3 rounded-xl"
            >
              <Text className="text-white font-semibold">Add Team Members</Text>
            </Pressable>
          </View>
        )}

        {/* Legend */}
        <View className="mx-5 mt-6 p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
          <Text className="text-slate-500 dark:text-slate-400 text-xs font-medium uppercase mb-3">
            Legend
          </Text>
          <View className="flex-row flex-wrap gap-4">
            <View className="flex-row items-center gap-2">
              <View className="w-3 h-3 rounded-full bg-blue-500" />
              <Text className="text-slate-700 dark:text-slate-300 text-sm">Doing</Text>
            </View>
            <View className="flex-row items-center gap-2">
              <View className="w-3 h-3 rounded-full bg-slate-500" />
              <Text className="text-slate-700 dark:text-slate-300 text-sm">Queued</Text>
            </View>
            <View className="flex-row items-center gap-2">
              <View className="w-3 h-3 rounded-full bg-red-500" />
              <Text className="text-slate-700 dark:text-slate-300 text-sm">Blocked</Text>
            </View>
            <View className="flex-row items-center gap-2">
              <View className="w-3 h-3 rounded-full bg-emerald-500" />
              <Text className="text-slate-700 dark:text-slate-300 text-sm">Done</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
