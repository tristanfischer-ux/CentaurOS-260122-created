import { View, Text, ScrollView, Pressable } from 'react-native';
import { useMemo, useRef, useEffect } from 'react';
import { type WorkPlan } from '@/lib/state/work-plan-store';
import { type OrganizationMember } from '@/lib/organization-seed';

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
  const currentWeek = useMemo(() => getWeekNumber(today), [today]);

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
    const roleOrder = { Founder: 0, FractionalExec: 1, Apprentice: 2 };

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

  // Generate 3 weeks: 1 week before, current week, 1 week after
  const weeks = useMemo(() => {
    const result = [];
    for (let i = -1; i <= 1; i++) {
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
    return result;
  }, [today]);

  // Filter active tasks (not completed or abandoned)
  const activeTasks = useMemo(() => {
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
    return activeTasks.map(task => {
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

      return {
        task,
        startOffset,
        endOffset,
        widthInWeeks,
        startDate,
        dueDate,
      };
    });
  }, [activeTasks, currentWeek]);

  const WEEK_WIDTH = 80; // Width of each week column in pixels
  const TASK_HEIGHT = 32; // Height of each task bar
  const MAX_VISIBLE_TASKS = 5; // Show 5 tasks at a time

  // Auto-scroll to show today at far left when component mounts
  useEffect(() => {
    // Scroll to position where current week (index 1) appears at the far left
    const scrollPosition = WEEK_WIDTH * 1;

    setTimeout(() => {
      headerScrollRef.current?.scrollTo({ x: scrollPosition, y: 0, animated: true });
      contentScrollRef.current?.scrollTo({ x: scrollPosition, y: 0, animated: true });
    }, 100);
  }, []);

  return (
    <View className="bg-white dark:bg-slate-900 border-b-2 border-gray-200 dark:border-slate-700">
      {/* Header */}
      <View className="px-4 pt-2 pb-1.5 border-b border-gray-200 dark:border-slate-700">
        <View className="flex-row items-center justify-between">
          <Text className="text-gray-900 dark:text-white text-xs font-bold">
            TASK TIMELINE
          </Text>
          <Text className="text-gray-600 dark:text-slate-400 text-[10px] font-semibold">
            {activeTasks.length} active task{activeTasks.length !== 1 ? 's' : ''}
          </Text>
        </View>
      </View>

      {/* Timeline Content */}
      <View className="relative bg-white dark:bg-slate-900">
        {/* Week Headers */}
        <ScrollView
          ref={headerScrollRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          className="border-b border-gray-200 dark:border-slate-700"
          scrollEnabled={false}
        >
          <View className="flex-row">
            {weeks.map((week, idx) => (
              <View
                key={idx}
                className={`border-r border-gray-200 dark:border-slate-700 py-2 ${
                  week.isCurrentWeek ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                }`}
                style={{ width: WEEK_WIDTH }}
              >
                <Text
                  className={`text-center text-[10px] font-semibold ${
                    week.isCurrentWeek
                      ? 'text-blue-600 dark:text-blue-400'
                      : 'text-gray-500 dark:text-slate-400'
                  }`}
                >
                  {week.label}
                </Text>
                <Text className="text-center text-[9px] text-gray-400 dark:text-slate-500 mt-0.5">
                  W{week.weekNumber}
                </Text>
              </View>
            ))}
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
        >
          <ScrollView
            showsVerticalScrollIndicator={true}
            style={{ maxHeight: TASK_HEIGHT * MAX_VISIBLE_TASKS + 16 }} // 5 tasks + padding
          >
            <View style={{ width: WEEK_WIDTH * weeks.length }}>
              {/* Current week indicator line */}
              <View
                className="absolute top-0 bottom-0 w-0.5 bg-blue-500 dark:bg-blue-400 opacity-50"
                style={{ left: WEEK_WIDTH * 1 + WEEK_WIDTH / 2 }}
              />

              {/* Task bars */}
              <View className="py-2">
              {taskBars.map((bar, idx) => {
                const colors = STATUS_COLORS[bar.task.status] || STATUS_COLORS['not-started'];
                const leftPosition = WEEK_WIDTH * (bar.startOffset + 1); // +1 to account for 1 week before
                const barWidth = WEEK_WIDTH * bar.widthInWeeks - 8; // -8 for padding
                const assignedMembers = getAssignedMembers(bar.task);
                const AVATAR_WIDTH = 32; // Width for avatar section
                const taskCost = calculateTaskCost(bar.task);

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
                          {assignedMembers.slice(0, 2).map((member, idx) => (
                            <View
                              key={member.id}
                              className="w-6 h-6 rounded-full items-center justify-center"
                              style={{
                                backgroundColor: ROLE_COLORS[member.role] + '20',
                                marginRight: idx < assignedMembers.slice(0, 2).length - 1 ? -6 : 0,
                                zIndex: idx + 1
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

                    {/* Task Bar */}
                    <Pressable
                      onPress={() => onTaskPress?.(bar.task.id)}
                      style={{
                        width: Math.max(60, barWidth),
                        height: TASK_HEIGHT,
                      }}
                    >
                      <View
                        className={`flex-row items-center px-2 py-1 rounded-lg border-2 ${
                          selectedTaskId === bar.task.id
                            ? 'border-blue-500 dark:border-blue-400'
                            : colors.border
                        } ${colors.bg} active:opacity-70`}
                        style={{ height: TASK_HEIGHT }}
                      >
                        <View className="flex-1">
                          <Text
                            className={`text-[10px] font-semibold ${colors.text}`}
                            numberOfLines={1}
                          >
                            {bar.task.title}
                          </Text>
                          <Text
                            className={`text-[8px] ${colors.text} opacity-80`}
                            numberOfLines={1}
                          >
                            {bar.task.function} • {bar.task.progress}%
                          </Text>
                        </View>
                        {/* Progress indicator */}
                        {bar.task.status === 'in-progress' && (
                          <View className="ml-1 w-1 h-1 rounded-full bg-white" />
                        )}
                      </View>
                    </Pressable>

                    {/* Cost Display - to the immediate right of task bar */}
                    <View className="ml-2 bg-gray-100 dark:bg-slate-800 px-2 py-1 rounded-md">
                      <Text className="text-gray-700 dark:text-gray-300 text-[9px] font-bold">
                        £{taskCost.toLocaleString()}
                      </Text>
                    </View>
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

        {/* Legend */}
        <View className="px-4 py-1.5 border-t border-gray-200 dark:border-slate-700 flex-row items-center justify-end gap-3 bg-white dark:bg-slate-900">
          <View className="flex-row items-center gap-1">
            <View className="w-2.5 h-2.5 rounded-sm border bg-gray-200 border-gray-300" />
            <Text className="text-gray-600 dark:text-slate-400 text-[9px]">Not Started</Text>
          </View>
          <View className="flex-row items-center gap-1">
            <View className="w-2.5 h-2.5 rounded-sm border bg-blue-400 border-blue-600" />
            <Text className="text-gray-600 dark:text-slate-400 text-[9px]">In Progress</Text>
          </View>
          <View className="flex-row items-center gap-1">
            <View className="w-2.5 h-2.5 rounded-sm border bg-red-400 border-red-600" />
            <Text className="text-gray-600 dark:text-slate-400 text-[9px]">Blocked</Text>
          </View>
        </View>
      </View>
    </View>
  );
}
