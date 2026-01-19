import { View, Text, ScrollView, Pressable, Dimensions, Modal } from 'react-native';
import { useMemo, useRef, useEffect, useState } from 'react';
import { type WorkPlan } from '@/lib/state/work-plan-store';
import { type OrganizationMember } from '@/lib/organization-seed';
import { X, Calendar, Clock, Users, DollarSign, AlertCircle, AlertTriangle, Target } from 'lucide-react-native';
import { getDelayInfo, formatDelay, getDelaySeverityColor } from '@/lib/task-delay-tracker';
import { lightImpact } from '@/lib/haptics';

interface MiniGanttChartProps {
  workPlans: WorkPlan[];
  members: OrganizationMember[];
  selectedTaskId?: string;
  onTaskPress?: (taskId: string) => void;
  fillAvailableSpace?: boolean;
}

// Calculate week number from a date
const getWeekNumber = (date: Date): number => {
  const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
  const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
  return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
};

// Get the start of week for a date (Monday)
const getWeekStart = (date: Date): Date => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
  return new Date(d.setDate(diff));
};

// Format date as "Jan 15"
const formatDate = (date: Date): string => {
  return date.toLocaleDateString('en-GB', { month: 'short', day: 'numeric' });
};

const STATUS_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  'not-started': { bg: 'bg-gray-200 dark:bg-gray-700', border: 'border-gray-400 dark:border-gray-600', text: 'text-gray-700 dark:text-gray-300' },
  'in-progress': { bg: 'bg-blue-400 dark:bg-blue-600', border: 'border-blue-600 dark:border-blue-400', text: 'text-white' },
  'blocked': { bg: 'bg-red-400 dark:bg-red-600', border: 'border-red-600 dark:border-red-400', text: 'text-white' },
  'completed': { bg: 'bg-emerald-400 dark:bg-emerald-600', border: 'border-emerald-600 dark:border-emerald-400', text: 'text-white' },
  'abandoned': { bg: 'bg-gray-300 dark:bg-gray-800', border: 'border-gray-500 dark:border-gray-700', text: 'text-gray-600 dark:text-gray-400' },
};

const ROLE_COLORS: Record<string, string> = {
  Founder: '#8b5cf6',
  FractionalExec: '#3b82f6',
  Apprentice: '#10b981',
};

export function MiniGanttChart({ workPlans, members, selectedTaskId, onTaskPress, fillAvailableSpace = false }: MiniGanttChartProps) {
  const today = useMemo(() => new Date(), []);
  const currentWeek = useMemo(() => getWeekNumber(today), [today]);

  // View mode state
  const [viewMode, setViewMode] = useState<'day' | 'week' | 'month' | 'year'>('week');

  // Refs for auto-scrolling to today
  const headerScrollRef = useRef<ScrollView>(null);
  const contentScrollRef = useRef<ScrollView>(null);

  // Helper to get initials from name
  const getInitials = (name: string): string => {
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  // Helper to get assigned members for a task, sorted by seniority
  const getAssignedMembers = (task: WorkPlan) => {
    const memberIds = task.assignedMemberIds || [];
    const roleOrder = { Founder: 0, CoFounder: 0, FractionalExec: 1, Apprentice: 2 };

    return memberIds
      .map(id => members.find(m => m.id === id))
      .filter((m): m is OrganizationMember => m !== undefined)
      .sort((a, b) => roleOrder[a.role] - roleOrder[b.role]); // Most senior first
  };

  // Calculate task cost
  const calculateTaskCost = (workPlan: WorkPlan) => {
    const assignedMembers = getAssignedMembers(workPlan);
    const totalSquares = workPlan.estimatedTimeUnits;

    // Calculate average cost per square from assigned members
    // Cost per square = costPerDay / 2 (since 1 day = 2 squares)
    let avgCostPerSquare = 0;
    if (assignedMembers.length > 0) {
      const totalCostPerSquare = assignedMembers.reduce((sum, member) => {
        const costPerSquare = (member.costPerDay || 0) / 2;
        return sum + costPerSquare;
      }, 0);
      avgCostPerSquare = totalCostPerSquare / assignedMembers.length;
    } else {
      // Default estimate if no members assigned (use apprentice rate)
      avgCostPerSquare = 75; // £150/day / 2
    }

    // Cumulative cost = total squares × average cost per square
    const cumulativeCost = Math.round(totalSquares * avgCostPerSquare);

    return cumulativeCost;
  };

  // Generate time periods based on view mode
  const timePeriods = useMemo(() => {
    const result = [];

    if (viewMode === 'day') {
      // Show 7 days: 2 before, today, 4 after
      for (let i = -2; i <= 4; i++) {
        const date = new Date(today);
        date.setDate(today.getDate() + i);
        result.push({
          offset: i,
          date,
          label: i === 0 ? 'Today' : date.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric' }),
          isToday: i === 0,
        });
      }
    } else if (viewMode === 'week') {
      // Show 13 weeks: 4 before, current week, 8 after
      for (let i = -4; i <= 8; i++) {
        const weekDate = new Date(today);
        weekDate.setDate(today.getDate() + i * 7);
        const weekStart = getWeekStart(weekDate);
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);

        result.push({
          offset: i,
          weekNumber: getWeekNumber(weekDate),
          weekStart,
          weekEnd,
          label: i === 0 ? 'This Week' : formatDate(weekStart),
          isCurrentWeek: i === 0,
        });
      }
    } else if (viewMode === 'month') {
      // Show 12 months: 2 before, current, 9 after
      for (let i = -2; i <= 9; i++) {
        const date = new Date(today.getFullYear(), today.getMonth() + i, 1);
        result.push({
          offset: i,
          date,
          label: date.toLocaleDateString('en-GB', { month: 'short', year: i === 0 ? undefined : 'numeric' }),
          isCurrentMonth: i === 0,
        });
      }
    } else if (viewMode === 'year') {
      // Show 5 years: 1 before, current, 3 after
      for (let i = -1; i <= 3; i++) {
        const year = today.getFullYear() + i;
        result.push({
          offset: i,
          year,
          label: year.toString(),
          isCurrentYear: i === 0,
        });
      }
    }

    return result;
  }, [today, viewMode]);

  // Show all non-completed/abandoned tasks, sorted by due date
  const filteredTasks = useMemo(() => {
    return workPlans
      .filter(wp => wp.status !== 'completed' && wp.status !== 'abandoned')
      .sort((a, b) => {
        // Sort by due date
        const aDate = a.dueDate ? new Date(a.dueDate).getTime() : Infinity;
        const bDate = b.dueDate ? new Date(b.dueDate).getTime() : Infinity;
        return aDate - bDate;
      });
  }, [workPlans]);

  // Calculate task position and width for each task
  const taskBars = useMemo(() => {
    return filteredTasks.map(task => {
      const dueDate = task.dueDate ? new Date(task.dueDate) : new Date(today.getTime() + 14 * 24 * 60 * 60 * 1000); // Default 2 weeks from today

      // Calculate start date based on estimated time units (1 TU = 4 hours, assume 8 hours per day)
      const estimatedDays = Math.ceil((task.estimatedTimeUnits * 4) / 8);
      const startDate = new Date(dueDate.getTime() - estimatedDays * 24 * 60 * 60 * 1000);

      // Find which weeks this task spans
      const startWeek = getWeekNumber(startDate);
      const endWeek = getWeekNumber(dueDate);

      // Calculate offset from current week
      const startOffset = startWeek - currentWeek;
      const endOffset = endWeek - currentWeek;

      // Calculate width (how many weeks this task spans)
      const widthInWeeks = Math.max(1, endOffset - startOffset + 1);

      // Get delay information
      const delayInfo = getDelayInfo(task);

      // Calculate original end position if there's a delay
      let originalEndOffset = endOffset;
      let extensionWidthInWeeks = 0;

      if (delayInfo.isDelayed && delayInfo.originalEndDate) {
        const originalEndWeek = getWeekNumber(delayInfo.originalEndDate);
        originalEndOffset = originalEndWeek - currentWeek;
        extensionWidthInWeeks = endOffset - originalEndOffset;
      }

      return {
        task,
        startOffset,
        endOffset,
        widthInWeeks,
        startDate,
        dueDate,
        delayInfo,
        originalEndOffset,
        extensionWidthInWeeks,
      };
    });
  }, [filteredTasks, currentWeek, today]);

  const screenWidth = Dimensions.get('window').width;
  const WEEK_WIDTH = screenWidth / 3; // Divide screen width by 3 weeks to fill entire width
  const TASK_HEIGHT = 36; // Height of each task bar (increased for better tap targets)
  const MAX_VISIBLE_TASKS = 6; // Show 6 tasks at a time

  // State for task info popup
  const [selectedTask, setSelectedTask] = useState<WorkPlan | null>(null);
  const [showTaskModal, setShowTaskModal] = useState(false);

  // Function to scroll to today's position
  const scrollToToday = () => {
    lightImpact();

    // Calculate scroll position based on view mode
    let scrollPosition = 0;

    if (viewMode === 'day') {
      // In day view, today is at index 2 (2 days before)
      scrollPosition = WEEK_WIDTH * 2;
    } else if (viewMode === 'week') {
      // In week view, current week is at index 4 (4 weeks before)
      scrollPosition = WEEK_WIDTH * 4;
    } else if (viewMode === 'month') {
      // In month view, current month is at index 2 (2 months before)
      scrollPosition = WEEK_WIDTH * 2;
    } else if (viewMode === 'year') {
      // In year view, current year is at index 1 (1 year before)
      scrollPosition = WEEK_WIDTH * 1;
    }

    headerScrollRef.current?.scrollTo({ x: scrollPosition, y: 0, animated: true });
    contentScrollRef.current?.scrollTo({ x: scrollPosition, y: 0, animated: true });
  };

  // Auto-scroll to show today at far left when component mounts or view mode changes
  useEffect(() => {
    setTimeout(() => {
      scrollToToday();
    }, 100);
  }, [viewMode]);

  return (
    <View className="flex-1 bg-white dark:bg-slate-900 border-t-2 border-gray-200 dark:border-slate-700">
      {/* Compact Header with View Toggle */}
      <View className="px-3 py-1.5 flex-row items-center justify-between border-b border-gray-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950">
        <View className="flex-row items-center gap-2">
          <Text className="text-gray-900 dark:text-white text-[10px] font-bold uppercase tracking-wide">
            Timeline
          </Text>
          <Text className="text-gray-500 dark:text-slate-400 text-[9px]">
            {filteredTasks.length} tasks
          </Text>

          {/* Today Button */}
          <Pressable
            onPress={scrollToToday}
            className="bg-blue-500 rounded-full px-2 py-0.5 flex-row items-center gap-1 active:opacity-70"
          >
            <Target size={10} color="white" />
            <Text className="text-white text-[9px] font-bold">Today</Text>
          </Pressable>
        </View>

        {/* View Mode Toggle */}
        <View className="flex-row items-center gap-1">
          <Pressable
            onPress={() => setViewMode('day')}
            className={`px-2 py-1 rounded ${
              viewMode === 'day'
                ? 'bg-purple-500'
                : 'bg-gray-200 dark:bg-slate-800'
            }`}
          >
            <Text className={`text-[9px] font-semibold ${
              viewMode === 'day'
                ? 'text-white'
                : 'text-gray-600 dark:text-slate-400'
            }`}>
              Day
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setViewMode('week')}
            className={`px-2 py-1 rounded ${
              viewMode === 'week'
                ? 'bg-purple-500'
                : 'bg-gray-200 dark:bg-slate-800'
            }`}
          >
            <Text className={`text-[9px] font-semibold ${
              viewMode === 'week'
                ? 'text-white'
                : 'text-gray-600 dark:text-slate-400'
            }`}>
              Week
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setViewMode('month')}
            className={`px-2 py-1 rounded ${
              viewMode === 'month'
                ? 'bg-purple-500'
                : 'bg-gray-200 dark:bg-slate-800'
            }`}
          >
            <Text className={`text-[9px] font-semibold ${
              viewMode === 'month'
                ? 'text-white'
                : 'text-gray-600 dark:text-slate-400'
            }`}>
              Month
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setViewMode('year')}
            className={`px-2 py-1 rounded ${
              viewMode === 'year'
                ? 'bg-purple-500'
                : 'bg-gray-200 dark:bg-slate-800'
            }`}
          >
            <Text className={`text-[9px] font-semibold ${
              viewMode === 'year'
                ? 'text-white'
                : 'text-gray-600 dark:text-slate-400'
            }`}>
              Year
            </Text>
          </Pressable>
        </View>
      </View>

      {/* Timeline Content */}
      <View className="flex-1 relative bg-white dark:bg-slate-900">
        {/* Compact Time Period Headers */}
        <ScrollView
          ref={headerScrollRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          className="border-b border-gray-200 dark:border-slate-700"
          scrollEnabled={false}
        >
          <View className="flex-row">
            {timePeriods.map((period: any, idx: number) => {
              const isCurrent = viewMode === 'week' ? period.isCurrentWeek :
                                viewMode === 'day' ? period.isToday :
                                viewMode === 'month' ? period.isCurrentMonth :
                                period.isCurrentYear;

              return (
                <View
                  key={idx}
                  className={`border-r border-gray-200 dark:border-slate-700 py-1 ${
                    isCurrent ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                  }`}
                  style={{ width: WEEK_WIDTH }}
                >
                  <Text
                    className={`text-center text-[9px] font-semibold ${
                      isCurrent
                        ? 'text-blue-600 dark:text-blue-400'
                        : 'text-gray-500 dark:text-slate-400'
                    }`}
                  >
                    {period.label}
                  </Text>
                  {viewMode === 'week' && (
                    <Text className="text-center text-[8px] text-gray-400 dark:text-slate-500">
                      W{period.weekNumber}
                    </Text>
                  )}
                </View>
              );
            })}
          </View>
        </ScrollView>

        {/* Task Bars - Horizontal and Vertical Scroll */}
        <ScrollView
          ref={contentScrollRef}
          horizontal
          showsHorizontalScrollIndicator={true}
          onScroll={(e) => {
            // Sync header scroll with content scroll
            const offsetX = e.nativeEvent.contentOffset.x;
            headerScrollRef.current?.scrollTo({ x: offsetX, y: 0, animated: false });
          }}
          scrollEventThrottle={16}
          contentContainerStyle={{ flexGrow: 1 }}
          className="flex-1"
        >
          <ScrollView
            showsVerticalScrollIndicator={true}
            contentContainerStyle={{ paddingBottom: 20 }}
            className="flex-1"
          >
            <View style={{ width: WEEK_WIDTH * timePeriods.length }}>
              {/* Current time indicator line */}
              <View
                className="absolute top-0 bottom-0 w-0.5 bg-blue-500 dark:bg-blue-400 opacity-50"
                style={{
                  left: WEEK_WIDTH * (viewMode === 'day' ? 2 : viewMode === 'week' ? 4 : viewMode === 'month' ? 2 : 1) + WEEK_WIDTH / 2
                }}
              />

              {/* Task bars */}
              <View className="py-2">
              {taskBars.map((bar, idx) => {
                const colors = STATUS_COLORS[bar.task.status] || STATUS_COLORS['not-started'];
                const leftPosition = WEEK_WIDTH * (bar.startOffset + 4); // +4 to account for 4 weeks before current week
                const assignedMembers = getAssignedMembers(bar.task);
                const AVATAR_WIDTH = 32; // Width for avatar section
                const taskCost = calculateTaskCost(bar.task);

                // Calculate bar widths for original vs extension
                const hasExtension = bar.delayInfo.isDelayed && bar.extensionWidthInWeeks > 0;
                const originalWidthInWeeks = hasExtension
                  ? bar.widthInWeeks - bar.extensionWidthInWeeks
                  : bar.widthInWeeks;
                const originalBarWidth = Math.max(60, WEEK_WIDTH * originalWidthInWeeks - 8);
                const extensionBarWidth = hasExtension ? WEEK_WIDTH * bar.extensionWidthInWeeks : 0;

                // Get delay severity colors
                const delaySeverityColors = getDelaySeverityColor(bar.delayInfo.severity);
                const delayBadgeText = formatDelay(bar.delayInfo);

                return (
                  <View
                    key={bar.task.id}
                    className="mb-2 flex-row items-center"
                    style={{
                      marginLeft: Math.max(0, leftPosition) - AVATAR_WIDTH - 4,
                      height: TASK_HEIGHT,
                    }}
                  >
                    {/* Team Avatars - positioned immediately to the left of the task bar */}
                    <View className="mr-1" style={{ width: AVATAR_WIDTH, flexDirection: 'row', justifyContent: 'flex-end' }}>
                      {assignedMembers.length > 0 ? (
                        <>
                          {assignedMembers.length > 2 && (
                            <View
                              className="w-6 h-6 rounded-full items-center justify-center"
                              style={{ backgroundColor: '#9ca3af20', marginRight: -6, zIndex: 0 }}
                            >
                              <Text className="font-bold text-[8px] text-gray-600 dark:text-gray-400">
                                +{assignedMembers.length - 2}
                              </Text>
                            </View>
                          )}
                          {assignedMembers.slice(0, 2).map((member, memberIdx) => (
                            <View
                              key={member.id}
                              className="w-6 h-6 rounded-full items-center justify-center"
                              style={{
                                backgroundColor: ROLE_COLORS[member.role] + '20',
                                marginRight: memberIdx < assignedMembers.slice(0, 2).length - 1 ? -6 : 0,
                                zIndex: memberIdx + 1
                              }}
                            >
                              <Text className="font-bold text-[8px]" style={{ color: ROLE_COLORS[member.role] }}>
                                {getInitials(member.name)}
                              </Text>
                            </View>
                          ))}
                        </>
                      ) : null}
                    </View>

                    {/* Task Bar Container - includes original bar + extension */}
                    <View className="flex-row items-center">
                      {/* Original Timeline Bar */}
                      <Pressable
                        onPress={() => {
                          console.log('[MiniGanttChart] Task pressed:', bar.task.title);
                          onTaskPress?.(bar.task.id);
                        }}
                        hitSlop={{ top: 5, bottom: 5, left: 5, right: 5 }}
                        style={{
                          width: originalBarWidth,
                          height: TASK_HEIGHT,
                        }}
                      >
                        <View
                          className={`flex-row items-center px-2 py-1 border-2 ${
                            selectedTaskId === bar.task.id
                              ? 'border-blue-500 dark:border-blue-400'
                              : colors.border
                          } ${colors.bg}`}
                          style={{
                            height: TASK_HEIGHT,
                            borderTopLeftRadius: 8,
                            borderBottomLeftRadius: 8,
                            // Only round right side if no extension
                            borderTopRightRadius: hasExtension ? 0 : 8,
                            borderBottomRightRadius: hasExtension ? 0 : 8,
                            borderRightWidth: hasExtension ? 0 : 2,
                          }}
                          pointerEvents="none"
                        >
                          <View className="flex-1">
                            <View className="flex-row items-center gap-1">
                              {/* Warning icon for delayed tasks */}
                              {bar.delayInfo.isDelayed && (
                                <AlertTriangle size={10} color={delaySeverityColors.bar} />
                              )}
                              <Text
                                className={`text-xs font-semibold ${colors.text}`}
                                numberOfLines={1}
                                style={{ flex: 1 }}
                              >
                                {bar.task.title}
                              </Text>
                            </View>
                            <Text
                              className={`text-[10px] ${colors.text} opacity-80`}
                              numberOfLines={1}
                            >
                              {bar.task.function} • {bar.task.progress}%
                            </Text>
                          </View>
                          {/* Progress indicator */}
                          {bar.task.status === 'in-progress' && !hasExtension && (
                            <View className="ml-1 w-1.5 h-1.5 rounded-full bg-white" />
                          )}
                        </View>
                      </Pressable>

                      {/* Extension Bar (for delayed tasks) */}
                      {hasExtension && (
                        <View
                          style={{
                            width: extensionBarWidth,
                            height: TASK_HEIGHT,
                            backgroundColor: delaySeverityColors.bar,
                            borderTopRightRadius: 8,
                            borderBottomRightRadius: 8,
                            borderWidth: 2,
                            borderLeftWidth: 0,
                            borderColor: delaySeverityColors.bar,
                            justifyContent: 'center',
                            paddingHorizontal: 6,
                          }}
                        >
                          {/* Diagonal stripes pattern overlay */}
                          <View
                            style={{
                              position: 'absolute',
                              top: 0,
                              left: 0,
                              right: 0,
                              bottom: 0,
                              opacity: 0.3,
                              overflow: 'hidden',
                              borderTopRightRadius: 6,
                              borderBottomRightRadius: 6,
                            }}
                          >
                            {/* Simple stripe pattern using multiple thin views */}
                            {[...Array(10)].map((_, i) => (
                              <View
                                key={i}
                                style={{
                                  position: 'absolute',
                                  width: 3,
                                  height: 60,
                                  backgroundColor: 'rgba(255,255,255,0.4)',
                                  transform: [{ rotate: '45deg' }],
                                  left: i * 12 - 20,
                                  top: -15,
                                }}
                              />
                            ))}
                          </View>

                          {/* Delay badge */}
                          <View className="flex-row items-center justify-center">
                            <Text className="text-white text-[9px] font-bold">
                              {delayBadgeText}
                            </Text>
                          </View>
                        </View>
                      )}
                    </View>

                    {/* Cost Display - to the immediate right of task bar */}
                    <View className="ml-2 bg-gray-100 dark:bg-slate-800 px-2 py-1 rounded-md">
                      <Text className="text-gray-700 dark:text-gray-300 text-[10px] font-bold">
                        £{taskCost.toLocaleString()}
                      </Text>
                    </View>

                    {/* Delay badge (alternative position) - shows if there's a delay but no extension visual */}
                    {bar.delayInfo.isDelayed && !hasExtension && delayBadgeText && (
                      <View
                        className="ml-1 px-1.5 py-0.5 rounded"
                        style={{ backgroundColor: delaySeverityColors.bar }}
                      >
                        <Text className="text-white text-[8px] font-bold">
                          {delayBadgeText}
                        </Text>
                      </View>
                    )}
                  </View>
                );
              })}

              {/* Empty state */}
              {taskBars.length === 0 && (
                <View className="items-center justify-center py-8">
                  <Text className="text-gray-400 dark:text-slate-500 text-sm">
                    No active tasks
                  </Text>
                </View>
              )}
            </View>
          </View>
        </ScrollView>
        </ScrollView>
      </View>

      {/* Task Info Modal */}
      <Modal
        visible={showTaskModal}
        transparent
        animationType="fade"
        onRequestClose={() => {
          console.log('[MiniGanttChart] Modal closing');
          setShowTaskModal(false);
        }}
      >
        <Pressable
          className="flex-1 bg-black/60"
          onPress={() => {
            console.log('[MiniGanttChart] Backdrop pressed');
            setShowTaskModal(false);
          }}
        >
          <View className="flex-1" />
          <Pressable
            onPress={(e) => {
              console.log('[MiniGanttChart] Modal content pressed');
              e.stopPropagation();
            }}
            style={{ maxHeight: '80%' }}
          >
            {selectedTask ? (
              <View className="mx-4 bg-white dark:bg-slate-800 rounded-2xl overflow-hidden shadow-2xl">
                {/* Header */}
                <View className={`px-4 py-3 ${STATUS_COLORS[selectedTask.status]?.bg || 'bg-gray-200'}`}>
                  <View className="flex-row items-start justify-between">
                    <View className="flex-1 mr-3">
                      <Text className={`text-base font-bold ${STATUS_COLORS[selectedTask.status]?.text || 'text-gray-900'}`}>
                        {selectedTask.title}
                      </Text>
                      <Text className={`text-xs mt-0.5 ${STATUS_COLORS[selectedTask.status]?.text || 'text-gray-700'} opacity-80`}>
                        {selectedTask.function} • {selectedTask.status.replace('-', ' ')}
                      </Text>
                    </View>
                    <Pressable
                      onPress={() => setShowTaskModal(false)}
                      className="p-1 rounded-full bg-black/10"
                    >
                      <X size={16} color={selectedTask.status === 'not-started' ? '#374151' : '#ffffff'} />
                    </Pressable>
                  </View>
                </View>

                {/* Content - Scrollable */}
                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ flexGrow: 1 }}>
                  <View className="p-4">
                  {/* Progress Bar */}
                  <View className="mb-4">
                    <View className="flex-row justify-between mb-1">
                      <Text className="text-xs text-gray-500 dark:text-slate-400">Progress</Text>
                      <Text className="text-xs font-semibold text-gray-700 dark:text-gray-300">{selectedTask.progress}%</Text>
                    </View>
                    <View className="h-2 bg-gray-200 dark:bg-slate-700 rounded-full overflow-hidden">
                      <View
                        className="h-full bg-blue-500 rounded-full"
                        style={{ width: `${selectedTask.progress}%` }}
                      />
                    </View>
                  </View>

                  {/* Info Grid */}
                  <View className="flex-row flex-wrap gap-3 mb-4">
                    {/* Due Date */}
                    <View className="flex-row items-center bg-gray-100 dark:bg-slate-700 px-3 py-2 rounded-lg">
                      <Calendar size={14} color="#6b7280" />
                      <Text className="text-xs text-gray-600 dark:text-gray-300 ml-2">
                        {selectedTask.dueDate
                          ? new Date(selectedTask.dueDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
                          : 'No due date'}
                      </Text>
                    </View>

                    {/* Time Units */}
                    <View className="flex-row items-center bg-gray-100 dark:bg-slate-700 px-3 py-2 rounded-lg">
                      <Clock size={14} color="#6b7280" />
                      <Text className="text-xs text-gray-600 dark:text-gray-300 ml-2">
                        {selectedTask.estimatedTimeUnits} TUs
                      </Text>
                    </View>

                    {/* Cost */}
                    <View className="flex-row items-center bg-gray-100 dark:bg-slate-700 px-3 py-2 rounded-lg">
                      <DollarSign size={14} color="#6b7280" />
                      <Text className="text-xs text-gray-600 dark:text-gray-300 ml-2">
                        £{calculateTaskCost(selectedTask).toLocaleString()}
                      </Text>
                    </View>
                  </View>

                  {/* Assigned Members */}
                  {(() => {
                    const taskMembers = getAssignedMembers(selectedTask);
                    if (taskMembers.length === 0) return null;
                    return (
                      <View className="mb-4">
                        <View className="flex-row items-center mb-2">
                          <Users size={14} color="#6b7280" />
                          <Text className="text-xs text-gray-500 dark:text-slate-400 ml-2">Assigned Team</Text>
                        </View>
                        <View className="flex-row flex-wrap gap-2">
                          {taskMembers.map((member) => (
                            <View
                              key={member.id}
                              className="flex-row items-center px-2 py-1.5 rounded-lg"
                              style={{ backgroundColor: ROLE_COLORS[member.role] + '15' }}
                            >
                              <View
                                className="w-5 h-5 rounded-full items-center justify-center mr-1.5"
                                style={{ backgroundColor: ROLE_COLORS[member.role] + '30' }}
                              >
                                <Text className="text-[8px] font-bold" style={{ color: ROLE_COLORS[member.role] }}>
                                  {getInitials(member.name)}
                                </Text>
                              </View>
                              <Text className="text-xs font-medium" style={{ color: ROLE_COLORS[member.role] }}>
                                {member.name.split(' ')[0]}
                              </Text>
                            </View>
                          ))}
                        </View>
                      </View>
                    );
                  })()}

                  {/* Blockers */}
                  {selectedTask.status === 'blocked' && (
                    <View className="bg-red-50 dark:bg-red-900/20 p-3 rounded-lg">
                      <View className="flex-row items-center mb-1">
                        <AlertCircle size={14} color="#ef4444" />
                        <Text className="text-xs font-semibold text-red-600 dark:text-red-400 ml-2">Blocked</Text>
                      </View>
                      <Text className="text-xs text-red-600 dark:text-red-400">
                        This task has blockers that need to be resolved.
                      </Text>
                    </View>
                  )}

                  {/* Go to Decide Button */}
                  <Pressable
                    onPress={() => {
                      setShowTaskModal(false);
                      onTaskPress?.(selectedTask.id);
                    }}
                    className="mt-4 bg-blue-500 py-3 rounded-xl active:bg-blue-600"
                  >
                    <Text className="text-white text-center text-sm font-semibold">
                      Manage Task
                    </Text>
                  </Pressable>
                </View>
                </ScrollView>
              </View>
            ) : null}
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}
