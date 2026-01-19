import { View, Text, ScrollView, Pressable, Dimensions } from 'react-native';
import { useMemo, useRef, useEffect, useState } from 'react';
import { type WorkPlan } from '@/lib/state/work-plan-store';
import { type OrganizationMember } from '@/lib/organization-seed';
import { AlertTriangle, Target } from 'lucide-react-native';
import { getDelayInfo, formatDelay, getDelaySeverityColor } from '@/lib/task-delay-tracker';
import { lightImpact } from '@/lib/haptics';
import { TaskQuickActionsModal } from './TaskQuickActionsModal';

interface MiniGanttChartProps {
  workPlans: WorkPlan[];
  members: OrganizationMember[];
  selectedTaskId?: string;
  onTaskPress?: (taskId: string) => void;
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

export function MiniGanttChart({ workPlans, members, selectedTaskId, onTaskPress }: MiniGanttChartProps) {
  const today = useMemo(() => new Date(), []);

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

  // Helper to calculate time difference based on view mode
  const getTimeDiff = (date1: Date, date2: Date, mode: 'day' | 'week' | 'month' | 'year'): number => {
    if (mode === 'day') {
      return Math.floor((date1.getTime() - date2.getTime()) / (24 * 60 * 60 * 1000));
    } else if (mode === 'week') {
      return getWeekNumber(date1) - getWeekNumber(date2);
    } else if (mode === 'month') {
      return (date1.getFullYear() - date2.getFullYear()) * 12 + (date1.getMonth() - date2.getMonth());
    } else {
      return date1.getFullYear() - date2.getFullYear();
    }
  };

  // Calculate task position and width for each task
  const taskBars = useMemo(() => {
    return filteredTasks.map(task => {
      const dueDate = task.dueDate ? new Date(task.dueDate) : new Date(today.getTime() + 14 * 24 * 60 * 60 * 1000); // Default 2 weeks from today

      // Calculate start date based on estimated time units (1 TU = 4 hours, assume 8 hours per day)
      const estimatedDays = Math.ceil((task.estimatedTimeUnits * 4) / 8);
      const startDate = task.startDate
        ? new Date(task.startDate)
        : new Date(dueDate.getTime() - estimatedDays * 24 * 60 * 60 * 1000);

      // Calculate offset from today/current period based on view mode
      let startOffset = 0;
      let endOffset = 0;
      let widthInPeriods = 1;

      if (viewMode === 'day') {
        // For day view, offset is in days from today
        startOffset = getTimeDiff(startDate, today, 'day');
        endOffset = getTimeDiff(dueDate, today, 'day');
        widthInPeriods = Math.max(1, endOffset - startOffset + 1);
      } else if (viewMode === 'week') {
        // For week view, offset is in weeks from current week
        startOffset = getTimeDiff(startDate, today, 'week');
        endOffset = getTimeDiff(dueDate, today, 'week');
        widthInPeriods = Math.max(1, endOffset - startOffset + 1);
      } else if (viewMode === 'month') {
        // For month view, offset is in months from current month
        startOffset = getTimeDiff(startDate, today, 'month');
        endOffset = getTimeDiff(dueDate, today, 'month');
        widthInPeriods = Math.max(1, endOffset - startOffset + 1);
      } else if (viewMode === 'year') {
        // For year view, offset is in years from current year
        startOffset = getTimeDiff(startDate, today, 'year');
        endOffset = getTimeDiff(dueDate, today, 'year');
        widthInPeriods = Math.max(1, endOffset - startOffset + 1);
      }

      // Get delay information
      const delayInfo = getDelayInfo(task);

      // Calculate original end position if there's a delay
      let originalEndOffset = endOffset;
      let extensionWidthInPeriods = 0;

      if (delayInfo.isDelayed && delayInfo.originalEndDate) {
        const originalEndOffsetCalc = getTimeDiff(delayInfo.originalEndDate, today, viewMode);
        originalEndOffset = originalEndOffsetCalc;
        extensionWidthInPeriods = endOffset - originalEndOffset;
      }

      return {
        task,
        startOffset,
        endOffset,
        widthInPeriods,
        startDate,
        dueDate,
        delayInfo,
        originalEndOffset,
        extensionWidthInPeriods,
      };
    });
  }, [filteredTasks, today, viewMode]);

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
                : 'bg-gray-200 dark:bg-slate-900'
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
                : 'bg-gray-200 dark:bg-slate-900'
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
                : 'bg-gray-200 dark:bg-slate-900'
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
                : 'bg-gray-200 dark:bg-slate-900'
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
          scrollEnabled={false}
          style={{ flexGrow: 0 }}
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
                  className={`border-r border-b border-gray-200 dark:border-slate-700 py-0.5 ${
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
          style={{ flex: 1 }}
          contentContainerStyle={{ flexGrow: 1 }}
        >
          <ScrollView
            showsVerticalScrollIndicator={true}
            contentContainerStyle={{ flexGrow: 1, paddingBottom: 80 }}
            style={{ flex: 1 }}
          >
            <View style={{ width: WEEK_WIDTH * timePeriods.length, minHeight: '100%' }}>
              {/* Week separator lines - full height */}
              {timePeriods.map((period: any, idx: number) => (
                <View
                  key={`separator-${idx}`}
                  className="absolute top-0 w-px bg-gray-200 dark:bg-slate-700"
                  style={{ left: WEEK_WIDTH * idx, height: '100%' }}
                />
              ))}

              {/* Today indicator line - full height */}
              {(() => {
                let todayIndex = 0;
                if (viewMode === 'day') {
                  todayIndex = 2; // 2 days before
                } else if (viewMode === 'week') {
                  todayIndex = 4; // 4 weeks before
                } else if (viewMode === 'month') {
                  todayIndex = 2; // 2 months before
                } else if (viewMode === 'year') {
                  todayIndex = 1; // 1 year before
                }

                const todayLineX = (todayIndex * WEEK_WIDTH) + (WEEK_WIDTH / 2);

                return (
                  <View
                    className="absolute top-0 w-1 bg-blue-500 dark:bg-blue-400"
                    style={{ left: todayLineX, height: '100%', zIndex: 5 }}
                    pointerEvents="none"
                  />
                );
              })()}

              {/* Task bars */}
              <View className="pt-1">
              {taskBars.map((bar, idx) => {
                const colors = STATUS_COLORS[bar.task.status] || STATUS_COLORS['not-started'];
                // Calculate left position offset based on view mode
                // Day: 2 periods before today, Week: 4 periods, Month: 2 periods, Year: 1 period
                const periodOffset = viewMode === 'day' ? 2 : viewMode === 'week' ? 4 : viewMode === 'month' ? 2 : 1;
                const leftPosition = WEEK_WIDTH * (bar.startOffset + periodOffset);
                const assignedMembers = getAssignedMembers(bar.task);
                const AVATAR_WIDTH = 32; // Width for avatar section
                const taskCost = calculateTaskCost(bar.task);

                // Calculate bar widths for original vs extension
                const hasExtension = bar.delayInfo.isDelayed && bar.extensionWidthInPeriods > 0;
                const originalWidthInPeriods = hasExtension
                  ? bar.widthInPeriods - bar.extensionWidthInPeriods
                  : bar.widthInPeriods;
                const originalBarWidth = Math.max(60, WEEK_WIDTH * originalWidthInPeriods - 8);
                const extensionBarWidth = hasExtension ? WEEK_WIDTH * bar.extensionWidthInPeriods : 0;

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
                          lightImpact();
                          setSelectedTask(bar.task);
                          setShowTaskModal(true);
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
                    <View className="ml-2 bg-gray-100 dark:bg-slate-900 px-2 py-1 rounded-md">
                      <Text className="text-gray-700 dark:text-gray-300 text-[10px] font-bold">
                        {taskCost > 0 ? `£${taskCost.toLocaleString()}` : '£X'}
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
              </View>

              {/* Empty state */}
              {taskBars.length === 0 && (
                <View className="flex-1 items-center justify-center py-8">
                  <Text className="text-gray-400 dark:text-slate-500 text-sm">
                    No active tasks
                  </Text>
                </View>
              )}
            </View>
          </ScrollView>
        </ScrollView>
      </View>

      {/* Task Quick Actions Modal */}
      <TaskQuickActionsModal
        visible={showTaskModal}
        onClose={() => {
          console.log('[MiniGanttChart] Modal closing');
          setShowTaskModal(false);
        }}
        task={selectedTask}
        onNavigateToDetails={(taskId) => {
          onTaskPress?.(taskId);
        }}
      />
    </View>
  );
}
